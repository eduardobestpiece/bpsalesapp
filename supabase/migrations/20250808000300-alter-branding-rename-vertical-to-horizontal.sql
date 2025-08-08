-- Renomear coluna vertical -> horizontal (se existir)
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'company_branding' and column_name = 'logo_vertical_url'
  ) then
    alter table public.company_branding rename column logo_vertical_url to logo_horizontal_url;
  end if;
end $$; 