-- Migração para corrigir políticas RLS das tabelas de permissões
-- Data: 2025-01-29
-- Descrição: Corrige as políticas RLS para permitir acesso adequado às permissões

-- Remover políticas existentes
DROP POLICY IF EXISTS "Master pode gerenciar permissões customizadas" ON custom_permissions;
DROP POLICY IF EXISTS "Todos podem ler permissões customizadas da sua empresa" ON custom_permissions;
DROP POLICY IF EXISTS "Master pode gerenciar detalhes de permissões" ON permission_details;
DROP POLICY IF EXISTS "Todos podem ler detalhes de permissões da sua empresa" ON permission_details;

-- Criar novas políticas mais permissivas para custom_permissions
CREATE POLICY "Permitir acesso completo às permissões da empresa" ON custom_permissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM crm_users 
    WHERE crm_users.id = auth.uid() 
    AND crm_users.company_id = custom_permissions.company_id
  )
);

-- Criar novas políticas mais permissivas para permission_details
CREATE POLICY "Permitir acesso completo aos detalhes de permissões da empresa" ON permission_details
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM custom_permissions cp
    JOIN crm_users cu ON cu.company_id = cp.company_id
    WHERE cp.id = permission_details.permission_id 
    AND cu.id = auth.uid()
  )
);

-- Verificar se RLS está habilitado
ALTER TABLE custom_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_details ENABLE ROW LEVEL SECURITY; 