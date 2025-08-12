-- Tabelas de agendamento por usuário
create table if not exists public.scheduling_availability (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  company_id uuid not null,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scheduling_event_types (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  company_id uuid not null,
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  min_gap_minutes integer not null default 0,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scheduling_calendar_settings (
  owner_user_id uuid not null,
  company_id uuid not null,
  google_calendar_id text,
  sync_enabled boolean not null default false,
  two_way_sync boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_user_id, company_id)
);

-- Eventos agendados pela plataforma
create table if not exists public.scheduling_events (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  company_id uuid not null,
  event_type_id uuid references public.scheduling_event_types(id) on delete set null,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  attendee_email text,
  google_event_id text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices
create index if not exists idx_sched_avail_owner_company on public.scheduling_availability(owner_user_id, company_id);
create index if not exists idx_sched_event_types_owner_company on public.scheduling_event_types(owner_user_id, company_id);
create index if not exists idx_sched_events_owner_company on public.scheduling_events(owner_user_id, company_id);

-- RLS
alter table public.scheduling_availability enable row level security;
alter table public.scheduling_event_types enable row level security;
alter table public.scheduling_calendar_settings enable row level security;
alter table public.scheduling_events enable row level security;

-- Permite ao usuário autenticado gerenciar apenas os próprios registros
create policy if not exists scheduling_availability_select on public.scheduling_availability
  for select using (auth.uid() = owner_user_id);
create policy if not exists scheduling_availability_modify on public.scheduling_availability
  for all using (auth.uid() = owner_user_id);

create policy if not exists scheduling_event_types_select on public.scheduling_event_types
  for select using (auth.uid() = owner_user_id);
create policy if not exists scheduling_event_types_modify on public.scheduling_event_types
  for all using (auth.uid() = owner_user_id);

create policy if not exists scheduling_calendar_settings_select on public.scheduling_calendar_settings
  for select using (auth.uid() = owner_user_id);
create policy if not exists scheduling_calendar_settings_modify on public.scheduling_calendar_settings
  for all using (auth.uid() = owner_user_id);

create policy if not exists scheduling_events_select on public.scheduling_events
  for select using (auth.uid() = owner_user_id or auth.uid() = created_by_user_id);
create policy if not exists scheduling_events_insert on public.scheduling_events
  for insert with check (auth.uid() = owner_user_id or auth.uid() = created_by_user_id);
create policy if not exists scheduling_events_update on public.scheduling_events
  for update using (auth.uid() = owner_user_id or auth.uid() = created_by_user_id);
create policy if not exists scheduling_events_delete on public.scheduling_events
  for delete using (auth.uid() = owner_user_id or auth.uid() = created_by_user_id); 