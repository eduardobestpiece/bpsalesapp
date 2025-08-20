-- Adicionar páginas para controle de permissões de usuários normais
insert into public.app_pages (key, label, parent_key, module, display_order)
values
  ('profile', 'Meu Perfil', null, 'user', 100),
  ('dashboard', 'Dashboard', null, 'crm', 5),
  ('agenda', 'Agenda', null, 'crm', 35),
  ('reports', 'Relatórios', null, 'crm', 45),
  ('master_config', 'Configurações Master', null, 'master', 200)
ON CONFLICT (key) DO UPDATE SET
  label = excluded.label,
  parent_key = excluded.parent_key,
  module = excluded.module,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

-- Solicitar reload de schema
select pg_notify('pgrst', 'reload schema'); 