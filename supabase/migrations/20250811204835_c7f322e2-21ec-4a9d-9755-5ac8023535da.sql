-- Evolution API connections table
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

-- RLS
alter table public.evolution_connections enable row level security;

-- Policies (drop then create to avoid duplicates)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'evolution_connections' AND policyname = 'evolution_connections_select_own') THEN
    DROP POLICY evolution_connections_select_own ON public.evolution_connections;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'evolution_connections' AND policyname = 'evolution_connections_insert_own') THEN
    DROP POLICY evolution_connections_insert_own ON public.evolution_connections;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'evolution_connections' AND policyname = 'evolution_connections_update_own') THEN
    DROP POLICY evolution_connections_update_own ON public.evolution_connections;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'evolution_connections' AND policyname = 'evolution_connections_delete_own') THEN
    DROP POLICY evolution_connections_delete_own ON public.evolution_connections;
  END IF;
END $$;

create policy evolution_connections_select_own
on public.evolution_connections
for select
using (owner_email = ((current_setting('request.jwt.claims', true))::json ->> 'email'));

create policy evolution_connections_insert_own
on public.evolution_connections
for insert
with check (owner_email = ((current_setting('request.jwt.claims', true))::json ->> 'email'));

create policy evolution_connections_update_own
on public.evolution_connections
for update
using (owner_email = ((current_setting('request.jwt.claims', true))::json ->> 'email'))
with check (owner_email = ((current_setting('request.jwt.claims', true))::json ->> 'email'));

create policy evolution_connections_delete_own
on public.evolution_connections
for delete
using (owner_email = ((current_setting('request.jwt.claims', true))::json ->> 'email'));

-- updated_at trigger
DROP TRIGGER IF EXISTS evolution_connections_set_updated_at ON public.evolution_connections;
create trigger evolution_connections_set_updated_at
before update on public.evolution_connections
for each row execute function public.set_updated_at();