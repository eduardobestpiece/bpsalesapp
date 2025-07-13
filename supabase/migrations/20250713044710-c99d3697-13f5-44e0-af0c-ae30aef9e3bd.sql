
-- Criar tabela para reduções de parcela
CREATE TABLE public.installment_reductions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  administrator_id UUID REFERENCES administrators(id) ON DELETE CASCADE,
  reduction_percent NUMERIC NOT NULL CHECK (reduction_percent > 0 AND reduction_percent <= 100),
  applications TEXT[] NOT NULL DEFAULT '{}', -- Array com: 'installment', 'admin_tax', 'reserve_fund', 'insurance'
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar company_id às tabelas existentes que não têm
ALTER TABLE administrators ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE leverages ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE bid_types ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE entry_types ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE installment_types ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Atualizar administrators para suportar novos campos
ALTER TABLE administrators ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE administrators ADD COLUMN IF NOT EXISTS update_type TEXT CHECK (update_type IN ('specific_month', 'after_12_installments')) DEFAULT 'specific_month';

-- Atualizar installment_types para suportar novos campos
ALTER TABLE installment_types ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE installment_types ADD COLUMN IF NOT EXISTS admin_tax_percent NUMERIC DEFAULT 0;
ALTER TABLE installment_types ADD COLUMN IF NOT EXISTS reserve_fund_percent NUMERIC DEFAULT 0;
ALTER TABLE installment_types ADD COLUMN IF NOT EXISTS insurance_percent NUMERIC DEFAULT 0;
ALTER TABLE installment_types ADD COLUMN IF NOT EXISTS optional_insurance BOOLEAN DEFAULT false;
ALTER TABLE installment_types ADD COLUMN IF NOT EXISTS installment_count INTEGER DEFAULT 1;

-- Criar tabela de relacionamento entre installment_types e installment_reductions
CREATE TABLE IF NOT EXISTS public.installment_type_reductions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installment_type_id UUID NOT NULL REFERENCES installment_types(id) ON DELETE CASCADE,
  installment_reduction_id UUID NOT NULL REFERENCES installment_reductions(id) ON DELETE CASCADE,
  UNIQUE(installment_type_id, installment_reduction_id)
);

-- Atualizar products para novos campos
ALTER TABLE products ADD COLUMN IF NOT EXISTS installment_value NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS admin_tax_percent NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserve_fund_percent NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS insurance_percent NUMERIC DEFAULT 0;

-- Criar tabela de relacionamento entre products e installment_types
CREATE TABLE IF NOT EXISTS public.product_installment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  installment_type_id UUID NOT NULL REFERENCES installment_types(id) ON DELETE CASCADE,
  UNIQUE(product_id, installment_type_id)
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE installment_reductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_type_reductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_installment_types ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para installment_reductions
CREATE POLICY "Allow public access to installment_reductions" ON installment_reductions FOR ALL USING (true) WITH CHECK (true);

-- Políticas RLS para installment_type_reductions
CREATE POLICY "Allow public access to installment_type_reductions" ON installment_type_reductions FOR ALL USING (true) WITH CHECK (true);

-- Políticas RLS para product_installment_types
CREATE POLICY "Allow public access to product_installment_types" ON product_installment_types FOR ALL USING (true) WITH CHECK (true);
