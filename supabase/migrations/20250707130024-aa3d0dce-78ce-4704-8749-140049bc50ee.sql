
-- Create table for installment types (parcelas)
CREATE TABLE public.installment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  administrator_id UUID REFERENCES public.administrators(id),
  type TEXT NOT NULL CHECK (type IN ('MEIA', 'REDUZIDA')),
  reduction_percentage NUMERIC,
  reduces_credit BOOLEAN DEFAULT false,
  reduces_admin_tax BOOLEAN DEFAULT false,
  reduces_insurance BOOLEAN DEFAULT false,
  reduces_reserve_fund BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for entry types (entradas)
CREATE TABLE public.entry_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  administrator_id UUID REFERENCES public.administrators(id),
  type TEXT NOT NULL CHECK (type IN ('PERCENTUAL', 'VALOR_FIXO')),
  percentage NUMERIC,
  fixed_value NUMERIC,
  installment_months INTEGER NOT NULL DEFAULT 1,
  is_optional BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.installment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_types ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching administrators table pattern)
CREATE POLICY "Allow public access to installment_types" 
  ON public.installment_types 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow public access to entry_types" 
  ON public.entry_types 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
