-- Script DINÂMICO para adicionar permissões das abas para TODAS as empresas
-- Versão que funciona corretamente

-- 1. Verificar empresas existentes
SELECT 'Empresas encontradas:' as info;
SELECT id, name FROM companies ORDER BY name;

-- 2. Criar tabela temporária com as páginas
WITH pages AS (
  SELECT unnest(ARRAY[
    'simulator_config_administrators',
    'simulator_config_reductions', 
    'simulator_config_installments',
    'simulator_config_products',
    'simulator_config_leverages'
  ]) as page_name
),
companies_pages AS (
  SELECT c.id as company_id, p.page_name
  FROM companies c
  CROSS JOIN pages p
)
-- 3. Inserir permissões para todas as empresas
INSERT INTO role_page_permissions (company_id, role, page, allowed)
SELECT 
  cp.company_id,
  'user' as role,
  cp.page_name as page,
  true as allowed
FROM companies_pages cp
ON CONFLICT (company_id, role, page) 
DO UPDATE SET allowed = EXCLUDED.allowed;

-- 4. Verificar resultado
SELECT 'Permissões criadas:' as info;
SELECT 
  c.name as empresa,
  rpp.role,
  rpp.page,
  rpp.allowed
FROM role_page_permissions rpp
JOIN companies c ON c.id = rpp.company_id
WHERE rpp.role = 'user' 
  AND rpp.page LIKE 'simulator_config_%'
ORDER BY c.name, rpp.page;

-- 5. Resumo
SELECT 'Resumo:' as info;
SELECT 
  COUNT(*) as total_permissoes_criadas,
  COUNT(DISTINCT company_id) as total_empresas,
  COUNT(DISTINCT page) as total_abas
FROM role_page_permissions 
WHERE role = 'user' 
  AND page LIKE 'simulator_config_%'; 