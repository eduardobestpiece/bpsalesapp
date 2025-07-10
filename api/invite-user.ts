import { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const { email, role, funnels, company_id } = req.body;
  if (!email || !role || !company_id) {
    res.status(400).json({ error: 'Dados obrigatórios ausentes' });
    return;
  }

  // 1. Convidar usuário no Auth (envia e-mail automático)
  const inviteRes = await fetch(`${SUPABASE_URL}/auth/v1/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      email,
      options: {
        redirectTo: 'https://monteo-app.vercel.app/crm/cadastro'
      }
    })
  });
  const inviteData = await inviteRes.json();
  if (!inviteRes.ok) {
    res.status(400).json({ error: inviteData });
    return;
  }
  const auth_id = inviteData.user?.id;

  // 2. Inserir usuário na tabela crm_users
  const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/crm_users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
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
  });
  const dbData = await dbRes.json();
  if (!dbRes.ok) {
    res.status(400).json({ error: dbData });
    return;
  }

  res.status(200).json({ success: true, user: dbData });
} 