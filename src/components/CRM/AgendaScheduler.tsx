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
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendarSync';

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
  const [busyRanges, setBusyRanges] = useState<{ start: number; end: number }[]>([]);
  const [slotsByDay, setSlotsByDay] = useState<Record<string, { start: Date; end: Date }[]>>({});
  const [weekReady, setWeekReady] = useState<boolean>(false);
  const [googleOnly, setGoogleOnly] = useState<boolean>(false);

  // Helpers de data
  const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
  const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const addMinutes = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60 * 1000);
  const format = (d: Date, pattern: string) => {
    if (pattern === 'yyyy-MM-dd') {
      return d.toISOString().split('T')[0];
    }
    if (pattern === 'HH:mm') {
      return d.toTimeString().slice(0, 5);
    }
    return d.toISOString();
  };
  
  const startOfWeek = (d: Date) => {
    const x = startOfDay(d);
    const day = x.getDay();
    const diff = (day + 6) % 7; // segunda como início
    return addDays(x, -diff);
  };
  const endOfWeek = (d: Date) => addDays(startOfWeek(d), 6);
  const dateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  // Range carregado (semana da data selecionada)
  const range = useMemo(() => ({ from: startOfWeek(selectedDate), to: endOfWeek(selectedDate) }), [selectedDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selectedDate), i)), [selectedDate]);

  // Google Calendar sync
  const { busySlots: googleBusySlots, isSlotBusy: isGoogleBusy, isLoading: isLoadingGoogle } = useGoogleCalendarSync(companyId, range);

  // Timezone label
  const timeZone = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'America/Sao_Paulo';
  const tz = timeZone;
  const brLabel = '(GMT-03:00) Horário Padrão de Brasília – São Paulo';

  // Funções auxiliares para segmentos
  const mergeSegments = (segs: { start: number; end: number }[]) => {
    if (segs.length === 0) return [];
    const sorted = segs.slice().sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      const last = merged[merged.length - 1];
      const curr = sorted[i];
      if (curr.start <= last.end) {
        last.end = Math.max(last.end, curr.end);
      } else {
        merged.push(curr);
      }
    }
    return merged;
  };

  const subtractSegmentList = (base: { start: number; end: number }[], toRemove: { start: number; end: number }[]) => {
    if (base.length === 0) return [];
    if (toRemove.length === 0) return base;
    const merged = mergeSegments(toRemove);
    let result = base.slice();
    for (const rem of merged) {
      const next: { start: number; end: number }[] = [];
      for (const seg of result) {
        if (rem.end <= seg.start || rem.start >= seg.end) {
          next.push(seg);
        } else {
          if (seg.start < rem.start) next.push({ start: seg.start, end: rem.start });
          if (rem.end < seg.end) next.push({ start: rem.end, end: seg.end });
        }
      }
      result = next;
    }
    return result;
  };

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

  // Carrega eventos da plataforma
  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const fromISO = range.from.toISOString();
      const toISO = new Date(range.to.getTime() + 24*60*60*1000 - 1).toISOString();
      
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
      let fbBusy: { start: number; end: number }[] = [];

      const { data: sess } = await supabase.auth.getSession();
      const authUserId = (await supabase.auth.getUser()).data.user?.id;
      let providerToken = (sess?.session as any)?.provider_token;
      if (!providerToken && typeof window !== 'undefined') {
        providerToken = localStorage.getItem('google_provider_token');
      }
      if (!providerToken) {
        dbg('no provider token', { hasSession: !!sess?.session, hasLocalStorage: !!(typeof window !== 'undefined' && localStorage.getItem('google_provider_token')) });
        setEvents(all);
        setBusyRanges([]);
        setGoogleOnly(false);
        dbg('total merged events (no Google)', all.length, all.slice(0, 3));
        return;
      }
      const { data: settingsRow } = await supabase
        .from('scheduling_calendar_settings')
        .select('google_calendar_id, sync_enabled, mode')
        .eq('company_id', companyId)
        .eq('owner_user_id', authUserId || '')
        .maybeSingle();
      
      // Se não há configuração de agendamento, buscar das integrações do perfil
      let selectedCalendarId = settingsRow?.google_calendar_id || 'primary';
      let syncEnabled = settingsRow?.sync_enabled ?? true;
      const modeValue = (settingsRow as any)?.mode as string | undefined;
      const isGoogleOnly = modeValue === 'google_only';
      setGoogleOnly(!!isGoogleOnly);
      
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
      dbg('calendar settings', { selected: selectedCalendarId, sync: syncEnabled, hasToken: !!providerToken, rowFound: !!settingsRow, mode: modeValue });
      if (syncEnabled) {
        const headers = { Authorization: `Bearer ${providerToken}` } as any;
        // Usar calendários "selecionados" no Google + o configurado + primary
        let calendarIds: string[] = [];
        try {
          const listResp = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader', { headers });
          if (listResp.ok) {
            const listJson = await listResp.json();
            const selectedFromGoogle = (listJson.items || [])
              .filter((it: any) => it?.selected)
              .map((it: any) => it.id as string)
              .filter((id: string) => id && !/classroom|holiday|contacts|resource\.calendar\.google\.com/i.test(id));
            calendarIds = selectedFromGoogle;
          }
        } catch {}
        const cfgId = selectedCalendarId === 'primary' || !selectedCalendarId ? 'primary' : selectedCalendarId;
        calendarIds.push(cfgId);
        if (!calendarIds.includes('primary')) calendarIds.push('primary');
        calendarIds = Array.from(new Set(calendarIds));
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
              // Adicionar aos busyRanges também
              for (const ge of gEvents) {
                const sMs = new Date(ge.start_at).getTime();
                const eMs = new Date(ge.end_at).getTime();
                fbBusy.push({ start: sMs, end: eMs });
              }
            } catch {}
          } else if (r.status === 'fulfilled') {
            dbg('Google API error', { status: r.value.status, statusText: r.value.statusText });
            if (r.value.status === 401) {
              dbg('Token expired - need to reconnect Google');
            }
          }
        }
        dbg('google events count', gcount);

        // FreeBusy para precisão de ocupado
        try {
          const fbBody = {
            timeMin: new Date(range.from.getTime() - 24*60*60*1000).toISOString(),
            timeMax: new Date(range.to.getTime() + 2*24*60*60*1000).toISOString(),
            items: calendarIds.map((id) => ({ id })),
            timeZone: tz,
          };
          const fbResp = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${providerToken}` },
            body: JSON.stringify(fbBody),
          });
          if (fbResp.ok) {
            const fb = await fbResp.json();
            let fbCount = 0;
            const cals = Object.values(fb.calendars || {}) as any[];
            for (const c of cals) {
              for (const b of (c.busy || [])) {
                fbCount++;
                const sMs = new Date(b.start).getTime();
                const eMs = new Date(b.end).getTime();
                fbBusy.push({ start: sMs, end: eMs });
              }
            }
            dbg('freeBusy blocks', fbCount);
          }
        } catch (e) {
          dbg('freeBusy error', e);
        }
      }

      setEvents(all);
      setBusyRanges(fbBusy);
      dbg('Total events loaded:', all.length);
      
    } catch (e) {
      toast.error('Falha ao carregar eventos');
      dbg('loadEvents error', e);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Load availability
  useEffect(() => {
    const loadAvailability = async () => {
      const authUser = (await supabase.auth.getUser()).data.user?.id;
      if (!authUser || !companyId) return;

      // Modo somente Google: disponibilidade 24h em todos os dias, slots serão apenas os livres após subtrair busy do Google
      if (googleOnly) {
        const map: Record<number, { is_active: boolean; start: string; end: string; intervals: { start: string; end: string }[] }> = {};
        for (let w = 0; w < 7; w++) {
          map[w] = { is_active: true, start: '00:00', end: '23:59', intervals: [] };
        }
        setAvailabilityByWeekday(map);
        dbg('availability (googleOnly) 24x7');
        return;
      }

      let { data: avls } = await (supabase as any)
        .from('scheduling_availability')
        .select('weekday, start_time, end_time, is_active, company_id')
        .eq('user_id', authUser)
        .eq('company_id', companyId);
      
      let { data: ints } = await (supabase as any)
        .from('scheduling_day_intervals')
        .select('weekday, start_time, end_time, company_id')
        .eq('user_id', authUser)
        .eq('company_id', companyId);
      
      // Fallback: buscar por user em qualquer empresa se nada encontrado para a empresa atual
      if ((!avls || avls.length === 0) && (!ints || ints.length === 0)) {
        const anyAv = await (supabase as any)
          .from('scheduling_availability')
          .select('weekday, start_time, end_time, is_active, company_id')
          .eq('user_id', authUser);
        avls = anyAv.data || [];
        
        const anyInt = await (supabase as any)
          .from('scheduling_day_intervals')
          .select('weekday, start_time, end_time, company_id')
          .eq('user_id', authUser);
        ints = anyInt.data || [];
        
        dbg('availability fallback (any company)', { avCount: avls.length, intCount: (ints || []).length });
      } else {
        dbg('availability company match', { avCount: (avls || []).length, intCount: (ints || []).length });
      }
      
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
      dbg('availability loaded', { mapKeys: Object.keys(map), sample: map[1] || map[2] || map[3] });
    };
    loadAvailability();
  }, [companyId, googleOnly]);

  // Disponibilidade (ocupado se colide com evento)
  const isBusy = (s: Date, e: Date) => {
    const sMs = s.getTime();
    const eMs = e.getTime();
    const margin = 60 * 1000; // 1 min
    // 1) FreeBusy do Google
    const fbHit = busyRanges.some(b => sMs < (b.end + margin) && eMs > (b.start - margin));
    if (fbHit) return true;
    // 2) Eventos da plataforma
    const evHit = events.some((ev) => {
      const es = new Date(ev.start_at).getTime();
      const ee = new Date(ev.end_at).getTime();
      return sMs < (ee + margin) && eMs > (es - margin);
    });
    return evHit;
  };

  useEffect(() => { loadEventTypes(); }, [companyId]);
  useEffect(() => { loadEvents(); }, [range.from.getTime(), range.to.getTime(), visibleMonth.getFullYear(), visibleMonth.getMonth(), companyId]);

  const hhmmToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const generateSlots = (date: Date) => {
    const slots: { start: Date; end: Date }[] = [];
    const startHour = 8;
    const endHour = 18;
    
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        const s = new Date(date); 
        s.setHours(h, m, 0, 0);
        const e = new Date(s.getTime() + 30 * 60 * 1000);
        
        // Verificar se está ocupado no Google Calendar
        const isGoogleCalendarBusy = isGoogleBusy(s, e);
        
        // Verificar se colide com eventos da plataforma
        const isConflict = events.some(ev => {
          const evStart = new Date(ev.start_at).getTime();
          const evEnd = new Date(ev.end_at).getTime();
          const slotStart = s.getTime();
          const slotEnd = e.getTime();
          return slotStart < evEnd && slotEnd > evStart;
        });
        
        // Verificar disponibilidade configurada
        const weekday = date.getDay();
        const av = availabilityByWeekday[weekday];
        const isAvailableTime = av && av.is_active && 
          hhmmToMinutes(format(s, 'HH:mm')) >= hhmmToMinutes(av.start) &&
          hhmmToMinutes(format(e, 'HH:mm')) <= hhmmToMinutes(av.end);
        
        // Bloquear se não está em horário disponível, tem conflito ou está ocupado no Google
        if (isAvailableTime && !isConflict && !isGoogleCalendarBusy) {
          // Bloquear horários passados
          const now = new Date();
          if (e > now) {
            slots.push({ start: s, end: e });
          }
        }
      }
    }
    return slots;
  };

  const clampToDay = (startMs: number, endMs: number, day: Date) => {
    const d0 = startOfDay(day).getTime();
    const d1 = endOfDay(day).getTime();
    const s = Math.max(startMs, d0);
    const e = Math.min(endMs, d1);
    if (e <= s) return null as null | { start: number; end: number };
    // Converter para minutos do dia
    const sDate = new Date(s);
    const eDate = new Date(e);
    const sMin = sDate.getHours() * 60 + sDate.getMinutes();
    const eMin = eDate.getHours() * 60 + eDate.getMinutes();
    return { start: sMin, end: eMin };
  };

  const getAvailabilityWindowsForDay = (date: Date) => {
    const weekday = date.getDay();
    let av = availabilityByWeekday[weekday];
    const invalid = !av || !av.start || !av.end || av.start === av.end || (av.start === '00:00' && av.end === '00:00');
    if (invalid) { dbg('avail invalid', { day: date.toISOString().slice(0,10), weekday, av }); return [] as { start: number; end: number }[]; }
    if (av && !av.is_active) { dbg('avail inactive', { day: date.toISOString().slice(0,10), weekday, av }); return [] as { start: number; end: number }[]; }
    const base = [{ start: hhmmToMinutes(av.start), end: hhmmToMinutes(av.end) }];
    const blocks = (av.intervals || []).map(it => ({ start: hhmmToMinutes(it.start), end: hhmmToMinutes(it.end) }));
    dbg('avail windows', { day: date.toISOString().slice(0,10), base, blocks });
    return subtractSegmentList(base, blocks);
  };

  const buildFreeSlotsForDay = (date: Date) => {
    const today = startOfDay(new Date());
    if (startOfDay(date) < today) return [] as { start: Date; end: Date }[];
    // Aguardar availability estar carregado
    if (Object.keys(availabilityByWeekday).length === 0) {
      dbg('availability not loaded yet', { day: date.toISOString().slice(0,10) });
      return [] as { start: Date; end: Date }[];
    }
    const slotMinutes = 30;
    const allowed = getAvailabilityWindowsForDay(date);
    if (allowed.length === 0) return [] as { start: Date; end: Date }[];
    // Ocupados do Google (freeBusy) + (opcional) plataforma + eventos Google normalizados
    const dayBusySegs: { start: number; end: number }[] = [];
    for (const b of busyRanges) {
      const seg = clampToDay(b.start, b.end, date);
      if (seg) dayBusySegs.push(seg);
    }
    if (!googleOnly) {
      for (const ev of events) {
        const seg = clampToDay(new Date(ev.start_at).getTime(), new Date(ev.end_at).getTime(), date);
        if (seg) dayBusySegs.push(seg);
      }
    }
    const busy = mergeSegments(dayBusySegs);
    const free = subtractSegmentList(allowed, busy);
    dbg('busy/free', { day: date.toISOString().slice(0,10), busy, allowed, freeCount: free.length });
    // Gerar slots
    const res: { start: Date; end: Date }[] = [];
    for (const f of free) {
      let cursor = f.start;
      while (cursor + slotMinutes <= f.end) {
        const s = new Date(date);
        s.setHours(Math.floor(cursor / 60), cursor % 60, 0, 0);
        const e = new Date(s.getTime() + slotMinutes * 60 * 1000);
        // Bloqueio adicional: se for hoje, remover passados
        if (!(startOfDay(date).getTime() === today.getTime() && e <= new Date())) {
          res.push({ start: s, end: e });
        }
        cursor += slotMinutes;
      }
    }
    if (AGENDA_DEBUG && res.length > 0) {
      dbg('slots generated', { day: date.toISOString().slice(0,10), count: res.length, first: res[0]?.start.toTimeString().slice(0,5), last: res[res.length-1]?.start.toTimeString().slice(0,5) });
    }
    return res;
  };

  // Recalcula slots quando dados mudam
  useEffect(() => {
    if (Object.keys(availabilityByWeekday).length === 0) { 
      setWeekReady(false); 
      return; 
    }
    
    const days = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selectedDate), i));
    const next: Record<string, { start: Date; end: Date }[]> = {};
    
    for (const d of days) {
      const key = dateKey(d);
      next[key] = generateSlots(d);
    }
    
    setSlotsByDay(next);
    setWeekReady(true);
    dbg('week slots ready', { keys: Object.keys(next), counts: Object.fromEntries(Object.entries(next).map(([k,v])=>[k, v.length])) });
  }, [availabilityByWeekday, events, busyRanges, googleBusySlots, selectedDate, isGoogleBusy]);

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
          user_id: authUser,
        })
        .select('id')
        .single();
      if (error) throw error;

      setConfirmOpen(false);
      setConfirmSuccess(true);
      await loadEvents();

    } catch (e) {
      toast.error('Falha ao agendar');
    } finally {
      setSaving(false);
    }
  };

  const headerDateLabel = useMemo(() => {
    return selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [selectedDate]);

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
              <div className="font-medium capitalize">{headerDateLabel}</div>
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
            />
          </div>

          {/* Coluna 2: Lista de horários da semana */}
          <div className="border rounded-md p-3 brand-radius">
            <div aria-label="Horários disponíveis" role="region" className="overflow-auto">
              {(loadingEvents || isLoadingGoogle) ? (
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
                  {!weekReady ? (
                    <div className="space-y-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full brand-radius" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-2 items-start">
                      {weekDays.map((day, colIdx) => {
                        const key = dateKey(day);
                        const slots = slotsByDay[key] || [];
                        
                        return (
                          <div key={`col-${colIdx}`} className="flex flex-col gap-2">
                            {slots.length === 0 ? (
                              <div className="text-xs text-muted-foreground text-center">Sem horários</div>
                            ) : (
                              slots.map(({ start, end }, i) => (
                                <button
                                  key={`btn-${colIdx}-${i}`}
                                  title={'Disponível'}
                                  onClick={() => openConfirm({ start, end })}
                                  className="w-full text-center px-3 py-2 brand-radius border transition hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-secondary)] text-[var(--brand-secondary)] border-border"
                                >
                                  {formatTime(start)}
                                </button>
                              ))
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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

      {/* Tela de sucesso */}
      {confirmSuccess && (
        <div className="px-6 pb-6">
          <div className="border rounded-md p-4 brand-radius bg-muted/20">
            <div className="font-medium mb-2">Agendamento confirmado!</div>
            <div className="text-sm text-muted-foreground mb-3">O evento foi criado e sincronizado com o Google Calendar.</div>
            <div className="flex gap-2">
              <Button className="brand-radius" variant="outline" onClick={() => setConfirmSuccess(false)}>Voltar ao início</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};