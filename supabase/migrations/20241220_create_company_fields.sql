-- Criar tabela company_fields
CREATE TABLE company_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  field_order INTEGER DEFAULT 0,
  placeholder BOOLEAN DEFAULT FALSE,
  placeholder_text TEXT DEFAULT '',
  max_length INTEGER DEFAULT 0,
  options TEXT DEFAULT '',
  searchable BOOLEAN DEFAULT FALSE,
  multiselect BOOLEAN DEFAULT FALSE,
  checkbox_multiselect BOOLEAN DEFAULT FALSE,
  checkbox_limit INTEGER DEFAULT 0,
  checkbox_columns INTEGER DEFAULT 1,
  checkbox_options TEXT DEFAULT '',
  checkbox_button_mode BOOLEAN DEFAULT FALSE,
  sender TEXT DEFAULT '',
  -- Configurações monetárias
  money_limits BOOLEAN DEFAULT FALSE,
  money_min DECIMAL(10,2) DEFAULT 0,
  money_max DECIMAL(10,2) DEFAULT 0,
  money_currency TEXT DEFAULT 'BRL',
  -- Configurações do slider
  slider_limits BOOLEAN DEFAULT FALSE,
  slider_min DECIMAL(10,2) DEFAULT 0,
  slider_max DECIMAL(10,2) DEFAULT 100,
  slider_step BOOLEAN DEFAULT FALSE,
  slider_step_value DECIMAL(10,2) DEFAULT 1,
  slider_start_end BOOLEAN DEFAULT FALSE,
  slider_start TEXT DEFAULT '',
  slider_end TEXT DEFAULT '',
  -- Configurações do documento
  document_cpf BOOLEAN DEFAULT FALSE,
  document_cnpj BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE company_fields ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view company fields for their company" ON company_fields
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies 
      WHERE id = auth.jwt() ->> 'company_id'::text::uuid
    )
  );

CREATE POLICY "Users can insert company fields for their company" ON company_fields
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM companies 
      WHERE id = auth.jwt() ->> 'company_id'::text::uuid
    )
  );

CREATE POLICY "Users can update company fields for their company" ON company_fields
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM companies 
      WHERE id = auth.jwt() ->> 'company_id'::text::uuid
    )
  );

CREATE POLICY "Users can delete company fields for their company" ON company_fields
  FOR DELETE USING (
    company_id IN (
      SELECT id FROM companies 
      WHERE id = auth.jwt() ->> 'company_id'::text::uuid
    )
  );
