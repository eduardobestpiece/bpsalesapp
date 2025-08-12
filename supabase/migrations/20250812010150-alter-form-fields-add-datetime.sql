-- Adiciona o tipo 'datetime' ao CHECK da coluna type em scheduling_form_fields
alter table public.scheduling_form_fields
  drop constraint if exists scheduling_form_fields_type_check;

alter table public.scheduling_form_fields
  add constraint scheduling_form_fields_type_check
  check (type in ('short_text','long_text','dropdown','multiselect','radio','number','currency','users','leads','datetime')); 