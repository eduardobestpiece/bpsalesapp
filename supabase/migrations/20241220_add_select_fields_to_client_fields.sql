-- Adicionar colunas específicas para seleção na tabela client_fields
ALTER TABLE public.client_fields 
ADD COLUMN IF NOT EXISTS options TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS searchable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS multiselect BOOLEAN DEFAULT false;

-- Atualizar registros existentes com valores padrão
UPDATE public.client_fields 
SET options = '', searchable = false, multiselect = false
WHERE options IS NULL OR searchable IS NULL OR multiselect IS NULL;
