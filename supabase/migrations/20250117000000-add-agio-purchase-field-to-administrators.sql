-- Adicionar campo para compra do ágio na tabela administrators
ALTER TABLE public.administrators 
ADD COLUMN agio_purchase_percentage DECIMAL(5,2) DEFAULT 0.00;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN public.administrators.agio_purchase_percentage IS 'Percentual para compra do ágio'; 