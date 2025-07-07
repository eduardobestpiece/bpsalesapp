
-- Criar tabela de alavancas
CREATE TABLE public.leverages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('real_estate', 'vehicle')),
  subtype TEXT CHECK (subtype IN ('short_stay', 'commercial_residential')),
  
  -- Campos para imóveis
  has_fixed_property_value BOOLEAN DEFAULT false,
  fixed_property_value NUMERIC,
  daily_percentage NUMERIC,
  rental_percentage NUMERIC,
  management_percentage NUMERIC,
  real_estate_percentage NUMERIC,
  total_expenses NUMERIC,
  occupancy_rate NUMERIC,
  
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar RLS
ALTER TABLE public.leverages ENABLE ROW LEVEL SECURITY;

-- Política para acesso público (similar às outras tabelas)
CREATE POLICY "Allow public access to leverages" 
  ON public.leverages 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
