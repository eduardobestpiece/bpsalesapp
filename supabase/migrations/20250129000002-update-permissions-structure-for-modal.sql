-- Migração para adequar a estrutura de permissões ao modal implementado
-- Data: 2025-01-29
-- Descrição: Atualiza as tabelas custom_permissions e permission_details para suportar
--           o sistema de permissões implementado no modal

-- Primeiro, vamos limpar os dados existentes para recomeçar com a nova estrutura
TRUNCATE custom_permissions, permission_details CASCADE;

-- Alterar a tabela custom_permissions para incluir campos necessários
ALTER TABLE custom_permissions 
ADD COLUMN IF NOT EXISTS detail_value text,
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id),
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES crm_users(id);

-- Alterar a tabela permission_details para suportar a nova estrutura
-- Remover campos antigos e adicionar novos
ALTER TABLE permission_details 
DROP COLUMN IF EXISTS module,
DROP COLUMN IF EXISTS page,
DROP COLUMN IF EXISTS tab;

-- Adicionar campo para identificar o módulo/funcionalidade
ALTER TABLE permission_details 
ADD COLUMN IF NOT EXISTS module_name text NOT NULL DEFAULT 'simulator';

-- Alterar os checks para suportar os novos valores
ALTER TABLE permission_details 
DROP CONSTRAINT IF EXISTS permission_details_can_view_check,
DROP CONSTRAINT IF EXISTS permission_details_can_create_check,
DROP CONSTRAINT IF EXISTS permission_details_can_edit_check,
DROP CONSTRAINT IF EXISTS permission_details_can_archive_check,
DROP CONSTRAINT IF EXISTS permission_details_can_deactivate_check;

-- Adicionar novos checks para os níveis de permissão
ALTER TABLE permission_details 
ADD CONSTRAINT permission_details_can_view_check 
CHECK (can_view = ANY (ARRAY['company'::text, 'team'::text, 'personal'::text, 'allowed'::text, 'none'::text])),

ADD CONSTRAINT permission_details_can_create_check 
CHECK (can_create = ANY (ARRAY['company'::text, 'team'::text, 'personal'::text, 'allowed'::text, 'none'::text])),

ADD CONSTRAINT permission_details_can_edit_check 
CHECK (can_edit = ANY (ARRAY['company'::text, 'team'::text, 'personal'::text, 'allowed'::text, 'none'::text])),

ADD CONSTRAINT permission_details_can_archive_check 
CHECK (can_archive = ANY (ARRAY['company'::text, 'team'::text, 'personal'::text, 'allowed'::text, 'none'::text])),

ADD CONSTRAINT permission_details_can_deactivate_check 
CHECK (can_deactivate = ANY (ARRAY['company'::text, 'team'::text, 'personal'::text, 'allowed'::text, 'none'::text]));

-- Alterar o check do level na tabela custom_permissions
ALTER TABLE custom_permissions 
DROP CONSTRAINT IF EXISTS custom_permissions_level_check;

ALTER TABLE custom_permissions 
ADD CONSTRAINT custom_permissions_level_check 
CHECK (level = ANY (ARRAY['Função'::text, 'Time'::text, 'Usuário'::text]));

-- Criar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_custom_permissions_company_id ON custom_permissions(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_permissions_level ON custom_permissions(level);
CREATE INDEX IF NOT EXISTS idx_permission_details_permission_id ON permission_details(permission_id);
CREATE INDEX IF NOT EXISTS idx_permission_details_module_name ON permission_details(module_name);

-- Comentários para documentar a estrutura
COMMENT ON TABLE custom_permissions IS 'Permissões customizadas criadas através do modal de configuração';
COMMENT ON COLUMN custom_permissions.name IS 'Nome da permissão (ex: Administrador CRM)';
COMMENT ON COLUMN custom_permissions.level IS 'Nível da permissão: Função, Time, ou Usuário';
COMMENT ON COLUMN custom_permissions.detail_value IS 'Detalhamento específico (ex: ID do time ou usuário)';
COMMENT ON COLUMN custom_permissions.team_id IS 'ID do time quando level = Time';
COMMENT ON COLUMN custom_permissions.user_id IS 'ID do usuário quando level = Usuário';

COMMENT ON TABLE permission_details IS 'Detalhes das permissões por módulo/funcionalidade';
COMMENT ON COLUMN permission_details.module_name IS 'Nome do módulo: simulator, simulator-config, management, crm-config, indicators, leads';
COMMENT ON COLUMN permission_details.can_view IS 'Permissão para visualizar: company, team, personal, allowed, none';
COMMENT ON COLUMN permission_details.can_create IS 'Permissão para criar: company, team, personal, allowed, none';
COMMENT ON COLUMN permission_details.can_edit IS 'Permissão para editar: company, team, personal, allowed, none';
COMMENT ON COLUMN permission_details.can_archive IS 'Permissão para arquivar: company, team, personal, allowed, none';
COMMENT ON COLUMN permission_details.can_deactivate IS 'Permissão para desativar: company, team, personal, allowed, none';

-- Função auxiliar para converter valores do modal para o banco
CREATE OR REPLACE FUNCTION convert_permission_value(
    module_id text,
    slider_value integer
) RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    -- Para módulos com 4 níveis (CRM, Indicadores, Leads)
    IF module_id IN ('crm-config', 'indicators', 'leads') THEN
        CASE slider_value
            WHEN 0 THEN RETURN 'none';
            WHEN 1 THEN RETURN 'personal';
            WHEN 2 THEN RETURN 'team';
            WHEN 3 THEN RETURN 'company';
            ELSE RETURN 'none';
        END CASE;
    -- Para módulos com 2 níveis (Simulador, Configurações Simulador, Gestão)
    ELSE
        CASE slider_value
            WHEN 0 THEN RETURN 'none';
            WHEN 1 THEN RETURN 'allowed';
            ELSE RETURN 'none';
        END CASE;
    END IF;
END;
$$;

-- Função auxiliar para converter valores do banco para o modal
CREATE OR REPLACE FUNCTION convert_permission_to_slider(
    module_id text,
    permission_value text
) RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
    -- Para módulos com 4 níveis (CRM, Indicadores, Leads)
    IF module_id IN ('crm-config', 'indicators', 'leads') THEN
        CASE permission_value
            WHEN 'none' THEN RETURN 0;
            WHEN 'personal' THEN RETURN 1;
            WHEN 'team' THEN RETURN 2;
            WHEN 'company' THEN RETURN 3;
            ELSE RETURN 0;
        END CASE;
    -- Para módulos com 2 níveis (Simulador, Configurações Simulador, Gestão)
    ELSE
        CASE permission_value
            WHEN 'none' THEN RETURN 0;
            WHEN 'allowed' THEN RETURN 1;
            ELSE RETURN 0;
        END CASE;
    END IF;
END;
$$; 