// Edge Function para convite seguro de usuário no Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Log de debug: headers recebidos
  const debugHeaders = {};
  for (const [key, value] of req.headers.entries()) {
    debugHeaders[key] = value;
  }

  // Tratar preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Método não permitido', { status: 405, headers: corsHeaders })
  }

  let bodyJson = null;
  try {
    bodyJson = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Corpo da requisição inválido', debugHeaders }), { status: 400, headers: corsHeaders });
  }
  const { email, role, funnels, company_id } = bodyJson;
  if (!email || !role || !company_id) {
    return new Response(JSON.stringify({ error: 'Dados obrigatórios ausentes', debugHeaders, bodyJson }), { status: 400, headers: corsHeaders });
  }

  // Definir manualmente as chaves para debug
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiaG9jZ2hiaWVxeGp3c2RzdGdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTg1NDExNywiZXhwIjoyMDY3NDMwMTE3fQ.THDbqsymTMNTaEyr3FxKp6maGlct6kr5jH8fIvDRTyE';
  const supabaseUrl = 'https://jbhocghbieqxjwsdstgm.supabase.co';

  // 1. Criar usuário no Auth (não envia e-mail automático)
  const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey
    },
    body: JSON.stringify({
      email
    })
  })
  const adminData = await adminRes.json()
  if (!adminRes.ok) {
    return new Response(JSON.stringify({ error: adminData, debugHeaders, bodyJson }), {
      status: 400,
      headers: corsHeaders
    });
  }
  const auth_id = adminData.user?.id;

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