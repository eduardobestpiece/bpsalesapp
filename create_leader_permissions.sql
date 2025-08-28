-- Script para criar permissões do Líder
-- Execute este script no Supabase SQL Editor

-- 1. Criar permissão para Líder
INSERT INTO custom_permissions (name, level, status, company_id, detail_value) 
VALUES ('Líder', 'Função', 'active', '334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b', 'Líder')
RETURNING id, name, level, detail_value;

-- 2. Obter o ID da permissão criada (substitua pelo ID retornado acima)
-- Exemplo: SET permission_id = 'uuid-da-permissao-criada';

-- 3. Criar detalhes das permissões para cada módulo
-- Simulador: nenhum acesso
INSERT INTO permission_details (permission_id, module_name, can_view, can_edit, can_create, can_archive, can_deactivate)
VALUES (
    (SELECT id FROM custom_permissions WHERE detail_value = 'Líder' AND company_id = '334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b'),
    'simulator',
    'none', 'none', 'none', 'none', 'none'
);

-- Configurações do Simulador: apenas visualização
INSERT INTO permission_details (permission_id, module_name, can_view, can_edit, can_create, can_archive, can_deactivate)
VALUES (
    (SELECT id FROM custom_permissions WHERE detail_value = 'Líder' AND company_id = '334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b'),
    'simulator-config',
    'allowed', 'none', 'none', 'none', 'none'
);

-- Gestão: nenhum acesso
INSERT INTO permission_details (permission_id, module_name, can_view, can_edit, can_create, can_archive, can_deactivate)
VALUES (
    (SELECT id FROM custom_permissions WHERE detail_value = 'Líder' AND company_id = '334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b'),
    'management',
    'none', 'none', 'none', 'none', 'none'
);

-- Configurações do CRM: nenhum acesso
INSERT INTO permission_details (permission_id, module_name, can_view, can_edit, can_create, can_archive, can_deactivate)
VALUES (
    (SELECT id FROM custom_permissions WHERE detail_value = 'Líder' AND company_id = '334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b'),
    'crm-config',
    'none', 'none', 'none', 'none', 'none'
);

-- Indicadores: nenhum acesso
INSERT INTO permission_details (permission_id, module_name, can_view, can_edit, can_create, can_archive, can_deactivate)
VALUES (
    (SELECT id FROM custom_permissions WHERE detail_value = 'Líder' AND company_id = '334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b'),
    'indicators',
    'none', 'none', 'none', 'none', 'none'
);

-- Leads: nenhum acesso
INSERT INTO permission_details (permission_id, module_name, can_view, can_edit, can_create, can_archive, can_deactivate)
VALUES (
    (SELECT id FROM custom_permissions WHERE detail_value = 'Líder' AND company_id = '334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b'),
    'leads',
    'none', 'none', 'none', 'none', 'none'
);

-- Verificar as permissões criadas
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
WHERE cp.detail_value = 'Líder' AND cp.company_id = '334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b'
ORDER BY pd.module_name; 