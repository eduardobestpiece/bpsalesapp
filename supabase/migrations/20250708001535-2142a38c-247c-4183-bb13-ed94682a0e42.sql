
-- Criar enum para tipos de usuário
CREATE TYPE user_role AS ENUM ('master', 'admin', 'leader', 'user');

-- Criar enum para verificação de funil
CREATE TYPE funnel_verification AS ENUM ('daily', 'weekly', 'monthly');

-- Criar enum para status geral
CREATE TYPE entity_status AS ENUM ('active', 'archived');

-- Tabela de empresas
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status entity_status DEFAULT 'active'
);

-- Tabela de usuários do CRM (perfis estendidos)
CREATE TABLE crm_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  birth_date DATE,
  bio TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  company_id UUID REFERENCES companies(id) NOT NULL,
  team_id UUID,
  leader_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status entity_status DEFAULT 'active',
  password_hash TEXT NOT NULL
);

-- Tabela de times/equipes
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  leader_id UUID REFERENCES crm_users(id) NOT NULL,
  company_id UUID REFERENCES companies(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status entity_status DEFAULT 'active'
);

-- Tabela de funis
CREATE TABLE funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  verification_type funnel_verification NOT NULL,
  verification_day INTEGER, -- Para semanal (1-7) ou mensal (1-31)
  company_id UUID REFERENCES companies(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status entity_status DEFAULT 'active'
);

-- Tabela de etapas do funil
CREATE TABLE funnel_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES funnels(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  target_percentage DECIMAL(5,2),
  target_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(funnel_id, stage_order)
);

-- Tabela de origens
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status entity_status DEFAULT 'active'
);

-- Tabela de leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  responsible_id UUID REFERENCES crm_users(id) NOT NULL,
  funnel_id UUID REFERENCES funnels(id) NOT NULL,
  current_stage_id UUID REFERENCES funnel_stages(id) NOT NULL,
  source_id UUID REFERENCES sources(id),
  company_id UUID REFERENCES companies(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status entity_status DEFAULT 'active'
);

-- Tabela de vendas
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) NOT NULL,
  sale_date DATE NOT NULL,
  sale_value DECIMAL(12,2) NOT NULL,
  responsible_id UUID REFERENCES crm_users(id) NOT NULL,
  team_id UUID REFERENCES teams(id),
  company_id UUID REFERENCES companies(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status entity_status DEFAULT 'active'
);

-- Tabela de indicadores
CREATE TABLE indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES crm_users(id) NOT NULL,
  funnel_id UUID REFERENCES funnels(id) NOT NULL,
  period_date DATE NOT NULL,
  month_reference INTEGER NOT NULL, -- Para controle manual do mês
  year_reference INTEGER NOT NULL,
  company_id UUID REFERENCES companies(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, funnel_id, period_date)
);

-- Tabela de valores dos indicadores por etapa
CREATE TABLE indicator_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id UUID REFERENCES indicators(id) ON DELETE CASCADE NOT NULL,
  stage_id UUID REFERENCES funnel_stages(id) NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(indicator_id, stage_id)
);

-- Adicionar foreign key para team_id em crm_users após criar teams
ALTER TABLE crm_users ADD CONSTRAINT fk_crm_users_team FOREIGN KEY (team_id) REFERENCES teams(id);
ALTER TABLE crm_users ADD CONSTRAINT fk_crm_users_leader FOREIGN KEY (leader_id) REFERENCES crm_users(id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_values ENABLE ROW LEVEL SECURITY;

-- Função para verificar permissões de usuário
CREATE OR REPLACE FUNCTION get_user_role(user_email TEXT)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM crm_users
  WHERE email = user_email AND status = 'active';
  
  RETURN COALESCE(user_role_result, 'user');
END;
$$;

-- Função para verificar se usuário pertence à empresa
CREATE OR REPLACE FUNCTION user_belongs_to_company(user_email TEXT, comp_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  belongs BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM crm_users 
    WHERE email = user_email 
    AND company_id = comp_id 
    AND status = 'active'
  ) INTO belongs;
  
  RETURN belongs;
END;
$$;

-- Políticas RLS básicas (serão refinadas conforme necessário)

-- Companies: Usuários só veem sua própria empresa
CREATE POLICY "Users can view own company" ON companies
  FOR ALL USING (
    get_user_role(current_setting('request.jwt.claims', true)::json->>'email') = 'master'
    OR id IN (
      SELECT company_id FROM crm_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND status = 'active'
    )
  );

-- CRM Users: Políticas baseadas em hierarquia
CREATE POLICY "Users can view company users" ON crm_users
  FOR SELECT USING (
    get_user_role(current_setting('request.jwt.claims', true)::json->>'email') = 'master'
    OR user_belongs_to_company(
      current_setting('request.jwt.claims', true)::json->>'email', 
      company_id
    )
  );

-- Inserir usuário master padrão
INSERT INTO companies (name) VALUES ('Best Piece') RETURNING id;

-- Inserir usuário master (será necessário ajustar o company_id após inserção)
WITH master_company AS (
  SELECT id FROM companies WHERE name = 'Best Piece' LIMIT 1
)
INSERT INTO crm_users (
  email, 
  first_name, 
  last_name, 
  role, 
  company_id,
  password_hash
) 
SELECT 
  'eduardocosta@bestpiece.com.br',
  'Eduardo',
  'Costa',
  'master',
  id,
  'temp_hash' -- Será atualizado quando implementarmos auth
FROM master_company;

-- Índices para performance
CREATE INDEX idx_crm_users_email ON crm_users(email);
CREATE INDEX idx_crm_users_company ON crm_users(company_id);
CREATE INDEX idx_crm_users_team ON crm_users(team_id);
CREATE INDEX idx_leads_responsible ON leads(responsible_id);
CREATE INDEX idx_leads_company ON leads(company_id);
CREATE INDEX idx_sales_company ON sales(company_id);
CREATE INDEX idx_indicators_user_funnel ON indicators(user_id, funnel_id);
