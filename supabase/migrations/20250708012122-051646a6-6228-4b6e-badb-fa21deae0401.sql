
-- Adicionar RLS policies completas para todas as tabelas CRM

-- Policies para funnels
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company funnels" 
ON public.funnels 
FOR SELECT 
USING (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
);

CREATE POLICY "Admins can manage company funnels" 
ON public.funnels 
FOR ALL 
USING (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id))
) 
WITH CHECK (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id))
);

-- Policies para funnel_stages
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view funnel stages" 
ON public.funnel_stages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.funnels 
    WHERE funnels.id = funnel_stages.funnel_id 
    AND (
      (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
      user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), funnels.company_id)
    )
  )
);

CREATE POLICY "Admins can manage funnel stages" 
ON public.funnel_stages 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.funnels 
    WHERE funnels.id = funnel_stages.funnel_id 
    AND (
      (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
      (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
       user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), funnels.company_id))
    )
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.funnels 
    WHERE funnels.id = funnel_stages.funnel_id 
    AND (
      (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
      (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
       user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), funnels.company_id))
    )
  )
);

-- Policies para sources
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company sources" 
ON public.sources 
FOR SELECT 
USING (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
);

CREATE POLICY "Admins can manage company sources" 
ON public.sources 
FOR ALL 
USING (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id))
) 
WITH CHECK (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id))
);

-- Policies para teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company teams" 
ON public.teams 
FOR SELECT 
USING (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)
);

CREATE POLICY "Admins can manage company teams" 
ON public.teams 
FOR ALL 
USING (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id))
) 
WITH CHECK (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id))
);

-- Policies para leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible leads" 
ON public.leads 
FOR SELECT 
USING (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)) OR
  (responsible_id IN (
    SELECT id FROM crm_users 
    WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
  )) OR
  (responsible_id IN (
    SELECT id FROM crm_users cu1
    WHERE cu1.team_id IN (
      SELECT team_id FROM crm_users cu2
      WHERE cu2.email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
      AND cu2.role = 'leader'::user_role
    )
  ))
);

CREATE POLICY "Users can manage their leads" 
ON public.leads 
FOR ALL 
USING (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)) OR
  (responsible_id IN (
    SELECT id FROM crm_users 
    WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
  ))
) 
WITH CHECK (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)) OR
  (responsible_id IN (
    SELECT id FROM crm_users 
    WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
  ))
);

-- Policies para sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible sales" 
ON public.sales 
FOR SELECT 
USING (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)) OR
  (responsible_id IN (
    SELECT id FROM crm_users 
    WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
  )) OR
  (responsible_id IN (
    SELECT id FROM crm_users cu1
    WHERE cu1.team_id IN (
      SELECT team_id FROM crm_users cu2
      WHERE cu2.email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
      AND cu2.role = 'leader'::user_role
    )
  ))
);

CREATE POLICY "Users can manage their sales" 
ON public.sales 
FOR ALL 
USING (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)) OR
  (responsible_id IN (
    SELECT id FROM crm_users 
    WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
  ))
) 
WITH CHECK (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)) OR
  (responsible_id IN (
    SELECT id FROM crm_users 
    WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
  ))
);

-- Policies para indicators
ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible indicators" 
ON public.indicators 
FOR SELECT 
USING (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)) OR
  (user_id IN (
    SELECT id FROM crm_users 
    WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
  )) OR
  (user_id IN (
    SELECT id FROM crm_users cu1
    WHERE cu1.team_id IN (
      SELECT team_id FROM crm_users cu2
      WHERE cu2.email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
      AND cu2.role = 'leader'::user_role
    )
  ))
);

CREATE POLICY "Users can manage their indicators" 
ON public.indicators 
FOR ALL 
USING (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)) OR
  (user_id IN (
    SELECT id FROM crm_users 
    WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
  ))
) 
WITH CHECK (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)) OR
  (user_id IN (
    SELECT id FROM crm_users 
    WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
  ))
);

-- Policies para indicator_values
ALTER TABLE public.indicator_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible indicator values" 
ON public.indicator_values 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.indicators 
    WHERE indicators.id = indicator_values.indicator_id 
    AND (
      (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
      (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
       user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), indicators.company_id)) OR
      (indicators.user_id IN (
        SELECT id FROM crm_users 
        WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
      )) OR
      (indicators.user_id IN (
        SELECT id FROM crm_users cu1
        WHERE cu1.team_id IN (
          SELECT team_id FROM crm_users cu2
          WHERE cu2.email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
          AND cu2.role = 'leader'::user_role
        )
      ))
    )
  )
);

CREATE POLICY "Users can manage their indicator values" 
ON public.indicator_values 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.indicators 
    WHERE indicators.id = indicator_values.indicator_id 
    AND (
      (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
      (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
       user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), indicators.company_id)) OR
      (indicators.user_id IN (
        SELECT id FROM crm_users 
        WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
      ))
    )
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.indicators 
    WHERE indicators.id = indicator_values.indicator_id 
    AND (
      (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
      (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
       user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), indicators.company_id)) OR
      (indicators.user_id IN (
        SELECT id FROM crm_users 
        WHERE email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
      ))
    )
  )
);

-- Adicionar politicas de INSERT, UPDATE e DELETE para crm_users
CREATE POLICY "Admins can create users" 
ON public.crm_users 
FOR INSERT 
WITH CHECK (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role)
);

CREATE POLICY "Admins can update users" 
ON public.crm_users 
FOR UPDATE 
USING (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)) OR
  (email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text))
) 
WITH CHECK (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id)) OR
  (email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text))
);

CREATE POLICY "Admins can delete users" 
ON public.crm_users 
FOR DELETE 
USING (
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'master'::user_role) OR 
  (get_user_role(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)) = 'admin'::user_role AND 
   user_belongs_to_company(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), company_id))
);
