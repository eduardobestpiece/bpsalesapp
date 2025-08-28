-- Script para adicionar permissões das abas para o usuário
-- Corrigido para usar 'user' em minúsculo (enum user_role)

-- Inserir permissões para todas as abas do simulador para o role 'user'
INSERT INTO role_page_permissions (company_id, role, page, allowed)
VALUES 
  ('5a2aa715-6017-4f50-91dd-bcd322ddc3a0', 'user', 'simulator_config_administrators', true),
  ('5a2aa715-6017-4f50-91dd-bcd322ddc3a0', 'user', 'simulator_config_reductions', true),
  ('5a2aa715-6017-4f50-91dd-bcd322ddc3a0', 'user', 'simulator_config_installments', true),
  ('5a2aa715-6017-4f50-91dd-bcd322ddc3a0', 'user', 'simulator_config_products', true),
  ('5a2aa715-6017-4f50-91dd-bcd322ddc3a0', 'user', 'simulator_config_leverages', true)
ON CONFLICT (company_id, role, page) 
DO UPDATE SET allowed = EXCLUDED.allowed;

-- Verificar se as permissões foram criadas
SELECT role, page, allowed 
FROM role_page_permissions 
WHERE role = 'user' 
  AND company_id = '5a2aa715-6017-4f50-91dd-bcd322ddc3a0'
  AND page LIKE 'simulator_config_%'
ORDER BY page; 