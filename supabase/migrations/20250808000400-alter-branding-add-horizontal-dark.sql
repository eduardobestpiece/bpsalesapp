-- Adiciona a coluna de logo horizontal para dark mode, se não existir
alter table public.company_branding
  add column if not exists logo_horizontal_dark_url text; 