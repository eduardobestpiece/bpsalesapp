-- Script para atualizar permissões do Líder conforme solicitado pelo usuário
-- Execute este script no Supabase SQL Editor

-- Atualizar permissões do Líder
-- Simulador: nenhum acesso
UPDATE permission_details 
SET can_view = 'none', can_edit = 'none', can_create = 'none', can_archive = 'none', can_deactivate = 'none'
WHERE permission_id = (
    SELECT id FROM custom_permissions 
    WHERE detail_value = 'Líder' AND company_id = '5a2aa715-6017-4f50-91dd-bcd322ddc3a0'
) AND module_name = 'simulator';

-- Configurações do Simulador: apenas visualização (já está correto)
-- Não precisa alterar, já está como 'allowed'

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