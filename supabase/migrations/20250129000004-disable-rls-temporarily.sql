-- Migração para desabilitar temporariamente RLS nas tabelas de permissões
-- Data: 2025-01-29
-- Descrição: Desabilita RLS temporariamente para permitir o funcionamento do sistema de permissões

-- Desabilitar RLS temporariamente para custom_permissions
ALTER TABLE custom_permissions DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS temporariamente para permission_details
ALTER TABLE permission_details DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (não são necessárias com RLS desabilitado)
DROP POLICY IF EXISTS "Permitir acesso completo às permissões da empresa" ON custom_permissions;
DROP POLICY IF EXISTS "Permitir acesso completo aos detalhes de permissões da empresa" ON permission_details;

-- Comentário explicativo
COMMENT ON TABLE custom_permissions IS 'RLS temporariamente desabilitado para permitir funcionamento do sistema de permissões';
COMMENT ON TABLE permission_details IS 'RLS temporariamente desabilitado para permitir funcionamento do sistema de permissões'; 