-- Script para corrigir permissões do Líder para funcionarem igual ao Administrador
-- Execute este script no Supabase SQL Editor

-- Atualizar permissões do Líder para funcionarem igual ao Administrador
-- Configurações do Simulador: dar permissões completas como o Administrador
UPDATE permission_details 
SET 
    can_edit = 'allowed',
    can_create = 'allowed',
    can_archive = 'allowed'
WHERE permission_id = (
    SELECT id FROM custom_permissions 
    WHERE detail_value = 'Líder' AND company_id = '5a2aa715-6017-4f50-91dd-bcd322ddc3a0'
) AND module_name = 'simulator-config';

-- Verificar as permissões atualizadas
SELECT 
    cp.name,
    cp.level,
    cp.detail_value,
    pd.module_name,
    pd.can_view,
    pd.can_edit,
    pd.can_create,
    pd.can_archive,
    pd.can_deactivate
FROM custom_permissions cp
JOIN permission_details pd ON cp.id = pd.permission_id
WHERE cp.detail_value = 'Líder' AND cp.company_id = '5a2aa715-6017-4f50-91dd-bcd322ddc3a0'
ORDER BY pd.module_name;

-- Comparar com permissões do Administrador
SELECT 
    'LÍDER' as role,
    cp.name,
    pd.module_name,
    pd.can_view,
    pd.can_edit,
    pd.can_create,
    pd.can_archive,
    pd.can_deactivate
FROM custom_permissions cp
JOIN permission_details pd ON cp.id = pd.permission_id
WHERE cp.detail_value = 'Líder' AND cp.company_id = '5a2aa715-6017-4f50-91dd-bcd322ddc3a0'
AND pd.module_name IN ('simulator', 'simulator-config')

UNION ALL

SELECT 
    'ADMIN' as role,
    cp.name,
    pd.module_name,
    pd.can_view,
    pd.can_edit,
    pd.can_create,
    pd.can_archive,
    pd.can_deactivate
FROM custom_permissions cp
JOIN permission_details pd ON cp.id = pd.permission_id
WHERE cp.detail_value = 'Administrador' AND cp.company_id = '5a2aa715-6017-4f50-91dd-bcd322ddc3a0'
AND pd.module_name IN ('simulator', 'simulator-config')
ORDER BY role, module_name; 