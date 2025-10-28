import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Parse request body
    const leadData = await req.json();

    if (!leadData.form_id || !leadData.company_id) {
      return new Response(
        JSON.stringify({ error: 'form_id e company_id são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Atribuir responsável baseado na distribuição (incluindo verificação de duplicatas)
    const { data: assignedUserId, error: assignError } = await supabaseClient
      .rpc('assign_lead_responsible', {
        p_form_id: leadData.form_id,
        p_company_id: leadData.company_id,
        p_email: leadData.email || null,
        p_telefone: leadData.telefone || null
      });

    if (assignError) {
      console.error('Erro ao atribuir responsável:', assignError);
      // Continuar sem responsável se houver erro
    }

    // Buscar dados do usuário responsável se foi atribuído
    let responsibleUserData = null;
    if (assignedUserId) {
      const { data: userData, error: userError } = await supabaseClient
        .from('crm_users')
        .select('id, first_name, last_name, email, phone')
        .eq('id', assignedUserId)
        .single();

      if (!userError && userData) {
        responsibleUserData = {
          id: userData.id,
          nome_completo: `${userData.first_name} ${userData.last_name}`.trim(),
          primeiro_nome: userData.first_name,
          sobrenome: userData.last_name,
          email: userData.email,
          telefone: userData.phone
        };
      }
    }

    // Criar o lead com o responsável atribuído
    const leadInsertData = {
      ...leadData,
      responsible_id: assignedUserId
    };

    const { data: newLead, error: leadError } = await supabaseClient
      .from('leads')
      .insert(leadInsertData)
      .select('*')
      .single();

    if (leadError) {
      console.error('Erro ao criar lead:', leadError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar lead: ' + leadError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar configurações de webhook para o formulário
    const { data: webhookConfig, error: webhookError } = await supabaseClient
      .from('form_integrations')
      .select('webhook_url, config_data')
      .eq('form_id', leadData.form_id)
      .eq('integration_type', 'webhook')
      .eq('is_active', true)
      .single();

    // Se há webhook configurado, enviar dados
    if (!webhookError && webhookConfig?.webhook_url) {
      const webhookPayload = {
        ...newLead,
        // Adicionar dados do responsável se disponível
        ...(responsibleUserData && {
          responsavel_nome: responsibleUserData.nome_completo,
          responsavel_primeiro_nome: responsibleUserData.primeiro_nome,
          responsavel_sobrenome: responsibleUserData.sobrenome,
          responsavel_email: responsibleUserData.email,
          responsavel_telefone: responsibleUserData.telefone
        })
      };

      try {
        const webhookResponse = await fetch(webhookConfig.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload)
        });

        if (!webhookResponse.ok) {
          console.error('Erro ao enviar webhook:', webhookResponse.status);
        }
      } catch (webhookErr) {
        console.error('Erro ao enviar webhook:', webhookErr);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        lead: newLead,
        responsible_user: responsibleUserData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro na função create-lead-with-distribution:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor: ' + error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
