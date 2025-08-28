-- Atualização da estrutura da tabela leads para suportar nome e sobrenome separados
-- Data: 2025-01-29

-- 1. Adicionar campos first_name e last_name
ALTER TABLE leads 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- 2. Migrar dados existentes do campo name para first_name e last_name
UPDATE leads 
SET 
  first_name = CASE 
    WHEN name IS NULL THEN NULL
    WHEN POSITION(' ' IN name) = 0 THEN name
    ELSE LEFT(name, POSITION(' ' IN name) - 1)
  END,
  last_name = CASE 
    WHEN name IS NULL THEN NULL
    WHEN POSITION(' ' IN name) = 0 THEN ''
    ELSE SUBSTRING(name FROM POSITION(' ' IN name) + 1)
  END;

-- 3. Tornar first_name obrigatório (não nulo) após migração
ALTER TABLE leads 
ALTER COLUMN first_name SET NOT NULL;

-- 4. Adicionar comentários explicativos
COMMENT ON COLUMN leads.first_name IS 'Primeiro nome do lead';
COMMENT ON COLUMN leads.last_name IS 'Sobrenome do lead (opcional)';

-- 5. Verificar se a migração foi bem-sucedida
SELECT 
  COUNT(*) as total_leads,
  COUNT(first_name) as leads_com_first_name,
  COUNT(last_name) as leads_com_last_name,
  COUNT(CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 1 END) as leads_com_nome_completo
FROM leads; 