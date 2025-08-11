-- Páginas do módulo Configurações
insert into public.app_pages (key, label, parent_key, module, display_order)
values
  ('settings_users', 'Usuários', null, 'settings', 60),
  ('settings_profile', 'Meu Perfil', null, 'settings', 70),
  ('settings_company', 'Empresa', null, 'settings', 80)
ON CONFLICT (key) DO UPDATE SET
  label = excluded.label,
  parent_key = excluded.parent_key,
  module = excluded.module,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

-- Abas de Usuários (seções)
insert into public.app_pages (key, label, parent_key, module, display_order)
values
  ('settings_users_list', 'Lista de Usuários', 'settings_users', 'settings', 601)
ON CONFLICT (key) DO UPDATE SET
  label = excluded.label,
  parent_key = excluded.parent_key,
  module = excluded.module,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

-- Abas de Meu Perfil
insert into public.app_pages (key, label, parent_key, module, display_order)
values
  ('settings_profile_info', 'Informações Pessoais', 'settings_profile', 'settings', 701),
  ('settings_profile_security', 'Segurança', 'settings_profile', 'settings', 702)
ON CONFLICT (key) DO UPDATE SET
  label = excluded.label,
  parent_key = excluded.parent_key,
  module = excluded.module,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

-- Abas de Empresa
insert into public.app_pages (key, label, parent_key, module, display_order)
values
  ('settings_company_data', 'Dados da empresa', 'settings_company', 'settings', 801),
  ('settings_company_branding', 'Identidade visual', 'settings_company', 'settings', 802)
ON CONFLICT (key) DO UPDATE SET
  label = excluded.label,
  parent_key = excluded.parent_key,
  module = excluded.module,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

select pg_notify('pgrst', 'reload schema'); 