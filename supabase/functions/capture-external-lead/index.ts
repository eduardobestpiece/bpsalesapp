import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface LeadData {
  formId: string;
  fieldValues: Record<string, any>;
  timestamp: string;
  source?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_source?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  fbid?: string;
}

Deno.serve(async (req: Request) => {
  // Configurar CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar se é uma requisição POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Obter dados do corpo da requisição
    const leadData: LeadData = await req.json();
    
    // Validar dados obrigatórios
    if (!leadData.formId || !leadData.fieldValues) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios não fornecidos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Obter informações do cliente
    const userAgent = req.headers.get('user-agent') || '';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Criar o Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se o formulário existe e está ativo
    const { data: form, error: formError } = await supabase
      .from('lead_forms')
      .select('id, company_id, name')
      .eq('id', leadData.formId)
      .eq('status', 'active')
      .single();

    if (formError || !form) {
      return new Response(
        JSON.stringify({ error: 'Formulário não encontrado ou inativo' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar origem correta do formulário
    let origemFinal = 'formulario'; // Valor padrão
    
    try {
      // Buscar informações do formulário incluindo origem padrão e se é base
      const { data: formInfo, error: formError } = await supabase
        .from('lead_forms')
        .select(`
          id,
          name,
          default_origin_id,
          is_base_form,
          lead_origins!lead_forms_default_origin_id_fkey (
            id,
            name
          )
        `)
        .eq('id', leadData.formId)
        .single();
      
      if (!formError && formInfo) {
        // Se é formulário base, priorizar campo de conexão
        if (formInfo.is_base_form) {
          // Para formulário base, buscar campo de conexão com origens
          const originFieldValue = Object.entries(leadData.fieldValues).find(([key, value]) => {
            // Buscar por campos que podem ser de origem (conexão com origens)
            return key.toLowerCase().includes('origem') || 
                   key.toLowerCase().includes('origin') ||
                   (typeof value === 'string' && value.length > 0 && !['nome', 'email', 'telefone', 'phone'].includes(key.toLowerCase()));
          });
          
          if (originFieldValue && originFieldValue[1]) {
            // Se encontrou um campo de conexão, buscar o nome da origem pelo ID
            try {
              const originId = originFieldValue[1] as string;
              const { data: originData, error: originError } = await supabase
                .from('lead_origins')
                .select('name')
                .eq('id', originId)
                .eq('company_id', form.company_id)
                .single();
              
              if (!originError && originData?.name) {
                origemFinal = originData.name;
              } else {
                // Se não encontrou a origem pelo ID, usar o valor direto
                origemFinal = originFieldValue[1] as string;
              }
            } catch (error) {
              console.error('Erro ao buscar origem pelo ID:', error);
              // Fallback para o valor direto
              origemFinal = originFieldValue[1] as string;
            }
          } else {
            // Se não tem campo de conexão preenchido, usar origem padrão do formulário
            if (formInfo.lead_origins?.name) {
              origemFinal = formInfo.lead_origins.name;
            } else if (formInfo.name) {
              origemFinal = formInfo.name;
            }
          }
        } else {
          // Para formulário normal, usar origem padrão do formulário
          if (formInfo.lead_origins?.name) {
            origemFinal = formInfo.lead_origins.name;
          } else if (formInfo.name) {
            origemFinal = formInfo.name;
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar informações do formulário:', error);
    }
    
    // Verificar se há um campo de conexão com origens nos valores do formulário (fallback)
    if (origemFinal === 'formulario') {
      const originFieldValue = Object.entries(leadData.fieldValues).find(([key, value]) => {
        // Buscar por campos que podem ser de origem (conexão com origens)
        return key.toLowerCase().includes('origem') || 
               key.toLowerCase().includes('origin') ||
               (typeof value === 'string' && value.length > 0 && !['nome', 'email', 'telefone', 'phone'].includes(key.toLowerCase()));
      });
      
      // Se encontrou um valor de origem nos campos, usar ele
      if (originFieldValue && originFieldValue[1]) {
        origemFinal = originFieldValue[1] as string;
      }
    }

    // Preparar dados do lead
    const leadRecord = {
      company_id: form.company_id,
      nome: leadData.fieldValues.nome || leadData.fieldValues.name || 'Lead Externo',
      email: leadData.fieldValues.email || '',
      telefone: leadData.fieldValues.telefone || leadData.fieldValues.phone || '',
      origem: origemFinal,
      status: 'novo',
      fonte: 'external_form',
      form_id: leadData.formId, // Adicionar form_id para relacionamento
      ip: ip,
      browser: userAgent,
      device: 'Desktop',
      pais: 'Brasil',
      url: leadData.url || '',
      utm_campaign: leadData.utm_campaign || '',
      utm_medium: leadData.utm_medium || '',
      utm_content: leadData.utm_content || '',
      utm_source: leadData.utm_source || '',
      utm_term: leadData.utm_term || '',
      gclid: leadData.gclid || '',
      fbclid: leadData.fbclid || '',
      fbc: leadData.fbc || '',
      fbp: leadData.fbp || '',
      fbid: leadData.fbid || '',
      created_at: leadData.timestamp ? new Date(leadData.timestamp).toISOString() : undefined
    };

    // Inserir o lead no banco de dados
    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert(leadRecord)
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir lead:', insertError);
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Salvar campos customizados em lead_custom_values
    if (newLead && leadData.fieldValues) {
      const customValues = [];
      
      for (const [fieldName, fieldValue] of Object.entries(leadData.fieldValues)) {
        // Pular campos básicos que já estão na tabela leads
        if (['nome', 'name', 'email', 'telefone', 'phone', 'origem', 'origin'].includes(fieldName.toLowerCase())) {
          continue;
        }
        
        // Buscar ou criar campo customizado
        let { data: customField, error: fieldError } = await supabase
          .from('lead_custom_fields')
          .select('id')
          .eq('company_id', form.company_id)
          .eq('name', fieldName)
          .single();
        
        if (fieldError && fieldError.code === 'PGRST116') {
          // Campo não existe, criar um novo
          const { data: newField, error: createFieldError } = await supabase
            .from('lead_custom_fields')
            .insert({
              company_id: form.company_id,
              name: fieldName,
              type: 'texto',
              created_at: new Date().toISOString()
            })
            .select('id')
            .single();
          
          if (createFieldError) {
            console.error('Erro ao criar campo customizado:', createFieldError);
            continue;
          }
          customField = newField;
        } else if (fieldError) {
          console.error('Erro ao buscar campo customizado:', fieldError);
          continue;
        }
        
        if (customField?.id) {
          customValues.push({
            lead_id: newLead.id,
            field_id: customField.id,
            value_text: String(fieldValue),
            created_at: new Date().toISOString()
          });
        }
      }
      
      // Inserir todos os valores customizados
      if (customValues.length > 0) {
        const { error: customValuesError } = await supabase
          .from('lead_custom_values')
          .insert(customValues);
        
        if (customValuesError) {
          console.error('Erro ao inserir valores customizados:', customValuesError);
        }
      }
    }

    // Log da captura (opcional)
    console.log(`Lead capturado: ${newLead.id} - Formulário: ${form.name}`);

    // Retornar sucesso
    return new Response(
      JSON.stringify({ 
        success: true, 
        leadId: newLead.id,
        message: 'Lead capturado com sucesso' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
