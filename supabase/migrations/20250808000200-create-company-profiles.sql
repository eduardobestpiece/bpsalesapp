-- Perfil e dados cadastrais da empresa
create table if not exists public.company_profiles (
  company_id uuid primary key references public.companies(id) on delete cascade,
  name text,
  cnpj text,
  niche text,
  cep text,
  address text,
  number text,
  neighborhood text,
  city text,
  state text,
  country text default 'Brasil',
  timezone text default 'America/Sao_Paulo',
  updated_at timestamp with time zone default now()
);

comment on table public.company_profiles is 'Dados cadastrais por empresa';

alter table public.company_profiles enable row level security;

create policy if not exists company_profiles_select on public.company_profiles
  for select using (auth.uid() is not null);

create policy if not exists company_profiles_upsert on public.company_profiles
  for all using (auth.uid() is not null) with check (auth.uid() is not null); 