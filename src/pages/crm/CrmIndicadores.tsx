
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Filter, Edit, Archive, Trash2, CheckCircle, AlertCircle, XCircle, User as UserIcon } from 'lucide-react';
import { IndicatorModal } from '@/components/CRM/IndicatorModal';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useIndicators } from '@/hooks/useIndicators';
import { useFunnels } from '@/hooks/useFunnels';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CrmPerformance from './CrmPerformance';
import { supabase } from '@/integrations/supabase/client';
import { useTeams } from '@/hooks/useTeams';
import { useCrmUsersByCompany } from '@/hooks/useCrmUsers';
import { useCompany } from '@/contexts/CompanyContext';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { simInfoLog } from '@/lib/devlog';
import { useQuery } from '@tanstack/react-query';

// Função utilitária para status visual do prazo
function getPrazoStatus(indicator: any, funnel: any) {
  if (!indicator || !funnel || !indicator.created_at || !indicator.period_end) return null;
  const deadlineHours = funnel.indicator_deadline_hours ?? 0;
  const periodEnd = new Date(indicator.period_end);
  const prazo = new Date(periodEnd.getTime() + deadlineHours * 60 * 60 * 1000);
  const createdAt = new Date(indicator.created_at);
  const diffMs = createdAt.getTime() - prazo.getTime();
  if (createdAt <= prazo) {
    return { color: 'green', icon: <CheckCircle className="w-4 h-4 text-green-500" />, msg: 'Preenchido dentro do prazo' };
  } else if (diffMs <= 24 * 60 * 60 * 1000) {
    return { color: 'yellow', icon: <AlertCircle className="w-4 h-4 text-yellow-500" />, msg: 'Preenchido 24 horas após prazo' };
  } else {
    return { color: 'red', icon: <XCircle className="w-4 h-4 text-red-500" />, msg: 'Preenchido fora do prazo' };
  }
}

// Função para validar se um indicador é válido
function isValidIndicator(indicator: any): boolean {
  return !!(
    indicator &&
    typeof indicator === 'object' &&
    indicator.id &&
    indicator.user_id &&
    indicator.funnel_id &&
    indicator.company_id &&
    typeof indicator.month_reference === 'number' &&
    typeof indicator.year_reference === 'number' &&
    indicator.created_at &&
    indicator.updated_at
  );
}

