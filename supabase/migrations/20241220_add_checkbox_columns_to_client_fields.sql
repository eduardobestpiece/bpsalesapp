-- Adicionar coluna de colunas para checkbox na tabela client_fields
ALTER TABLE public.client_fields 
ADD COLUMN IF NOT EXISTS checkbox_columns INTEGER DEFAULT 1;

-- Atualizar registros existentes com valor padrão
UPDATE public.client_fields 
SET checkbox_columns = 1
WHERE checkbox_columns IS NULL;

-- Adicionar constraint para garantir que o valor esteja entre 1 e 10
ALTER TABLE public.client_fields 
ADD CONSTRAINT check_checkbox_columns_range 
CHECK (checkbox_columns >= 1 AND checkbox_columns <= 10);
