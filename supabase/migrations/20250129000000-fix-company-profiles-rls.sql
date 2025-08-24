-- Corrigir políticas RLS para company_profiles
-- Permitir acesso baseado na empresa do usuário

-- Remover políticas existentes
DROP POLICY IF EXISTS company_profiles_select ON public.company_profiles;
DROP POLICY IF EXISTS company_profiles_upsert ON public.company_profiles;

-- Criar políticas mais específicas
-- Política para SELECT: usuário pode ver dados da sua empresa
CREATE POLICY company_profiles_select ON public.company_profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    company_id IN (
      SELECT company_id 
      FROM public.crm_users 
      WHERE email = auth.email()
    )
  );

-- Política para INSERT/UPDATE: usuário pode modificar dados da sua empresa
CREATE POLICY company_profiles_insert ON public.company_profiles
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id IN (
      SELECT company_id 
      FROM public.crm_users 
      WHERE email = auth.email()
    )
  );

CREATE POLICY company_profiles_update ON public.company_profiles
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    company_id IN (
      SELECT company_id 
      FROM public.crm_users 
      WHERE email = auth.email()
    )
  ) WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id IN (
      SELECT company_id 
      FROM public.crm_users 
      WHERE email = auth.email()
    )
  );

-- Política para DELETE: usuário pode deletar dados da sua empresa (se necessário)
CREATE POLICY company_profiles_delete ON public.company_profiles
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    company_id IN (
      SELECT company_id 
      FROM public.crm_users 
      WHERE email = auth.email()
    )
  ); 