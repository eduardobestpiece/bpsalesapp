-- Corrigir a constraint de field_type para incluir todos os tipos suportados
ALTER TABLE public.custom_fields DROP CONSTRAINT IF EXISTS custom_fields_field_type_check;

ALTER TABLE public.custom_fields ADD CONSTRAINT custom_fields_field_type_check 
CHECK (field_type IN ('text', 'textarea', 'number', 'email', 'phone', 'date', 'time', 'datetime', 'money', 'multifield', 'select', 'multiselect', 'checkbox', 'radio')); 