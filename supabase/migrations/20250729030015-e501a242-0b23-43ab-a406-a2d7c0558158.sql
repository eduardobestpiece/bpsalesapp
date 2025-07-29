-- Adiciona política temporária para permitir busca de usuário CRM durante autenticação
-- Essa política permite que usuários autenticados no Supabase leiam seus próprios dados CRM

CREATE POLICY "Allow authenticated users to read their own CRM data" 
ON public.crm_users 
FOR SELECT 
USING (
  -- Permite ao usuário autenticado no Supabase ler seus próprios dados
  auth.jwt() ->> 'email' = email
  OR 
  -- Mantém as permissões existentes para masters e admins
  public.get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::public.user_role 
  OR 
  public.user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
);