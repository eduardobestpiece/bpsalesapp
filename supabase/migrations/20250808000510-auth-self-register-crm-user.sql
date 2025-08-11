-- Permitir leitura de empresas por usuários autenticados (necessário para pegar empresa padrão)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Enable read companies for authenticated' AND tablename = 'companies'
  ) THEN
    CREATE POLICY "Enable read companies for authenticated" ON public.companies
    FOR SELECT TO authenticated
    USING (true);
  END IF;
END $$;

-- Permitir INSERT no crm_users pelo próprio usuário autenticado (auto-registro)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Allow self insert crm_user' AND tablename = 'crm_users'
  ) THEN
    CREATE POLICY "Allow self insert crm_user" ON public.crm_users
    FOR INSERT TO authenticated
    WITH CHECK (
      email = ((current_setting('request.jwt.claims', true))::json ->> 'email')
    );
  END IF;
END $$;

-- Garantir que leitura em crm_users para autenticados exista
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Enable read access for authenticated users' AND tablename = 'crm_users'
  ) THEN
    CREATE POLICY "Enable read access for authenticated users" ON public.crm_users
    FOR SELECT TO authenticated
    USING (true);
  END IF;
END $$;

-- password_hash torna-se opcional para criação automática via app
ALTER TABLE public.crm_users ALTER COLUMN password_hash DROP NOT NULL; 