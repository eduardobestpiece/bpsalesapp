-- Criar tabela de motivos de perda
CREATE TABLE IF NOT EXISTS public.loss_reasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_loss_reasons_company_id ON public.loss_reasons(company_id);
CREATE INDEX IF NOT EXISTS idx_loss_reasons_status ON public.loss_reasons(status);
CREATE INDEX IF NOT EXISTS idx_loss_reasons_created_at ON public.loss_reasons(created_at);

-- Habilitar RLS
ALTER TABLE public.loss_reasons ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para motivos de perda
CREATE POLICY "Users can view loss reasons from their company" ON public.loss_reasons
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.crm_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert loss reasons in their company" ON public.loss_reasons
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.crm_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update loss reasons in their company" ON public.loss_reasons
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.crm_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete loss reasons in their company" ON public.loss_reasons
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM public.crm_users 
            WHERE user_id = auth.uid()
        )
    );

-- Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_loss_reasons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_loss_reasons_updated_at
    BEFORE UPDATE ON public.loss_reasons
    FOR EACH ROW
    EXECUTE FUNCTION update_loss_reasons_updated_at(); 