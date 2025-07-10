// Edge Function para convite seguro de usuário no Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Tratar preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Método não permitido', { status: 405, headers: corsHeaders })
  }

  const { email, role, funnels, company_id } = await req.json()
  if (!email || !role || !company_id) {
    return new Response('Dados obrigatórios ausentes', { status: 400, headers: corsHeaders })
  }

  // Chave de serviço (Service Role) do Supabase
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')

  // 1. Criar usuário no Auth
  const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`
    },
    body: JSON.stringify({
      email,
      password: 'Admin',
      email_confirm: true
    })
  })
  const authData = await authRes.json()
  if (!authRes.ok) {
    return new Response(JSON.stringify({ error: authData }), {
      status: 400,
      headers: corsHeaders
    });
  }
  const auth_id = authData.user?.id

  // 2. Inserir usuário na tabela crm_users
  const dbRes = await fetch(`${supabaseUrl}/rest/v1/crm_users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      email,
      role,
      funnels,
      company_id,
      status: 'active',
      auth_id
    })
  })
  const dbData = await dbRes.json()
  if (!dbRes.ok) {
    return new Response(JSON.stringify({ error: dbData }), {
      status: 400,
      headers: corsHeaders
    });
  }

  return new Response(JSON.stringify({ success: true, user: dbData }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200
  })
}) 