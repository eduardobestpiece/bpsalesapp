-- Script SIMPLES para adicionar permissões das abas para TODAS as empresas
-- Versão simplificada para testar

-- 1. Verificar empresas existentes
SELECT 'Empresas encontradas:' as info;
SELECT id, name FROM companies ORDER BY name;

-- 2. Adicionar permissões para cada empresa (versão manual)
-- Monteo Investimentos
INSERT INTO role_page_permissions (company_id, role, page, allowed)
VALUES 
  ('5a2aa715-6017-4f50-91dd-bcd322ddc3a0', 'user', 'simulator_config_administrators', true),
  ('5a2aa715-6017-4f50-91dd-bcd322ddc3a0', 'user', 'simulator_config_reductions', true),
  ('5a2aa715-6017-4f50-91dd-bcd322ddc3a0', 'user', 'simulator_config_installments', true),
  ('5a2aa715-6017-4f50-91dd-bcd322ddc3a0', 'user', 'simulator_config_products', true),
  ('5a2aa715-6017-4f50-91dd-bcd322ddc3a0', 'user', 'simulator_config_leverages', true)
ON CONFLICT (company_id, role, page) 
DO UPDATE SET allowed = EXCLUDED.allowed;

-- Best Piece (se existir)
INSERT INTO role_page_permissions (company_id, role, page, allowed)
VALUES 
  ('334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b', 'user', 'simulator_config_administrators', true),
  ('334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b', 'user', 'simulator_config_reductions', true),
  ('334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b', 'user', 'simulator_config_installments', true),
  ('334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b', 'user', 'simulator_config_products', true),
  ('334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b', 'user', 'simulator_config_leverages', true)
ON CONFLICT (company_id, role, page) 
DO UPDATE SET allowed = EXCLUDED.allowed;

-- 3. Verificar resultado
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