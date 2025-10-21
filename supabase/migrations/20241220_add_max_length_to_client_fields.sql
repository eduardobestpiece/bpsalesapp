-- Adicionar coluna max_length na tabela client_fields
ALTER TABLE public.client_fields 
ADD COLUMN IF NOT EXISTS max_length INTEGER DEFAULT 0;

-- Atualizar registros existentes com valor padrão
UPDATE public.client_fields 
SET max_length = 0
WHERE max_length IS NULL;
