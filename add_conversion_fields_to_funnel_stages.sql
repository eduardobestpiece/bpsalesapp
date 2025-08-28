-- Adicionar colunas para funcionalidade de conversão
ALTER TABLE funnel_stages 
ADD COLUMN is_conversion BOOLEAN DEFAULT FALSE,
ADD COLUMN conversion_type TEXT CHECK (conversion_type IN ('MQL', 'SQL', 'SAL', 'Venda')); 