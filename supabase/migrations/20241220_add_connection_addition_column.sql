-- Adicionar coluna connection_addition às tabelas de campos
-- Esta coluna controla se o campo de conexão permite adicionar novos itens

-- Adicionar à tabela client_fields
ALTER TABLE client_fields 
ADD COLUMN IF NOT EXISTS connection_addition BOOLEAN DEFAULT FALSE;

-- Adicionar à tabela company_fields  
ALTER TABLE company_fields 
ADD COLUMN IF NOT EXISTS connection_addition BOOLEAN DEFAULT FALSE;

-- Adicionar à tabela sale_fields
ALTER TABLE sale_fields 
ADD COLUMN IF NOT EXISTS connection_addition BOOLEAN DEFAULT FALSE;

-- Comentários para documentação
COMMENT ON COLUMN client_fields.connection_addition IS 'Se o campo de conexão permite adicionar novos itens via ícone +';
COMMENT ON COLUMN company_fields.connection_addition IS 'Se o campo de conexão permite adicionar novos itens via ícone +';
COMMENT ON COLUMN sale_fields.connection_addition IS 'Se o campo de conexão permite adicionar novos itens via ícone +';


