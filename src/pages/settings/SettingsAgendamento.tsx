import { useEffect, useMemo, useState } from 'react';
import { SettingsLayout } from '@/components/Layout/SettingsLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AvailabilityRow {
  id?: string;
  weekday: number; // 0-6 (domingo-sábado)
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  is_active: boolean;
}

interface EventTypeRow {
  id?: string;
  name: string;
  description?: string;
  duration_minutes: number;
  min_gap_minutes: number;
  status: 'active' | 'archived';
}

export default function SettingsAgendamento() {
  const { crmUser } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const ownerId = crmUser?.id || '';
  const companyId = selectedCompanyId || crmUser?.company_id || '';

  const [activeTab, setActiveTab] = useState<'availability' | 'event_types' | 'calendar'>('availability');

  // Disponibilidade
  const defaultAvailability: AvailabilityRow[] = useMemo(() => (
    Array.from({ length: 7 }, (_, i) => ({
      weekday: i,
      start_time: '09:00',
      end_time: '18:00',
      is_active: i >= 1 && i <= 5, // seg-sex ativos por padrão
    }))
  ), []);
  const [availability, setAvailability] = useState<AvailabilityRow[]>(defaultAvailability);
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Tipos de Evento
  const [eventTypes, setEventTypes] = useState<EventTypeRow[]>([]);
  const [eventDraft, setEventDraft] = useState<EventTypeRow>({ name: '', description: '', duration_minutes: 30, min_gap_minutes: 15, status: 'active' });
  const [savingEventType, setSavingEventType] = useState(false);

  // Integração de Calendário
  const [syncEnabled, setSyncEnabled] = useState<boolean>(false);
  const [twoWaySync, setTwoWaySync] = useState<boolean>(true);
  const [googleCalendarId, setGoogleCalendarId] = useState<string>('');
  const [savingCalendar, setSavingCalendar] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      if (!ownerId || !companyId) return;
      // availability
      const { data: avail } = await supabase
        .from('scheduling_availability')
        .select('*')
        .eq('owner_user_id', ownerId)
        .eq('company_id', companyId)
        .order('weekday');
      if (Array.isArray(avail) && avail.length > 0) {
        setAvailability(avail.map((r: any) => ({ id: r.id, weekday: r.weekday, start_time: r.start_time, end_time: r.end_time, is_active: r.is_active })));
      }
      // event types
      const { data: evt } = await supabase
        .from('scheduling_event_types')
        .select('*')
        .eq('owner_user_id', ownerId)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (Array.isArray(evt)) {
        setEventTypes(evt as any);
      }
      // calendar settings
      const { data: cal } = await supabase
        .from('scheduling_calendar_settings')
        .select('*')
        .eq('owner_user_id', ownerId)
        .eq('company_id', companyId)
        .maybeSingle();
      if (cal) {
        setSyncEnabled(!!cal.sync_enabled);
        setTwoWaySync(!!cal.two_way_sync);
        setGoogleCalendarId(cal.google_calendar_id || '');
      }
    };
    loadAll();
  }, [ownerId, companyId]);

  const saveAvailability = async () => {
    if (!ownerId || !companyId) return;
    setSavingAvailability(true);
    try {
      // upsert em lote
      const rows = availability.map(a => ({
        id: a.id,
        owner_user_id: ownerId,
        company_id: companyId,
        weekday: a.weekday,
        start_time: a.start_time,
        end_time: a.end_time,
        is_active: a.is_active,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await (supabase as any)
        .from('scheduling_availability')
        .upsert(rows, { onConflict: 'id' });
      if (error) throw error;
      toast.success('Disponibilidade salva.');
    } catch (e) {
      toast.error('Erro ao salvar disponibilidade.');
    } finally {
      setSavingAvailability(false);
    }
  };

  const saveEventType = async () => {
    if (!ownerId || !companyId) return;
    if (!eventDraft.name || eventDraft.duration_minutes <= 0) {
      toast.error('Informe nome e duração.');
      return;
    }
    setSavingEventType(true);
    try {
      const payload = {
        owner_user_id: ownerId,
        company_id: companyId,
        name: eventDraft.name,
        description: eventDraft.description || '',
        duration_minutes: Number(eventDraft.duration_minutes || 0),
        min_gap_minutes: Number(eventDraft.min_gap_minutes || 0),
        status: eventDraft.status,
        updated_at: new Date().toISOString(),
      } as any;
      const { data, error } = await (supabase as any)
        .from('scheduling_event_types')
        .insert(payload)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      setEventTypes(prev => [data, ...prev]);
      setEventDraft({ name: '', description: '', duration_minutes: 30, min_gap_minutes: 15, status: 'active' });
      toast.success('Tipo de evento criado.');
    } catch (e) {
      toast.error('Erro ao salvar tipo de evento.');
    } finally {
      setSavingEventType(false);
    }
  };

  const archiveEventType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduling_event_types')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setEventTypes(prev => prev.filter(e => e.id !== id));
      toast.success('Tipo de evento arquivado.');
    } catch (e) {
      toast.error('Erro ao arquivar tipo de evento.');
    }
  };

  const saveCalendarSettings = async () => {
    if (!ownerId || !companyId) return;
    setSavingCalendar(true);
    try {
      const payload = {
        owner_user_id: ownerId,
        company_id: companyId,
        google_calendar_id: googleCalendarId || null,
        sync_enabled: syncEnabled,
        two_way_sync: twoWaySync,
        updated_at: new Date().toISOString(),
      } as any;
      const { error } = await (supabase as any)
        .from('scheduling_calendar_settings')
        .upsert(payload, { onConflict: 'owner_user_id,company_id' });
      if (error) throw error;
      toast.success('Configurações de calendário salvas.');
    } catch (e) {
      toast.error('Erro ao salvar configurações de calendário.');
    } finally {
      setSavingCalendar(false);
    }
  };

  const weekdayLabel = (i: number) => ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][i];

  return (
    <SettingsLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">Configuração do Agendamento</h1>

          <Card className="shadow-xl border-0 bg-card">
            <CardHeader>
              <CardTitle>Preferências</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                <TabsList className="mb-4 grid grid-cols-1 sm:grid-cols-3 w-full max-w-xl">
                  <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
                  <TabsTrigger value="event_types">Tipos de Evento</TabsTrigger>
                  <TabsTrigger value="calendar">Integração de Calendário</TabsTrigger>
                </TabsList>

                <TabsContent value="availability" className="space-y-4">
                  <div className="space-y-3">
                    {availability.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3 items-end border p-3 rounded-lg">
                        <div className="col-span-12 sm:col-span-3">
                          <Label>Dia</Label>
                          <Input value={weekdayLabel(row.weekday)} readOnly className="brand-radius" />
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                          <Label>Início</Label>
                          <Input type="time" value={row.start_time} onChange={e => setAvailability(prev => prev.map((r, i) => i===idx ? { ...r, start_time: e.target.value } : r))} className="brand-radius" />
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                          <Label>Fim</Label>
                          <Input type="time" value={row.end_time} onChange={e => setAvailability(prev => prev.map((r, i) => i===idx ? { ...r, end_time: e.target.value } : r))} className="brand-radius" />
                        </div>
                        <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
                          <Switch checked={row.is_active} onCheckedChange={(v) => setAvailability(prev => prev.map((r, i) => i===idx ? { ...r, is_active: !!v } : r))} />
                          <span>Ativo</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={saveAvailability} disabled={savingAvailability} variant="brandPrimaryToSecondary" className="brand-radius">
                      {savingAvailability ? 'Salvando...' : 'Salvar Disponibilidade'}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="event_types" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 border rounded-lg p-4">
                      <h3 className="font-semibold">Novo tipo de evento</h3>
                      <div>
                        <Label>Nome</Label>
                        <Input value={eventDraft.name} onChange={e => setEventDraft({ ...eventDraft, name: e.target.value })} className="brand-radius" />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Input value={eventDraft.description} onChange={e => setEventDraft({ ...eventDraft, description: e.target.value })} className="brand-radius" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Duração (min)</Label>
                          <Input type="number" min={5} value={eventDraft.duration_minutes} onChange={e => setEventDraft({ ...eventDraft, duration_minutes: Number(e.target.value) })} className="brand-radius" />
                        </div>
                        <div>
                          <Label>Intervalo mínimo (min)</Label>
                          <Input type="number" min={0} value={eventDraft.min_gap_minutes} onChange={e => setEventDraft({ ...eventDraft, min_gap_minutes: Number(e.target.value) })} className="brand-radius" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={eventDraft.status === 'active'} onCheckedChange={(v) => setEventDraft({ ...eventDraft, status: v ? 'active' : 'archived' })} />
                        <span>Ativo</span>
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={saveEventType} disabled={savingEventType} variant="brandPrimaryToSecondary" className="brand-radius">
                          {savingEventType ? 'Salvando...' : 'Salvar Tipo'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Tipos existentes</h3>
                      {eventTypes.length === 0 && (
                        <div className="text-sm text-muted-foreground">Nenhum tipo de evento criado.</div>
                      )}
                      {eventTypes.map((evt) => (
                        <div key={evt.id} className="border rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <div className="font-medium">{evt.name}</div>
                            <div className="text-xs text-muted-foreground">{evt.duration_minutes} min • intervalo {evt.min_gap_minutes} min</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${evt.status === 'active' ? 'text-green-600' : 'text-muted-foreground'}`}>{evt.status}</span>
                            {evt.id && (
                              <Button size="sm" variant="outline" className="brand-radius" onClick={() => archiveEventType(evt.id!)}>Arquivar</Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="calendar" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 border rounded-lg p-4">
                      <h3 className="font-semibold">Integração Google Calendar</h3>
                      <div className="flex items-center gap-2">
                        <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
                        <span>Sincronização ativa</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={twoWaySync} onCheckedChange={setTwoWaySync} />
                        <span>Sincronização bidirecional</span>
                      </div>
                      <div>
                        <Label>ID do Calendário Google (primário ou específico)</Label>
                        <Input placeholder="primary ou id@group.calendar.google.com" value={googleCalendarId} onChange={e => setGoogleCalendarId(e.target.value)} className="brand-radius" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Observação: a listagem automática de calendários será habilitada quando a conexão Google estiver ativa na aba "Meu Perfil > Integrações".
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={saveCalendarSettings} disabled={savingCalendar} variant="brandPrimaryToSecondary" className="brand-radius">
                          {savingCalendar ? 'Salvando...' : 'Salvar Configurações'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 p-4 border rounded-lg">
                      <h3 className="font-semibold">Como funciona</h3>
                      <p className="text-sm text-muted-foreground">
                        • Eventos agendados pela plataforma serão criados no Google Calendar quando a sincronização estiver ativa.
                        • Bloqueios no Google Calendar (ocupado) serão refletidos como indisponibilidade aqui, e vice‑versa quando a opção bidirecional estiver habilitada.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </SettingsLayout>
  );
} 