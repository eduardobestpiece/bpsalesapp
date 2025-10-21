import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface LeadData {
  formId: string;
  fieldValues: Record<string, any>;
  timestamp: string;
  source?: string;
  userAgent?: string;
  ip?: string;
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

    // Preparar dados do lead
    const leadRecord = {
      company_id: form.company_id,
      nome: leadData.fieldValues.nome || leadData.fieldValues.name || 'Lead Externo',
      email: leadData.fieldValues.email || '',
      telefone: leadData.fieldValues.telefone || leadData.fieldValues.phone || '',
      origem: 'Formulário Externo',
      status: 'novo',
      fonte: leadData.source || 'iframe',
      dados_extras: {
        formId: leadData.formId,
        formName: form.name,
        fieldValues: leadData.fieldValues,
        timestamp: leadData.timestamp,
        userAgent,
        ip
      },
      created_at: new Date().toISOString()
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
