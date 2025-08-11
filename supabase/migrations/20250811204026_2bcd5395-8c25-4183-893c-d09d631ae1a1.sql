-- Create Evolution API connections table
create table if not exists public.evolution_connections (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  name text not null,
  base_url text not null,
  instance_name text not null,
  instance_key text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure quick lookup and allow upsert by owner
create unique index if not exists evolution_connections_owner_email_uidx
  on public.evolution_connections(owner_email);

-- Enable RLS
alter table public.evolution_connections enable row level security;

-- Policies: only the owner can manage their own connections
create policy if not exists evolution_connections_select_own
on public.evolution_connections
for select
using (owner_email = (current_setting('request.jwt.claims', true))::json ->> 'email');

create policy if not exists evolution_connections_insert_own
on public.evolution_connections
for insert
with check (owner_email = (current_setting('request.jwt.claims', true))::json ->> 'email');

create policy if not exists evolution_connections_update_own
on public.evolution_connections
for update
using (owner_email = (current_setting('request.jwt.claims', true))::json ->> 'email')
with check (owner_email = (current_setting('request.jwt.claims', true))::json ->> 'email');

create policy if not exists evolution_connections_delete_own
on public.evolution_connections
for delete
using (owner_email = (current_setting('request.jwt.claims', true))::json ->> 'email');

-- Auto update updated_at
create trigger evolution_connections_set_updated_at
before update on public.evolution_connections
for each row execute function public.set_updated_at();