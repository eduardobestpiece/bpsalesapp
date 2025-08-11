-- Adiciona abas (filhas) de Configurações do Simulador
insert into public.app_pages (key, label, parent_key, module, display_order)
values
  ('simulator_config_administrators', 'Administradoras', 'simulator_config', 'settings', 201),
  ('simulator_config_reductions', 'Redução de Parcela', 'simulator_config', 'settings', 202),
  ('simulator_config_installments', 'Parcelas', 'simulator_config', 'settings', 203),
  ('simulator_config_products', 'Produtos', 'simulator_config', 'settings', 204),
  ('simulator_config_leverages', 'Alavancas', 'simulator_config', 'settings', 205)
ON CONFLICT (key) DO UPDATE SET
  label = excluded.label,
  parent_key = excluded.parent_key,
  module = excluded.module,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

select pg_notify('pgrst', 'reload schema'); 