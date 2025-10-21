-- Adicionar coluna placeholder_text na tabela client_fields
ALTER TABLE public.client_fields 
ADD COLUMN IF NOT EXISTS placeholder_text TEXT DEFAULT 'seu@email.com';

-- Atualizar registros existentes com valor padrão
UPDATE public.client_fields 
SET placeholder_text = 'seu@email.com'
WHERE placeholder_text IS NULL OR placeholder_text = '';
