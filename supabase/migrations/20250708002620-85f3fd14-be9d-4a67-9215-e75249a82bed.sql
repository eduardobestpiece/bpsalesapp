
-- Primeiro, vamos criar as tabelas necessárias para o sistema de permissões
-- Tabela de empresas (companies) já existe

-- Inserir dados de teste para empresa
INSERT INTO companies (id, name, status) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Empresa Demo', 'active')
ON CONFLICT (id) DO NOTHING;

-- Inserir dados de teste para usuários CRM
INSERT INTO crm_users (
  id, 
  email, 
  first_name, 
  last_name, 
  phone, 
  role, 
  company_id, 
  status,
  password_hash
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'eduardocosta@bestpiece.com.br',
  'Eduardo',
  'Costa',
  '(11) 99999-9999',
  'master',
  '550e8400-e29b-41d4-a716-446655440000',
  'active',
  'hashed_password_placeholder'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'admin@empresa.com',
  'Admin',
  'Sistema',
  '(11) 88888-8888',
  'admin',
  '550e8400-e29b-41d4-a716-446655440000',
  'active',
  'hashed_password_placeholder'
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'lider@empresa.com',
  'João',
  'Silva',
  '(11) 77777-7777',
  'leader',
  '550e8400-e29b-41d4-a716-446655440000',
  'active',
  'hashed_password_placeholder'
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'usuario@empresa.com',
  'Maria',
  'Santos',
  '(11) 66666-6666',
  'user',
  '550e8400-e29b-41d4-a716-446655440000',
  'active',
  'hashed_password_placeholder'
)
ON CONFLICT (id) DO NOTHING;

-- Inserir dados de teste para times
INSERT INTO teams (
  id,
  name,
  leader_id,
  company_id,
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440010',
  'Equipe Vendas',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- Inserir dados de teste para funis
INSERT INTO funnels (
  id,
  name,
  verification_type,
  verification_day,
  company_id,
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440020',
  'Funil Principal',
  'weekly',
  1,
  '550e8400-e29b-41d4-a716-446655440000',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- Inserir etapas do funil
INSERT INTO funnel_stages (
  id,
  funnel_id,
  name,
  stage_order,
  target_percentage,
  target_value
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440030',
  '550e8400-e29b-41d4-a716-446655440020',
  'Contato Inicial',
  1,
  100.0,
  1000
),
(
  '550e8400-e29b-41d4-a716-446655440031',
  '550e8400-e29b-41d4-a716-446655440020',
  'Qualificação',
  2,
  50.0,
  500
),
(
  '550e8400-e29b-41d4-a716-446655440032',
  '550e8400-e29b-41d4-a716-446655440020',
  'Proposta',
  3,
  25.0,
  250
),
(
  '550e8400-e29b-41d4-a716-446655440033',
  '550e8400-e29b-41d4-a716-446655440020',
  'Fechamento',
  4,
  10.0,
  100
)
ON CONFLICT (id) DO NOTHING;

-- Inserir dados de teste para origens
INSERT INTO sources (
  id,
  name,
  company_id,
  status
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440040',
  'Site',
  '550e8400-e29b-41d4-a716-446655440000',
  'active'
),
(
  '550e8400-e29b-41d4-a716-446655440041',
  'Indicação',
  '550e8400-e29b-41d4-a716-446655440000',
  'active'
),
(
  '550e8400-e29b-41d4-a716-446655440042',
  'Redes Sociais',
  '550e8400-e29b-41d4-a716-446655440000',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- Inserir dados de teste para leads
INSERT INTO leads (
  id,
  name,
  email,
  phone,
  responsible_id,
  funnel_id,
  current_stage_id,
  source_id,
  company_id,
  status
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440050',
  'Cliente Teste 1',
  'cliente1@teste.com',
  '(11) 99999-1111',
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440020',
  '550e8400-e29b-41d4-a716-446655440030',
  '550e8400-e29b-41d4-a716-446655440040',
  '550e8400-e29b-41d4-a716-446655440000',
  'active'
),
(
  '550e8400-e29b-41d4-a716-446655440051',
  'Cliente Teste 2',
  'cliente2@teste.com',
  '(11) 99999-2222',
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440020',
  '550e8400-e29b-41d4-a716-446655440031',
  '550e8400-e29b-41d4-a716-446655440041',
  '550e8400-e29b-41d4-a716-446655440000',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- Inserir dados de teste para vendas
INSERT INTO sales (
  id,
  lead_id,
  sale_date,
  sale_value,
  responsible_id,
  team_id,
  company_id,
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440060',
  '550e8400-e29b-41d4-a716-446655440050',
  '2024-01-15',
  15000.00,
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440000',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- Atualizar o usuário comum para fazer parte do time
UPDATE crm_users 
SET team_id = '550e8400-e29b-41d4-a716-446655440010'
WHERE id = '550e8400-e29b-41d4-a716-446655440004';

-- Criar políticas RLS para as tabelas CRM
-- Políticas para funnels
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company funnels"
ON funnels FOR SELECT
USING (
  get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role
  OR user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
);

CREATE POLICY "Admins can manage company funnels"
ON funnels FOR ALL
USING (
  get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) IN ('master'::user_role, 'admin'::user_role)
  AND (
    get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role
    OR user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
  )
);

-- Políticas para funnel_stages
ALTER TABLE funnel_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view funnel stages"
ON funnel_stages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM funnels f 
    WHERE f.id = funnel_stages.funnel_id 
    AND (
      get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role
      OR user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), f.company_id)
    )
  )
);

