
-- Tabela para Redução de Parcelas
CREATE TABLE public.installment_reductions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  administrator_id UUID REFERENCES administrators(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  reduction_percent NUMERIC NOT NULL,
  applications TEXT[] NOT NULL DEFAULT '{}', -- Array de strings: 'installment', 'admin_tax', 'reserve_fund', 'insurance'
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de relacionamento entre tipos de parcelas e reduções
CREATE TABLE public.installment_type_reductions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installment_type_id UUID NOT NULL REFERENCES installment_types(id),
  installment_reduction_id UUID NOT NULL REFERENCES installment_reductions(id)
);

-- Adicionar campos para empresa nas tabelas existentes
ALTER TABLE public.administrators ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE public.installment_types ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES installment_types(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE public.leverages ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE public.bid_types ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE public.entry_types ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Adicionar campos para identificar item padrão
ALTER TABLE public.administrators ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.installment_types ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Atualizar tabela de administradoras com novos campos
ALTER TABLE public.administrators ADD COLUMN IF NOT EXISTS update_type TEXT DEFAULT 'specific_month';
ALTER TABLE public.administrators ADD COLUMN IF NOT EXISTS update_month INTEGER;
ALTER TABLE public.administrators DROP COLUMN IF EXISTS credit_update_type;

-- Garantir que apenas uma administradora seja padrão por empresa
CREATE OR REPLACE FUNCTION ensure_single_default_administrator()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE administrators 
    SET is_default = false 
    WHERE company_id = NEW.company_id 
    AND id != NEW.id 
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_administrator ON administrators;
CREATE TRIGGER trigger_ensure_single_default_administrator
  BEFORE INSERT OR UPDATE ON administrators
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_administrator();

-- Garantir que apenas uma parcela seja padrão por administradora
CREATE OR REPLACE FUNCTION ensure_single_default_installment_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE installment_types 
    SET is_default = false 
    WHERE administrator_id = NEW.administrator_id 
    AND id != NEW.id 
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_installment_type ON installment_types;
CREATE TRIGGER trigger_ensure_single_default_installment_type
  BEFORE INSERT OR UPDATE ON installment_types
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_installment_type();

-- Políticas RLS para installment_reductions
ALTER TABLE public.installment_reductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to installment_reductions" 
ON public.installment_reductions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Políticas RLS para installment_type_reductions
ALTER TABLE public.installment_type_reductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to installment_type_reductions" 
ON public.installment_type_reductions 
FOR ALL 
USING (true) 
WITH CHECK (true);
