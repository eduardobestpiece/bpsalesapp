import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

interface AgendaSchedulerProps {
  companyId: string;
}

interface EventType {
  id: string;
  name: string;
  duration_minutes: number;
  scope?: 'user' | 'team' | 'company';
  team_id?: string | null;
  status: 'active' | 'archived';
  owner_user_id?: string;
}

interface PlatformEvent {
  id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at: string;
  google_event_id?: string | null;
}

export const AgendaScheduler = ({ companyId }: AgendaSchedulerProps) => {
  const AGENDA_DEBUG = true;
  const dbg = (...args: any[]) => { if (AGENDA_DEBUG) console.log('[AGENDA]', ...args); };
  // Visual state
  const [use12h, setUse12h] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date());
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Data
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [availabilityByWeekday, setAvailabilityByWeekday] = useState<Record<number, { is_active: boolean; start: string; end: string; intervals: { start: string; end: string }[] }>>({});

  // Helpers de data
  const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
  const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const startOfWeek = (d: Date) => {
    const x = startOfDay(d);
    const day = x.getDay();
    const diff = (day + 6) % 7; // segunda como início
    return addDays(x, -diff);
  };
  const endOfWeek = (d: Date) => addDays(startOfWeek(d), 6);
  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

  // Range carregado (semana da data selecionada)
  const range = useMemo(() => ({ from: startOfWeek(selectedDate), to: endOfWeek(selectedDate) }), [selectedDate]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selectedDate), i)), [selectedDate]);

  // Timezone label
  const timeZone = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'America/Sao_Paulo';
  const brLabel = '(GMT-03:00) Horário Padrão de Brasília – São Paulo';

  // Slots (30m por padrão)
  const generateSlots = (date: Date) => {
    const slots: { start: Date; end: Date }[] = [];
    const startHour = 8;
    const endHour = 18;
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        const s = new Date(date); s.setHours(h, m, 0, 0);
        const e = new Date(s.getTime() + 30 * 60 * 1000);
        slots.push({ start: s, end: e });
      }
    }
    return slots;
  };

  const daySlots = useMemo(() => generateSlots(selectedDate), [selectedDate]);

  // Carrega tipos de evento
  const loadEventTypes = async () => {
    const { data, error } = await (supabase as any)
      .from('scheduling_event_types')
      .select('id, name, duration_minutes, scope, team_id, status, owner_user_id')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('name');
    if (!error) setEventTypes(data || []);
  };

  // Carrega eventos (plataforma + Google)
  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const fromISO = range.from.toISOString();
      const toISO = new Date(range.to.getTime() + 24*60*60*1000 - 1).toISOString();
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
      dbg('loadEvents range/tz', { fromISO, toISO, tz, weekStart: range.from, weekEnd: range.to });

      const { data: plat, error: perr } = await (supabase as any)
        .from('scheduling_events')
        .select('id, title, description, start_at, end_at, google_event_id')
        .eq('company_id', companyId)
        .gte('start_at', fromISO)
        .lte('end_at', toISO)
        .order('start_at', { ascending: true });
      if (perr) throw perr;
      let all: PlatformEvent[] = (plat || []) as any;
      dbg('platform events count', all.length);

      const { data: sess } = await supabase.auth.getSession();
      const authUserId = (await supabase.auth.getUser()).data.user?.id;
      const providerToken = (sess?.session as any)?.provider_token || (typeof window !== 'undefined' ? localStorage.getItem('google_provider_token') : '');
      
      // Buscar configurações do calendário do agendamento
      const { data: settingsRow } = await (supabase as any)
        .from('scheduling_calendar_settings')
        .select('google_calendar_id, sync_enabled')
        .eq('company_id', companyId)
        .eq('owner_user_id', authUserId || '')
        .maybeSingle();
      
      // Se não há configuração de agendamento, buscar das integrações do perfil
      let selectedCalendarId = settingsRow?.google_calendar_id || 'primary';
      let syncEnabled = settingsRow?.sync_enabled ?? true;
      
      // Se syncEnabled = false ou não há provider_token, tenta buscar das integrações do perfil
      if (!syncEnabled || !providerToken) {
        const { data: user } = await supabase.auth.getUser();
        if (user?.user?.email) {
          // Verifica se há integração Google configurada
          const { data: identities } = await supabase.auth.getUser();
          const hasGoogle = (identities?.user as any)?.identities?.some((i: any) => i.provider === 'google') || false;
          
          if (hasGoogle) {
            syncEnabled = true;
            const token = (typeof window !== 'undefined' ? localStorage.getItem('google_provider_token') : '') || providerToken;
            if (token && selectedCalendarId === 'primary') {
              selectedCalendarId = 'primary';
            }
          }
        }
      }
      dbg('calendar settings', { selected: selectedCalendarId, sync: syncEnabled, hasToken: !!providerToken, rowFound: !!settingsRow });
      if (providerToken && syncEnabled) {
        const headers = { Authorization: `Bearer ${providerToken}` } as any;
        // Usar somente o calendário selecionado (ou primário)
        let calendarIds: string[] = [];
        if (selectedCalendarId && selectedCalendarId !== 'primary') {
          calendarIds = [selectedCalendarId];
        } else {
          calendarIds = ['primary'];
        }
        dbg('calendarIds used', calendarIds);

        const params = new URLSearchParams({
          timeMin: new Date(range.from.getTime() - 24*60*60*1000).toISOString(),
          timeMax: new Date(range.to.getTime() + 2*24*60*60*1000).toISOString(),
          singleEvents: 'true',
          orderBy: 'startTime',
          maxResults: '2500',
          timeZone: tz,
        });

        const results = await Promise.allSettled(calendarIds.map((cid) =>
          fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cid)}/events?${params.toString()}`, { headers })
        ));
        let gcount = 0;
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value.ok) {
            try {
              const json = await r.value.json();
              const gEvents: PlatformEvent[] = (json.items || []).map((it: any) => {
                const startRaw = it.start?.dateTime || it.start?.date;
                const endRaw = it.end?.dateTime || it.end?.date;
                let start = startRaw;
                let end = endRaw;
                if (it.start?.date && !it.start?.dateTime) {
                  const s = new Date(it.start.date + 'T00:00:00');
                  start = s.toISOString();
                }
                if (it.end?.date && !it.end?.dateTime) {
                  const e = new Date(it.end.date + 'T00:00:00');
                  const eFix = new Date(e.getTime() - 60 * 1000);
                  end = eFix.toISOString();
                }
                return ({
                  id: `g_${it.id}`,
                  title: it.summary || '(Sem título)',
                  description: it.description || null,
                  start_at: start || it.created,
                  end_at: end || it.created,
                  google_event_id: it.id,
                });
              });
              gcount += gEvents.length;
              all = [...all, ...gEvents];
            } catch {}
          }
        }
        dbg('google events count', gcount);

        // FreeBusy fallback
        try {
          const fbResp = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({
              timeMin: new Date(range.from.getTime() - 24*60*60*1000).toISOString(),
              timeMax: new Date(range.to.getTime() + 2*24*60*60*1000).toISOString(),
              timeZone: tz,
              items: calendarIds.map((id) => ({ id })),
            })
          });
          if (fbResp.ok) {
            const fb = await fbResp.json();
            let fbCount = 0;
            const cals = Object.values(fb.calendars || {}) as any[];
            for (const c of cals) {
              for (const b of (c.busy || [])) {
                fbCount++;
                all.push({ id: `fb_${b.start}_${b.end}`, title: 'busy', start_at: b.start, end_at: b.end, description: null, google_event_id: undefined } as any);
              }
            }
            dbg('freeBusy blocks', fbCount);
          }
        } catch (e) {
          dbg('freeBusy error', e);
        }
      }

      setEvents(all);
      dbg('total merged events', all.length, all.slice(0, 3));
    } catch (e) {
      toast.error('Falha ao carregar eventos');
      dbg('loadEvents error', e);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => { loadEventTypes(); }, [companyId]);
  useEffect(() => { loadEvents(); }, [range.from.getTime(), range.to.getTime(), visibleMonth.getFullYear(), visibleMonth.getMonth(), companyId]);
  useEffect(() => {
    const loadAvailability = async () => {
      const authUser = (await supabase.auth.getUser()).data.user?.id;
      if (!authUser || !companyId) return;
      const { data: avls } = await (supabase as any)
        .from('scheduling_availability')
        .select('weekday, start_time, end_time, is_active')
        .eq('owner_user_id', authUser)
        .eq('company_id', companyId);
      const { data: ints } = await (supabase as any)
        .from('scheduling_day_intervals')
        .select('weekday, start_time, end_time')
        .eq('owner_user_id', authUser)
        .eq('company_id', companyId);
      const map: Record<number, { is_active: boolean; start: string; end: string; intervals: { start: string; end: string }[] }> = {};
      (avls || []).forEach((r: any) => {
        map[r.weekday] = { is_active: !!r.is_active, start: r.start_time, end: r.end_time, intervals: [] };
      });
      (ints || []).forEach((r: any) => {
        const w = r.weekday;
        if (!map[w]) map[w] = { is_active: false, start: '00:00', end: '00:00', intervals: [] };
        map[w].intervals.push({ start: r.start_time, end: r.end_time });
      });
      setAvailabilityByWeekday(map);
    };
    loadAvailability();
  }, [companyId]);

  // Disponibilidade (ocupado se colide com evento)
  const isBusy = (s: Date, e: Date) => {
    const sMs = s.getTime();
    const eMs = e.getTime();
    const margin = 60 * 1000; // 1 min
    const hit = events.some(ev => {
      const evS = new Date(ev.start_at).getTime() - margin;
      const evE = new Date(ev.end_at).getTime() + margin;
      return sMs < evE && eMs > evS;
    });
    if (AGENDA_DEBUG && hit && s.getHours() === 14) {
      dbg('busy@14h', { start: s.toISOString(), end: e.toISOString() });
    }
    return hit;
  };

  const hhmmToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const isAllowedByAvailability = (start: Date, end: Date): boolean => {
    // Bloquear dias passados totalmente
    const today = startOfDay(new Date());
    const dayStart = startOfDay(start);
    if (dayStart < today) return false;
    // Hoje: apenas horários futuros
    if (dayStart.getTime() === today.getTime()) {
      if (end <= new Date()) return false;
    }
    const weekday = start.getDay();
    let av = availabilityByWeekday[weekday];
    // Fallback: se não houver configuração, considerar janela padrão 08:00–18:00 ativa
    if (!av) {
      av = { is_active: true, start: '08:00', end: '18:00', intervals: [] };
    }
    if (!av.is_active) return false;
    const stMin = start.getHours() * 60 + start.getMinutes();
    const enMin = end.getHours() * 60 + end.getMinutes();
    const aStart = hhmmToMinutes(av.start);
    const aEnd = hhmmToMinutes(av.end);
    if (stMin < aStart || enMin > aEnd) return false;
    // Intervals são bloqueios
    for (const itv of av.intervals || []) {
      const iS = hhmmToMinutes(itv.start);
      const iE = hhmmToMinutes(itv.end);
      if (stMin < iE && enMin > iS) return false;
    }
    return true;
  };

  // Navegação por teclado
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { setSelectedDate(prev => addDays(prev, -1)); }
      if (e.key === 'ArrowRight') { setSelectedDate(prev => addDays(prev, 1)); }
      if (e.key === 'ArrowUp') { setSelectedDate(prev => addDays(prev, -7)); }
      if (e.key === 'ArrowDown') { setSelectedDate(prev => addDays(prev, 7)); }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, []);

  // Form de agendamento
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [slotSelected, setSlotSelected] = useState<{ start: Date; end: Date } | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formEventType, setFormEventType] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const formatTime = (d: Date) => {
    return use12h
      ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
  };

  const openConfirm = (slot: { start: Date; end: Date }) => {
    setSlotSelected(slot);
    setFormEventType('');
    setConfirmOpen(true);
  };

  const generateICS = (title: string, start: Date, end: Date, description?: string) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const toICSTime = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const uid = `${Date.now()}@monteo`;
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Monteo//Agenda//PT-BR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${toICSTime(new Date())}`,
      `DTSTART:${toICSTime(start)}`,
      `DTEND:${toICSTime(end)}`,
      `SUMMARY:${title.replace(/\n/g, ' ')}`,
      description ? `DESCRIPTION:${description.replace(/\n/g, ' ')}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');
    return new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  };

  const saveSchedule = async () => {
    if (!slotSelected) return;
    if (!formEventType || !formName || !formEmail) {
      toast.error('Preencha os dados obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      const startISO = slotSelected.start.toISOString();
      const endISO = slotSelected.end.toISOString();
      const type = eventTypes.find(et => et.id === formEventType);
      const title = type?.name || 'Reunião';

      // Inserir na plataforma
      const authUser = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await (supabase as any)
        .from('scheduling_events')
        .insert({
          title,
          description: formNotes || null,
          start_at: startISO,
          end_at: endISO,
          company_id: companyId,
          owner_user_id: authUser,
          created_by_user_id: authUser,
        })
        .select('id')
        .single();
      if (error) throw error;

      // Google opcional
      const { data: sess } = await supabase.auth.getSession();
      const providerToken = (sess?.session as any)?.provider_token || (typeof window !== 'undefined' ? localStorage.getItem('google_provider_token') : '');
      const { data: settings } = await (supabase as any)
        .from('scheduling_calendar_settings')
        .select('google_calendar_id, sync_enabled')
        .eq('company_id', companyId)
        .single();
      if (providerToken && settings?.google_calendar_id && settings?.sync_enabled) {
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(settings.google_calendar_id)}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${providerToken}` },
          body: JSON.stringify({
            summary: title,
            description: formNotes || undefined,
            start: { dateTime: startISO },
            end: { dateTime: endISO },
            attendees: formEmail ? [{ email: formEmail, displayName: formName }] : undefined,
          })
        }).then(async (resp) => {
          if (resp.ok) {
            const gj = await resp.json();
            await (supabase as any).from('scheduling_events').update({ google_event_id: gj.id }).eq('id', data.id);
          }
        });
      }

      setConfirmOpen(false);
      setConfirmSuccess(true);
      await loadEvents();

      // Disponibiliza .ics
      const blob = generateICS(title, slotSelected.start, slotSelected.end, formNotes);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compromisso-${slotSelected.start.toISOString().slice(0,10)}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Falha ao agendar');
    } finally {
      setSaving(false);
    }
  };

  const headerDateLabel = useMemo(() => {
    return selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [selectedDate]);

  const weekDayLabel = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short' }).replace('.', '');

  return (
    <Card className="brand-radius" ref={containerRef} tabIndex={0} aria-label="Agenda" role="region">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Selecione um horário</CardTitle>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="hidden sm:block">{brLabel}</div>
            <div className="flex items-center gap-2">
              <span>12h</span>
              <Switch checked={use12h} onCheckedChange={setUse12h} />
              <span>24h</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] gap-6">
          {/* Coluna 1: Calendário mensal */}
          <div aria-label="Calendário mensal" role="grid" className="border rounded-md p-3 brand-radius">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium capitalize">{headerDateLabel.replace('August', 'Agosto').replace('September', 'Setembro')}</div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="brand-radius" onClick={() => setVisibleMonth(prev => new Date(prev.getFullYear(), prev.getMonth()-1, 1))}>{'<'}</Button>
                <Button size="sm" variant="outline" className="brand-radius" onClick={() => setVisibleMonth(prev => new Date(prev.getFullYear(), prev.getMonth()+1, 1))}>{'>'}</Button>
              </div>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => { if (d) { setSelectedDate(d); setVisibleMonth(d); } }}
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              ISOWeek
              captionLayout="buttons"
              locale={ptBR}
              disabled={{ before: startOfDay(new Date()) }}
              modifiers={{
                available: (date: Date) => {
                  const today = startOfDay(new Date());
                  if (date < today) return false;
                  // Carregar disponibilidade simples com base nos eventos carregados
                  const slots = generateSlots(date);
                  return slots.some(s => !isBusy(s.start, s.end));
                }
              }}
              modifiersClassNames={{
                available: 'bg-muted/40',
              }}
            />
          </div>

          {/* Coluna 2: Lista de horários da semana (dias como cabeçalho) */}
          <div className="border rounded-md p-3 brand-radius">
            <div aria-label="Horários disponíveis" role="region" className="overflow-auto">
              {loadingEvents ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full brand-radius" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-2">
                    {weekDays.map((d, idx) => (
                      <div key={`hdr-${idx}`} className="text-center text-muted-foreground font-medium">
                        {d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-2 items-start">
                    {weekDays.map((day, colIdx) => {
                      // gerar slots deste dia e filtrar pelo availability
                      const base = new Date(startOfDay(selectedDate));
                      base.setHours(8, 0, 0, 0);
                      const slots = Array.from({ length: 20 }).map((_, i) => {
                        const s = new Date(day); s.setHours(base.getHours(), base.getMinutes(), 0, 0);
                        const start = new Date(s.getTime() + i * 30 * 60 * 1000);
                        const end = new Date(start.getTime() + 30 * 60 * 1000);
                        return { start, end };
                      }).filter(({ start, end }) => isAllowedByAvailability(start, end) && !isBusy(start, end));
                      if (AGENDA_DEBUG) {
                        const dLabel = day.toISOString().slice(0,10);
                        const has1400 = slots.some(s => s.start.getHours() === 14 && s.start.getMinutes() === 0);
                        dbg('day slots', dLabel, { count: slots.length, has1400 });
                      }
                      return (
                        <div key={`col-${colIdx}`} className="flex flex-col gap-2">
                          {slots.length === 0 ? (
                            <div className="text-xs text-muted-foreground text-center">Sem horários</div>
                          ) : (
                            slots.map(({ start, end }, i) => {
                              const busy = isBusy(start, end);
                              if (AGENDA_DEBUG && start.getHours() === 14 && start.getMinutes() === 0) {
                                dbg('render@14h', { day: start.toISOString().slice(0,10), busy });
                              }
                              return (
                                <button
                                  key={`btn-${colIdx}-${i}`}
                                  disabled={busy}
                                  aria-disabled={busy}
                                  tabIndex={busy ? -1 : 0}
                                  title={busy ? 'Indisponível' : 'Disponível'}
                                  onClick={() => !busy && openConfirm({ start, end })}
                                  className={`w-full text-center px-3 py-2 brand-radius border transition ${busy ? 'cursor-not-allowed opacity-50 bg-muted text-muted-foreground focus:ring-0' : 'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-secondary)] text-[var(--brand-secondary)]'} border-border`}
                                >
                                  {formatTime(start)}
                                </button>
                              );
                            })
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Modal de confirmação */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="brand-radius">
          <DialogHeader>
            <DialogTitle>Confirmar agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {slotSelected && (
                <span>
                  {slotSelected.start.toLocaleDateString()} • {formatTime(slotSelected.start)} – {formatTime(slotSelected.end)} (30 min)
                </span>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Tipo de evento</Label>
                <Select value={formEventType} onValueChange={setFormEventType}>
                  <SelectTrigger className="brand-radius"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(et => (
                      <SelectItem key={et.id} value={et.id}>{et.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nome</Label>
                <Input className="brand-radius" value={formName} onChange={e => setFormName(e.target.value)} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input className="brand-radius" type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
              </div>
              <div>
                <Label>Telefone (opcional)</Label>
                <Input className="brand-radius" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Observações</Label>
                <Input className="brand-radius" value={formNotes} onChange={e => setFormNotes(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="brand-radius" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button className="brand-radius" variant="brandPrimaryToSecondary" disabled={saving || !formEventType || !formName || !formEmail} onClick={saveSchedule}>
              {saving ? 'Confirmando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tela de sucesso (inline simplificada) */}
      {confirmSuccess && (
        <div className="px-6 pb-6">
          <div className="border rounded-md p-4 brand-radius bg-muted/20">
            <div className="font-medium mb-2">Agendamento confirmado!</div>
            <div className="text-sm text-muted-foreground mb-3">O evento foi criado. Um arquivo .ics foi baixado para você adicionar ao seu calendário.</div>
            <div className="flex gap-2">
              <Button className="brand-radius" variant="outline" onClick={() => setConfirmSuccess(false)}>Voltar ao início</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}; 