-- Script para atualizar permissões do Líder e Usuário para Simulador
-- Execute este script diretamente no Supabase SQL Editor

-- 1. Atualizar permissões do Líder para Simulador (apenas visualização)
UPDATE permission_details 
SET 
  can_view = 'allowed',
  can_create = 'none',
  can_edit = 'none',
  can_archive = 'none',
  can_deactivate = 'none',
  updated_at = NOW()
WHERE permission_id = '27f6b2fe-ec85-4ffc-97f9-958653c7bd1b' 
AND module_name = 'simulator';

-- 2. Atualizar permissões do Líder para Configurações do Simulador (mesmo padrão do Administrador)
UPDATE permission_details 
SET 
  can_view = 'allowed',
  can_create = 'allowed',
  can_edit = 'allowed',
  can_archive = 'allowed',
  can_deactivate = 'none',
  updated_at = NOW()
WHERE permission_id = '27f6b2fe-ec85-4ffc-97f9-958653c7bd1b' 
AND module_name = 'simulator-config';

-- 3. Atualizar permissões do Usuário para Simulador (apenas visualização)
UPDATE permission_details 
SET 
  can_view = 'allowed',
  can_create = 'none',
  can_edit = 'none',
  can_archive = 'none',
  can_deactivate = 'none',
  updated_at = NOW()
WHERE permission_id = '48d2bcff-0731-4383-9791-f19e5ba42371' 
AND module_name = 'simulator';

-- 4. Atualizar permissões do Usuário para Configurações do Simulador (apenas visualização)
UPDATE permission_details 
SET 
  can_view = 'allowed',
  can_create = 'none',
  can_edit = 'none',
  can_archive = 'none',
  can_deactivate = 'none',
  updated_at = NOW()
WHERE permission_id = '48d2bcff-0731-4383-9791-f19e5ba42371' 
AND module_name = 'simulator-config';

-- 5. Verificar as atualizações
SELECT 
  cp.name as permission_name,
  pd.module_name,
  pd.can_view,
  pd.can_create,
  pd.can_edit,
  pd.can_archive,
  pd.can_deactivate
FROM permission_details pd 
JOIN custom_permissions cp ON pd.permission_id = cp.id 
WHERE cp.name IN ('Líder', 'Usuário') 
AND pd.module_name IN ('simulator', 'simulator-config')
AND cp.company_id = '5a2aa715-6017-4f50-91dd-bcd322ddc3a0'
ORDER BY cp.name, pd.module_name; 