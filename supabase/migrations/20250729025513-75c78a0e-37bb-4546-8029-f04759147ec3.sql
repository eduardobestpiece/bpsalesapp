-- Corrige as funções de segurança críticas com search_path
-- Esta correção resolve problemas de segurança e pode resolver o erro "Usuário não encontrado no CRM"

-- Atualiza get_user_role com search_path seguro
CREATE OR REPLACE FUNCTION public.get_user_role(user_email text)
 RETURNS user_role
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM public.crm_users
  WHERE email = user_email AND status = 'active';
  
  RETURN COALESCE(user_role_result, 'user');
END;
$function$;

-- Atualiza user_belongs_to_company com search_path seguro
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(user_email text, comp_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  belongs BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.crm_users 
    WHERE email = user_email 
    AND company_id = comp_id 
    AND status = 'active'
  ) INTO belongs;
  
  RETURN belongs;
END;
$function$;

-- Atualiza create_default_bid_type com search_path seguro
CREATE OR REPLACE FUNCTION public.create_default_bid_type()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.bid_types (name, administrator_id, percentage, allows_embedded, is_default)
  VALUES ('Lance Livre', NEW.id, 0, true, true);
  RETURN NEW;
END;
$function$;

-- Adiciona RLS para funnel_column_settings
ALTER TABLE public.funnel_column_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company funnel settings" 
ON public.funnel_column_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.funnels 
  WHERE funnels.id = funnel_column_settings.funnel_id 
  AND (
    public.get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role
    OR public.user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), funnels.company_id)
  )
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.funnels 
  WHERE funnels.id = funnel_column_settings.funnel_id 
  AND (
    public.get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role
    OR public.user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), funnels.company_id)
  )
));

-- Adiciona RLS para simulator_configurations
ALTER TABLE public.simulator_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own simulator configurations" 
ON public.simulator_configurations 
FOR ALL 
USING (
  public.get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role
  OR public.user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
  OR user_id IN (
    SELECT id FROM public.crm_users 
    WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
  )
)
WITH CHECK (
  public.get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role
  OR public.user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
  OR user_id IN (
    SELECT id FROM public.crm_users 
    WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
  )
);