-- Políticas para sources
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company sources"
ON sources FOR SELECT
USING (
  get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role
  OR user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
);

CREATE POLICY "Admins can manage company sources"
ON sources FOR ALL
USING (
  get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) IN ('master'::user_role, 'admin'::user_role)
  AND (
    get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role
    OR user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
  )
);

-- Políticas para teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company teams"
ON teams FOR SELECT
USING (
  get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role
  OR user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
);

CREATE POLICY "Admins can manage company teams"
ON teams FOR ALL
USING (
  get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) IN ('master'::user_role, 'admin'::user_role)
  AND (
    get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role
    OR user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
  )
);

-- Políticas para leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company leads"
ON leads FOR SELECT
USING (
  get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role
  OR user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
);

CREATE POLICY "Users can manage leads"
ON leads FOR ALL
USING (
  get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) IN ('master'::user_role, 'admin'::user_role)
  OR (
    user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
    AND (
      get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'leader'::user_role
      OR responsible_id IN (
        SELECT id FROM crm_users 
        WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
      )
    )
  )
);

-- Políticas para sales
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company sales"
ON sales FOR SELECT
USING (
  get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role
  OR user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
);

CREATE POLICY "Users can manage sales"
ON sales FOR ALL
USING (
  get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) IN ('master'::user_role, 'admin'::user_role)
  OR (
    user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
    AND (
      get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'leader'::user_role
      OR responsible_id IN (
        SELECT id FROM crm_users 
        WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
      )
    )
  )
);

-- Políticas para indicators
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company indicators"
ON indicators FOR SELECT
USING (
  get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role
  OR user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
);

CREATE POLICY "Users can manage indicators"
ON indicators FOR ALL
USING (
  get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) IN ('master'::user_role, 'admin'::user_role)
  OR (
    user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
    AND (
      get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'leader'::user_role
      OR user_id IN (
        SELECT id FROM crm_users 
        WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
      )
    )
  )
);

-- Políticas para indicator_values
ALTER TABLE indicator_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view indicator values"
ON indicator_values FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM indicators i 
    WHERE i.id = indicator_values.indicator_id 
    AND (
      get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role
      OR user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), i.company_id)
    )
  )
);

CREATE POLICY "Users can manage indicator values"
ON indicator_values FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM indicators i 
    WHERE i.id = indicator_values.indicator_id 
    AND (
      get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) IN ('master'::user_role, 'admin'::user_role)
      OR (
        user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), i.company_id)
        AND (
          get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'leader'::user_role
          OR i.user_id IN (
            SELECT id FROM crm_users 
            WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
          )
        )
      )
    )
  )
);
