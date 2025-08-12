import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [loading, setLoading] = useState(false);

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
  const startOfMonth = (d: Date) => { const x = new Date(d.getFullYear(), d.getMonth(), 1); return x; };
  const endOfMonth = (d: Date) => { const x = new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999); return x; };

  const range = useMemo(() => {
    if (view === 'day') return { from: startOfDay(currentDate), to: endOfDay(currentDate) };
    if (view === 'week') return { from: startOfWeek(currentDate), to: endOfWeek(currentDate) };
    return { from: startOfMonth(currentDate), to: endOfMonth(currentDate) };
  }, [view, currentDate]);

  const formatDateISO = (d: Date) => d.toISOString();

  const loadEventTypes = async () => {
    // RLS já permite SELECT por escopos (user/team/company)
    const { data, error } = await supabase
      .from('scheduling_event_types')
      .select('id, name, duration_minutes, scope, team_id, status, owner_user_id')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('name');
    if (!error) setEventTypes(data || []);
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const fromISO = formatDateISO(range.from);
      const toISO = formatDateISO(range.to);

      // Plataforma
      const { data: plat, error: perr } = await supabase
        .from('scheduling_events')
        .select('id, title, description, start_at, end_at, google_event_id')
        .eq('company_id', companyId)
        .gte('start_at', fromISO)
        .lte('end_at', toISO)
        .order('start_at', { ascending: true });
      if (perr) throw perr;
      let all: PlatformEvent[] = (plat || []) as any;

      // Google
      const { data: sess } = await supabase.auth.getSession();
      const providerToken = (sess?.session as any)?.provider_token || (typeof window !== 'undefined' ? localStorage.getItem('google_provider_token') : '');
      const { data: settings } = await supabase
        .from('scheduling_calendar_settings')
        .select('google_calendar_id, sync_enabled')
        .eq('company_id', companyId)
        .single();
      if (providerToken && settings?.google_calendar_id && settings?.sync_enabled) {
        const params = new URLSearchParams({
          timeMin: fromISO,
          timeMax: toISO,
          singleEvents: 'true',
          orderBy: 'startTime',
          maxResults: '2500',
        });
        const resp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(settings.google_calendar_id)}/events?${params.toString()}`,
          { headers: { Authorization: `Bearer ${providerToken}` } });
        if (resp.ok) {
          const json = await resp.json();
          const gEvents: PlatformEvent[] = (json.items || []).map((it: any) => ({
            id: `g_${it.id}`,
            title: it.summary || '(Sem título)',
            description: it.description || null,
            start_at: it.start?.dateTime || it.start?.date || it.created,
            end_at: it.end?.dateTime || it.end?.date || it.created,
            google_event_id: it.id,
          }));
          // Mesclar
          all = [...all, ...gEvents];
        }
      }

      setEvents(all);
    } catch (e) {
      toast.error('Falha ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventTypes();
  }, [companyId]);
  useEffect(() => {
    loadEvents();
  }, [range.from.getTime(), range.to.getTime(), companyId]);

  const goPrev = () => {
    setCurrentDate(prev => view === 'day' ? addDays(prev, -1) : view === 'week' ? addDays(prev, -7) : new Date(prev.getFullYear(), prev.getMonth()-1, prev.getDate()));
  };
  const goNext = () => {
    setCurrentDate(prev => view === 'day' ? addDays(prev, 1) : view === 'week' ? addDays(prev, 7) : new Date(prev.getFullYear(), prev.getMonth()+1, prev.getDate()));
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 08..19
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const [scheduleDraft, setScheduleDraft] = useState<{ date: string; time: string; eventTypeId: string; title: string; description?: string }>({ date: '', time: '', eventTypeId: '', title: '' });
  const [scheduling, setScheduling] = useState(false);

  const scheduleAt = (date: Date, hour: number) => {
    const d = new Date(date); d.setHours(hour, 0, 0, 0);
    setScheduleDraft({ date: d.toISOString().slice(0,10), time: d.toTimeString().slice(0,5), eventTypeId: '', title: '' });
  };

  const saveSchedule = async () => {
    if (!scheduleDraft.eventTypeId || !scheduleDraft.date || !scheduleDraft.time) {
      toast.error('Informe tipo e horário'); return;
    }
    setScheduling(true);
    try {
      const selected = eventTypes.find(et => et.id === scheduleDraft.eventTypeId);
      const startISO = new Date(`${scheduleDraft.date}T${scheduleDraft.time}:00`).toISOString();
      const endISO = new Date(new Date(startISO).getTime() + ((selected?.duration_minutes || 30) * 60 * 1000)).toISOString();
      const title = scheduleDraft.title || (selected?.name || 'Evento');

      // Inserir na plataforma
      const { data, error } = await supabase
        .from('scheduling_events')
        .insert({
          title,
          description: scheduleDraft.description || null,
          start_at: startISO,
          end_at: endISO,
          company_id: companyId,
          owner_user_id: (await supabase.auth.getUser()).data.user?.id,
          created_by_user_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select('id')
        .single();
      if (error) throw error;

      // Se calendar integrado, criar no Google
      const { data: sess } = await supabase.auth.getSession();
      const providerToken = (sess?.session as any)?.provider_token || (typeof window !== 'undefined' ? localStorage.getItem('google_provider_token') : '');
      const { data: settings } = await supabase
        .from('scheduling_calendar_settings')
        .select('google_calendar_id, sync_enabled')
        .eq('company_id', companyId)
        .single();
      if (providerToken && settings?.google_calendar_id && settings?.sync_enabled) {
        const resp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(settings.google_calendar_id)}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${providerToken}` },
          body: JSON.stringify({
            summary: title,
            description: scheduleDraft.description || undefined,
            start: { dateTime: startISO },
            end: { dateTime: endISO },
          })
        });
        if (resp.ok) {
          const gj = await resp.json();
          await supabase.from('scheduling_events').update({ google_event_id: gj.id }).eq('id', data.id);
        }
      }

      toast.success('Evento agendado');
      setScheduleDraft({ date: '', time: '', eventTypeId: '', title: '' });
      await loadEvents();
    } catch (e) {
      toast.error('Falha ao agendar');
    } finally {
      setScheduling(false);
    }
  };

  const dateLabel = useMemo(() => {
    return currentDate.toLocaleDateString();
  }, [currentDate]);

  return (
    <Card className="brand-radius">
      <CardHeader>
        <CardTitle>Agenda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="brand-radius" onClick={goPrev}>Anterior</Button>
            <div className="px-2 text-sm text-muted-foreground">{dateLabel}</div>
            <Button variant="outline" className="brand-radius" onClick={goNext}>Próximo</Button>
          </div>
          <div className="ml-auto">
            <Select value={view} onValueChange={(v) => setView(v as any)}>
              <SelectTrigger className="w-[160px] brand-radius">
                <SelectValue placeholder="Visualização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Dia</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {view !== 'month' && (
          <div className="overflow-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 w-20 text-muted-foreground">Hora</th>
                  {view === 'day' ? (
                    <th className="p-2">{currentDate.toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: '2-digit' })}</th>
                  ) : (
                    weekDays.map((d, i) => (
                      <th key={`wd-${i}`} className="p-2 text-center text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit' })}</th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {hours.map(h => (
                  <tr key={`h-${h}`} className="border-t">
                    <td className="p-2 text-muted-foreground align-top">{String(h).padStart(2,'0')}:00</td>
                    {view === 'day' ? (
                      <td className="p-2 align-top">
                        <div className="min-h-[64px] border rounded-md p-2 hover:bg-accent/30 cursor-pointer brand-radius" onClick={() => scheduleAt(currentDate, h)}>
                          {events.filter(e => new Date(e.start_at).getHours() === h && new Date(e.start_at).toDateString() === currentDate.toDateString()).map(ev => (
                            <div key={ev.id} className="text-xs bg-[var(--brand-secondary)]/10 border border-[var(--brand-secondary)]/30 rounded px-2 py-1 mb-1 brand-radius">
                              <div className="font-medium truncate text-foreground">{ev.title}</div>
                              <div className="text-muted-foreground">{new Date(ev.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(ev.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          ))}
                          <div className="text-[10px] text-muted-foreground">Clique para agendar</div>
                        </div>
                      </td>
                    ) : (
                      weekDays.map((d, i) => (
                        <td key={`cell-${h}-${i}`} className="p-2 align-top">
                          <div className="min-h-[64px] border rounded-md p-2 hover:bg-accent/30 cursor-pointer brand-radius" onClick={() => scheduleAt(d, h)}>
                            {events.filter(e => new Date(e.start_at).getHours() === h && new Date(e.start_at).toDateString() === d.toDateString()).map(ev => (
                              <div key={ev.id} className="text-xs bg-[var(--brand-secondary)]/10 border border-[var(--brand-secondary)]/30 rounded px-2 py-1 mb-1 brand-radius">
                                <div className="font-medium truncate text-foreground">{ev.title}</div>
                                <div className="text-muted-foreground">{new Date(ev.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(ev.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                              </div>
                            ))}
                            <div className="text-[10px] text-muted-foreground">Clique para agendar</div>
                          </div>
                        </td>
                      ))
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'month' && (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: (endOfMonth(currentDate).getDate()) }, (_, i) => i + 1).map(day => {
              const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const evs = events.filter(e => new Date(e.start_at).toDateString() === d.toDateString());
              return (
                <div key={`mday-${day}`} className="border rounded-md p-2 min-h-[100px] brand-radius">
                  <div className="text-xs font-medium mb-2">{day}</div>
                  <div className="space-y-1">
                    {evs.slice(0,3).map(ev => (
                      <div key={ev.id} className="text-[10px] bg-[var(--brand-secondary)]/10 border border-[var(--brand-secondary)]/30 rounded px-1 py-0.5 truncate brand-radius">{ev.title}</div>
                    ))}
                    {evs.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">+{evs.length - 3} mais</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(scheduleDraft.date && scheduleDraft.time) && (
          <div className="border rounded-md p-3 space-y-3">
            <div className="text-sm font-medium">Agendar em {scheduleDraft.date} às {scheduleDraft.time}</div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label>Tipo de evento</Label>
                <Select value={scheduleDraft.eventTypeId} onValueChange={(v) => setScheduleDraft(prev => ({ ...prev, eventTypeId: v }))}>
                  <SelectTrigger className="brand-radius"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(et => (
                      <SelectItem key={et.id} value={et.id}>{et.name} ({et.duration_minutes}m)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Título</Label>
                <Input className="brand-radius" value={scheduleDraft.title} onChange={e => setScheduleDraft(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="md:col-span-3">
                <Label>Descrição</Label>
                <Input className="brand-radius" value={scheduleDraft.description || ''} onChange={e => setScheduleDraft(prev => ({ ...prev, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="brand-radius" onClick={() => setScheduleDraft({ date: '', time: '', eventTypeId: '', title: '' })}>Cancelar</Button>
              <Button className="brand-radius" variant="brandPrimaryToSecondary" disabled={scheduling} onClick={saveSchedule}>{scheduling ? 'Salvando...' : 'Agendar'}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 