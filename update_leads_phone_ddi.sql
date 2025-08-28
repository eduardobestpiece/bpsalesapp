-- Adicionar campo DDI para telefone dos leads
-- Data: 2025-01-29

-- 1. Adicionar campo phone_ddi para armazenar o código do país
ALTER TABLE leads
ADD COLUMN phone_ddi TEXT DEFAULT '+55';

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN leads.phone_ddi IS 'Código do país (DDI) do telefone do lead. Padrão: +55 (Brasil)';

-- 3. Verificar se a alteração foi aplicada
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name = 'phone_ddi'; 