-- Adicionar colunas específicas para checkbox na tabela client_fields
ALTER TABLE public.client_fields 
ADD COLUMN IF NOT EXISTS checkbox_multiselect BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS checkbox_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS checkbox_options TEXT DEFAULT '';

-- Atualizar registros existentes com valores padrão
UPDATE public.client_fields 
SET checkbox_multiselect = false, checkbox_limit = 0, checkbox_options = ''
WHERE checkbox_multiselect IS NULL OR checkbox_limit IS NULL OR checkbox_options IS NULL;
