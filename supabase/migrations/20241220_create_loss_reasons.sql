-- Criar tabela loss_reasons
CREATE TABLE IF NOT EXISTS public.loss_reasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status entity_status DEFAULT 'active'
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_loss_reasons_company_id ON public.loss_reasons(company_id);
CREATE INDEX IF NOT EXISTS idx_loss_reasons_status ON public.loss_reasons(status);

-- Habilitar RLS
ALTER TABLE public.loss_reasons ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários só podem ver/editar motivos de perda da própria empresa
CREATE POLICY "Users can view loss reasons from their company" ON public.loss_reasons
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.crm_users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert loss reasons for their company" ON public.loss_reasons
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.crm_users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update loss reasons from their company" ON public.loss_reasons
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.crm_users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete loss reasons from their company" ON public.loss_reasons
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM public.crm_users WHERE id = auth.uid()
        )
    );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_loss_reasons_updated_at 
    BEFORE UPDATE ON public.loss_reasons 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