const CrmIndicadores = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<any>(null);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const { crmUser, loading: authLoading, userRole, companyId: authCompanyId } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const effectiveCompanyId = selectedCompanyId || crmUser?.company_id || authCompanyId || '';

  // DEBUG: montagem e contexto
  useEffect(() => {
    simInfoLog('[INDICADORES] mounted');
  }, []);
  simInfoLog('[INDICADORES] contexto', { effectiveCompanyId, userRole, crmUser });
  
  // Carregar times e usuários ANTES de calcular o escopo (usa teams no useMemo abaixo)
  const { data: teams = [], isLoading: isTeamsLoading } = useTeams();
  const { data: crmUsers = [], isLoading: isUsersLoading } = useCrmUsersByCompany(effectiveCompanyId);

  // Buscar cores da empresa para o estilo das abas
  const { data: branding } = useQuery({
    queryKey: ['company_branding', effectiveCompanyId],
    enabled: !!effectiveCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .maybeSingle();
      return data;
    }
  });

  const primaryColor = branding?.primary_color || '#A86F57';

  // Buscar indicadores conforme perfil - memoizado para evitar mudanças desnecessárias
  const userIdForIndicators = useMemo(() => {
    if (!crmUser) return undefined;
    const leaderByOwnership = teams.some(t => t.leader_id === crmUser.id);
    // Se for usuário comum E não lidera nenhum time, busca apenas seus próprios
    if (crmUser.role === 'user' && !leaderByOwnership) {
      simInfoLog('[INDICADORES] scope=user-only', { userId: crmUser.id });
      return crmUser.id;
    }
    // Para admin, master, leader ou líder por posse: busca nível empresa
    simInfoLog('[INDICADORES] scope=company', { role: crmUser.role, leaderByOwnership });
    return undefined;
  }, [crmUser, teams]);

  // Buscar indicadores conforme escopo calculado (após termos teams)
  const { data: indicators, isLoading: isIndicatorsLoading, error: indicatorsError } = useIndicators(effectiveCompanyId, userIdForIndicators);
  const { data: funnels, isLoading: isFunnelsLoading, error: funnelsError } = useFunnels(effectiveCompanyId, 'active');

  // DEBUG: dados carregados
  useEffect(() => {
    // console.log('[INDICADORES] carregados', {
    //   indicatorsCount: indicators?.length,
    //   teamsCount: teams?.length,
    //   usersCount: crmUsers?.length,
    //   isIndicatorsLoading,
    //   indicatorsError
    // });
  }, [indicators, teams, crmUsers, isIndicatorsLoading, indicatorsError]);

  // Estados simplificados com memoização
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState({
    periodStart: '',
    periodEnd: '',
    month: '',
    year: '',
    teamId: '',
    userId: ''
  });

  // Permissões de abas (dinâmicas via role_page_permissions/app_pages)
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [defaultTab, setDefaultTab] = useState<string>('performance');
  const [tabsLoading, setTabsLoading] = useState<boolean>(true);
  const [tabsError, setTabsError] = useState<string | null>(null);

  useEffect(() => {
    const cid = effectiveCompanyId;
    if (!cid || !userRole) return;

    // Master tem acesso total às abas
    if (userRole === 'master') {
      setAllowedTabs(['performance', 'registro']);
      setDefaultTab('performance');
      setTabsLoading(false);
      setTabsError(null);
      return;
    }

    setTabsLoading(true);
    setTabsError(null);
    supabase
      .from('role_page_permissions')
      .select('page, allowed')
      .eq('company_id', cid)
      .eq('role', userRole)
      .then(({ data, error }) => {
        if (error) {
          setTabsError('Erro ao carregar permissões das abas.');
          setTabsLoading(false);
          return;
        }
        const tabs: string[] = [];
        // chaves conforme seeds em app_pages: indicadores_performance, indicadores_registro
        const pages = new Map((data || []).map((p: any) => [p.page, p.allowed]));
        const perfAllowed = pages.has('indicadores_performance') ? pages.get('indicadores_performance') !== false : true;
        const regAllowed  = pages.has('indicadores_registro') ? pages.get('indicadores_registro') !== false : true;
        if (perfAllowed) tabs.push('performance');
        if (regAllowed) tabs.push('registro');
        setAllowedTabs(tabs);
        setDefaultTab(tabs[0] || 'performance');
        setTabsLoading(false);
      });
  }, [effectiveCompanyId, selectedCompanyId, crmUser?.company_id, userRole]);

  // Seleção automática do primeiro funil
  useEffect(() => {
    if (funnels && funnels.length > 0 && !selectedFunnelId) {
      setSelectedFunnelId(funnels[0].id);
    }
  }, [funnels, selectedFunnelId]);

  // selectedFunnel memoizado
  const selectedFunnel = useMemo(() => {
    if (!funnels || funnels.length === 0) return null;
    if (selectedFunnelId) {
      return funnels.find(f => f.id === selectedFunnelId) || funnels[0];
    }
    return funnels[0];
  }, [funnels, selectedFunnelId]);

  // Atualizar funil selecionado apenas quando necessário
  useEffect(() => {
    if (selectedFunnel && selectedFunnel.id !== selectedFunnelId) {
      setSelectedFunnelId(selectedFunnel.id);
    }
  }, [selectedFunnel, selectedFunnelId]);

  // Callbacks memoizados
  const handleEdit = useCallback((indicator: any) => {
    setSelectedIndicator(indicator);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedIndicator(null);
  }, []);

  const [archivedIndicatorIds, setArchivedIndicatorIds] = useState<string[]>([]);

  const handleArchive = useCallback(async (indicator: any) => {
    if (!indicator || !indicator.id) return;
    await supabase
      .from('indicators')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', indicator.id);
    // Em vez de recarregar a página, apenas atualize o estado local
    setArchivedIndicatorIds(prev => [...prev, indicator.id]);
  }, []);

  const handleDelete = useCallback(async (indicator: any) => {
    if (!indicator || !indicator.id) return;
    if (!window.confirm('Tem certeza que deseja excluir este indicador? Essa ação não pode ser desfeita.')) return;
    await supabase
      .from('indicators')
      .delete()
      .eq('id', indicator.id);
    window.location.reload();
  }, []);

  // Filtragem de indicadores por perfil - memoizado com verificações rigorosas de null
  const accessibleIndicators = useMemo(() => {
    
    if (!indicators || !Array.isArray(indicators) || !crmUser) {
      simInfoLog('[INDICADORES] accessibleIndicators early-exit', { hasIndicators: !!indicators, hasCrmUser: !!crmUser });
      return [];
    }
    
    // Filtragem mais rigorosa para garantir que não há valores null
    const validIndicators = indicators.filter((ind): ind is NonNullable<typeof ind> => {
      if (!isValidIndicator(ind)) {
        return false;
      }
      return true;
    });

    const isLeaderByOwnership = teams.some(t => t.leader_id === crmUser.id);
    const isAdmin = crmUser.role === 'admin' || crmUser.role === 'master';
    const isLeader = crmUser.role === 'leader' || isLeaderByOwnership;
    const leaderTeams = teams.filter(t => t.leader_id === crmUser.id).map(t => t.id);
    const teamMembers = crmUsers.filter(u => leaderTeams.includes(u.team_id || '')).map(u => u.id);
    simInfoLog('[INDICADORES] perfil', { isAdmin, isLeader, isLeaderByOwnership, leaderTeams, teamMembersCount: teamMembers.length });
    
    if (isAdmin) {
      return validIndicators; // vê todos da empresa
    } else if (isLeader) {
      const result = validIndicators.filter(ind => teamMembers.includes(ind.user_id) || ind.user_id === crmUser.id);
      simInfoLog('[INDICADORES] resultado líder', { total: validIndicators.length, visiveis: result.length });
      return result;
    } else if (crmUser.role === 'user') {
      return validIndicators.filter(ind => ind.user_id === crmUser.id);
    }
    return [];
  }, [indicators, crmUser, crmUsers, teams]);

  // Filtros aplicados com verificações ainda mais rigorosas
  const filteredIndicators = useMemo(() => {
    
    let result = accessibleIndicators.filter(indicator => {
      // Verificação rigorosa de null no início - dupla verificação
      if (!isValidIndicator(indicator)) {
        return false;
      }
      
      // Verificar se está arquivado
      if (archivedIndicatorIds.includes(indicator.id)) {
        return false;
      }
      
      // Filtros de funil
      if (selectedFunnelId && indicator.funnel_id !== selectedFunnelId) {
        return false;
      }
      
      // Filtros de período - só aplicar se ambos period_start e period_end existirem
      if (filters.periodStart && filters.periodEnd && indicator.period_start && indicator.period_end) {
        if (indicator.period_start < filters.periodStart || indicator.period_end > filters.periodEnd) {
          return false;
        }
      }
      
      // Filtros por mês e ano
      if (filters.month && Number(indicator.month_reference) !== Number(filters.month)) {
        return false;
      }
      if (filters.year && String(indicator.year_reference) !== String(filters.year)) {
        return false;
      }
      
      // Filtro por equipe: manter apenas indicadores de usuários que pertencem ao teamId selecionado
      if (filters.teamId) {
        const teamMemberIds = crmUsers.filter(u => u.team_id === filters.teamId).map(u => u.id);
        if (!teamMemberIds.includes(indicator.user_id)) {
          return false;
        }
      }
      // Filtro por usuário
      if (filters.userId && indicator.user_id !== filters.userId) {
        return false;
      }
      
      return true;
    });
    
    // Aplicar filtro "Meus Indicadores" se ativo
    if (showOnlyMine && crmUser) {
      result = result.filter(ind => ind && ind.user_id === crmUser.id);
    }
    
    // Validação final - garantir que nenhum indicator null passe
    result = result.filter(isValidIndicator);
    
    simInfoLog('[INDICADORES] filtrados', { antes: accessibleIndicators.length, depois: result.length, filtros: filters, showOnlyMine });
    return result;
  }, [accessibleIndicators, selectedFunnelId, filters, showOnlyMine, crmUser, archivedIndicatorIds, crmUsers]);

  // Dados do funil selecionado - memoizado
  const funnelData = useMemo(() => {
    if (!selectedFunnel) return { sortedStages: [], lastStage: null, recommendationStage: null };
    
    const sortedStages = (selectedFunnel.stages || []).sort((a: any, b: any) => a.stage_order - b.stage_order);
    const lastStage = sortedStages.length > 0 ? sortedStages[sortedStages.length - 1] : null;
    const recommendationStage = sortedStages.find((s: any) => s.name.toLowerCase().includes('reuni') || s.name.toLowerCase().includes('recomend'));
    
    return { sortedStages, lastStage, recommendationStage };
  }, [selectedFunnel]);

  // Funis permitidos para o usuário - memoizado
  const allowedFunnels = useMemo(() => {
    if (!funnels || !crmUser) return [];
    const isUser = crmUser.role === 'user';
    const isLeader = crmUser.role === 'leader' || teams.some(t => t.leader_id === crmUser.id);
    if (isUser || isLeader) {
      const assigned = crmUser.funnels || [];
      if (Array.isArray(assigned) && assigned.length > 0) {
        return funnels.filter(f => assigned.includes(f.id));
      }
      return funnels;
    }
    return funnels;
  }, [funnels, crmUser, teams]);

  // Loading states (inclui carregamento de permissões de abas)
  if (authLoading || isIndicatorsLoading || isFunnelsLoading || tabsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span>Carregando dados...</span>
      </div>
    );
  }

  if (tabsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500">
        {tabsError}
      </div>
    );
  }

  if (allowedTabs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        Você não tem permissão para acessar as abas desta página.
      </div>
    );
  }

  const isGestor = crmUser?.role === 'admin' || crmUser?.role === 'master' || crmUser?.role === 'leader';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Indicadores</h1>
        <p className="text-muted-foreground">Acompanhe performance e registre seus indicadores</p>
      </div>

      <Card className="shadow-xl border-0 bg-card">
        <CardContent className="p-0">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="flex items-end border-b border-border/30 bg-transparent p-0 rounded-none justify-start w-fit">
              {allowedTabs.includes('performance') && (
                <>
                  <TabsTrigger 
                    value="performance" 
                    className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[var(--tab-active-color)]"
                    style={{ 
                      '--tab-active-color': primaryColor 
                    } as React.CSSProperties}
                  >
                    Performance
                  </TabsTrigger>
                  <div className="w-px h-6 bg-border/30 self-center"></div>
                </>
              )}
              {allowedTabs.includes('registro') && (
                <TabsTrigger 
                  value="registro" 
                  className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[var(--tab-active-color)]"
                  style={{ 
                    '--tab-active-color': primaryColor 
                  } as React.CSSProperties}
                >
                  Registro de Indicadores
                </TabsTrigger>
              )}
            </TabsList>
            
            {allowedTabs.includes('performance') && (
              <TabsContent value="performance" className="p-6">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">Performance</h2>
                      <p className="text-muted-foreground mt-1">Visualize métricas e indicadores de performance</p>
                    </div>
                  </div>
                  <CrmPerformance embedded />
                </div>
              </TabsContent>
            )}
            
            {allowedTabs.includes('registro') && (
              <TabsContent value="registro" className="p-6">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">Registro de Indicadores</h2>
                      <p className="text-muted-foreground mt-1">Registre seus números por período e funil</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-4">
                        {isGestor && (
                          <Button
                            variant={showOnlyMine ? 'brandOutlineSecondaryHover' : 'outline'}
                            size="icon"
                            className="mr-2 brand-radius hover:bg-[var(--brand-secondary)] active:bg-[var(--brand-secondary)] focus:bg-[var(--brand-secondary)]"
                            title="Meus Indicadores"
                            onClick={() => {
                              setShowOnlyMine((prev) => {
                                const next = !prev;
                                // Sincronizar filtro de usuário para evitar conflitos com outros filtros
                                if (next) {
                                  setFilters((f) => ({ ...f, userId: crmUser?.id || '' }));
                                } else {
                                  setFilters((f) => ({ ...f, userId: '' }));
                                }
                                return next;
                              });
                            }}
                          >
                            <UserIcon className="w-5 h-5" />
                          </Button>
                        )}
                        {allowedFunnels.length > 1 && (
                          <div>
                            <select 
                              value={selectedFunnelId} 
                              onChange={e => setSelectedFunnelId(e.target.value)} 
                              className="border border-input bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                              <option value="">Todos os funis</option>
                              {allowedFunnels.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <Button variant="outline" className="brand-radius hover:bg-[var(--brand-secondary)] active:bg-[var(--brand-secondary)] focus:bg-[var(--brand-secondary)]" onClick={() => setShowFiltersModal(true)}>
                          <Filter className="w-4 h-4 mr-2" />
                          Filtros
                        </Button>
                        <Button onClick={() => setShowModal(true)} variant="brandPrimaryToSecondary" className="brand-radius">
                          <Plus className="w-4 h-4 mr-2" />
                          Registrar Indicador
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center"> </TableHead>
                        <TableHead className="text-left">Período</TableHead>
                        {funnelData.lastStage && <TableHead className="text-left">{funnelData.lastStage.name}</TableHead>}
                        <TableHead className="text-left">Valor das Vendas</TableHead>
                        <TableHead className="text-left">Ticket Médio</TableHead>
                        <TableHead className="text-left">Taxa de Conversão</TableHead>
                        <TableHead className="text-left">Conversão do Funil</TableHead>
                        {funnelData.recommendationStage && <TableHead className="text-left">Média de Recomendações</TableHead>}
                        {isGestor && <TableHead className="text-left">Usuário</TableHead>}
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIndicators.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                            Nenhum indicador encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredIndicators.map((indicator, idx) => {
                          // Verificação de segurança final antes do render - verificação tripla
                          if (!isValidIndicator(indicator)) {
                            return null;
                          }
                          
                          // Buscar funil e etapas com verificações de segurança
                          const funnel = funnels?.find(f => f && f.id === indicator.funnel_id);
                          if (!funnel) {
                            return null;
                          }
                          
                          const stages = (funnel.stages || []).sort((a: any, b: any) => a.stage_order - b.stage_order);
                          const lastStageLocal = stages[stages.length - 1];
                          const penultimateStage = stages[stages.length - 2];
                          const firstStage = stages[0];
                          const lastValue = (indicator.values || []).find((v: any) => v && v.stage_id === lastStageLocal?.id)?.value || 0;
                          const penultimateValue = (indicator.values || []).find((v: any) => v && v.stage_id === penultimateStage?.id)?.value || 0;
                          const firstValue = (indicator.values || []).find((v: any) => v && v.stage_id === firstStage?.id)?.value || 0;
                          const salesValue = indicator.sales_value || 0;
                          const ticketMedio = lastValue > 0 ? salesValue / lastValue : 0;
                          const taxaConversao = penultimateValue > 0 ? (lastValue / penultimateValue) * 100 : 0;
                          const conversaoFunil = firstValue > 0 ? (lastValue / firstValue) * 100 : 0;
                          const recommendationStageLocal = stages.find((s: any) => s && s.name && (s.name.toLowerCase().includes('reuni') || s.name.toLowerCase().includes('recomend')));
                          const recommendationStageValue = (indicator.values || []).find((v: any) => v && v.stage_id === recommendationStageLocal?.id)?.value || 0;
                          const recommendationsCount = indicator.recommendations_count || 0;
                          const mediaRecomendacoes = recommendationStageValue > 0 ? recommendationsCount / recommendationStageValue : 0;
                          const prazoStatus = getPrazoStatus(indicator, funnel);
                          const user = crmUsers.find(u => u && u.id === indicator.user_id);

                          return (
                            <TableRow key={indicator.id}>
                              <TableCell className="text-center">
                                {prazoStatus && (
                                  <span className={`inline-block w-3 h-3 rounded-full ${
                                    prazoStatus.color === 'green' ? 'bg-green-500' : prazoStatus.color === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'
                                  }`}></span>
                                )}
                              </TableCell>
                              <TableCell>
                                {indicator.period_start && indicator.period_end
                                  ? `De ${formatDate(indicator.period_start)} até ${formatDate(indicator.period_end)}`
                                  : 'Período não definido'
                                }
                              </TableCell>
                              {lastStageLocal && <TableCell className="text-center font-bold text-base">{lastValue}</TableCell>}
                              <TableCell className="text-center">{salesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                              <TableCell className="text-center">{ticketMedio > 0 ? ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</TableCell>
                              <TableCell className="text-center">{penultimateValue > 0 ? taxaConversao.toFixed(1) + '%' : '-'}</TableCell>
                              <TableCell className="text-center">{firstValue > 0 ? conversaoFunil.toFixed(1) + '%' : '-'}</TableCell>
                              {recommendationStageLocal && <TableCell className="text-center">{recommendationStageValue > 0 ? mediaRecomendacoes.toFixed(2) : '-'}</TableCell>}
                              {isGestor && (
                                <TableCell className="text-left">
                                  {user ? `${user.first_name} ${user.last_name}` : '-'}
                                </TableCell>
                              )}
                              <TableCell className="text-center">
                                <div className="flex gap-2 justify-center">
                                  {(() => {
                                    const isAdmin = crmUser?.role === 'admin' || crmUser?.role === 'master';
                                    const canEditIndicator = isAdmin || indicator.user_id === crmUser?.id;
                                    return (
                                      <>
                                        {canEditIndicator && (
                                          <Button variant="outline" size="sm" className="brand-radius hover:bg-[var(--brand-secondary)] active:bg-[var(--brand-secondary)] focus:bg-[var(--brand-secondary)]" onClick={() => handleEdit(indicator)}>
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                        )}
                                        <Button variant="outline" size="sm" className="brand-radius hover:bg-[var(--brand-secondary)] active:bg-[var(--brand-secondary)] focus:bg-[var(--brand-secondary)]" onClick={() => handleArchive(indicator)}>
                                          <Archive className="w-4 h-4" />
                                        </Button>
                                      </>
                                    );
                                    })()}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          }).filter(Boolean)
                        )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      <IndicatorModal
        isOpen={showModal}
        onClose={handleCloseModal}
        companyId={effectiveCompanyId}
        indicator={selectedIndicator}
      />

      {showFiltersModal && (
        <FullScreenModal
          isOpen={showFiltersModal}
          onClose={() => setShowFiltersModal(false)}
          title="Selecionar Período"
          actions={
            <>
              <Button type="button" variant="outline" className="brand-radius" onClick={() => setFilters({ periodStart: '', periodEnd: '', month: '', year: '', teamId: '', userId: '' })}>
                Limpar filtros
              </Button>
              <Button type="button" className="brand-radius" variant="brandPrimaryToSecondary" onClick={() => setShowFiltersModal(false)}>
                Aplicar
              </Button>
            </>
          }
        >
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data início</label>
                <input type="date" value={filters.periodStart} onChange={e => setFilters(f => ({ ...f, periodStart: e.target.value }))} className="w-full border border-input bg-background text-foreground rounded-lg px-3 py-2 brand-radius field-secondary-focus no-ring-focus" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data fim</label>
                <input type="date" value={filters.periodEnd} onChange={e => setFilters(f => ({ ...f, periodEnd: e.target.value }))} className="w-full border border-input bg-background text-foreground rounded-lg px-3 py-2 brand-radius field-secondary-focus no-ring-focus" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mês</label>
                <select value={filters.month} onChange={e => setFilters(f => ({ ...f, month: e.target.value }))} className="w-full border border-input bg-background text-foreground rounded-lg px-3 py-2 brand-radius field-secondary-focus no-ring-focus">
                  <option value="">Todos</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ano</label>
                <select value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))} className="w-full border border-input bg-background text-foreground rounded-lg px-3 py-2 brand-radius field-secondary-focus no-ring-focus">
                  <option value="">Todos</option>
                  {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              {(crmUser?.role === 'admin' || crmUser?.role === 'master' || crmUser?.role === 'leader') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Equipe</label>
                    <select value={filters.teamId} onChange={e => setFilters(f => ({ ...f, teamId: e.target.value }))} className="w-full border border-input bg-background text-foreground rounded-lg px-3 py-2 brand-radius field-secondary-focus no-ring-focus">
                      <option value="">Todas</option>
                      {(crmUser?.role === 'leader' ? teams.filter(t => t.leader_id === crmUser?.id) : teams).map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Usuário</label>
                    <select value={filters.userId} onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))} className="w-full border border-input bg-background text-foreground rounded-lg px-3 py-2 brand-radius field-secondary-focus no-ring-focus">
                      <option value="">Todos</option>
                      {(crmUser?.role === 'leader'
                        ? crmUsers.filter(u => teams.filter(t => t.leader_id === crmUser?.id).map(t => t.id).includes(u.team_id || '') || u.id === crmUser?.id)
                        : crmUsers
                      ).map(user => (
                        <option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </form>
        </FullScreenModal>
      )}
    </div>
  );
};

// Função utilitária para formatar data YYYY-MM-DD para dd/MM/yyyy
function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.substring(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export default CrmIndicadores;
