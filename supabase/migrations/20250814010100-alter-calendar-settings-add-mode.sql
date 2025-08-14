-- Add mode column to control agenda behavior
alter table if exists public.scheduling_calendar_settings
  add column if not exists mode text check (mode in ('platform','google_only')) default 'platform';

-- Backfill default
update public.scheduling_calendar_settings set mode = coalesce(mode, 'platform'); 