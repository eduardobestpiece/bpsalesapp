-- Atualizar a constraint da coluna type na tabela products para incluir 'service'
-- Remover a constraint antiga
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;

-- Adicionar a nova constraint que inclui 'service'
ALTER TABLE products ADD CONSTRAINT products_type_check 
CHECK (type = ANY (ARRAY['property'::text, 'car'::text, 'service'::text])); 