// Edge Function para convite seguro de usuário no Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Método não permitido', { status: 405 })
  }

  const { email, role, funnels, company_id } = await req.json()
  if (!email || !role || !company_id) {
    return new Response('Dados obrigatórios ausentes', { status: 400 })
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
    return new Response(`Erro ao criar usuário no Auth: ${authData?.msg || authData?.error_description || 'Erro desconhecido'}`, { status: 400 })
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
    return new Response(`Erro ao inserir usuário no banco: ${dbData?.message || dbData?.error_description || 'Erro desconhecido'}`, { status: 400 })
  }

  return new Response(JSON.stringify({ success: true, user: dbData }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  })
}) 