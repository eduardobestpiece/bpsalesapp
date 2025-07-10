
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Invite user function called')

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      console.error('Method not allowed:', req.method)
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const requestBody = await req.json()
    console.log('Request body:', requestBody)
    
    const { email, role, funnels, company_id } = requestBody

    if (!email || !role || !company_id) {
      console.error('Missing required fields:', { email: !!email, role: !!role, company_id: !!company_id })
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios ausentes (email, role, company_id)' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', { 
        supabaseUrl: !!supabaseUrl, 
        supabaseServiceKey: !!supabaseServiceKey 
      })
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Inviting user via Supabase Auth...')

    // 1. Convidar usuário no Auth (envia e-mail automático)
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${supabaseUrl.replace('.supabase.co', '.vercel.app')}/crm/redefinir-senha-convite`
      }
    )

    if (inviteError) {
      console.error('Error inviting user:', inviteError)
      return new Response(
        JSON.stringify({ error: `Erro ao convidar usuário: ${inviteError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('User invited successfully:', inviteData)
    const auth_id = inviteData.user?.id

    if (!auth_id) {
      console.error('No auth_id returned from invite')
      return new Response(
        JSON.stringify({ error: 'Falha ao obter ID do usuário convidado' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 2. Inserir usuário na tabela crm_users
    console.log('Creating CRM user record...')
    const { data: crmUserData, error: crmUserError } = await supabase
      .from('crm_users')
      .insert({
        email,
        role,
        company_id,
        status: 'active',
        first_name: '',
        last_name: '',
        password_hash: 'temp_hash' // Will be updated when user completes registration
      })
      .select()
      .single()

    if (crmUserError) {
      console.error('Error creating CRM user:', crmUserError)
      
      // Se houver erro ao criar o usuário CRM, tentar remover o usuário do Auth
      try {
        await supabase.auth.admin.deleteUser(auth_id)
        console.log('Cleaned up auth user after CRM user creation failure')
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError)
      }
      
      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário no CRM: ${crmUserError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('CRM user created successfully:', crmUserData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: crmUserData,
        message: 'Usuário convidado com sucesso! O usuário receberá um e-mail para completar o cadastro.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: `Erro interno inesperado: ${error?.message || 'Erro desconhecido'}`,
        details: error?.stack || 'Sem detalhes adicionais'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
