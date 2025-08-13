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
  const brLabel = '(GMT-03:00) Horário Padrão de Brasília – São Paulo';


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
      
      const events: PlatformEvent[] = (plat || []);
      
      // Converter eventos para busy ranges
      const fbBusy: { start: number; end: number }[] = [];
      events.forEach(event => {
        const sMs = new Date(event.start_at).getTime();
        const eMs = new Date(event.end_at).getTime();
        fbBusy.push({ start: sMs, end: eMs });
      });

      setEvents(events);
      setBusyRanges(fbBusy);
      dbg('Platform events loaded:', events.length);
      
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
  }, [companyId]);

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