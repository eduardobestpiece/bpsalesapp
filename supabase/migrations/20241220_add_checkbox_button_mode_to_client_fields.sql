-- Adicionar coluna de modo botão para checkbox na tabela client_fields
ALTER TABLE public.client_fields 
ADD COLUMN IF NOT EXISTS checkbox_button_mode BOOLEAN DEFAULT false;

-- Atualizar registros existentes com valor padrão
UPDATE public.client_fields 
SET checkbox_button_mode = false
WHERE checkbox_button_mode IS NULL;
