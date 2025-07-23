-- Adicionar campo de taxa de atualização anual na tabela installment_types
ALTER TABLE installment_types ADD COLUMN annual_update_rate NUMERIC DEFAULT 6.00;

-- Comentário explicativo
COMMENT ON COLUMN installment_types.annual_update_rate IS 'Taxa de atualização anual em percentual (ex: 6.00 = 6%)'; 