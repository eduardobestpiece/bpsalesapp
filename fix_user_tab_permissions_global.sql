-- Script para adicionar permissões das abas para TODAS as empresas
-- Corrigido para usar 'user' em minúsculo (enum user_role)
-- DINÂMICO: Funciona para todas as empresas automaticamente

-- 1. Primeiro, vamos verificar quais empresas existem
SELECT 'Empresas encontradas:' as info;
SELECT id, name FROM companies ORDER BY name;

-- 2. Adicionar permissões das abas para TODAS as empresas
-- Para cada empresa, adicionar permissões para role 'user'
INSERT INTO role_page_permissions (company_id, role, page, allowed)
SELECT 
  c.id as company_id,
  'user' as role,
  page_name,
  true as allowed
FROM companies c
CROSS JOIN (
  VALUES 
    ('simulator_config_administrators'),
    ('simulator_config_reductions'),
    ('simulator_config_installments'),
    ('simulator_config_products'),
    ('simulator_config_leverages')
) AS pages(page_name)
ON CONFLICT (company_id, role, page) 
DO UPDATE SET allowed = EXCLUDED.allowed;

-- 3. Verificar se as permissões foram criadas para todas as empresas
SELECT 'Permissões criadas por empresa:' as info;
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

-- 4. Contagem de permissões criadas
SELECT 'Resumo:' as info;
SELECT 
  COUNT(*) as total_permissoes_criadas,
  COUNT(DISTINCT company_id) as total_empresas,
  COUNT(DISTINCT page) as total_abas
FROM role_page_permissions 
WHERE role = 'user' 
  AND page LIKE 'simulator_config_%'; 