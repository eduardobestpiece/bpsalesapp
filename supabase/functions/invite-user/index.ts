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

  // 1. Convidar usuário no Auth (envia e-mail automático)
  const inviteRes = await fetch(`${supabaseUrl}/auth/v1/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey
    },
    body: JSON.stringify({
      email,
      options: {
        redirectTo: 'https://monteo-app.vercel.app/crm/cadastro'
      }
    })
  })
  const inviteData = await inviteRes.json()
  if (!inviteRes.ok) {
    return new Response(JSON.stringify({ error: inviteData, debugHeaders, bodyJson, serviceKey, supabaseUrl }), {
      status: 400,
      headers: corsHeaders
    });
  }
  const auth_id = inviteData.user?.id

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