import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

interface BusySlot {
  start: Date;
  end: Date;
}

export const useGoogleCalendarSync = (companyId: string, dateRange: { from: Date; to: Date }) => {
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoogleCalendarEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      const { data: user } = await supabase.auth.getUser();
      
      if (!user?.user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar token do Google
      let providerToken = (session?.session as any)?.provider_token;
      
      if (!providerToken && typeof window !== 'undefined') {
        providerToken = localStorage.getItem('google_provider_token');
      }

      if (!providerToken) {
        console.log('Google Calendar: No provider token found');
        setBusySlots([]);
        return;
      }

      // Buscar configurações do calendário
      const { data: settingsRow } = await (supabase as any)
        .from('scheduling_calendar_settings')
        .select('google_calendar_id, sync_enabled')
        .eq('company_id', companyId)
        .eq('user_id', user.user.id)
        .maybeSingle();

      // Se não há configuração específica, buscar das integrações do perfil
      let selectedCalendarId = settingsRow?.google_calendar_id || 'primary';
      let syncEnabled = settingsRow?.sync_enabled ?? true;

      if (!syncEnabled) {
        console.log('Google Calendar sync is disabled');
        setBusySlots([]);
        return;
      }

      // Buscar eventos do Google Calendar
      const headers = { Authorization: `Bearer ${providerToken}` };
      const params = new URLSearchParams({
        timeMin: dateRange.from.toISOString(),
        timeMax: dateRange.to.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '2500'
      });

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(selectedCalendarId)}/events?${params.toString()}`,
        { headers }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token do Google expirado. Reconecte sua conta.');
        }
        throw new Error(`Erro na API do Google Calendar: ${response.status}`);
      }

      const data = await response.json();
      const events: GoogleCalendarEvent[] = data.items || [];

      // Converter eventos em slots ocupados
      const busy: BusySlot[] = [];
      
      events.forEach(event => {
        // Pular eventos sem horário definido ou eventos de dia inteiro
        if (!event.start?.dateTime || !event.end?.dateTime) {
          return;
        }

        const startTime = new Date(event.start.dateTime);
        const endTime = new Date(event.end.dateTime);

        // Verificar se o evento está no range de datas
        if (startTime >= dateRange.from && startTime <= dateRange.to) {
          busy.push({
            start: startTime,
            end: endTime
          });
        }
      });

      setBusySlots(busy);
      console.log(`Google Calendar: Loaded ${events.length} events, ${busy.length} busy slots`);
      
    } catch (err) {
      console.error('Error fetching Google Calendar events:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setBusySlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, dateRange.from.getTime(), dateRange.to.getTime()]);

  useEffect(() => {
    fetchGoogleCalendarEvents();
  }, [fetchGoogleCalendarEvents]);

  const isSlotBusy = useCallback((slotStart: Date, slotEnd: Date): boolean => {
    return busySlots.some(busy => {
      // Verificar se há sobreposição entre o slot e o evento
      return slotStart < busy.end && slotEnd > busy.start;
    });
  }, [busySlots]);

  return {
    busySlots,
    isLoading,
    error,
    isSlotBusy,
    refetch: fetchGoogleCalendarEvents
  };
};