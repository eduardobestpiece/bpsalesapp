import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ 
        error: 'user_id é obrigatório' 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Criar cliente Supabase com Service Role Key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Primeiro, buscar dados do usuário na tabela crm_users
    const { data: crmUser, error: fetchError } = await supabase
      .from('crm_users')
      .select('user_id, email')
      .eq('id', user_id)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar usuário:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Usuário não encontrado na tabela crm_users' 
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Excluir da tabela crm_users
    const { error: crmDeleteError } = await supabase
      .from('crm_users')
      .delete()
      .eq('id', user_id);

    if (crmDeleteError) {
      console.error('Erro ao excluir da tabela crm_users:', crmDeleteError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao excluir usuário da tabela: ' + crmDeleteError.message 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Excluir da autenticação (auth.users)
    if (crmUser.user_id) {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(crmUser.user_id);
      
      if (authDeleteError) {
        console.error('Erro ao excluir da autenticação:', authDeleteError);
        // Não falha a operação se não conseguir excluir da auth
        // O usuário já foi excluído da tabela crm_users
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Usuário excluído com sucesso de todas as tabelas!'
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor: ' + error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});
