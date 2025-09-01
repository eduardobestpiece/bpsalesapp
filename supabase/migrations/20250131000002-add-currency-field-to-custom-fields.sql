-- Adicionar campo currency para campos monetários
ALTER TABLE public.custom_fields 
ADD COLUMN currency TEXT DEFAULT 'R$';

-- Adicionar constraint para validar moedas válidas
ALTER TABLE public.custom_fields 
ADD CONSTRAINT custom_fields_currency_check 
CHECK (currency IN ('R$', '$', '€', '£', '¥', '₿', '₽', '₹', '₩', '₪')); 