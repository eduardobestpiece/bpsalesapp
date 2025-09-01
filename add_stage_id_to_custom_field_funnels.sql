-- Migração para adicionar coluna stage_id à tabela custom_field_funnels
-- Execute este SQL no seu banco de dados Supabase (SQL Editor)

-- Adicionar coluna stage_id à tabela custom_field_funnels
ALTER TABLE custom_field_funnels 
ADD COLUMN stage_id UUID REFERENCES funnel_stages(id);

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN custom_field_funnels.stage_id IS 'ID da etapa do funil onde o campo é obrigatório';

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'custom_field_funnels' 
AND column_name = 'stage_id'; 