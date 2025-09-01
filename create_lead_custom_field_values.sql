-- Migração para criar tabela de valores dos campos personalizados dos leads
-- Execute este SQL no seu banco de dados Supabase (SQL Editor)

-- Criar tabela para armazenar valores dos campos personalizados dos leads
CREATE TABLE lead_custom_field_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Garantir que cada lead só tem um valor por campo personalizado
  UNIQUE(lead_id, custom_field_id)
);

-- Adicionar comentários
COMMENT ON TABLE lead_custom_field_values IS 'Valores dos campos personalizados para cada lead';
COMMENT ON COLUMN lead_custom_field_values.lead_id IS 'ID do lead';
COMMENT ON COLUMN lead_custom_field_values.custom_field_id IS 'ID do campo personalizado';
COMMENT ON COLUMN lead_custom_field_values.value IS 'Valor do campo (pode ser JSON para campos multiselect)';

-- Criar índices para melhor performance
CREATE INDEX idx_lead_custom_field_values_lead_id ON lead_custom_field_values(lead_id);
CREATE INDEX idx_lead_custom_field_values_custom_field_id ON lead_custom_field_values(custom_field_id);

-- Verificar se a tabela foi criada
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lead_custom_field_values' 
ORDER BY ordinal_position; 