import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GestaoLayout } from '@/components/Layout/GestaoLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, RotateCcw, RefreshCw, Copy, Check, ChevronLeft, ChevronRight, Pencil, X, Search, Filter, User, Calendar } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useCompany } from '@/contexts/CompanyContext';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
// Import removed: using a local duplicated preview structure instead of PublicAppointmentForm

interface Appointment {
  id: string;
  lead_id?: string;
  user_id?: string;
  meeting_type: 'novo' | 'continuacao' | 'negociacao' | 'remarcacao';
  meeting_date: string;
  meeting_time: string;
  meeting_duration?: number;
  meeting_location?: string;
  meeting_notes?: string;
  status: 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'remarcado';
  created_at: string;
  updated_at: string;
  lead?: {
    id: string;
    nome: string;
    email: string;
    telefone: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function GestaoAgendamentos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();
  const { userRole, crmUser } = useCrmAuth();
  const queryClient = useQueryClient();

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados para modais
  const [openModal, setOpenModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isBulkResponsibleModalOpen, setIsBulkResponsibleModalOpen] = useState<boolean>(false);

  // Estados para seleção múltipla
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Estados para o formulário de agendamento (prévia)
  const [agType, setAgType] = useState<'novo' | 'continuacao' | 'negociacao' | 'remarcacao'>('novo');
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedMeeting, setSelectedMeeting] = useState<string>('');
  const [sameHost, setSameHost] = useState<'sim' | 'nao'>('sim');
  const [meetingWhen, setMeetingWhen] = useState<string>('');
  const [info, setInfo] = useState<string>('');
  
  // Estados para busca
  const [leadQuery, setLeadQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [meetingQuery, setMeetingQuery] = useState('');
  
  // Dados para selects
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);

