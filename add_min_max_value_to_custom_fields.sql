-- Migração para adicionar colunas min_value e max_value à tabela custom_fields
-- Execute este SQL no seu banco de dados Supabase (SQL Editor)

-- Adicionar colunas min_value e max_value à tabela custom_fields
ALTER TABLE custom_fields 
ADD COLUMN min_value TEXT,
ADD COLUMN max_value TEXT;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN custom_fields.min_value IS 'Valor mínimo permitido para campos numéricos';
COMMENT ON COLUMN custom_fields.max_value IS 'Valor máximo permitido para campos numéricos';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'custom_fields' 
AND column_name IN ('min_value', 'max_value'); 