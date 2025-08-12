-- Tabelas de formulários para agendamento
create table if not exists public.scheduling_forms (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  company_id uuid not null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scheduling_form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.scheduling_forms(id) on delete cascade,
  label text not null,
  type text not null check (type in ('short_text','long_text','dropdown','multiselect','radio','number','currency','users','leads')),
  required boolean not null default false,
  options jsonb,
  currency_code text,
  allow_comma boolean not null default false,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scheduling_event_type_forms (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.scheduling_forms(id) on delete cascade,
  event_type_id uuid not null references public.scheduling_event_types(id) on delete cascade,
  owner_user_id uuid not null,
  company_id uuid not null,
  created_at timestamptz not null default now(),
  unique(form_id, event_type_id)
);

-- Índices
create index if not exists idx_sched_forms_owner_company on public.scheduling_forms(owner_user_id, company_id);
create index if not exists idx_sched_form_fields_form on public.scheduling_form_fields(form_id);
create index if not exists idx_sched_event_type_forms_form on public.scheduling_event_type_forms(form_id);

-- RLS
alter table public.scheduling_forms enable row level security;
alter table public.scheduling_form_fields enable row level security;
alter table public.scheduling_event_type_forms enable row level security;

-- Policies: forms (somente do owner)
do $$ begin
  perform 1;
end $$;

drop policy if exists scheduling_forms_select on public.scheduling_forms;
create policy scheduling_forms_select on public.scheduling_forms
for select using (owner_user_id = auth.uid());

drop policy if exists scheduling_forms_modify on public.scheduling_forms;
create policy scheduling_forms_modify on public.scheduling_forms
for all using (owner_user_id = auth.uid());

-- Policies: form_fields (herda do form)
drop policy if exists scheduling_form_fields_select on public.scheduling_form_fields;
create policy scheduling_form_fields_select on public.scheduling_form_fields
for select using (exists (
  select 1 from public.scheduling_forms f where f.id = form_id and f.owner_user_id = auth.uid()
));

drop policy if exists scheduling_form_fields_modify on public.scheduling_form_fields;
create policy scheduling_form_fields_modify on public.scheduling_form_fields
for all using (exists (
  select 1 from public.scheduling_forms f where f.id = form_id and f.owner_user_id = auth.uid()
));

-- Policies: event_type_forms (owner do vínculo)
drop policy if exists scheduling_event_type_forms_select on public.scheduling_event_type_forms;
create policy scheduling_event_type_forms_select on public.scheduling_event_type_forms
for select using (owner_user_id = auth.uid());

drop policy if exists scheduling_event_type_forms_modify on public.scheduling_event_type_forms;
create policy scheduling_event_type_forms_modify on public.scheduling_event_type_forms
for all using (owner_user_id = auth.uid());

-- Grants
grant select, insert, update, delete on table public.scheduling_forms to authenticated;
grant select, insert, update, delete on table public.scheduling_form_fields to authenticated;
grant select, insert, update, delete on table public.scheduling_event_type_forms to authenticated; 