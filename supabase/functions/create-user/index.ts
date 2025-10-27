import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Headers CORS para permitir requisições do frontend
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
    // Verificar se é POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Obter dados do corpo da requisição
    const { email, first_name, last_name, role, company_id } = await req.json();

    // Validar dados obrigatórios
    if (!email || !first_name || !role || !company_id) {
      return new Response(JSON.stringify({ 
        error: 'Dados obrigatórios: email, first_name, role, company_id' 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Obter URL e chave do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Criar cliente Supabase com service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se já existe na tabela crm_users
    const { data: existingCrmUser } = await supabase
      .from('crm_users')
      .select('id')
      .eq('email', email)
      .eq('company_id', company_id)
      .maybeSingle();

    if (existingCrmUser) {
      return new Response(JSON.stringify({ 
        error: 'Já existe um usuário cadastrado com este email nesta empresa.' 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Criar usuário na autenticação usando inviteUserByEmail (envia email automaticamente)
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name: first_name,
        last_name: last_name,
        role: role,
        company_id: company_id
      },
      redirectTo: `${Deno.env.get('SITE_URL') || 'http://localhost:8080'}/user-setup`
    });

    if (authError) {
      console.error('Erro ao criar usuário na auth:', authError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao criar usuário na autenticação: ' + authError.message 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Criar registro na tabela crm_users
    const { error: crmError } = await supabase
      .from('crm_users')
      .insert({
        user_id: authData.user.id,
        email: email,
        first_name: first_name,
        last_name: last_name,
        role: role,
        company_id: company_id,
        status: 'active',
        password_hash: '', // Não armazenar senha na tabela crm_users
      });

    if (crmError) {
      console.error('Erro ao criar usuário na tabela crm_users:', crmError);
      
      // Se falhou na tabela crm_users, tentar remover da auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return new Response(JSON.stringify({ 
        error: 'Erro ao criar usuário na tabela: ' + crmError.message 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Usuário criado com sucesso! Email de confirmação enviado.',
      user_id: authData.user.id
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Erro na função create-user:', error);
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
