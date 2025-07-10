
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Archive, Trash2, Filter, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { IndicatorModal } from '@/components/CRM/IndicatorModal';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useIndicators } from '@/hooks/useIndicators';
import { useFunnels } from '@/hooks/useFunnels';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CrmPerformance from './CrmPerformance';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useEffect } from 'react';
import { DatePicker } from '@/components/ui/datepicker'; // Supondo que existe um componente de datepicker
import { useTeams } from '@/hooks/useTeams';
import { useCrmUsers } from '@/hooks/useCrmUsers';

// Função utilitária para status visual do prazo
function getPrazoStatus(indicator, funnel) {
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
  const [searchTerm, setSearchTerm] = useState('');
  const { crmUser } = useCrmAuth();
  const companyId = crmUser?.company_id || '';
  const { data: indicators, isLoading: isIndicatorsLoading } = useIndicators(companyId, crmUser?.id);
  const { data: funnels, isLoading: isFunnelsLoading } = useFunnels(companyId, 'active');
  const { data: teams = [] } = useTeams();
  const { data: crmUsers = [] } = useCrmUsers();

  // Configuração de colunas por funil
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [columnsConfig, setColumnsConfig] = useState<Record<string, string[]>>({}); // funnel_id -> colunas
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>('');
  const allColumns = [
    { key: 'period', label: 'Período' },
    { key: 'month', label: 'Mês' },
    { key: 'year', label: 'Ano' },
    { key: 'last_stage', label: 'Última etapa' },
    { key: 'sales_value', label: 'Valor das Vendas' },
    { key: 'ticket_medio', label: 'Ticket Médio' },
    { key: 'taxa_conversao', label: 'Taxa de conversão' },
    { key: 'conversao_funil', label: 'Conversão do funil' },
    { key: 'media_recomendacoes', label: 'Média de Recomendações' },
  ];

  // Buscar configuração de colunas ao carregar
  useEffect(() => {
    const fetchConfigs = async () => {
      if (!funnels) return;
      const configs: Record<string, string[]> = {};
      for (const funnel of funnels) {
        const { data } = await supabase
          .from('funnel_column_settings')
          .select('columns')
          .eq('funnel_id', funnel.id)
          .single();
        configs[funnel.id] = data?.columns || allColumns.map(c => c.key);
      }
      setColumnsConfig(configs);
    };
    fetchConfigs();
  }, [funnels]);

  // Salvar configuração
  const saveColumnsConfig = async (funnelId: string, columns: string[]) => {
    const { data: existing } = await supabase
      .from('funnel_column_settings')
      .select('id')
      .eq('funnel_id', funnelId)
      .single();
    if (existing) {
      await supabase
        .from('funnel_column_settings')
        .update({ columns })
        .eq('funnel_id', funnelId);
    } else {
      await supabase
        .from('funnel_column_settings')
        .insert({ funnel_id: funnelId, columns });
    }
    setColumnsConfig(prev => ({ ...prev, [funnelId]: columns }));
    setShowColumnsModal(false);
  };

  const handleEdit = (indicator: any) => {
    setSelectedIndicator(indicator);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedIndicator(null);
  };

  const [showFiltersModal, setShowFiltersModal] = useState(false);
  // Estado para seleção de funil fixa
  const [filters, setFilters] = useState({
    periodStart: '',
    periodEnd: '',
    month: '',
    year: '',
    teamId: '',
    userId: ''
  });

  // Filtragem de indicadores por perfil
  let accessibleIndicators = indicators || [];
  if (crmUser?.role === 'leader') {
    // Líder vê os próprios e da equipe
    const teamMembers = crmUsers.filter(u => u.team_id === crmUser.team_id).map(u => u.id);
    accessibleIndicators = accessibleIndicators.filter(ind => teamMembers.includes(ind.user_id) || ind.user_id === crmUser.id);
  } else if (crmUser?.role === 'user') {
    // Usuário comum vê apenas os próprios
    accessibleIndicators = accessibleIndicators.filter(ind => ind.user_id === crmUser.id);
  }
  // Filtrar indicadores pelo funil selecionado
  const filteredIndicators = (accessibleIndicators || []).filter(indicator => {
    if (selectedFunnelId && indicator.funnel_id !== selectedFunnelId) return false;
    // Filtro por período
    if (filters.periodStart && filters.periodEnd) {
      if (!indicator.period_start || !indicator.period_end) return false;
      if (indicator.period_start < filters.periodStart || indicator.period_end > filters.periodEnd) return false;
    }
    // Filtro por mês
    if (filters.month && String(indicator.month_reference) !== String(filters.month)) return false;
    // Filtro por ano
    if (filters.year && String(indicator.year_reference) !== String(filters.year)) return false;
    // Filtro por equipe (apenas admin/master)
    if (filters.teamId && indicator.team_id !== filters.teamId) return false;
    // Filtro por usuário (apenas admin/master)
    if (filters.userId && indicator.user_id !== filters.userId) return false;
    return true;
  });

  // Adicionar estado para seleção em massa
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [selectedFunilId, setSelectedFunilId] = useState<string | null>(null);
  const [showBulkPeriodModal, setShowBulkPeriodModal] = useState(false);

  // Função para lidar com seleção em massa
  const handleSelectIndicator = (indicatorId: string, funilId: string) => {
    if (selectedIndicators.length === 0) {
      setSelectedIndicators([indicatorId]);
      setSelectedFunilId(funilId);
    } else if (selectedFunilId === funilId) {
      setSelectedIndicators(prev => prev.includes(indicatorId) ? prev.filter(id => id !== indicatorId) : [...prev, indicatorId]);
    } else {
      alert('Só é possível selecionar indicadores do mesmo funil para ações em massa.');
    }
  };
  // Função para limpar seleção
  const clearBulkSelection = () => {
    setSelectedIndicators([]);
    setSelectedFunilId(null);
  };
  // Função para arquivar em massa
  const handleBulkArchive = async () => {
    if (selectedIndicators.length === 0) return;
    if (!window.confirm('Tem certeza que deseja arquivar os indicadores selecionados?')) return;
    await Promise.all(selectedIndicators.map(id =>
      supabase.from('indicators').update({ archived_at: new Date().toISOString() }).eq('id', id)
    ));
    clearBulkSelection();
    window.location.reload();
  };
  // Função para abrir modal de período em massa
  const handleBulkPeriod = () => {
    setShowBulkPeriodModal(true);
  };

  // Função para arquivar indicador
  const handleArchive = async (indicator: any) => {
    if (!indicator) return;
    await supabase
      .from('indicators')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', indicator.id);
    window.location.reload(); // Atualiza a lista
  };
  // Função para excluir indicador
  const handleDelete = async (indicator: any) => {
    if (!indicator) return;
    if (!window.confirm('Tem certeza que deseja excluir este indicador? Essa ação não pode ser desfeita.')) return;
    await supabase
      .from('indicators')
      .delete()
      .eq('id', indicator.id);
    window.location.reload();
  };

  const selectedFunnel = funnels?.find(f => f.id === selectedFunnelId);
  const sortedStages = (selectedFunnel?.stages || []).sort((a: any, b: any) => a.stage_order - b.stage_order);
  const lastStage = sortedStages.length > 0 ? sortedStages[sortedStages.length - 1] : null;
  const recommendationStage = sortedStages.find((s: any) => s.name.toLowerCase().includes('reuni') || s.name.toLowerCase().includes('recomend'));

  const isUser = crmUser?.role === 'user';
  const allowedFunnels = isUser ? (funnels || []).filter(f => crmUser.funnels?.includes(f.id)) : (funnels || []);

  // Permissões de abas
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [defaultTab, setDefaultTab] = useState<string>('performance');
  useEffect(() => {
    if (!companyId || !crmUser?.role) return;
    supabase
      .from('role_page_permissions')
      .select('page, allowed')
      .eq('company_id', companyId)
      .eq('role', crmUser.role)
      .then(({ data }) => {
        const tabs = [];
        if (data?.find((p: any) => p.page === 'indicadores_performance' && p.allowed !== false)) tabs.push('performance');
        if (data?.find((p: any) => p.page === 'indicadores_registro' && p.allowed !== false)) tabs.push('registro');
        setAllowedTabs(tabs);
        setDefaultTab(tabs[0] || 'performance');
      });
  }, [companyId, crmUser?.role]);

  // Seleção automática do primeiro funil
  useEffect(() => {
    if (funnels && funnels.length > 0 && !selectedFunnelId) {
      setSelectedFunnelId(funnels[0].id);
    }
  }, [funnels]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-full mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-1">
            <div className="bg-white rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              
              {allowedTabs.length > 0 && (
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
                          {/* Layout dos filtros e seletor de funil (apenas Funil ao lado do botão Filtros) */}
                          <div className="flex items-center gap-4">
                            <div>
                              <select value={selectedFunnelId} onChange={e => setSelectedFunnelId(e.target.value)} className="border rounded-lg px-3 py-2 text-base">
                                <option value="">Todos os funis</option>
                                {allowedFunnels.map(f => (
                                  <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                              </select>
                            </div>
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
                      {/* Menu de ações em massa acima da tabela */}
                      {selectedIndicators.length > 0 && (
                        <div className="flex gap-2 mb-2">
                          <Button variant="destructive" onClick={handleBulkArchive}>Arquivar Selecionados</Button>
                          <Button variant="outline" onClick={handleBulkPeriod} disabled={(() => {
                            if (selectedIndicators.length === 0) return true;
                            const selectedObjs = filteredIndicators.filter(i => selectedIndicators.includes(i.id));
                            if (selectedObjs.length === 0) return true;
                            const firstPeriod = selectedObjs[0]?.period_start + '_' + selectedObjs[0]?.period_end;
                            return !selectedObjs.every(i => (i.period_start + '_' + i.period_end) === firstPeriod);
                          })()}>Alterar Período</Button>
                          <Button variant="ghost" onClick={clearBulkSelection}>Cancelar Seleção</Button>
                  </div>
                      )}
                      {/* Tabela única com colunas ajustadas */}
                      <div className="overflow-x-auto rounded-2xl shadow border bg-white">
                                  <table className="min-w-full border-separate border-spacing-y-1">
                          <thead className="sticky top-0 z-10 bg-muted">
                            <tr>
                              <th className="px-2 py-2 text-center font-semibold rounded-tl-2xl"></th> {/* Bolinha */}
                              {(crmUser?.role === 'admin' || crmUser?.role === 'master') && <th className="px-2 py-2 text-center font-semibold"></th>} {/* Checkbox */}
                              <th className="px-2 py-2 text-left font-semibold">Período</th>
                              {selectedFunnel && lastStage && <th className="px-2 py-2 text-left font-semibold">{lastStage.name}</th>}
                              <th className="px-2 py-2 text-left font-semibold">Valor das Vendas</th>
                              <th className="px-2 py-2 text-left font-semibold">Ticket Médio</th>
                              <th className="px-2 py-2 text-left font-semibold">Taxa de Conversão</th>
                              <th className="px-2 py-2 text-left font-semibold">Conversão do Funil</th>
                              {selectedFunnel && recommendationStage && <th className="px-2 py-2 text-left font-semibold">Média de Recomendações</th>}
                              <th className="px-2 py-2 text-center font-semibold rounded-tr-2xl">Ações</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                            {filteredIndicators.length === 0 ? (
                              <tr><td colSpan={10} className="text-center text-muted-foreground py-8">Nenhum indicador encontrado.</td></tr>
                                      ) : (
                              filteredIndicators.map((indicator, idx) => {
                                // Buscar funil e etapas
                                const funnel = funnels?.find(f => f.id === indicator.funnel_id);
                                const stages = (funnel?.stages || []).sort((a: any, b: any) => a.stage_order - b.stage_order);
                                const lastStage = stages[stages.length - 1];
                                const penultimateStage = stages[stages.length - 2];
                                const firstStage = stages[0];
                                          const lastValue = (indicator.values || []).find((v: any) => v.stage_id === lastStage?.id)?.value || 0;
                                          const penultimateValue = (indicator.values || []).find((v: any) => v.stage_id === penultimateStage?.id)?.value || 0;
                                          const firstValue = (indicator.values || []).find((v: any) => v.stage_id === firstStage?.id)?.value || 0;
                                          const salesValue = indicator.sales_value || 0;
                                          const ticketMedio = lastValue > 0 ? salesValue / lastValue : 0;
                                          const taxaConversao = penultimateValue > 0 ? (lastValue / penultimateValue) * 100 : 0;
                                          const conversaoFunil = firstValue > 0 ? (lastValue / firstValue) * 100 : 0;
                                // Etapa de recomendação
                                const recommendationStage = stages.find((s: any) => s.name.toLowerCase().includes('reuni') || s.name.toLowerCase().includes('recomend'));
                                const recommendationStageValue = (indicator.values || []).find((v: any) => v.stage_id === recommendationStage?.id)?.value || 0;
                                const recommendationsCount = indicator.recommendations_count || 0;
                                const mediaRecomendacoes = recommendationStageValue > 0 ? recommendationsCount / recommendationStageValue : 0;
                                const prazoStatus = getPrazoStatus(indicator, funnel);
                                          return (
                                  <tr key={indicator.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-muted/40'}>
                                    {/* Bolinha colorida */}
                                    <td className="px-2 py-2 text-center">
                                      {prazoStatus && (
                                        <span className={`inline-block w-3 h-3 rounded-full ${
                                          prazoStatus.color === 'green' ? 'bg-green-500' : prazoStatus.color === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'
                                        }`}></span>
                                      )}
                                    </td>
                                    {/* Checkbox */}
                                    {(crmUser?.role === 'admin' || crmUser?.role === 'master') && (
                                      <td className="px-2 py-2 text-center">
                                        <input type="checkbox" checked={selectedIndicators.includes(indicator.id)} onChange={e => handleSelectIndicator(indicator.id, indicator.funnel_id)} />
                                      </td>
                                    )}
                                    {/* Período */}
                                    <td className="px-2 py-2">{
                                                  indicator.period_start && indicator.period_end
                                                    ? `De ${new Date(indicator.period_start).toLocaleDateString('pt-BR')} até ${new Date(indicator.period_end).toLocaleDateString('pt-BR')}`
                                                    : '-'
                                                }</td>
                                    {/* Última etapa (apenas valor) */}
                                    {lastStage && <td className="px-2 py-2 text-center font-bold text-base">{lastValue}</td>}
                                    {/* Valor das Vendas */}
                                    <td className="px-2 py-2 text-center">{salesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    {/* Ticket Médio */}
                                    <td className="px-2 py-2 text-center">{ticketMedio > 0 ? ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</td>
                                    {/* Taxa de Conversão */}
                                    <td className="px-2 py-2 text-center">{penultimateValue > 0 ? taxaConversao.toFixed(1) + '%' : '-'}</td>
                                    {/* Conversão do Funil */}
                                    <td className="px-2 py-2 text-center">{firstValue > 0 ? conversaoFunil.toFixed(1) + '%' : '-'}</td>
                                    {/* Média de Recomendações */}
                                    {recommendationStage && <td className="px-2 py-2 text-center">{recommendationStageValue > 0 ? mediaRecomendacoes.toFixed(2) : '-'}</td>}
                                              {/* Ações */}
                                    <td className="px-2 py-2 text-center">
                                              <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(indicator)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {crmUser?.role === 'master' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleArchive(indicator)}
                                >
                                  <Archive className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(indicator)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
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
                  <IndicatorModal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    companyId={companyId}
                    indicator={selectedIndicator}
                  />
                  </Card>
                </TabsContent>
              </Tabs>
              )}
              {/* Fechamento correto do Tabs */}
            </div>
          </div>
        </div>
      </main>
      {/* Modal de Filtros de Indicadores */}
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
                  <div>
                    <label className="block text-sm font-medium mb-1">Equipe</label>
                    <select value={filters.teamId} onChange={e => setFilters(f => ({ ...f, teamId: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                      <option value="">Todas</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {(crmUser?.role === 'admin' || crmUser?.role === 'master') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Usuário</label>
                    <select value={filters.userId} onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                      <option value="">Todos</option>
                      {crmUsers.map(user => (
                        <option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setFilters({ periodStart: '', periodEnd: '', month: '', year: '', teamId: '', userId: '' })}>Limpar filtros</Button>
                <Button type="button" onClick={() => setShowFiltersModal(false)}>Aplicar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {/* Modal de Alterar Período em massa */}
      {showBulkPeriodModal && (
        <Dialog open={showBulkPeriodModal} onOpenChange={setShowBulkPeriodModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Período (Ação em Massa)</DialogTitle>
            </DialogHeader>
            <div className="mb-4">Você está alterando o período de {selectedIndicators.length} indicadores.</div>
            {/* Aqui pode ser usado o mesmo conteúdo do modal de período já existente, adaptando para múltiplos IDs */}
            {/* ... */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowBulkPeriodModal(false)}>Cancelar</Button>
              {/* Botão de salvar alteração em massa (implementar lógica conforme modal individual) */}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CrmIndicadores;
