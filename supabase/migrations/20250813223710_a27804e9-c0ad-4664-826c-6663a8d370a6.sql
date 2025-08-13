-- Criar tabelas para configurações de agendamento
CREATE TABLE public.scheduling_calendar_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  google_calendar_id TEXT,
  sync_enabled BOOLEAN DEFAULT false,
  bidirectional_sync BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Configurações de disponibilidade por usuário
CREATE TABLE public.scheduling_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0 = domingo, 1 = segunda, etc
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Intervalos de horários por dia da semana
CREATE TABLE public.scheduling_day_intervals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  availability_id UUID NOT NULL REFERENCES public.scheduling_availability(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Eventos sincronizados do Google Calendar
CREATE TABLE public.google_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  google_event_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(google_event_id, calendar_id)
);

-- Enable RLS
ALTER TABLE public.scheduling_calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_day_intervals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies para scheduling_calendar_settings
CREATE POLICY "Users can manage their own calendar settings"
ON public.scheduling_calendar_settings
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies para scheduling_availability
CREATE POLICY "Users can manage their own availability"
ON public.scheduling_availability
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies para scheduling_day_intervals
CREATE POLICY "Users can manage their own day intervals"
ON public.scheduling_day_intervals
FOR ALL
USING (availability_id IN (
  SELECT id FROM public.scheduling_availability 
  WHERE user_id = auth.uid()
));

-- RLS Policies para google_calendar_events
CREATE POLICY "Users can manage their own calendar events"
ON public.google_calendar_events
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Triggers para updated_at
CREATE TRIGGER update_scheduling_calendar_settings_updated_at
BEFORE UPDATE ON public.scheduling_calendar_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_scheduling_availability_updated_at
BEFORE UPDATE ON public.scheduling_availability
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_google_calendar_events_updated_at
BEFORE UPDATE ON public.google_calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();