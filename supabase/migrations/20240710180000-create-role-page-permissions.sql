-- Migration: Tabela de permissões de páginas por função
CREATE TABLE public.role_page_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  page TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT true,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role, page, company_id)
);

-- Exemplo de páginas: 'simulator', 'crm', 'indicadores', 'configuracoes', etc.

-- Habilitar RLS
ALTER TABLE public.role_page_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas básicas: apenas master pode alterar, todos podem ler suas permissões
CREATE POLICY "Master pode gerenciar permissões" ON public.role_page_permissions
  FOR ALL USING (
    get_user_role(current_setting('request.jwt.claims', true)::json->>'email') = 'master'
    AND user_belongs_to_company(current_setting('request.jwt.claims', true)::json->>'email', company_id)
  )
  WITH CHECK (
    get_user_role(current_setting('request.jwt.claims', true)::json->>'email') = 'master'
    AND user_belongs_to_company(current_setting('request.jwt.claims', true)::json->>'email', company_id)
  );

CREATE POLICY "Todos podem ler permissões da sua empresa" ON public.role_page_permissions
  FOR SELECT USING (
    user_belongs_to_company(current_setting('request.jwt.claims', true)::json->>'email', company_id)
  ); 