-- Adicionar novas colunas para os novos tipos de campo
ALTER TABLE client_fields 
ADD COLUMN IF NOT EXISTS field_type_new TEXT,
ADD COLUMN IF NOT EXISTS slider_min INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS slider_max INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS slider_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS money_currency TEXT DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS address_cep_auto BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS address_country TEXT DEFAULT 'Brasil';

-- Atualizar tipos existentes para usar a nova coluna
UPDATE client_fields 
SET field_type_new = field_type 
WHERE field_type_new IS NULL;

-- Adicionar constraint para validar tipos de campo
ALTER TABLE client_fields 
ADD CONSTRAINT check_field_type_new 
CHECK (field_type_new IN (
  'text', 'name', 'email', 'phone', 'number', 'date', 'time', 'datetime', 
  'money', 'slider', 'address', 'textarea', 'select', 'checkbox'
));

-- Comentários para documentação
COMMENT ON COLUMN client_fields.field_type_new IS 'Tipo do campo com suporte aos novos tipos';
COMMENT ON COLUMN client_fields.slider_min IS 'Valor mínimo do slider';
COMMENT ON COLUMN client_fields.slider_max IS 'Valor máximo do slider';
COMMENT ON COLUMN client_fields.slider_step IS 'Incremento do slider';
COMMENT ON COLUMN client_fields.money_currency IS 'Moeda para campos monetários';
COMMENT ON COLUMN client_fields.address_cep_auto IS 'Se deve preencher automaticamente com CEP';
COMMENT ON COLUMN client_fields.address_country IS 'País padrão para endereços';
