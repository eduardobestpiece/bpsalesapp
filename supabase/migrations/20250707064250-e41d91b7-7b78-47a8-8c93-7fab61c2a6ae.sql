
-- Criar tabela de administradoras
CREATE TABLE public.administrators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  credit_update_type TEXT NOT NULL CHECK (credit_update_type IN ('monthly', 'annual')),
  update_month INTEGER CHECK (update_month BETWEEN 1 AND 12),
  grace_period_days INTEGER,
  max_embedded_percentage DECIMAL(5,2),
  special_entry_type TEXT CHECK (special_entry_type IN ('none', 'percentage', 'fixed_value')),
  special_entry_percentage DECIMAL(5,2),
  special_entry_fixed_value DECIMAL(15,2),
  special_entry_installments INTEGER,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de tipos de lance
CREATE TABLE public.bid_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  administrator_id UUID REFERENCES public.administrators(id) ON DELETE CASCADE,
  percentage DECIMAL(5,2),
  allows_embedded BOOLEAN DEFAULT FALSE,
  is_loyalty BOOLEAN DEFAULT FALSE,
  loyalty_months INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de produtos
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('property', 'car')),
  administrator_id UUID REFERENCES public.administrators(id) ON DELETE CASCADE,
  credit_value DECIMAL(15,2) NOT NULL,
  term_options INTEGER[] NOT NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para permitir acesso público por enquanto
CREATE POLICY "Allow public access to administrators" ON public.administrators FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to bid_types" ON public.bid_types FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to products" ON public.products FOR ALL TO public USING (true) WITH CHECK (true);

-- Inserir lance livre padrão para todas as administradoras (será feito via trigger)
CREATE OR REPLACE FUNCTION public.create_default_bid_type()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.bid_types (name, administrator_id, percentage, allows_embedded, is_default)
  VALUES ('Lance Livre', NEW.id, 0, true, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_default_bid_type_trigger
  AFTER INSERT ON public.administrators
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_bid_type();

-- Constraint para garantir apenas um lance padrão por administradora
CREATE UNIQUE INDEX unique_default_bid_per_admin 
ON public.bid_types (administrator_id) 
WHERE is_default = true AND is_archived = false;
