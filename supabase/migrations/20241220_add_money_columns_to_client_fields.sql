-- Adicionar colunas monetárias à tabela client_fields
ALTER TABLE client_fields 
ADD COLUMN IF NOT EXISTS money_limits BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS money_min DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS money_max DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS money_currency TEXT DEFAULT 'BRL';

-- Adicionar constraint para validar moeda
ALTER TABLE client_fields 
ADD CONSTRAINT check_money_currency 
CHECK (money_currency IN (
  'BRL', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 
  'ARS', 'CLP', 'COP', 'MXN', 'PEN', 'UYU', 'VARIABLES'
));

-- Comentários para documentação
COMMENT ON COLUMN client_fields.money_limits IS 'Se o campo monetário tem limites de valor';
COMMENT ON COLUMN client_fields.money_min IS 'Valor mínimo para campo monetário';
COMMENT ON COLUMN client_fields.money_max IS 'Valor máximo para campo monetário';
COMMENT ON COLUMN client_fields.money_currency IS 'Moeda selecionada para campo monetário';
