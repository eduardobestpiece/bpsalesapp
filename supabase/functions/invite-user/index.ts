
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

    console.log('Checking if user already exists in Auth...')

    // First, check if user already exists in Auth
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return new Response(
        JSON.stringify({ error: `Erro ao verificar usuários existentes: ${listError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const existingUser = existingUsers.users.find(user => user.email === email)
    let auth_id = existingUser?.id

    // Check if user already exists in CRM users table
    console.log('Checking if CRM user already exists...')
    const { data: existingCrmUser, error: checkError } = await supabase
      .from('crm_users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing CRM user:', checkError)
      return new Response(
        JSON.stringify({ error: `Erro ao verificar usuário no CRM: ${checkError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (existingCrmUser) {
      console.log('CRM user already exists:', existingCrmUser)
      return new Response(
        JSON.stringify({ 
          success: true, 
          user: existingCrmUser,
          message: 'Usuário já existe no sistema.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (existingUser) {
      console.log('User already exists in Auth, using existing user:', existingUser.id)
    } else {
      console.log('User does not exist in Auth, inviting new user...')
      
      // Get the current origin/domain to build the correct redirect URL
      const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || supabaseUrl.replace('.supabase.co', '.vercel.app')
      const redirectUrl = `${origin}/crm/redefinir-senha-convite`
      
      console.log('Using redirect URL:', redirectUrl)
      
      // User doesn't exist, so invite them
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo: redirectUrl,
          data: {
            role: role,
            company_id: company_id,
            invited: true
          }
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
      auth_id = inviteData.user?.id
    }

    if (!auth_id) {
      console.error('No auth_id available')
      return new Response(
        JSON.stringify({ error: 'Falha ao obter ID do usuário' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create new CRM user
    console.log('Creating new CRM user record...')
    const { data: crmUserData, error: crmUserError } = await supabase
      .from('crm_users')
      .insert({
        email,
        role,
        company_id,
        status: 'active',
        first_name: '',
        last_name: '',
        password_hash: 'temp_hash',
        funnels: funnels || []
      })
      .select()
      .single()

    if (crmUserError) {
      console.error('Error creating CRM user:', crmUserError)
      
      // If this was a new user we just invited, clean up
      if (!existingUser && auth_id) {
        try {
          await supabase.auth.admin.deleteUser(auth_id)
          console.log('Cleaned up auth user after CRM user creation failure')
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError)
        }
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

    const message = existingUser 
      ? 'Usuário já existia no sistema de autenticação e foi adicionado ao CRM com sucesso!'
      : 'Usuário convidado com sucesso! O usuário receberá um e-mail para completar o cadastro.'

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: crmUserData,
        message
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
