
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Edit, Archive, Trash2, CheckCircle, AlertCircle, XCircle, User as UserIcon } from 'lucide-react';
import { IndicatorModal } from '@/components/CRM/IndicatorModal';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useIndicators } from '@/hooks/useIndicators';
import { useFunnels } from '@/hooks/useFunnels';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CrmPerformance from './CrmPerformance';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTeams } from '@/hooks/useTeams';
import { useCrmUsers } from '@/hooks/useCrmUsers';
import { useCompany } from '@/contexts/CompanyContext';

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

const CrmIndicadores = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<any>(null);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const { crmUser, loading: authLoading } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const companyId = selectedCompanyId || crmUser?.company_id || '';

  // Buscar indicadores conforme perfil - memoizado para evitar mudanças desnecessárias
  const userIdForIndicators = useMemo(() => {
    if (!crmUser) return undefined;
    if (crmUser.role === 'user') return crmUser.id;
    if (crmUser.role === 'leader') return undefined; // pega todos da equipe via filtragem abaixo
    if (crmUser.role === 'admin' || crmUser.role === 'master') return undefined; // pega todos da empresa
    return undefined;
  }, [crmUser]);

  // Hooks de dados com memoização
  const { data: indicators, isLoading: isIndicatorsLoading, error: indicatorsError } = useIndicators(companyId, userIdForIndicators);
  const { data: funnels, isLoading: isFunnelsLoading, error: funnelsError } = useFunnels(companyId, 'active');
  const { data: teams = [], isLoading: isTeamsLoading } = useTeams();
  const { data: crmUsers = [], isLoading: isUsersLoading } = useCrmUsers();

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

  // Permissões de abas
  const [allowedTabs] = useState<string[]>(['performance', 'registro']);
  const [defaultTab] = useState<string>('performance');

  // Seleção automática do primeiro funil - memoizado
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
    if (!indicator) return;
    await supabase
      .from('indicators')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', indicator.id);
    // Em vez de recarregar a página, apenas atualize o estado local
    setArchivedIndicatorIds(prev => [...prev, indicator.id]);
  }, []);

  const handleDelete = useCallback(async (indicator: any) => {
    if (!indicator) return;
    if (!window.confirm('Tem certeza que deseja excluir este indicador? Essa ação não pode ser desfeita.')) return;
    await supabase
      .from('indicators')
      .delete()
      .eq('id', indicator.id);
    window.location.reload();
  }, []);

  // Filtragem de indicadores por perfil - memoizado
  const accessibleIndicators = useMemo(() => {
    if (!indicators || !crmUser) return [];
    
    // Filter out null indicators and add null checks
    const validIndicators = indicators.filter(ind => ind && typeof ind === 'object');
    
    if (crmUser.role === 'master' || crmUser.role === 'admin') {
      return validIndicators; // vê todos da empresa
    } else if (crmUser.role === 'leader') {
      const teamMembers = crmUsers.filter(u => u.team_id === crmUser.team_id).map(u => u.id);
      return validIndicators.filter(ind => teamMembers.includes(ind.user_id) || ind.user_id === crmUser.id);
    } else if (crmUser.role === 'user') {
      return validIndicators.filter(ind => ind.user_id === crmUser.id);
    }
    return [];
  }, [indicators, crmUser, crmUsers]);

  // Substituir filteredIndicators para não exibir os arquivados localmente
  const filteredIndicators = useMemo(() => {
    let result = accessibleIndicators.filter(indicator => {
      // Add null check for indicator
      if (!indicator || archivedIndicatorIds.includes(indicator.id)) return false;
      if (selectedFunnelId && indicator.funnel_id !== selectedFunnelId) return false;
      if (filters.periodStart && filters.periodEnd) {
        if (!indicator.period_start || !indicator.period_end) return false;
        if (indicator.period_start < filters.periodStart || indicator.period_end > filters.periodEnd) return false;
      }
      if (filters.month && Number(indicator.month_reference) !== Number(filters.month)) return false;
      if (filters.year && String(indicator.year_reference) !== String(filters.year)) return false;
      if (filters.teamId && indicator.user_id !== filters.teamId) return false;
      if (filters.userId && indicator.user_id !== filters.userId) return false;
      return true;
    });
    if (showOnlyMine && crmUser) {
      result = result.filter(ind => ind && ind.user_id === crmUser.id);
    }
    return result;
  }, [accessibleIndicators, selectedFunnelId, filters, showOnlyMine, crmUser, archivedIndicatorIds]);

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
    return isUser ? funnels.filter(f => crmUser.funnels?.includes(f.id)) : funnels;
  }, [funnels, crmUser]);

  // Loading states
  if (authLoading || isIndicatorsLoading || isFunnelsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span>Carregando dados...</span>
      </div>
    );
  }

  const isGestor = crmUser?.role === 'admin' || crmUser?.role === 'master' || crmUser?.role === 'leader';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-full mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-1">
            <div className="bg-white rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              <Tabs defaultValue={defaultTab}>
                <TabsList className="mb-6">
                  {allowedTabs.includes('performance') && (
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                  )}
                  {allowedTabs.includes('registro') && (
                    <TabsTrigger value="registro">Registro de Indicadores</TabsTrigger>
                  )}
                </TabsList>
                
                {allowedTabs.includes('performance') && (
                  <TabsContent value="performance">
                    <CrmPerformance embedded />
                  </TabsContent>
                )}
                
                {allowedTabs.includes('registro') && (
                  <TabsContent value="registro">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle>Meus Indicadores</CardTitle>
                            <CardDescription>
                              Registre seus números por período e funil
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex items-center gap-4">
                              {isGestor && (
                                <Button
                                  variant={showOnlyMine ? 'default' : 'outline'}
                                  size="icon"
                                  className="mr-2"
                                  title="Meus Indicadores"
                                  onClick={() => setShowOnlyMine(v => !v)}
                                >
                                  <UserIcon className="w-5 h-5" />
                                </Button>
                              )}
                              {allowedFunnels.length > 1 && (
                                <div>
                                  <select 
                                    value={selectedFunnelId} 
                                    onChange={e => setSelectedFunnelId(e.target.value)} 
                                    className="border rounded-lg px-3 py-2 text-sm"
                                  >
                                    <option value="">Todos os funis</option>
                                    {allowedFunnels.map(f => (
                                      <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              <Button variant="outline" onClick={() => setShowFiltersModal(true)}>
                                <Filter className="w-4 h-4 mr-2" />
                                Filtros
                              </Button>
                              <Button onClick={() => setShowModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Registrar Indicador
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto rounded-2xl shadow border bg-white">
                          <table className="min-w-full border-separate border-spacing-y-1">
                            <thead className="sticky top-0 z-10 bg-muted">
                              <tr>
                                <th className="px-2 py-2 text-center font-semibold rounded-tl-2xl text-xs"></th>
                                <th className="px-2 py-2 text-left font-semibold">Período</th>
                                {funnelData.lastStage && <th className="px-2 py-2 text-left font-semibold">{funnelData.lastStage.name}</th>}
                                <th className="px-2 py-2 text-left font-semibold">Valor das Vendas</th>
                                <th className="px-2 py-2 text-left font-semibold">Ticket Médio</th>
                                <th className="px-2 py-2 text-left font-semibold">Taxa de Conversão</th>
                                <th className="px-2 py-2 text-left font-semibold">Conversão do Funil</th>
                                {funnelData.recommendationStage && <th className="px-2 py-2 text-left font-semibold">Média de Recomendações</th>}
                                {isGestor && <th className="px-2 py-2 text-left font-semibold">Usuário</th>}
                                <th className="px-2 py-2 text-center font-semibold rounded-tr-2xl">Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredIndicators.length === 0 ? (
                                <tr>
                                  <td colSpan={10} className="text-center text-muted-foreground py-8">
                                    Nenhum indicador encontrado.
                                  </td>
                                </tr>
                              ) : (
                                filteredIndicators.map((indicator, idx) => {
                                  // Add null checks for indicator
                                  if (!indicator) return null;
                                  
                                  // Buscar funil e etapas
                                  const funnel = funnels?.find(f => f.id === indicator.funnel_id);
                                  const stages = (funnel?.stages || []).sort((a: any, b: any) => a.stage_order - b.stage_order);
                                  const lastStageLocal = stages[stages.length - 1];
                                  const penultimateStage = stages[stages.length - 2];
                                  const firstStage = stages[0];
                                  const lastValue = (indicator.values || []).find((v: any) => v.stage_id === lastStageLocal?.id)?.value || 0;
                                  const penultimateValue = (indicator.values || []).find((v: any) => v.stage_id === penultimateStage?.id)?.value || 0;
                                  const firstValue = (indicator.values || []).find((v: any) => v.stage_id === firstStage?.id)?.value || 0;
                                  const salesValue = indicator.sales_value || 0;
                                  const ticketMedio = lastValue > 0 ? salesValue / lastValue : 0;
                                  const taxaConversao = penultimateValue > 0 ? (lastValue / penultimateValue) * 100 : 0;
                                  const conversaoFunil = firstValue > 0 ? (lastValue / firstValue) * 100 : 0;
                                  const recommendationStageLocal = stages.find((s: any) => s.name.toLowerCase().includes('reuni') || s.name.toLowerCase().includes('recomend'));
                                  const recommendationStageValue = (indicator.values || []).find((v: any) => v.stage_id === recommendationStageLocal?.id)?.value || 0;
                                  const recommendationsCount = indicator.recommendations_count || 0;
                                  const mediaRecomendacoes = recommendationStageValue > 0 ? recommendationsCount / recommendationStageValue : 0;
                                  const prazoStatus = getPrazoStatus(indicator, funnel);
                                  const user = crmUsers.find(u => u.id === indicator.user_id);

                                  return (
                                    <tr key={indicator.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-muted/40'}>
                                      <td className="px-2 py-2 text-center">
                                        {prazoStatus && (
                                          <span className={`inline-block w-3 h-3 rounded-full ${
                                            prazoStatus.color === 'green' ? 'bg-green-500' : prazoStatus.color === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'
                                          }`}></span>
                                        )}
                                      </td>
                                      <td className="px-2 py-2">
                                        {indicator.period_start && indicator.period_end
                                          ? `De ${new Date(indicator.period_start).toLocaleDateString('pt-BR')} até ${new Date(indicator.period_end).toLocaleDateString('pt-BR')}`
                                          : '-'
                                        }
                                      </td>
                                      {lastStageLocal && <td className="px-2 py-2 text-center font-bold text-base">{lastValue}</td>}
                                      <td className="px-2 py-2 text-center">{salesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                      <td className="px-2 py-2 text-center">{ticketMedio > 0 ? ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</td>
                                      <td className="px-2 py-2 text-center">{penultimateValue > 0 ? taxaConversao.toFixed(1) + '%' : '-'}</td>
                                      <td className="px-2 py-2 text-center">{firstValue > 0 ? conversaoFunil.toFixed(1) + '%' : '-'}</td>
                                      {recommendationStageLocal && <td className="px-2 py-2 text-center">{recommendationStageValue > 0 ? mediaRecomendacoes.toFixed(2) : '-'}</td>}
                                      {isGestor && (
                                        <td className="px-2 py-2 text-left">
                                          {user ? `${user.first_name} ${user.last_name}` : '-'}
                                        </td>
                                      )}
                                      <td className="px-2 py-2 text-center">
                                        <div className="flex gap-2 justify-center">
                                          <Button variant="outline" size="sm" onClick={() => handleEdit(indicator)}>
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                          {/* Permitir arquivamento para todos os usuários */}
                                          <Button variant="outline" size="sm" onClick={() => handleArchive(indicator)}>
                                            <Archive className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      <IndicatorModal
        isOpen={showModal}
        onClose={handleCloseModal}
        companyId={companyId}
        indicator={selectedIndicator}
      />

      {showFiltersModal && (
        <Dialog open={showFiltersModal} onOpenChange={setShowFiltersModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filtros de indicadores</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Data início</label>
                  <input type="date" value={filters.periodStart} onChange={e => setFilters(f => ({ ...f, periodStart: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data fim</label>
                  <input type="date" value={filters.periodEnd} onChange={e => setFilters(f => ({ ...f, periodEnd: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mês</label>
                  <select value={filters.month} onChange={e => setFilters(f => ({ ...f, month: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                    <option value="">Todos</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ano</label>
                  <select value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                    <option value="">Todos</option>
                    {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                {(crmUser?.role === 'admin' || crmUser?.role === 'master') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Equipe</label>
                      <select value={filters.teamId} onChange={e => setFilters(f => ({ ...f, teamId: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                        <option value="">Todas</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Usuário</label>
                      <select value={filters.userId} onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                        <option value="">Todos</option>
                        {crmUsers.map(user => (
                          <option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setFilters({ periodStart: '', periodEnd: '', month: '', year: '', teamId: '', userId: '' })}>
                  Limpar filtros
                </Button>
                <Button type="button" onClick={() => setShowFiltersModal(false)}>
                  Aplicar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CrmIndicadores;
