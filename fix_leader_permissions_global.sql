-- Script para dar permissões completas ao Líder para TODAS as empresas
-- DINÂMICO: Funciona para todas as empresas automaticamente

-- 1. Primeiro, vamos verificar quais empresas existem
SELECT 'Empresas encontradas:' as info;
SELECT id, name FROM companies ORDER BY name;

-- 2. Atualizar permissões do Líder para TODAS as empresas
-- Dar permissões completas (igual ao Administrador) para Configurações do Simulador
UPDATE permission_details 
SET 
  can_edit = 'allowed',
  can_create = 'allowed', 
  can_archive = 'allowed'
WHERE 
  module_name = 'simulator-config'
  AND custom_permission_id IN (
    SELECT cp.id 
    FROM custom_permissions cp
    JOIN companies c ON c.id = cp.company_id
    WHERE cp.level = 'Função' 
      AND cp.detail_value = 'Líder'
  );

-- 3. Verificar se as permissões foram atualizadas
SELECT 'Permissões do Líder atualizadas:' as info;
SELECT 
  c.name as empresa,
  cp.detail_value as funcao,
  pd.module_name,
  pd.can_view,
  pd.can_edit,
  pd.can_create,
  pd.can_archive
FROM permission_details pd
JOIN custom_permissions cp ON cp.id = pd.custom_permission_id
JOIN companies c ON c.id = cp.company_id
WHERE cp.level = 'Função' 
  AND cp.detail_value = 'Líder'
  AND pd.module_name = 'simulator-config'
ORDER BY c.name;

-- 4. Contagem de permissões atualizadas
SELECT 'Resumo das atualizações:' as info;
SELECT 
  COUNT(*) as total_permissoes_atualizadas,
  COUNT(DISTINCT cp.company_id) as total_empresas
FROM permission_details pd
JOIN custom_permissions cp ON cp.id = pd.custom_permission_id
JOIN companies c ON c.id = cp.company_id
WHERE cp.level = 'Função' 
  AND cp.detail_value = 'Líder'
  AND pd.module_name = 'simulator-config'; 