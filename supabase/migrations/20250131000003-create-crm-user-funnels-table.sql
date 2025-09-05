-- Criar tabela para relacionar usuários com funis
CREATE TABLE IF NOT EXISTS public.crm_user_funnels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.crm_users(id) ON DELETE CASCADE,
    funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, funnel_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_crm_user_funnels_user_id ON public.crm_user_funnels(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_user_funnels_funnel_id ON public.crm_user_funnels(funnel_id);

-- Habilitar RLS
ALTER TABLE public.crm_user_funnels ENABLE ROW LEVEL SECURITY;

-- Política para usuários poderem ver seus próprios funis
CREATE POLICY "Users can view their own funnels" ON public.crm_user_funnels
    FOR SELECT USING (auth.uid()::uuid = user_id);

-- Política para admins/master poderem gerenciar todos os funis
CREATE POLICY "Admins can manage all user funnels" ON public.crm_user_funnels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.crm_users 
            WHERE id = auth.uid()::uuid
            AND role IN ('master', 'admin')
        )
    ); 