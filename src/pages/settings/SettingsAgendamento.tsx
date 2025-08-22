import { useEffect, useMemo, useState } from 'react';
// import { SettingsLayout } from '@/components/Layout/SettingsLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy as CopyIcon, Trash2, Pencil } from 'lucide-react';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
// import { useTeams } from '@/hooks/useTeams';
// import { useCompany } from '@/contexts/CompanyContext';
import { FullScreenModal } from '@/components/ui/FullScreenModal';

const SCHED_DEBUG = false;
const schedLog = (...args: any[]) => { if (SCHED_DEBUG) console.log(...args); };

interface AvailabilityRow {
  id?: string;
  weekday: number; // 0-6 (domingo-sábado)
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  is_active: boolean;
  intervals?: { id?: string; name: string; start_time: string; end_time: string }[]; // apenas UI por enquanto
}

interface EventTypeRow {
  id?: string;
  name: string;
  description?: string;
  duration_minutes: number;
  min_gap_minutes: number;
  status: 'active' | 'archived';
  scope?: 'user' | 'team' | 'company';
  team_id?: string | null;
  owner_user_id?: string;
}

export default function SettingsAgendamento() {
  const { crmUser, user } = useCrmAuth();
  const ownerId = crmUser?.id || '';
  const selectedCompanyIdLS = (typeof window !== 'undefined') ? (localStorage.getItem('selectedCompanyId') || '') : '';
  const companyId = selectedCompanyIdLS || crmUser?.company_id || '';

  const [activeTab, setActiveTab] = useState<'availability' | 'event_types' | 'forms' | 'calendar'>('availability');

  // Disponibilidade
  const defaultAvailability: AvailabilityRow[] = useMemo(() => (
    Array.from({ length: 7 }, (_, i) => ({
      weekday: i,
      start_time: '09:00',
      end_time: '18:00',
      is_active: i >= 1 && i <= 5, // seg-sex ativos por padrão
      intervals: [],
    }))
  ), []);
  const [availability, setAvailability] = useState<AvailabilityRow[]>(defaultAvailability);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [activeIntervalDay, setActiveIntervalDay] = useState<number | null>(null);
  const [copySourceDay, setCopySourceDay] = useState<number | null>(null);
  const [copyTargets, setCopyTargets] = useState<number[]>([]);
  const [intervalFormDay, setIntervalFormDay] = useState<number | null>(null);
  const [intervalDraft, setIntervalDraft] = useState<{ name: string; start_time: string; end_time: string }>({ name: '', start_time: '', end_time: '' });

  const startCopy = (weekday: number) => {
    setCopySourceDay(weekday);
    setCopyTargets([]);
  };
  const toggleCopyTarget = (weekday: number) => {
    if (copySourceDay === null || weekday === copySourceDay) return;
    setCopyTargets(prev => prev.includes(weekday) ? prev.filter(w => w !== weekday) : [...prev, weekday]);
  };
  const cancelCopy = () => {
    setCopySourceDay(null);
    setCopyTargets([]);
  };
  const applyCopy = () => {
    if (copySourceDay === null || copyTargets.length === 0) return;
    const source = availability.find(a => a.weekday === copySourceDay);
    if (!source) return;
    const next = availability.map(a => {
      if (copyTargets.includes(a.weekday)) {
        return {
          ...a,
          is_active: source.is_active,
          start_time: source.start_time,
          end_time: source.end_time,
          intervals: (source.intervals || []).map(it => ({ ...it })),
        };
      }
      return a;
    });
    setAvailability(next);
    cancelCopy();
    toast.success('Regras copiadas.');
  };

  const removeInterval = (weekday: number, index: number) => {
    setAvailability(prev => prev.map(r => r.weekday === weekday ? {
      ...r,
      intervals: (r.intervals || []).filter((_, i) => i !== index)
    } : r));
  };

  const openIntervalForm = (weekday: number) => {
    setIntervalFormDay(weekday);
    setIntervalDraft({ name: '', start_time: '', end_time: '' });
  };

  const cancelIntervalForm = () => {
    setIntervalFormDay(null);
    setIntervalDraft({ name: '', start_time: '', end_time: '' });
  };

  const addInterval = () => {
    if (intervalFormDay === null) return;
    const { name, start_time, end_time } = intervalDraft;
    if (!start_time || !end_time) {
      toast.error('Informe início e fim do intervalo.');
      return;
    }
    setAvailability(prev => prev.map(r => r.weekday === intervalFormDay ? {
      ...r,
      intervals: [ ...(r.intervals || []), { name, start_time, end_time } ]
    } : r));
    cancelIntervalForm();
  };

  // Tipos de Evento
  const [eventTypes, setEventTypes] = useState<EventTypeRow[]>([]);
  const [eventDraft, setEventDraft] = useState<EventTypeRow>({ name: '', description: '', duration_minutes: 30, min_gap_minutes: 15, status: 'active', scope: 'user', team_id: null });
  const [savingEventType, setSavingEventType] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const isAdminLike = crmUser?.role === 'admin' || crmUser?.role === 'master' || crmUser?.role === 'submaster';
  const isLeader = crmUser?.role === 'leader';
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const fetchTeams = async () => {
    if (!companyId) return;
    schedLog('[SCHED] fetchTeams start', { companyId });
    let { data } = await supabase
      .from('teams')
      .select('id, name, status, company_id')
      .eq('company_id', companyId)
      .order('name');
    if (!data || data.length === 0) {
      const fallback = await supabase
        .from('teams')
        .select('id, name, status, company_id')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('name');
      data = fallback.data || [];
    }
    setTeams(data || []);
    schedLog('[SCHED] fetchTeams done', { count: (data || []).length });
  };

  // Formulários
  type FormFieldType = 'short_text' | 'long_text' | 'dropdown' | 'multiselect' | 'radio' | 'number' | 'currency' | 'users' | 'leads' | 'datetime';
  interface FormFieldRow {
    id?: string;
    form_id?: string;
    label: string;
    type: FormFieldType;
    required: boolean;
    options?: string[] | null; // para dropdown/multiselect/radio
    currency_code?: string | null; // para currency
    allow_comma?: boolean; // number/currency
    sort_order: number;
  }
  interface FormRow {
    id?: string;
    name: string;
    description?: string;
    status: 'active' | 'archived';
    fields: FormFieldRow[];
    linkedEventTypeIds: string[]; // associação com tipos de evento
  }

  const [forms, setForms] = useState<FormRow[]>([]);
  const [savingForm, setSavingForm] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [formDraft, setFormDraft] = useState<FormRow>({ name: '', description: '', status: 'active', fields: [], linkedEventTypeIds: [] });

  const addEmptyField = () => {
    const nextOrder = (formDraft.fields?.length || 0) + 1;
    setFormDraft(prev => ({
      ...prev,
      fields: [
        ...prev.fields,
        { label: '', type: 'short_text', required: false, options: null, currency_code: null, allow_comma: false, sort_order: nextOrder },
      ],
    }));
  };


  const updateField = (idx: number, patch: Partial<FormFieldRow>) => {
    setFormDraft(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === idx ? { ...f, ...patch } : f),
    }));
  };

  const removeField = (idx: number) => {
    setFormDraft(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== idx).map((f, i2) => ({ ...f, sort_order: i2 + 1 })),
    }));
  };

  const loadForms = async () => {
    if (!ownerId || !companyId) return;
    const { data: fs, error } = await supabase
      .from('scheduling_forms')
      .select('id, name, description, status')
      .eq('owner_user_id', user?.id)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) return;
    const result: FormRow[] = [];
    for (const f of fs || []) {
      const { data: fields } = await supabase
        .from('scheduling_form_fields')
        .select('id, label, type, required, options, currency_code, allow_comma, sort_order')
        .eq('form_id', f.id)
        .order('sort_order');
      const { data: links } = await supabase
        .from('scheduling_event_type_forms')
        .select('event_type_id')
        .eq('form_id', f.id);
      result.push({
        id: f.id,
        name: f.name,
        description: f.description,
        status: f.status,
        fields: (fields || []) as any,
        linkedEventTypeIds: (links || []).map(l => l.event_type_id),
      });
    }
    setForms(result);
  };

  const resetFormDraft = () => {
    setEditingFormId(null);
    setFormDraft({
      name: '',
      description: '',
      status: 'active',
      linkedEventTypeIds: [],
      fields: [
        { label: 'Data e hora', type: 'datetime', required: true, options: null, currency_code: null, allow_comma: false, sort_order: 1 },
      ],
    });
  };


  const editForm = (formId: string) => {
    const f = forms.find(x => x.id === formId);
    if (!f) return;
    setEditingFormId(formId);
    // Garante que sempre exista o campo obrigatório Data e hora como primeiro
    const cloned: FormRow = JSON.parse(JSON.stringify(f));
    const hasDateTime = (cloned.fields || []).some(ff => ff.type === 'datetime');
    if (!hasDateTime) {
      cloned.fields = [
        { label: 'Data e hora', type: 'datetime', required: true, options: null, currency_code: null, allow_comma: false, sort_order: 1 },
        ...(cloned.fields || []).map((ff, i) => ({ ...ff, sort_order: i + 2 })),
      ];
    } else {
      // Garante que esteja no topo
      cloned.fields = [
        ...(cloned.fields.filter(ff => ff.type === 'datetime').map(ff => ({ ...ff, required: true, sort_order: 1 }))),
        ...cloned.fields.filter(ff => ff.type !== 'datetime').map((ff, i) => ({ ...ff, sort_order: i + 2 })),
      ];
    }
    setFormDraft(cloned);
  };

  const deleteForm = async (formId: string) => {
    try {
      await supabase.from('scheduling_event_type_forms').delete().eq('form_id', formId);
      await supabase.from('scheduling_form_fields').delete().eq('form_id', formId);
      await supabase.from('scheduling_forms').delete().eq('id', formId);
      toast.success('Formulário excluído');
      await loadForms();
      if (editingFormId === formId) resetFormDraft();
    } catch (e) {
      toast.error('Falha ao excluir formulário');
    }
  };

  const saveForm = async () => {
    if (!formDraft.name) {
      toast.error('Informe o nome do formulário');
      return;
    }
    setSavingForm(true);
    try {
      // Upsert do formulário
      let formId = editingFormId;
      if (!formId) {
        const { data, error } = await supabase
          .from('scheduling_forms')
          .insert({
            name: formDraft.name,
            description: formDraft.description || null,
            status: formDraft.status,
            owner_user_id: user?.id,
            company_id: companyId,
          })
          .select('id')
          .single();
        if (error) throw error;
        formId = data?.id;
      } else {
        const { error } = await supabase
          .from('scheduling_forms')
          .update({ name: formDraft.name, description: formDraft.description || null, status: formDraft.status })
          .eq('id', formId);
        if (error) throw error;
        // limpar campos para regravar
        await supabase.from('scheduling_form_fields').delete().eq('form_id', formId);
      }
      if (!formId) throw new Error('Falha ao obter id do formulário');

      // Upsert dos campos
      if (formDraft.fields && formDraft.fields.length > 0) {
        const payload = formDraft.fields.map((f, idx) => ({
          form_id: formId,
          label: f.label,
          type: f.type,
          required: !!f.required,
          options: f.options ? JSON.stringify(f.options) : null,
          currency_code: f.currency_code || null,
          allow_comma: !!f.allow_comma,
          sort_order: idx + 1,
        }));
        const { error: ferr } = await supabase.from('scheduling_form_fields').insert(payload as any);
        if (ferr) throw ferr;
      }

      // Associações com tipos de evento (sincronizar)
      await supabase.from('scheduling_event_type_forms').delete().eq('form_id', formId);
      if (formDraft.linkedEventTypeIds?.length) {
        const linkPayload = formDraft.linkedEventTypeIds.map(etId => ({
          form_id: formId,
          event_type_id: etId,
          owner_user_id: user?.id,
          company_id: companyId,
        }));
        const { error: lerr } = await supabase.from('scheduling_event_type_forms').insert(linkPayload as any);
        if (lerr) throw lerr;
      }

      toast.success('Formulário salvo');
      await loadForms();
      setEditingFormId(formId);
    } catch (e) {
      toast.error('Falha ao salvar formulário');
    } finally {
      setSavingForm(false);
    }
  };

  // Integração de Calendário
  const [syncEnabled, setSyncEnabled] = useState<boolean>(false);
  const [twoWaySync, setTwoWaySync] = useState<boolean>(true);
  const [googleCalendarId, setGoogleCalendarId] = useState<string>('');
  const [savingCalendar, setSavingCalendar] = useState(false);
  const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState(false);
  const [calendarItems, setCalendarItems] = useState<{ id: string; summary: string }[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarSelection, setCalendarSelection] = useState<string>('');
  const [calendarMode, setCalendarMode] = useState<'platform' | 'google_only'>('platform');

  // Captura e persiste provider_token ao montar/retornar do OAuth nesta página
  useEffect(() => {
    let active = true;
    const url = new URL(window.location.href);
    const cb = url.searchParams.get('google_callback');
    const persistToken = async () => {
      const { data } = await supabase.auth.getSession();
      const token = (data?.session as any)?.provider_token;
      if (token) {
        try { localStorage.setItem('google_provider_token', token); } catch {}
      }
      if (cb) {
        url.searchParams.delete('google_callback');
        window.history.replaceState({}, '', url.toString());
      }
    };
    persistToken();
    return () => { active = false; };
  }, []);

  const reconnectGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.modify',
          queryParams: { access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true' },
          redirectTo: `${window.location.origin}/configuracoes/agendamento?google_callback=1`,
        },
      } as any);
    } catch (e) {
      setCalendarError('Falha ao iniciar reconexão com o Google.');
    }
  };
  const openCalendarPicker = async () => {
    setIsCalendarPickerOpen(true);
    setCalendarLoading(true);
    setCalendarError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      let providerToken = (sess?.session as any)?.provider_token;
      if (!providerToken) {
        try { providerToken = localStorage.getItem('google_provider_token') || ''; } catch {}
      }
      if (!providerToken) {
        setCalendarError('Conecte sua conta Google em Meu Perfil \u003e Integrações para listar calendários.');
        setCalendarLoading(false);
        return;
      }
      const resp = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer', {
        headers: { Authorization: `Bearer ${providerToken}` },
      });
      if (!resp.ok) {
        let msg = 'Falha ao carregar calendários do Google.';
        try {
          const err = await resp.json();
          const reason = err?.error?.errors?.[0]?.reason || err?.error?.status;
          if (resp.status === 403 && (reason === 'insufficientPermissions' || reason === 'PERMISSION_DENIED')) {
            msg = 'Permissões insuficientes no Google. Reconecte concedendo acesso ao Google Calendar.';
          }
        } catch {}
        setCalendarError(msg);
        setCalendarLoading(false);
        return;
      }
      const json = await resp.json();
      const items = (json.items || []).map((it: any) => ({ id: it.id, summary: it.summary }));
      // Adiciona opção explícita do calendário primário
      if (!items.some((i: any) => i.id === 'primary')) {
        items.unshift({ id: 'primary', summary: 'Calendário primário' } as any);
      }
      setCalendarItems(items);
      setCalendarSelection(items.find((c: any) => c.id === googleCalendarId)?.id || '');
    } catch (e) {
      setCalendarError('Erro inesperado ao buscar calendários.');
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    schedLog('[SCHED] mount ctx', { ownerId, companyId, userId: user?.id });
    const loadAll = async () => {
      if (!ownerId || !companyId) return;
      // availability
      const ownerAuthId = user?.id || ownerId;
      const { data: avail } = await supabase
        .from('scheduling_availability')
        .select('*')
        .eq('owner_user_id', ownerAuthId)
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false })
        .order('weekday');
      schedLog('[SCHED] load availability', { count: avail?.length });

      // Deduplicar por weekday (mais recente vence)
      const dedupAvailMap = new Map<number, any>();
      (avail || []).forEach((r: any) => {
        if (!dedupAvailMap.has(r.weekday)) dedupAvailMap.set(r.weekday, r);
      });
      const dedupAvail = Array.from(dedupAvailMap.values()).sort((a, b) => a.weekday - b.weekday);

      // intervals
      const { data: intervalsData } = await supabase
        .from('scheduling_day_intervals' as any)
        .select('*')
        .eq('owner_user_id', ownerAuthId)
        .eq('company_id', companyId)
        .order('weekday');
      schedLog('[SCHED] load intervals', { count: intervalsData?.length });
      const intervalsByWeekday: Record<number, { id?: string; name: string; start_time: string; end_time: string }[]> = {};
      (intervalsData || []).forEach((it: any) => {
        const w = Number(it.weekday);
        intervalsByWeekday[w] = intervalsByWeekday[w] || [];
        intervalsByWeekday[w].push({ id: it.id, name: it.name || '', start_time: it.start_time, end_time: it.end_time });
      });

      if (dedupAvail.length > 0) {
        setAvailability(dedupAvail.map((r: any) => ({ id: r.id, weekday: r.weekday, start_time: r.start_time, end_time: r.end_time, is_active: r.is_active, intervals: intervalsByWeekday[r.weekday] || [] })));
      }
      // event types
      const { data: evt } = await supabase
        .from('scheduling_event_types')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      schedLog('[SCHED] load event_types', { count: evt?.length });
      if (Array.isArray(evt)) {
        setEventTypes(evt as any);
      }
      // calendar settings
      const { data: cal } = await supabase
        .from('scheduling_calendar_settings')
        .select('*')
        .eq('owner_user_id', ownerAuthId)
        .eq('company_id', companyId)
        .maybeSingle();
      schedLog('[SCHED] load calendar_settings', !!cal);
      if (cal) {
        setSyncEnabled(!!cal.sync_enabled);
        setTwoWaySync(!!cal.two_way_sync);
        setGoogleCalendarId(cal.google_calendar_id || '');
        setCalendarMode((cal as any).mode === 'google_only' ? 'google_only' : 'platform');
      }

      // teams (sem depender de CompanyContext)
      await fetchTeams();
      await loadForms();
    };
    loadAll();
  }, [ownerId, companyId, user?.id]);

  useEffect(() => {
    if (isAdminLike && eventDraft.scope === 'team') {
      fetchTeams();
    }
  }, [eventDraft.scope, companyId]);

  const saveAvailability = async () => {
    if (!ownerId || !companyId) return;
    setSavingAvailability(true);
    try {
      // Montar payload omitindo 'id' quando não existir
      const rows = availability.map(a => {
        const base: any = {
          owner_user_id: user?.id || ownerId,
          company_id: companyId,
          weekday: a.weekday,
          start_time: a.start_time,
          end_time: a.end_time,
          is_active: a.is_active,
          updated_at: new Date().toISOString(),
        };
        if (a.id) base.id = a.id;
        return base;
      });
      schedLog('[SCHED] saving availability', { authUid: user?.id, companyId, rows });
      const { data, error, status } = await (supabase as any)
        .from('scheduling_availability')
        .upsert(rows, { onConflict: 'owner_user_id,company_id,weekday' })
        .select('*');
      schedLog('[SCHED] upsert result', { status, error: error || null, data });
      if (error) throw error;
      // Atualizar ids retornados
      if (Array.isArray(data) && data.length > 0) {
        setAvailability(prev => prev.map(a => {
          const match = data.find((d: any) => d.weekday === a.weekday);
          return match ? { ...a, id: match.id } as any : a as any;
        }));
      }

      // Persistir intervalos (delete + insert do snapshot atual)
      const ownerAuthIdForIntervals = user?.id || ownerId;
      await supabase
        .from('scheduling_day_intervals' as any)
        .delete()
        .eq('owner_user_id', ownerAuthIdForIntervals)
        .eq('company_id', companyId);
      const flatIntervals = availability.flatMap(a => (a.intervals || []).map(it => ({
        owner_user_id: ownerAuthIdForIntervals,
        company_id: companyId,
        weekday: a.weekday,
        name: it.name || '',
        start_time: it.start_time,
        end_time: it.end_time,
        updated_at: new Date().toISOString(),
      })));
      if (flatIntervals.length > 0) {
        const { error: insErr } = await supabase
          .from('scheduling_day_intervals' as any)
          .insert(flatIntervals)
          .select('*');
        schedLog('[SCHED] intervals insert', { count: flatIntervals.length, err: insErr || null });
      } else {
        schedLog('[SCHED] intervals insert skipped (none)');
      }

      // Recarregar para garantir persistência
      const ownerAuthIdReload = user?.id || ownerId;
      const { data: availReload } = await supabase
        .from('scheduling_availability')
        .select('*')
        .eq('owner_user_id', ownerAuthIdReload)
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false })
        .order('weekday');
      const { data: intervalsReload } = await supabase
        .from('scheduling_day_intervals' as any)
        .select('*')
        .eq('owner_user_id', ownerAuthIdReload)
        .eq('company_id', companyId)
        .order('weekday');
      schedLog('[SCHED] reload availability', availReload?.length);
      schedLog('[SCHED] reload intervals', intervalsReload?.length);
      const mapReload: Record<number, any[]> = {};
      (intervalsReload || []).forEach((it: any) => {
        mapReload[it.weekday] = mapReload[it.weekday] || [];
        mapReload[it.weekday].push({ id: it.id, name: it.name || '', start_time: it.start_time, end_time: it.end_time });
      });
      if (Array.isArray(availReload)) {
        const dedupReloadMap = new Map<number, any>();
        availReload.forEach((r: any) => { if (!dedupReloadMap.has(r.weekday)) dedupReloadMap.set(r.weekday, r); });
        const dedupReload = Array.from(dedupReloadMap.values()).sort((a, b) => a.weekday - b.weekday);
        setAvailability(dedupReload.map((r: any) => ({ id: r.id, weekday: r.weekday, start_time: r.start_time, end_time: r.end_time, is_active: r.is_active, intervals: mapReload[r.weekday] || [] })));
      }
      toast.success('Disponibilidade salva.');
    } catch (e: any) {
      if (SCHED_DEBUG) console.error('[SCHED] saveAvailability error', e);
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
    // Regra: escopos empresa/time somente admin/master
    const scope = (isAdminLike ? (eventDraft.scope || 'user') : 'user') as 'user' | 'team' | 'company';
    const teamId = scope === 'team' ? (eventDraft.team_id || null) : null;
    setSavingEventType(true);
    try {
      const payload = {
        owner_user_id: user?.id || ownerId,
        company_id: companyId,
        name: eventDraft.name,
        description: eventDraft.description || '',
        duration_minutes: Number(eventDraft.duration_minutes || 0),
        min_gap_minutes: Number(eventDraft.min_gap_minutes || 0),
        status: eventDraft.status,
        scope,
        team_id: teamId,
        updated_at: new Date().toISOString(),
      } as any;
      let data: any = null; let error: any = null;
      if (editingEventId) {
        const res = await (supabase as any)
          .from('scheduling_event_types')
          .update(payload)
          .eq('id', editingEventId)
          .select('*')
          .maybeSingle();
        data = res.data; error = res.error;
      } else {
        const res = await (supabase as any)
          .from('scheduling_event_types')
          .insert(payload)
          .select('*')
          .maybeSingle();
        data = res.data; error = res.error;
      }
      if (error) throw error;
      if (editingEventId) {
        setEventTypes(prev => prev.map(t => t.id === editingEventId ? data : t));
        toast.success('Tipo de evento atualizado.');
      } else {
        setEventTypes(prev => [data, ...prev]);
        toast.success('Tipo de evento criado.');
      }
      setEditingEventId(null);
      setEventDraft({ name: '', description: '', duration_minutes: 30, min_gap_minutes: 15, status: 'active', scope: isAdminLike ? 'company' : 'user', team_id: null });
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
        owner_user_id: user?.id || ownerId,
        company_id: companyId,
        google_calendar_id: googleCalendarId || null,
        sync_enabled: syncEnabled,
        two_way_sync: twoWaySync,
        mode: calendarMode,
        updated_at: new Date().toISOString(),
      } as any;
      const { error } = await (supabase as any)
        .from('scheduling_calendar_settings')
        .upsert(payload, { onConflict: 'owner_user_id,company_id' });
      if (error) throw error;
      toast.success('Configurações de calendário salvas.');
    } catch (e) {
      setCalendarError('Erro ao salvar configurações do calendário.');
    } finally {
      setSavingCalendar(false);
    }
  };

  const weekdayLabel = (i: number) => ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][i];

  const canDeleteEventType = (t: EventTypeRow): boolean => {
    const scope = t.scope || 'user';
    if (scope === 'company') return isAdminLike; // só admin/master
    if (scope === 'team') return isAdminLike || isLeader; // admin/master/líder
    // scope user: próprio dono OU admin/master
    return (t.owner_user_id && (t.owner_user_id === (user?.id || ''))) || isAdminLike;
  };

  const deleteEventType = async (t: EventTypeRow) => {
    if (!t.id) return;
    if (!canDeleteEventType(t)) {
      toast.error('Você não tem permissão para excluir este tipo.');
      return;
    }
    if (!confirm('Excluir este tipo de evento?')) return;
    const { error } = await supabase
      .from('scheduling_event_types')
      .delete()
      .eq('id', t.id);
    if (error) { toast.error('Erro ao excluir.'); return; }
    setEventTypes(prev => prev.filter(x => x.id !== t.id));
    toast.success('Excluído.');
  };

  const toggleEventTypeStatus = async (t: EventTypeRow, nextActive?: boolean) => {
    if (!t.id) return;
    const next = typeof nextActive === 'boolean'
      ? (nextActive ? 'active' : 'archived')
      : (t.status === 'active' ? 'archived' : 'active');
    const { data, error } = await supabase
      .from('scheduling_event_types')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', t.id)
      .select('*')
      .maybeSingle();
    if (error) { toast.error('Erro ao atualizar status.'); return; }
    setEventTypes(prev => prev.map(x => x.id === t.id ? (data as any) : x));
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">Configuração do Agendamento</h1>

          <Card className="shadow-xl border-0 bg-card">
            <CardHeader>
              <CardTitle>Preferências</CardTitle>
            </CardHeader>
            <CardContent>
              {copySourceDay !== null && (
                <div className="mb-4 p-3 rounded-lg bg-muted flex items-center justify-between">
                  <div className="text-sm">
                    Copiando regras de <strong>{weekdayLabel(copySourceDay)}</strong>. Selecione os dias no cabeçalho e clique em Salvar.
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={applyCopy} disabled={copyTargets.length === 0} className="brand-radius" variant="brandPrimaryToSecondary">Salvar</Button>
                    <Button onClick={cancelCopy} className="brand-radius" variant="outline">Cancelar</Button>
                  </div>
                </div>
              )}
              <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                <TabsList className="mb-4 grid grid-cols-4 w-full gap-2">
                  <TabsTrigger className="w-full" value="availability">Disponibilidade</TabsTrigger>
                  <TabsTrigger className="w-full" value="event_types">Tipos de Evento</TabsTrigger>
                  <TabsTrigger className="w-full" value="forms">Formulário</TabsTrigger>
                  <TabsTrigger className="w-full" value="calendar">Integração de Calendário</TabsTrigger>
                </TabsList>

                <TabsContent value="availability" className="space-y-4">
                  <div className="overflow-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr>
                          <th className="p-3 text-left w-40">Configuração</th>
                          {availability.map((row) => (
                            <th key={`hdr-${row.weekday}`} className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span>{weekdayLabel(row.weekday)}</span>
                                {copySourceDay === null ? (
                                  <Button size="xs" variant="outline" className="h-6 px-2 brand-radius" onClick={() => startCopy(row.weekday)} title="Copiar regras deste dia">
                                    <CopyIcon className="w-3 h-3" />
                                  </Button>
                                ) : (
                                  row.weekday === copySourceDay ? (
                                    <span className="text-xs text-muted-foreground">Origem</span>
                                  ) : (
                                    <Button size="xs" variant={copyTargets.includes(row.weekday) ? 'brandPrimaryToSecondary' : 'outline'} className="h-6 px-2 brand-radius" onClick={() => toggleCopyTarget(row.weekday)}>
                                      {copyTargets.includes(row.weekday) ? 'Selecionado' : 'Selecionar'}
                                    </Button>
                                  )
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={copySourceDay !== null ? 'opacity-40' : ''}>
                        <tr className="border-t">
                          <td className="p-3 font-medium">Ativo</td>
                          {availability.map((row, idx) => (
                            <td key={`active-${row.weekday}`} className="p-3 text-center">
                              <div className="flex items-center justify-center">
                                <Switch checked={row.is_active} onCheckedChange={(v) => setAvailability(prev => prev.map((r, i) => i===idx ? { ...r, is_active: !!v } : r))} />
                              </div>
                            </td>
                          ))}
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 font-medium">Início do dia</td>
                          {availability.map((row, idx) => (
                            <td key={`start-${row.weekday}`} className="p-3">
                              <Input type="time" value={row.start_time} onChange={e => setAvailability(prev => prev.map((r, i) => i===idx ? { ...r, start_time: e.target.value } : r))} className="brand-radius" />
                            </td>
                          ))}
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 font-medium align-top">Intervalos cadastrados</td>
                          {availability.map((row) => (
                            <td key={`list-${row.weekday}`} className="p-3 align-top">
                              {(row.intervals && row.intervals.length > 0) ? (
                                <div className="flex flex-col gap-1">
                                  {row.intervals.map((it, i) => (
                                    <div key={i} className="text-xs px-2 py-1 rounded bg-muted/50 border border-border flex items-center justify-between gap-2">
                                      <span className="truncate max-w-[180px]" title={`${it.name || 'Sem nome'} (${it.start_time || '--:--'} - ${it.end_time || '--:--'})`}>
                                        {(it.name || 'Sem nome')} • {it.start_time || '--:--'}–{it.end_time || '--:--'}
                                      </span>
                                      <Button size="xs" variant="outline" className="h-6 px-2 brand-radius" onClick={() => removeInterval(row.weekday, i)} title="Remover intervalo">
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Nenhum</span>
                              )}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 font-medium">Intervalos</td>
                          {availability.map((row, idx) => (
                            <td key={`add-${row.weekday}`} className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button size="sm" variant="outline" className="brand-radius" onClick={() => openIntervalForm(row.weekday)}>+</Button>
                                <span className="text-xs text-muted-foreground">{(row.intervals?.length || 0)} cadastrado(s)</span>
                              </div>
                            </td>
                          ))}
                        </tr>
                        {intervalFormDay !== null && (
                          <>
                            <tr className="border-t">
                              <td className="p-3 font-medium">Nome do intervalo</td>
                              {availability.map((row) => (
                                <td key={`name-${row.weekday}`} className="p-3">
                                  {row.weekday === intervalFormDay ? (
                                    <Input value={intervalDraft.name} onChange={e => setIntervalDraft(d => ({ ...d, name: e.target.value }))} className="brand-radius" />
                                  ) : null}
                                </td>
                              ))}
                            </tr>
                            <tr className="border-t">
                              <td className="p-3 font-medium">Início do intervalo</td>
                              {availability.map((row) => (
                                <td key={`stint-${row.weekday}`} className="p-3">
                                  {row.weekday === intervalFormDay ? (
                                    <Input type="time" value={intervalDraft.start_time} onChange={e => setIntervalDraft(d => ({ ...d, start_time: e.target.value }))} className="brand-radius" />
                                  ) : null}
                                </td>
                              ))}
                            </tr>
                            <tr className="border-t">
                              <td className="p-3 font-medium">Fim do intervalo</td>
                              {availability.map((row) => (
                                <td key={`enint-${row.weekday}`} className="p-3">
                                  {row.weekday === intervalFormDay ? (
                                    <Input type="time" value={intervalDraft.end_time} onChange={e => setIntervalDraft(d => ({ ...d, end_time: e.target.value }))} className="brand-radius" />
                                  ) : null}
                                </td>
                              ))}
                            </tr>
                            <tr className="border-t">
                              <td className="p-3 font-medium">Ações</td>
                              {availability.map((row) => (
                                <td key={`actions-${row.weekday}`} className="p-3">
                                  {row.weekday === intervalFormDay ? (
                                    <div className="flex gap-2">
                                      <Button size="sm" className="brand-radius" variant="brandPrimaryToSecondary" onClick={addInterval}>Adicionar</Button>
                                      <Button size="sm" className="brand-radius" variant="outline" onClick={cancelIntervalForm}>Cancelar</Button>
                                    </div>
                                  ) : null}
                                </td>
                              ))}
                            </tr>
                          </>
                        )}
                        <tr className="border-t">
                          <td className="p-3 font-medium">Fim do dia</td>
                          {availability.map((row, idx) => (
                            <td key={`end-${row.weekday}`} className="p-3">
                              <Input type="time" value={row.end_time} onChange={e => setAvailability(prev => prev.map((r, i) => i===idx ? { ...r, end_time: e.target.value } : r))} className="brand-radius" />
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
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
                      <h3 className="font-semibold">{editingEventId ? 'Editar tipo de evento' : 'Novo tipo de evento'}</h3>
                      <div>
                        <Label>Nome</Label>
                        <Input value={eventDraft.name} onChange={e => setEventDraft({ ...eventDraft, name: e.target.value })} className="brand-radius" />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Input value={eventDraft.description} onChange={e => setEventDraft({ ...eventDraft, description: e.target.value })} className="brand-radius" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Nível</Label>
                          <select
                            disabled={!isAdminLike}
                            value={eventDraft.scope || 'user'}
                            onChange={e => { const val = e.target.value as any; schedLog('[SCHED] scope change', val); setEventDraft({ ...eventDraft, scope: val }); if (val === 'team') { fetchTeams(); } }}
                            className="w-full border border-input bg-background text-foreground rounded-lg px-3 py-2 brand-radius field-secondary-focus no-ring-focus"
                          >
                            {isAdminLike ? (
                              <>
                                <option value="company">Empresa</option>
                                <option value="team">Time</option>
                                <option value="user">Usuário</option>
                              </>
                            ) : (
                              <option value="user">Usuário</option>
                            )}
                          </select>
                        </div>
                        {isAdminLike && (eventDraft.scope === 'team') && (
                          <div>
                            <Label>Time</Label>
                            <select
                              value={eventDraft.team_id || ''}
                              onChange={e => { schedLog('[SCHED] team select', e.target.value); setEventDraft({ ...eventDraft, team_id: e.target.value || null }); }}
                              className="w-full border border-input bg-background text-foreground rounded-lg px-3 py-2 brand-radius field-secondary-focus no-ring-focus"
                            >
                              <option value="">{teams.length ? 'Selecione um time' : 'Nenhum time ativo'}</option>
                              {teams.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
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
                      <div className="flex justify-end gap-2">
                        {editingEventId && (
                          <Button
                            type="button"
                            variant="outline"
                            className="brand-radius"
                            onClick={() => {
                              setEditingEventId(null);
                              setEventDraft({ name: '', description: '', duration_minutes: 30, min_gap_minutes: 15, status: 'active', scope: isAdminLike ? 'company' : 'user', team_id: null });
                            }}
                          >
                            Cancelar
                          </Button>
                        )}
                        <Button onClick={saveEventType} disabled={savingEventType} className="brand-radius" variant="brandPrimaryToSecondary">
                          {savingEventType ? 'Salvando...' : (editingEventId ? 'Salvar Alterações' : 'Salvar Tipo')}
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
                            <div className="text-xs text-muted-foreground">
                              {evt.duration_minutes} min • intervalo {evt.min_gap_minutes} min • escopo {(evt.scope || 'user')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost" className="p-0 h-8 w-8" title="Editar" onClick={() => { setEditingEventId(evt.id || null); setEventDraft({
                              id: evt.id,
                              name: evt.name,
                              description: evt.description,
                              duration_minutes: evt.duration_minutes,
                              min_gap_minutes: evt.min_gap_minutes,
                              status: evt.status,
                              scope: evt.scope || 'user',
                              team_id: evt.team_id || null,
                              owner_user_id: evt.owner_user_id,
                            }); }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {canDeleteEventType(evt) && (
                              <Button size="icon" variant="ghost" className="p-0 h-8 w-8 text-destructive hover:text-destructive" title="Excluir" onClick={() => deleteEventType(evt)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Switch
                              checked={evt.status === 'active'}
                              onCheckedChange={(checked) => toggleEventTypeStatus(evt, checked)}
                              className="data-[state=checked]:bg-green-600"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="forms">
                  <Card className="brand-radius">
                    <CardHeader>
                      <CardTitle>Formulários</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Meus formulários</Label>
                            <Button type="button" variant="outline" className="brand-radius" onClick={resetFormDraft}>Novo</Button>
                          </div>
                          <div className="border rounded-md max-h-[320px] overflow-auto divide-y">
                            {forms.length === 0 && (
                              <div className="text-sm text-muted-foreground p-3">Nenhum formulário criado.</div>
                            )}
                            {forms.map((f) => (
                              <div key={f.id} className={`p-3 flex items-center justify-between ${editingFormId === f.id ? 'bg-muted/50' : ''}`}>
                                <button className="text-left text-sm" onClick={() => editForm(f.id!)}>{f.name}</button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => deleteForm(f.id!)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-6">
                          <div className="grid gap-3">
                            <div>
                              <Label>Nome</Label>
                              <Input className="brand-radius" value={formDraft.name} onChange={e => setFormDraft({ ...formDraft, name: e.target.value })} />
                            </div>
                            <div>
                              <Label>Descrição</Label>
                              <Textarea className="brand-radius" value={formDraft.description} onChange={e => setFormDraft({ ...formDraft, description: e.target.value })} />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Campos</Label>
                              <Button type="button" variant="outline" className="brand-radius" onClick={addEmptyField}>Adicionar campo</Button>
                            </div>
                            <div className="space-y-3">
                              {formDraft.fields.length === 0 && (
                                <div className="text-sm text-muted-foreground">Nenhum campo adicionado.</div>
                              )}
                              {formDraft.fields.map((field, idx) => (
                                <div key={`field-${idx}`} className="border rounded-md p-3 space-y-3">
                                  <div className="grid md:grid-cols-6 gap-3 items-end">
                                    <div className="md:col-span-2">
                                      <Label>Rótulo</Label>
                                      <Input className="brand-radius" value={field.label} onChange={e => updateField(idx, { label: e.target.value })} />
                                    </div>
                                    <div>
                                      <Label>Tipo</Label>
                                                                    <Select value={field.type} onValueChange={(v) => {
                                const newType = v as FormFieldType;
                                updateField(idx, { type: newType, allow_comma: newType === 'number' || newType === 'currency' });
                              }}>
                                <SelectTrigger className="brand-radius"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="short_text">Texto curto</SelectItem>
                                  <SelectItem value="long_text">Texto longo</SelectItem>
                                  <SelectItem value="dropdown">Dropdown</SelectItem>
                                  <SelectItem value="multiselect">Multi seleção</SelectItem>
                                  <SelectItem value="radio">Radio</SelectItem>
                                  <SelectItem value="number">Número</SelectItem>
                                  <SelectItem value="currency">Monetário</SelectItem>
                                  <SelectItem value="users">Escolha de usuários</SelectItem>
                                  <SelectItem value="leads">Escolha de leads</SelectItem>
                                  <SelectItem value="datetime">Data e hora</SelectItem>
                                </SelectContent>
                              </Select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Checkbox id={`req-${idx}`} checked={!!field.required} onCheckedChange={(v) => updateField(idx, { required: !!v })} />
                                      <Label htmlFor={`req-${idx}`}>Obrigatório</Label>
                                    </div>
                                    <div className="ml-auto">
                                      <Button type="button" variant="ghost" onClick={() => removeField(idx)}>
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  {(field.type === 'dropdown' || field.type === 'multiselect' || field.type === 'radio') && (
                                    <div>
                                      <Label>Opções (separe por vírgula)</Label>
                                      <Input className="brand-radius" value={(field.options || [])?.join(', ')} onChange={e => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                                    </div>
                                  )}
                                  {(field.type === 'number' || field.type === 'currency') && (
                                    <div className="grid md:grid-cols-3 gap-3">
                                                                        {field.type === 'currency' && (
                                    <div>
                                      <Label>Moeda</Label>
                                      <Select value={field.currency_code || 'BRL'} onValueChange={(v) => updateField(idx, { currency_code: v })}>
                                        <SelectTrigger className="brand-radius"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="BRL">Real brasileiro (BRL)</SelectItem>
                                          <SelectItem value="USD">Dólar (USD)</SelectItem>
                                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                                          <SelectItem value="GBP">Libra (GBP)</SelectItem>
                                          <SelectItem value="ARS">Peso argentino (ARS)</SelectItem>
                                          <SelectItem value="CLP">Peso chileno (CLP)</SelectItem>
                                          <SelectItem value="MXN">Peso mexicano (MXN)</SelectItem>
                                          <SelectItem value="JPY">Iene (JPY)</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                    </div>
                                  )}
                                  {(field.type === 'users' || field.type === 'leads') && (
                                    <div className="text-xs text-muted-foreground">
                                      As opções serão carregadas dinamicamente conforme as permissões do usuário no momento do agendamento.
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Associar a Tipos de Evento</Label>
                            <div className="grid md:grid-cols-2 gap-2 border rounded-md p-3 max-h-[240px] overflow-auto">
                              {eventTypes.length === 0 && (
                                <div className="text-sm text-muted-foreground">Nenhum tipo de evento disponível.</div>
                              )}
                              {eventTypes.map(et => (
                                <label key={et.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={formDraft.linkedEventTypeIds.includes(et.id!)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setFormDraft(prev => ({
                                        ...prev,
                                        linkedEventTypeIds: checked
                                          ? Array.from(new Set([...(prev.linkedEventTypeIds || []), et.id!]))
                                          : (prev.linkedEventTypeIds || []).filter(id => id !== et.id)
                                      }));
                                    }}
                                  />
                                  <span className="text-sm">{et.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            {editingFormId && (
                              <Button type="button" variant="outline" className="brand-radius" onClick={resetFormDraft}>Cancelar</Button>
                            )}
                            <Button type="button" className="brand-radius" variant="brandPrimaryToSecondary" disabled={savingForm} onClick={saveForm}>
                              {savingForm ? 'Salvando...' : (editingFormId ? 'Salvar alterações' : 'Criar formulário')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                        <div className="flex items-center gap-2">
                          <Input placeholder="primary ou id@group.calendar.google.com" value={googleCalendarId} onChange={e => setGoogleCalendarId(e.target.value)} className="brand-radius" />
                          <Button type="button" variant="outline" className="brand-radius" onClick={openCalendarPicker}>Selecionar no Google</Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                                                  Observação: a listagem automática de calendários será habilitada quando a conexão Google estiver ativa na aba "Meu Perfil \u003e Integrações".
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={saveCalendarSettings} disabled={savingCalendar} variant="brandPrimaryToSecondary" className="brand-radius">
                          {savingCalendar ? 'Salvando...' : 'Salvar Configurações'}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Modo de Agenda</Label>
                        <Select value={calendarMode} onValueChange={(v) => setCalendarMode(v as any)}>
                          <SelectTrigger className="brand-radius w-[260px]">
                            <SelectValue placeholder="Escolha o modo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="platform">Disponibilidade da plataforma + Google como ocupado</SelectItem>
                            <SelectItem value="google_only">Somente Google (reflete agenda do Google)</SelectItem>
                          </SelectContent>
                        </Select>
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
                <FullScreenModal
                  isOpen={isCalendarPickerOpen}
                  onClose={() => setIsCalendarPickerOpen(false)}
                  title="Selecionar Calendário Google"
                  actions={
                    <>
                      <Button type="button" variant="outline" className="brand-radius" onClick={() => setIsCalendarPickerOpen(false)}>Cancelar</Button>
                      <Button type="button" className="brand-radius" variant="brandPrimaryToSecondary" onClick={() => { if (calendarSelection) setGoogleCalendarId(calendarSelection); setIsCalendarPickerOpen(false); }}>Confirmar</Button>
                    </>
                  }
                >
                  {calendarLoading ? (
                    <div className="text-sm text-muted-foreground">Carregando calendários...</div>
                  ) : calendarError ? (
                    <div className="space-y-2">
                      <div className="text-sm text-destructive">{calendarError}</div>
                      <div>
                        <Button type="button" variant="outline" className="brand-radius" onClick={reconnectGoogle}>Reconectar Google com permissões</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[60vh] overflow-auto">
                      {calendarItems.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Nenhum calendário disponível.</div>
                      ) : calendarItems.map((cal) => (
                        <label key={cal.id} className="flex items-center gap-2 p-2 border rounded-md cursor-pointer">
                          <input type="radio" name="gcal" value={cal.id} checked={calendarSelection === cal.id} onChange={() => setCalendarSelection(cal.id)} />
                          <span className="text-sm">{cal.summary}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{cal.id}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </FullScreenModal>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
  );
} 