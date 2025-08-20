-- Adicionar campo funcionamento na tabela administrators
-- Este campo controla se a entrada especial é "Incluso" ou "Adicional"
-- Aparece apenas quando special_entry_type não é 'none'

ALTER TABLE public.administrators 
ADD COLUMN IF NOT EXISTS functioning TEXT CHECK (functioning IN ('included', 'additional'));

-- Comentário explicativo
COMMENT ON COLUMN public.administrators.functioning IS 'Tipo de funcionamento da entrada especial: included (Incluso) ou additional (Adicional). Aparece apenas quando special_entry_type não é none.';

-- Atualizar registros existentes para ter um valor padrão
-- Se já existe special_entry_type diferente de 'none', definir como 'included' por padrão
UPDATE public.administrators 
SET functioning = 'included' 
WHERE special_entry_type IS NOT NULL 
  AND special_entry_type != 'none' 
  AND functioning IS NULL;

-- Para registros com special_entry_type = 'none', deixar functioning como NULL
-- (não aplicável neste caso) 