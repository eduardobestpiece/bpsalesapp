-- Remover políticas problemáticas e criar uma mais simples
DROP POLICY IF EXISTS "Allow authenticated users to read their own CRM data" ON public.crm_users;
DROP POLICY IF EXISTS "Allow master users full access" ON public.crm_users;
DROP POLICY IF EXISTS "Master users can read all CRM users" ON public.crm_users;
DROP POLICY IF EXISTS "Users can view company users" ON public.crm_users;
DROP POLICY IF EXISTS "Admins can update users" ON public.crm_users;
DROP POLICY IF EXISTS "Admins can create users" ON public.crm_users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.crm_users;

-- Criar política simples para leitura
CREATE POLICY "Enable read access for authenticated users" ON public.crm_users
FOR SELECT USING (true);

-- Criar política simples para modificações (apenas para masters e admins)
CREATE POLICY "Enable write access for masters and admins" ON public.crm_users
FOR ALL USING (
  get_user_role(((current_setting('request.jwt.claims', true))::json ->> 'email')) IN ('master', 'admin')
) WITH CHECK (
  get_user_role(((current_setting('request.jwt.claims', true))::json ->> 'email')) IN ('master', 'admin')
);

-- Criar função RPC para buscar usuário por email
CREATE OR REPLACE FUNCTION public.get_crm_user_by_email(user_email text)
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  role user_role,
  company_id uuid,
  status entity_status,
  phone text,
  avatar_url text,
  bio text,
  birth_date date,
  leader_id uuid,
  team_id uuid,
  funnels text[],
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cu.id,
    cu.email,
    cu.first_name,
    cu.last_name,
    cu.role,
    cu.company_id,
    cu.status,
    cu.phone,
    cu.avatar_url,
    cu.bio,
    cu.birth_date,
    cu.leader_id,
    cu.team_id,
    cu.funnels,
    cu.created_at,
    cu.updated_at
  FROM public.crm_users cu
  WHERE cu.email = user_email AND cu.status = 'active'::entity_status;
END;
$$;