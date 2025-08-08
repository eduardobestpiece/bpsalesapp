-- Criação da tabela de branding por empresa
create table if not exists public.company_branding (
  company_id uuid primary key references public.companies(id) on delete cascade,
  logo_square_url text,
  logo_vertical_url text,
  primary_color text default '#A86F57',
  updated_at timestamp with time zone default now()
);

comment on table public.company_branding is 'Configurações de marca por empresa (logos e cor primária)';

-- RLS básica
alter table public.company_branding enable row level security;

create policy if not exists company_branding_select on public.company_branding
  for select using (auth.uid() is not null);

create policy if not exists company_branding_upsert on public.company_branding
  for all using (auth.uid() is not null) with check (auth.uid() is not null); 