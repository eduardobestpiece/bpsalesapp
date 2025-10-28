-- Adicionar campos de perfil à tabela crm_users
-- Execute este SQL diretamente no Supabase Dashboard > SQL Editor

-- Adicionar colunas de perfil se não existirem
ALTER TABLE crm_users 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comentários para documentação
COMMENT ON COLUMN crm_users.birth_date IS 'Data de nascimento do usuário';
COMMENT ON COLUMN crm_users.bio IS 'Biografia/descrição do usuário';
COMMENT ON COLUMN crm_users.avatar_url IS 'URL da foto de perfil do usuário';
