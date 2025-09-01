-- Criar tabela de campos personalizados
CREATE TABLE IF NOT EXISTS public.custom_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'email', 'phone', 'date', 'time', 'datetime', 'money', 'multifield', 'select', 'multiselect', 'checkbox', 'radio')),
    is_required BOOLEAN DEFAULT false,
    options TEXT, -- Para campos de seleção (uma opção por linha)
    validation_rules TEXT, -- Regras de validação específicas
    required_funnel_id UUID REFERENCES public.funnels(id) ON DELETE SET NULL, -- Funil onde o campo é obrigatório
    required_stage_id UUID REFERENCES public.funnel_stages(id) ON DELETE SET NULL, -- Fase onde o campo se torna obrigatório
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de relação entre campos personalizados e funis
CREATE TABLE IF NOT EXISTS public.custom_field_funnels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    custom_field_id UUID NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
    funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(custom_field_id, funnel_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_custom_fields_company_id ON public.custom_fields(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_status ON public.custom_fields(status);
CREATE INDEX IF NOT EXISTS idx_custom_fields_created_at ON public.custom_fields(created_at);
CREATE INDEX IF NOT EXISTS idx_custom_field_funnels_custom_field_id ON public.custom_field_funnels(custom_field_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_funnels_funnel_id ON public.custom_field_funnels(funnel_id);

-- Habilitar RLS
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_funnels ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para campos personalizados (seguindo o padrão das outras tabelas)
CREATE POLICY "Admins can manage company custom fields" ON public.custom_fields
    FOR ALL USING (
        (get_user_role((current_setting('request.jwt.claims', true))::json ->> 'email') = 'master'::user_role) 
        OR 
        ((get_user_role((current_setting('request.jwt.claims', true))::json ->> 'email') = 'admin'::user_role) 
         AND user_belongs_to_company((current_setting('request.jwt.claims', true))::json ->> 'email', company_id))
    );

CREATE POLICY "Users can view company custom fields" ON public.custom_fields
    FOR SELECT USING (
        (get_user_role((current_setting('request.jwt.claims', true))::json ->> 'email') = 'master'::user_role) 
        OR 
        user_belongs_to_company((current_setting('request.jwt.claims', true))::json ->> 'email', company_id)
    );

-- Políticas RLS para relação custom_field_funnels
CREATE POLICY "Admins can manage company custom field funnels" ON public.custom_field_funnels
    FOR ALL USING (
        (get_user_role((current_setting('request.jwt.claims', true))::json ->> 'email') = 'master'::user_role) 
        OR 
        ((get_user_role((current_setting('request.jwt.claims', true))::json ->> 'email') = 'admin'::user_role) 
         AND EXISTS (
             SELECT 1 FROM public.custom_fields cf 
             WHERE cf.id = custom_field_funnels.custom_field_id 
             AND user_belongs_to_company((current_setting('request.jwt.claims', true))::json ->> 'email', cf.company_id)
         ))
    );

CREATE POLICY "Users can view company custom field funnels" ON public.custom_field_funnels
    FOR SELECT USING (
        (get_user_role((current_setting('request.jwt.claims', true))::json ->> 'email') = 'master'::user_role) 
        OR 
        EXISTS (
            SELECT 1 FROM public.custom_fields cf 
            WHERE cf.id = custom_field_funnels.custom_field_id 
            AND user_belongs_to_company((current_setting('request.jwt.claims', true))::json ->> 'email', cf.company_id)
        )
    );

-- Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_custom_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_custom_fields_updated_at
    BEFORE UPDATE ON public.custom_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_fields_updated_at(); 