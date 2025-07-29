-- Corrige as tabelas sem RLS para resolver problemas de segurança

-- Habilita RLS para funnel_column_settings
ALTER TABLE public.funnel_column_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company funnel settings" 
ON public.funnel_column_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.funnels 
  WHERE funnels.id = funnel_column_settings.funnel_id 
  AND (
    public.get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::public.user_role
    OR public.user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), funnels.company_id)
  )
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.funnels 
  WHERE funnels.id = funnel_column_settings.funnel_id 
  AND (
    public.get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::public.user_role
    OR public.user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), funnels.company_id)
  )
));

-- Habilita RLS para simulator_configurations
ALTER TABLE public.simulator_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own simulator configurations" 
ON public.simulator_configurations 
FOR ALL 
USING (
  public.get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::public.user_role
  OR public.user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
  OR user_id IN (
    SELECT id FROM public.crm_users 
    WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
  )
)
WITH CHECK (
  public.get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::public.user_role
  OR public.user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
  OR user_id IN (
    SELECT id FROM public.crm_users 
    WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
  )
);