  // Carregar estilo ativo de Agendamentos (mesma origem da prévia: lead_form_styles)
  const { data: activeStyleRow } = useQuery({
    queryKey: ['lead_form_styles_active', selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('lead_form_styles')
        .select('style_config, updated_at')
        .eq('company_id', selectedCompanyId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    }
  });

  // Estilos (espelham a prévia de SettingsForms para Agendamentos)
  const cfgRaw = (activeStyleRow?.style_config || {}) as any;
  // Realtime preview override
  const [previewCfg, setPreviewCfg] = useState<any | null>(null);
  useEffect(() => {
    if (!selectedCompanyId) return;
    const ch = (supabase as any).channel(`form_style_preview_${selectedCompanyId}`)
      .on('broadcast', { event: 'agendamentos_style_preview' }, (payload: any) => {
        const newStyle = payload?.payload?.style;
        if (newStyle) setPreviewCfg(newStyle);
      })
      .subscribe();
    return () => { try { ch.unsubscribe(); } catch {} };
  }, [selectedCompanyId]);

  const srcCfg = previewCfg || cfgRaw;
  // Defaults idênticos aos usados na prévia quando vazio
  const cfg = {
    spacingFieldsPx: srcCfg.spacingFieldsPx ?? 16,
    previewFont: srcCfg.previewFont,
    fontSizeLabelPx: srcCfg.fontSizeLabelPx ?? 14,
    fontSizeInputPx: srcCfg.fontSizeInputPx ?? 16,
    fontSizeButtonPx: srcCfg.fontSizeButtonPx ?? 16,
    fieldBgColor: srcCfg.fieldBgColor ?? '#0F0F0F',
    fieldTextColor: srcCfg.fieldTextColor ?? '#FFFFFF',
    selectBgColor: srcCfg.selectBgColor ?? '#2A2A2A',
    selectTextColor: srcCfg.selectTextColor ?? '#FFFFFF',
    borderRadiusPx: srcCfg.borderRadiusPx ?? 8,
    borderWidthNormalPx: srcCfg.borderWidthNormalPx ?? 1,
    borderWidthFocusPx: srcCfg.borderWidthFocusPx ?? 2,
    borderColorNormal: srcCfg.borderColorNormal ?? '#2F2F2F',
    borderColorActive: srcCfg.borderColorActive ?? '#6b7280',
    buttonSpacingPx: srcCfg.buttonSpacingPx ?? 16,
    btnBg1: srcCfg.btnBg1 ?? '#E50F5E',
    btnBg2: srcCfg.btnBg2 ?? '#7c032e',
    btnAngle: srcCfg.btnAngle ?? 90,
    btnBgActive1: srcCfg.btnBgActive1 ?? '#c80d52',
    btnBgActive2: srcCfg.btnBgActive2 ?? '#630226',
    btnAngleActive: srcCfg.btnAngleActive ?? 90,
    btnText: srcCfg.btnText ?? '#FFFFFF',
    btnTextActive: srcCfg.btnTextActive ?? '#FFFFFF',
    btnRadius: srcCfg.btnRadius ?? 12,
    btnBorderWidth: srcCfg.btnBorderWidth ?? 0,
    btnBorderWidthActive: srcCfg.btnBorderWidthActive ?? 0,
    btnBorderColor: srcCfg.btnBorderColor ?? '#FFFFFF00',
    btnBorderColorActive: srcCfg.btnBorderColorActive ?? '#FFFFFF00',
    spacingLabelPx: srcCfg.spacingLabelPx ?? 8,
  } as any;
  const fontStyle = cfg.previewFont ? { fontFamily: `${cfg.previewFont}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'` } : undefined;
  const labelStyle = { ...(fontStyle || {}), fontSize: `${cfg.fontSizeLabelPx}px`, marginBottom: `${cfg.spacingLabelPx}px` } as React.CSSProperties;
  const inputStyle = { ...(fontStyle || {}), fontSize: `${cfg.fontSizeInputPx}px` } as React.CSSProperties;
  const fieldStyle = {
    ...inputStyle,
    backgroundColor: cfg.fieldBgColor || '#0F0F0F',
    color: cfg.fieldTextColor || '#FFFFFF',
    borderColor: cfg.borderColorNormal || '#2F2F2F',
    borderWidth: cfg.borderWidthNormalPx ?? 1,
    borderStyle: 'solid' as const,
    borderRadius: cfg.borderRadiusPx ?? 8,
  } as React.CSSProperties;
  const selectBgColor = cfg.selectBgColor;
  const selectTextColor = cfg.selectTextColor;
  const borderColorActive = cfg.borderColorActive;
  const borderWidthFocusPx = cfg.borderWidthFocusPx;
  const fontSizeInputPx = cfg.fontSizeInputPx;
  const spacingFieldsPx = cfg.spacingFieldsPx;
  const buttonSpacingPx = cfg.buttonSpacingPx;
  const normalButtonBg = `linear-gradient(${cfg.btnAngle}deg, ${cfg.btnBg1}, ${cfg.btnBg2})`;
  const activeButtonBg = `linear-gradient(${cfg.btnAngleActive}deg, ${cfg.btnBgActive1}, ${cfg.btnBgActive2})`;
  const buttonStyle = {
    ...(fontStyle || {}),
    fontSize: `${cfg.fontSizeButtonPx ?? 16}px`,
    marginTop: `${buttonSpacingPx}px`,
    backgroundImage: normalButtonBg,
    color: cfg.btnText || '#FFFFFF',
    borderRadius: cfg.btnRadius ?? 8,
    borderWidth: cfg.btnBorderWidth ?? 1,
    borderColor: cfg.btnBorderColor || '#FFFFFF20',
    borderStyle: 'solid',
  } as React.CSSProperties;
  // Variáveis adicionais usadas no bloco duplicado
  const borderRadiusPx = cfg.borderRadiusPx;
  const borderWidthNormalPx = cfg.borderWidthNormalPx;
  const fieldBgColor = cfg.fieldBgColor;
  const fieldTextColor = cfg.fieldTextColor;
  const borderColorNormal = cfg.borderColorNormal;
  const btnText = cfg.btnText;
  const btnTextActive = cfg.btnTextActive;
  const btnBorderWidth = cfg.btnBorderWidth;
  const btnBorderWidthActive = cfg.btnBorderWidthActive;
  const btnBorderColor = cfg.btnBorderColor;
  const btnBorderColorActive = cfg.btnBorderColorActive;
  const selectorVars = {
    ['--baseBg' as any]: selectBgColor,
    ['--baseFg' as any]: selectTextColor,
    ['--selBg' as any]: selectBgColor,
    ['--selFg' as any]: selectTextColor,
    ['--active-bc' as any]: borderColorActive,
  } as React.CSSProperties;
  const selectorBaseStyle = {
    borderRadius: borderRadiusPx,
    borderWidth: cfg.borderWidthNormalPx ?? 1,
    borderColor: borderColorNormal,
    borderStyle: 'solid' as const,
  } as React.CSSProperties;

  // Buscar agendamentos
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['appointments', selectedCompanyId, searchTerm, statusFilter, typeFilter, dateFilter, responsibleFilter, showArchived, currentPage, itemsPerPage],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      let query = (supabase as any)
        .from('appointments')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (typeFilter !== 'all') {
        query = query.eq('meeting_type', typeFilter);
      }

      if (responsibleFilter !== 'all') {
        // Filtrar por responsável no servidor
        // Campo esperado: user_id no registro de appointments
        query = query.eq('user_id', responsibleFilter);
      }

      // Busca textual simples será feita no cliente (por não haver join aqui)

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Appointment[];
    },
  });

  // Buscar leads para o formulário
  const { data: leadsData = [] } = useQuery({
    queryKey: ['leads', selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      let leadsQuery = supabase
        .from('leads')
        .select('id, nome, email, telefone')
        .eq('company_id', selectedCompanyId as any);

      if (!(userRole === 'admin' || userRole === 'master')) {
        if (crmUser?.id) leadsQuery = leadsQuery.eq('responsible_id', crmUser.id);
      }

      const { data: baseLeads, error } = await leadsQuery.order('nome');
      if (error) throw error;

      const leadIds = (baseLeads || []).map((l: any) => l.id);
      if (leadIds.length === 0) return [] as any[];

      // Buscar quais campos são 'name' e 'email' na company
      const { data: leadFields } = await (supabase as any)
        .from('lead_fields')
        .select('id, type')
        .eq('company_id', selectedCompanyId);

      const nameFieldId = (leadFields || []).find((f: any) => f.type === 'name')?.id;
      const emailFieldId = (leadFields || []).find((f: any) => f.type === 'email')?.id;

      if (!nameFieldId && !emailFieldId) {
        return (baseLeads || []).map((l: any) => ({
          ...l,
          computed_name: l.nome || '',
          computed_email: l.email || '',
        }));
      }

      const { data: fieldValues } = await (supabase as any)
        .from('lead_field_values')
        .select('lead_id, field_id, value_text')
        .in('lead_id', leadIds)
        .in('field_id', [nameFieldId, emailFieldId].filter(Boolean));

      const valuesMap = new Map<string, Record<string, string>>();
      (fieldValues || []).forEach((v: any) => {
        const byLead = valuesMap.get(v.lead_id) || {};
        byLead[v.field_id] = v.value_text || '';
        valuesMap.set(v.lead_id, byLead);
      });

      return (baseLeads || []).map((l: any) => {
        const v = valuesMap.get(l.id) || {};
        const computed_name = (nameFieldId && v[nameFieldId]) || l.nome || '';
        const computed_email = (emailFieldId && v[emailFieldId]) || l.email || '';
        return { ...l, computed_name, computed_email };
      });
    },
  });

  // Buscar usuários para o formulário
  const { data: usersData = [] } = useQuery({
    queryKey: ['users', selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_users')
        .select('id, first_name, last_name, email, company_id')
        .eq('company_id', selectedCompanyId)
        .order('first_name');
      
      if (error) throw error;
      // Normaliza para { id, name, email }
      return (data || []).map((u: any) => ({ id: u.id, name: `${u.first_name || ''} ${u.last_name || ''}`.trim(), email: u.email }));
    },
  });

  // Atualizar dados quando necessário
  useEffect(() => {
    setLeads(leadsData);
    setUsers(usersData);
  }, [leadsData, usersData]);

  // Filtros aplicados
  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfNextDay = new Date(startOfDay);
    startOfNextDay.setDate(startOfNextDay.getDate() + 1);
    const endOfTomorrow = new Date(endOfDay);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);

    // Semana atual (segunda a domingo)
    const dayOfWeek = (startOfDay.getDay() + 6) % 7; // 0 = segunda
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Próxima semana
    const startOfNextWeek = new Date(startOfWeek);
    startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 6);
    endOfNextWeek.setHours(23, 59, 59, 999);

    return appointments.filter(appointment => {
      if (!showArchived && (appointment as any).status === 'arquivado') return false;

      // Filtro por responsável no cliente caso necessário (fallback)
      if (responsibleFilter !== 'all' && appointment.user_id !== responsibleFilter) return false;

      // Filtro de busca simples por lead (necessita dados agregados posteriormente se houver)
      if (searchTerm) {
        const leadMatch = false; // Sem join neste momento
        const notesMatch = (appointment.meeting_notes || '').toLowerCase().includes(searchTerm.toLowerCase());
        if (!leadMatch && !notesMatch) return false;
      }

      if (dateFilter === 'all') return true;

      const apptDate = new Date(appointment.meeting_date);

      switch (dateFilter) {
        case 'today':
          return apptDate >= startOfDay && apptDate <= endOfDay;
        case 'tomorrow':
          return apptDate >= startOfNextDay && apptDate <= endOfTomorrow;
        case 'this_week':
          return apptDate >= startOfWeek && apptDate <= endOfWeek;
        case 'next_week':
          return apptDate >= startOfNextWeek && apptDate <= endOfNextWeek;
        default:
          return true;
      }
    });
  }, [appointments, showArchived, dateFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFilter('all');
    setResponsibleFilter('all');
    setShowArchived(false);
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedAppointments(paginatedAppointments.map(appointment => appointment.id));
    } else {
      setSelectedAppointments([]);
    }
  };

  const handleSelectAppointment = (appointmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedAppointments(prev => [...prev, appointmentId]);
    } else {
      setSelectedAppointments(prev => prev.filter(id => id !== appointmentId));
    }
  };

  const handleAddAppointment = () => {
    setOpenModal(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditModalOpen(true);
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteModalOpen(true);
  };

  const handleBulkDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleBulkResponsible = () => {
    setIsBulkResponsibleModalOpen(true);
  };

  const handleSubmitAppointment = async () => {
    try {
      if (!selectedCompanyId) throw new Error('Empresa não selecionada');
      if (!selectedLead) throw new Error('Selecione um lead');
      if (!selectedUser) throw new Error('Selecione o responsável');
      if (!meetingWhen) throw new Error('Informe data e hora');

      const dt = new Date(meetingWhen);
      const isoDate = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).toISOString();
      const timeStr = dt.toTimeString().slice(0, 5); // HH:MM

      const { error } = await (supabase as any)
        .from('appointments')
        .insert({
          company_id: selectedCompanyId,
          lead_id: selectedLead,
          user_id: selectedUser,
          meeting_type: agType,
          meeting_date: isoDate,
          meeting_time: timeStr,
          meeting_location: selectedMeeting,
          meeting_notes: info,
          status: 'agendado',
        });

      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso!",
      });
      setOpenModal(false);
      queryClient.invalidateQueries({ queryKey: ['appointments', selectedCompanyId] });
    } catch (error) {
      toast({
        title: "Erro",
        description: (error as any)?.message || "Erro ao criar agendamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      agendado: { label: 'Agendado', variant: 'default' as const },
      confirmado: { label: 'Confirmado', variant: 'secondary' as const },
      realizado: { label: 'Realizado', variant: 'outline' as const },
      cancelado: { label: 'Cancelado', variant: 'destructive' as const },
      remarcado: { label: 'Remarcado', variant: 'secondary' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'default' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const typeLabels = {
      novo: 'Novo',
      continuacao: 'Continuação',
      negociacao: 'Negociação',
      remarcacao: 'Remarcação',
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  return (
    <GestaoLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Agendamentos
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Gerencie seus agendamentos e compromissos
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['appointments', selectedCompanyId] })}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                <Button
                  size="sm"
                  className="brand-radius"
                  onClick={handleAddAppointment}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Nome, email ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="realizado">Realizado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                      <SelectItem value="remarcado">Remarcado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type-filter">Tipo</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="continuacao">Continuação</SelectItem>
                      <SelectItem value="negociacao">Negociação</SelectItem>
                      <SelectItem value="remarcacao">Remarcação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-filter">Data</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as datas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as datas</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="tomorrow">Amanhã</SelectItem>
                      <SelectItem value="this_week">Esta semana</SelectItem>
                      <SelectItem value="next_week">Próxima semana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsible-filter">Responsável</Label>
                  <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os responsáveis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os responsáveis</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-archived"
                      checked={showArchived}
                      onCheckedChange={(checked) => setShowArchived(checked as boolean)}
                    />
                    <Label htmlFor="show-archived">Mostrar arquivados</Label>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                  <Button size="sm" onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabela */}
            {isLoadingAppointments ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Ações em lote */}
                {selectedAppointments.length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      {selectedAppointments.length} agendamento(s) selecionado(s)
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkResponsible}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Alterar Responsável
                    </Button>
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Lead</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedAppointments.includes(appointment.id)}
                            onCheckedChange={(checked) => 
                              handleSelectAppointment(appointment.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{appointment.lead?.nome || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">
                              {appointment.lead?.email || appointment.lead?.telefone || ''}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeLabel(appointment.meeting_type)}</TableCell>
                        <TableCell>
                          <div>
                            <div>{new Date(appointment.meeting_date).toLocaleDateString('pt-BR')}</div>
                            <div className="text-sm text-muted-foreground">
                              {appointment.meeting_time}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{(usersData.find((u: any) => u.id === (appointment as any).user_id)?.name) || 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {appointment.meeting_notes || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAppointment(appointment)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAppointment(appointment)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredAppointments.length)} de {filteredAppointments.length} agendamentos
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Adição de Agendamento */}
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent className="max-w-[500px] p-[25px] max-h-[85vh] overflow-y-auto bg-[#1F1F1F] text-white border border-white/10">
            <div className="w-full bg-[#1F1F1F]/95 backdrop-blur-sm shadow-xl border border-white/10 rounded-md">
              <div className="p-6" style={fontStyle}>
                <h2 className="text-lg font-semibold mb-4">Adicionar agendamento</h2>
                <style>{`.focus-border:focus { border-color: var(--active-bc) !important; border-width: var(--focus-bw, 2px) !important; }`}</style>
                <div className="flex flex-col">
                  <div className="space-y-2" style={{ marginBottom: `${spacingFieldsPx}px` }}>
                    <Label style={labelStyle}>Selecione o tipo de Reunião</Label>
                    <Select value={agType} onValueChange={(v: any) => setAgType(v)}>
                      <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}>
                        <SelectValue placeholder="Selecione o tipo de Reunião" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-white/20 text-white" style={{ ...(fontStyle||{}), ['--selBg' as any]: selectBgColor, ['--selFg' as any]: selectTextColor, fontSize: `${fontSizeInputPx}px` }}>
                        <SelectItem value="novo" className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${fontSizeInputPx}px` }}>Novo</SelectItem>
                        <SelectItem value="continuacao" className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${fontSizeInputPx}px` }}>Continuação</SelectItem>
                        <SelectItem value="negociacao" className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${fontSizeInputPx}px` }}>Negociação</SelectItem>
                        <SelectItem value="remarcacao" className="data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${fontSizeInputPx}px` }}>Remarcação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {agType === 'novo' && (
                    <>
                      <div className="space-y-2" style={{ marginBottom: `${spacingFieldsPx}px` }}>
                        <div className="flex gap-2" style={{ ...(selectorVars as any) }}>
                          <Select value={selectedLead} onValueChange={setSelectedLead}>
                            <SelectTrigger className="flex-1 h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}>
                              <SelectValue placeholder="Selecione ou Adicione um Lead" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2A2A2A] border-white/20 text-white max-h-80" style={{ ...(fontStyle||{}), ['--selBg' as any]: selectBgColor, ['--selFg' as any]: selectTextColor }}>
                              <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: borderRadiusPx }}>
                                <Input
                                  placeholder="Pesquisar nome, e-mail ou telefone"
                                  value={leadQuery}
                                  onChange={(e) => setLeadQuery(e.target.value)}
                                  className="h-9 bg-[#1f1f1f] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                                  style={{ ...(fontStyle||{}), borderRadius: borderRadiusPx, ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}
                                />
                              </div>
                              {(leads || [])
                                .filter((l) => {
                                  const q = leadQuery.toLowerCase();
                                  return (
                                    !q ||
                                    (l.nome || '').toLowerCase().includes(q) ||
                                    (l.email || '').toLowerCase().includes(q) ||
                                    (l.telefone || '').toLowerCase().includes(q)
                                  );
                                })
                                .slice(0, 50)
                                .map((l) => (
                                  <SelectItem key={l.id} value={l.id} className="text-base data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${fontSizeInputPx}px` }}>
                                    {((l as any).computed_name || l.nome) && ((l as any).computed_email || l.email)
                                      ? ((l as any).computed_name || l.nome) + ' — ' + ((l as any).computed_email || l.email)
                                      : ((l as any).computed_name || l.nome || (l as any).computed_email || l.email || l.telefone || 'Lead sem dados')}
                                  </SelectItem>
                                ))
                                }
                            </SelectContent>
                          </Select>
                          <Button type="button" className="h-12 px-3 border hover:bg-[var(--selBg)] hover:text-[var(--selFg)]" variant="ghost" title="Adicionar lead" style={{ backgroundColor: fieldBgColor, color: fieldTextColor, borderColor: borderColorNormal, borderWidth: borderWidthNormalPx, borderRadius: borderRadiusPx }}>
                            +
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2" style={{ marginBottom: `${spacingFieldsPx}px` }}>
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                          <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}>
                            <SelectValue placeholder="Selecione o Anfitrião" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2A2A2A] border-white/20 text-white max-h-80" style={{ ...(fontStyle||{}), ['--selBg' as any]: selectBgColor, ['--selFg' as any]: selectTextColor, fontSize: `${fontSizeInputPx}px` }}>
                            <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: borderRadiusPx }}>
                              <Input
                                placeholder="Pesquisar usuário"
                                value={userQuery}
                                onChange={(e) => setUserQuery(e.target.value)}
                                className="h-9 bg-[#1f1f1f] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                                style={{ ...(fontStyle||{}), borderRadius: borderRadiusPx, ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}
                              />
                            </div>
                            {(users || [])
                              .filter((u) => {
                                const q = userQuery.toLowerCase();
                                const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                                return (
                                  !q ||
                                  name.toLowerCase().includes(q) ||
                                  (u.email || '').toLowerCase().includes(q) ||
                                  (u.phone || '').toLowerCase().includes(q)
                                );
                              })
                              .slice(0, 50)
                              .map((u) => (
                                <SelectItem key={u.id} value={u.id} className="text-base data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}), fontSize: `${fontSizeInputPx}px` }}>
                                  {(u.first_name || '') + ' ' + (u.last_name || '') || u.email || u.phone}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1" style={{ marginBottom: `${spacingFieldsPx}px` }}>
                        <Label style={labelStyle}>Informe a data e hora da reunião</Label>
                        <Input
                          type="datetime-local"
                          value={meetingWhen}
                          onChange={(e) => setMeetingWhen(e.target.value)}
                          className="h-12 text-base focus-ring-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border" style={{ ...fieldStyle, ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}
                        />
                      </div>

                      <Textarea
                        placeholder="Informações da reunião"
                        value={info}
                        onChange={(e) => setInfo(e.target.value)}
                        className="min-h-24 placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border" style={{ ...fieldStyle, ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}
                      />
                      <Button type="button" className="w-full h-12 font-semibold transition-all duration-300 shadow-lg" style={buttonStyle}
                        onMouseDown={(e)=>{ (e.currentTarget.style as any).backgroundImage = activeButtonBg; (e.currentTarget.style as any).color = btnTextActive; (e.currentTarget.style as any).borderWidth = `${btnBorderWidthActive}px`; (e.currentTarget.style as any).borderColor = btnBorderColorActive; }}
                        onMouseUp={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = btnText; (e.currentTarget.style as any).borderWidth = `${btnBorderWidth}px`; (e.currentTarget.style as any).borderColor = btnBorderColor; }}
                        onMouseLeave={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = btnText; (e.currentTarget.style as any).borderWidth = `${btnBorderWidth}px`; (e.currentTarget.style as any).borderColor = btnBorderColor; }}
                        onClick={handleSubmitAppointment}
                      >
                        Agendar Reunião
                      </Button>
                    </>
                  )}

                  {(agType === 'negociacao' || agType === 'continuacao' || agType === 'remarcacao') && (
                    <>
                      <div style={{ display: 'grid', rowGap: `${cfg.spacingLabelPx ?? 8}px`, marginBottom: `${spacingFieldsPx}px` }}>
                        <Select value={selectedMeeting} onValueChange={setSelectedMeeting}>
                          <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}>
                            <SelectValue placeholder="Selecione a Reunião" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2A2A2A] border-white/20 text-white max-h-80" style={{ ...(fontStyle||{}), fontSize: `${fontSizeInputPx}px` }}>
                            <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: borderRadiusPx }}>
                              <Input
                                placeholder="Pesquisar reunião (lead)"
                                value={meetingQuery}
                                onChange={(e) => setMeetingQuery(e.target.value)}
                                className="h-9 bg-[#1f1f1f] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                                style={{ ...(fontStyle||{}), borderRadius: borderRadiusPx, ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}
                              />
                            </div>
                            {(meetings || [])
                              .filter((m) => {
                                const q = meetingQuery.toLowerCase();
                                return (
                                  !q ||
                                  (m.title || '').toLowerCase().includes(q) ||
                                  (m.lead_name || '').toLowerCase().includes(q) ||
                                  (m.lead_email || '').toLowerCase().includes(q) ||
                                  (m.lead_phone || '').toLowerCase().includes(q)
                                );
                              })
                              .slice(0, 50)
                              .map((m) => (
                                <SelectItem key={m.id} value={m.id} className="text-base" style={{ ...(fontStyle||{}), fontSize: `${fontSizeInputPx}px` }}>
                                  {m.title || m.lead_name || m.lead_email || m.lead_phone}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2" style={{ ...(selectorVars as any), marginBottom: `${spacingFieldsPx}px` }}>
                        <Label style={labelStyle}>Será feita pelo mesmo anfitrião?</Label>
                        <ToggleGroup type="single" value={sameHost} onValueChange={(v) => setSameHost((v as any) || sameHost)} className="grid grid-cols-2 gap-3" style={{ ...(selectorVars as any), ...(fontStyle||{}) }}>
                          <ToggleGroupItem
                            value="sim"
                            aria-label="Sim"
                            className="font-normal text-base bg-[var(--baseBg)] text-[var(--baseFg)] hover:bg-[var(--selBg)] hover:text-[var(--selFg)] data-[state=on]:bg-[var(--selBg)] data-[state=on]:text-[var(--selFg)] data-[state=on]:border-[var(--active-bc)]"
                            style={{ ...selectorBaseStyle }}
                          >
                            Sim
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="nao"
                            aria-label="Não"
                            className="font-normal text-base bg-[var(--baseBg)] text-[var(--baseFg)] hover:bg-[var(--selBg)] hover:text-[var(--selFg)] data-[state=on]:bg-[var(--selBg)] data-[state=on]:text-[var(--selFg)] data-[state=on]:border-[var(--active-bc)]"
                            style={{ ...selectorBaseStyle }}
                          >
                            Não
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>

                      {sameHost === 'nao' && (
                        <div className="space-y-2" style={{ marginBottom: `${spacingFieldsPx}px` }}>
                          <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger className="h-12 text-base focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-border" style={{ ...fieldStyle, ...(fontStyle||{}), ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}>
                              <SelectValue placeholder="Selecione o Anfitrião" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2A2A2A] border-white/20 text-white max-h-80" style={{ ...(selectorVars as any), ...(fontStyle||{}) }}>
                              <div className="p-2" style={{ ...(fontStyle||{}), borderRadius: borderRadiusPx }}>
                                <Input
                                  placeholder="Pesquisar usuário"
                                  value={userQuery}
                                  onChange={(e) => setUserQuery(e.target.value)}
                                  className="h-9 bg-[#1f1f1f] border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border"
                                  style={{ ...(fontStyle||{}), borderRadius: borderRadiusPx, ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}
                                />
                              </div>
                              {(users || [])
                                .filter((u) => {
                                  const q = userQuery.toLowerCase();
                                  const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                                  return (
                                    !q ||
                                    name.toLowerCase().includes(q) ||
                                    (u.email || '').toLowerCase().includes(q) ||
                                    (u.phone || '').toLowerCase().includes(q)
                                  );
                                })
                                .slice(0, 50)
                                .map((u) => (
                                  <SelectItem key={u.id} value={u.id} className="text-base data-[highlighted]:bg-[var(--selBg)] data-[highlighted]:text-[var(--selFg)] data-[state=checked]:bg-[var(--selBg)] data-[state=checked]:text-[var(--selFg)]" style={{ ...(fontStyle||{}) }}>
                                    {(u.first_name || '') + ' ' + (u.last_name || '') || u.email || u.phone}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-1" style={{ marginBottom: `${spacingFieldsPx}px` }}>
                        <Label style={labelStyle}>Informe a data e hora da reunião</Label>
                        <Input
                          type="datetime-local"
                          value={meetingWhen}
                          onChange={(e) => setMeetingWhen(e.target.value)}
                          className="h-12 text-base focus-ring-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border" style={{ ...fieldStyle, ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}
                        />
                      </div>

                      <Textarea
                        placeholder="Informações da reunião"
                        value={info}
                        onChange={(e) => setInfo(e.target.value)}
                        className="min-h-24 placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus-border" style={{ ...fieldStyle, ['--active-bc' as any]: borderColorActive, ['--focus-bw' as any]: `${borderWidthFocusPx}px` }}
                      />
                      <Button type="button" className="w-full h-12 font-semibold transition-all duration-300 shadow-lg" style={buttonStyle}
                        onMouseDown={(e)=>{ (e.currentTarget.style as any).backgroundImage = activeButtonBg; (e.currentTarget.style as any).color = btnTextActive; (e.currentTarget.style as any).borderWidth = `${btnBorderWidthActive}px`; (e.currentTarget.style as any).borderColor = btnBorderColorActive; }}
                        onMouseUp={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = btnText; (e.currentTarget.style as any).borderWidth = `${btnBorderWidth}px`; (e.currentTarget.style as any).borderColor = btnBorderColor; }}
                        onMouseLeave={(e)=>{ (e.currentTarget.style as any).backgroundImage = normalButtonBg; (e.currentTarget.style as any).color = btnText; (e.currentTarget.style as any).borderWidth = `${btnBorderWidth}px`; (e.currentTarget.style as any).borderColor = btnBorderColor; }}
                        onClick={handleSubmitAppointment}
                      >
                        Agendar Reunião
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Modal de Confirmação de Exclusão */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                {selectedAppointments.length > 0
                  ? `Tem certeza que deseja excluir ${selectedAppointments.length} agendamento(s) selecionado(s)?`
                  : 'Tem certeza que deseja excluir este agendamento?'}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={async () => {
                try {
                  if (!selectedCompanyId) throw new Error('Empresa não selecionada');
                  if (selectedAppointments.length > 0) {
                    const { error } = await (supabase as any)
                      .from('appointments')
                      .delete()
                      .in('id', selectedAppointments);
                    if (error) throw error;
                  } else if (selectedAppointment) {
                    const { error } = await (supabase as any)
                      .from('appointments')
                      .delete()
                      .eq('id', selectedAppointment.id);
                    if (error) throw error;
                  }
                  toast({ title: 'Sucesso', description: 'Agendamento(s) excluído(s).' });
                } catch (e) {
                  toast({ title: 'Erro', description: (e as any)?.message || 'Falha ao excluir.', variant: 'destructive' });
                } finally {
                  setIsDeleteModalOpen(false);
                  setSelectedAppointments([]);
                  queryClient.invalidateQueries({ queryKey: ['appointments', selectedCompanyId] });
                }
              }}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Alteração de Responsável em Lote */}
        <Dialog open={isBulkResponsibleModalOpen} onOpenChange={setIsBulkResponsibleModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Responsável</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-2">
                <Label>Novo Responsável</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkResponsibleModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                // TODO: Implementar alteração de responsável
                setIsBulkResponsibleModalOpen(false);
                setSelectedAppointments([]);
                queryClient.invalidateQueries({ queryKey: ['appointments', selectedCompanyId] });
              }}>
                Alterar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </GestaoLayout>
  );
}


