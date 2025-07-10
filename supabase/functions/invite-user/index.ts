
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
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { email, role, funnels, company_id } = await req.json()
    console.log('Received data:', { email, role, funnels, company_id })

    if (!email || !role || !company_id) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios ausentes' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
        redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.vercel.app') || 'https://monteo-app.vercel.app'}/crm/cadastro`
      }
    )

    if (inviteError) {
      console.error('Error inviting user:', inviteError)
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('User invited successfully:', inviteData)
    const auth_id = inviteData.user?.id

    // 2. Inserir usuário na tabela crm_users
    console.log('Creating CRM user record...')
    const { data: crmUserData, error: crmUserError } = await supabase
      .from('crm_users')
      .insert({
        email,
        role,
        funnels: funnels || [],
        company_id,
        status: 'active',
        auth_id,
        first_name: '',
        last_name: '',
        password_hash: 'temp_hash' // Will be updated when user completes registration
      })
      .select()
      .single()

    if (crmUserError) {
      console.error('Error creating CRM user:', crmUserError)
      return new Response(
        JSON.stringify({ error: crmUserError.message }),
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
      JSON.stringify({ error: error?.message || 'Erro interno inesperado' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
