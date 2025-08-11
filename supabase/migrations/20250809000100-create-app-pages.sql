-- Tabela de páginas/abas da plataforma
create table if not exists public.app_pages (
  key text primary key,
  label text not null,
  parent_key text null references public.app_pages(key) on delete cascade,
  module text null,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.app_pages is 'Registro canônico de páginas e abas para controle de permissões';

create index if not exists idx_app_pages_parent on public.app_pages(parent_key);
create index if not exists idx_app_pages_active on public.app_pages(is_active);

-- RLS
alter table public.app_pages enable row level security;

-- Política SELECT (idempotente)
DO $$ BEGIN
  CREATE POLICY app_pages_select ON public.app_pages
    FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Política WRITE (idempotente)
DO $$ BEGIN
  CREATE POLICY app_pages_write ON public.app_pages
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seeds idempotentes
insert into public.app_pages (key, label, parent_key, module, display_order)
values
  ('simulator', 'Simulador', null, 'simulator', 10),
  ('simulator_config', 'Configurações do Simulador', null, 'settings', 20),
  ('comercial', 'Comercial', null, 'crm', 30),
  ('comercial_leads', 'Leads', 'comercial', 'crm', 31),
  ('comercial_sales', 'Vendas', 'comercial', 'crm', 32),
  ('indicadores', 'Indicadores', null, 'crm', 40),
  ('indicadores_performance', 'Performance', 'indicadores', 'crm', 41),
  ('indicadores_registro', 'Registro de Indicadores', 'indicadores', 'crm', 42),
  ('crm_config', 'Configurações CRM', null, 'settings', 50),
  ('crm_config_funnels', 'Funis', 'crm_config', 'settings', 51),
  ('crm_config_sources', 'Origens', 'crm_config', 'settings', 52),
  ('crm_config_teams', 'Times', 'crm_config', 'settings', 53),
  ('crm_config_users', 'Usuários', 'crm_config', 'settings', 54)
ON CONFLICT (key) DO UPDATE SET
  label = excluded.label,
  parent_key = excluded.parent_key,
  module = excluded.module,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

-- Solicitar reload de schema
select pg_notify('pgrst', 'reload schema'); 