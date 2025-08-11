-- Permitir que o próprio usuário atualize seu perfil em public.crm_users
-- A política usa auth.email() (e também id = auth.uid() como fallback para bases antigas)

alter table if exists public.crm_users enable row level security;

drop policy if exists "allow_update_own_profile" on public.crm_users;
create policy "allow_update_own_profile"
  on public.crm_users
  for update
  using (
    auth.email() = email
    or id::text = auth.uid()::text
  )
  with check (
    auth.email() = email
    or id::text = auth.uid()::text
  ); 