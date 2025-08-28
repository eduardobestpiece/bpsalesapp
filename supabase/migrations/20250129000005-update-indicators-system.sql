-- Migração para atualizar o sistema de indicadores
-- Data: 2025-01-29
-- Descrição: Remover periodicidade semanal/mensal, remover campos de vendas/recomendações, adicionar sistema de conversão

-- 1. Adicionar campos de conversão na tabela funnel_stages
ALTER TABLE funnel_stages 
ADD COLUMN IF NOT EXISTS conversion_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS conversion_funnel_id UUID REFERENCES funnels(id),
ADD COLUMN IF NOT EXISTS conversion_stage_id UUID REFERENCES funnel_stages(id);

-- 2. Adicionar comentários para documentar os novos campos
COMMENT ON COLUMN funnel_stages.conversion_enabled IS 'Habilita a conversão desta etapa para outro funil';
COMMENT ON COLUMN funnel_stages.conversion_funnel_id IS 'ID do funil de destino para conversão';
COMMENT ON COLUMN funnel_stages.conversion_stage_id IS 'ID da etapa de destino no funil de conversão';

-- 3. Criar índices para melhorar performance das consultas de conversão
CREATE INDEX IF NOT EXISTS idx_funnel_stages_conversion_enabled ON funnel_stages(conversion_enabled);
CREATE INDEX IF NOT EXISTS idx_funnel_stages_conversion_funnel ON funnel_stages(conversion_funnel_id);

-- 4. Adicionar constraint para garantir que se conversion_enabled = true, os campos de conversão devem estar preenchidos
ALTER TABLE funnel_stages 
ADD CONSTRAINT check_conversion_fields 
CHECK (
  (conversion_enabled = FALSE) OR 
  (conversion_enabled = TRUE AND conversion_funnel_id IS NOT NULL AND conversion_stage_id IS NOT NULL)
);

-- 5. Atualizar a tabela indicators para remover campos desnecessários (opcional - manter para compatibilidade)
-- Os campos sales_value e recommendations_count serão mantidos para compatibilidade com dados existentes
-- mas não serão mais usados no novo sistema

-- 6. Adicionar campo para controlar se o indicador é diário (sempre true no novo sistema)
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS is_daily BOOLEAN DEFAULT TRUE;

-- 7. Atualizar comentários da tabela indicators
COMMENT ON COLUMN indicators.is_daily IS 'Indica se o indicador é de periodicidade diária (sempre true no novo sistema)';
COMMENT ON COLUMN indicators.period_date IS 'Data do indicador (sempre diário no novo sistema)';

-- 8. Criar função para facilitar consultas de conversão
CREATE OR REPLACE FUNCTION get_conversion_stages(funnel_id_param UUID)
RETURNS TABLE(
  stage_id UUID,
  stage_name TEXT,
  conversion_funnel_id UUID,
  conversion_funnel_name TEXT,
  conversion_stage_id UUID,
  conversion_stage_name TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fs.id as stage_id,
    fs.name as stage_name,
    fs.conversion_funnel_id,
    f.name as conversion_funnel_name,
    fs.conversion_stage_id,
    fs2.name as conversion_stage_name
  FROM funnel_stages fs
  LEFT JOIN funnels f ON f.id = fs.conversion_funnel_id
  LEFT JOIN funnel_stages fs2 ON fs2.id = fs.conversion_stage_id
  WHERE fs.funnel_id = funnel_id_param 
    AND fs.conversion_enabled = TRUE;
END;
$$;

-- 9. Criar view para facilitar consultas de indicadores com conversões
CREATE OR REPLACE VIEW indicators_with_conversions AS
SELECT 
  i.*,
  fs.name as stage_name,
  fs.conversion_enabled,
  fs.conversion_funnel_id,
  f.name as conversion_funnel_name,
  fs.conversion_stage_id,
  fs2.name as conversion_stage_name
FROM indicators i
JOIN indicator_values iv ON iv.indicator_id = i.id
JOIN funnel_stages fs ON fs.id = iv.stage_id
LEFT JOIN funnels f ON f.id = fs.conversion_funnel_id
LEFT JOIN funnel_stages fs2 ON fs2.id = fs.conversion_stage_id
WHERE fs.conversion_enabled = TRUE;

-- 10. Atualizar políticas RLS para incluir os novos campos
-- As políticas existentes já cobrem os novos campos automaticamente

-- 11. Criar função para validar conversões
CREATE OR REPLACE FUNCTION validate_conversion_setup()
RETURNS TABLE(
  funnel_name TEXT,
  stage_name TEXT,
  conversion_funnel_name TEXT,
  conversion_stage_name TEXT,
  is_valid BOOLEAN,
  error_message TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.name as funnel_name,
    fs.name as stage_name,
    f2.name as conversion_funnel_name,
    fs2.name as conversion_stage_name,
    CASE 
      WHEN fs.conversion_enabled = FALSE THEN TRUE
      WHEN fs.conversion_funnel_id IS NULL OR fs.conversion_stage_id IS NULL THEN FALSE
      WHEN fs2.id IS NULL THEN FALSE
      ELSE TRUE
    END as is_valid,
    CASE 
      WHEN fs.conversion_enabled = FALSE THEN 'Conversão desabilitada'
      WHEN fs.conversion_funnel_id IS NULL THEN 'Funil de conversão não definido'
      WHEN fs.conversion_stage_id IS NULL THEN 'Etapa de conversão não definida'
      WHEN fs2.id IS NULL THEN 'Etapa de conversão não encontrada'
      ELSE 'Configuração válida'
    END as error_message
  FROM funnel_stages fs
  JOIN funnels f ON f.id = fs.funnel_id
  LEFT JOIN funnels f2 ON f2.id = fs.conversion_funnel_id
  LEFT JOIN funnel_stages fs2 ON fs2.id = fs.conversion_stage_id
  WHERE fs.conversion_enabled = TRUE;
END;
$$; 