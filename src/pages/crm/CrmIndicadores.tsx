
import { useState } from 'react';
import { CrmHeader } from '@/components/Layout/CrmHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Archive, Trash2, Filter } from 'lucide-react';
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
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);
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
  const [filters, setFilters] = useState({
    periodStart: '',
    periodEnd: '',
    month: '',
    year: '',
    funnelId: '',
    teamId: '',
    userId: ''
  });

  const filteredIndicators = (indicators || []).filter(indicator => {
    // Filtro por período
    if (filters.periodStart && filters.periodEnd) {
      if (!indicator.period_start || !indicator.period_end) return false;
      if (indicator.period_start < filters.periodStart || indicator.period_end > filters.periodEnd) return false;
    }
    // Filtro por mês
    if (filters.month && String(indicator.month_reference) !== String(filters.month)) return false;
    // Filtro por ano
    if (filters.year && String(indicator.year_reference) !== String(filters.year)) return false;
    // Filtro por funil
    if (filters.funnelId && indicator.funnel_id !== filters.funnelId) return false;
    // Filtro por equipe (apenas admin/master)
    if (filters.teamId && indicator.team_id !== filters.teamId) return false;
    // Filtro por usuário (apenas admin/master)
    if (filters.userId && indicator.user_id !== filters.userId) return false;
    return true;
  });

  // Agrupar indicadores por funil (usando os filtrados)
  const filteredIndicatorsByFunnel: Record<string, any[]> = {};
  (filteredIndicators || []).forEach((indicator) => {
    if (!filteredIndicatorsByFunnel[indicator.funnel_id]) {
      filteredIndicatorsByFunnel[indicator.funnel_id] = [];
    }
    filteredIndicatorsByFunnel[indicator.funnel_id].push(indicator);
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
      <CrmHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-full mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-1">
            <div className="bg-white rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              
              <Tabs defaultValue="performance">
                <TabsList className="mb-6">
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="registro">Registro de Indicadores</TabsTrigger>
                </TabsList>
                <TabsContent value="performance">
                  <CrmPerformance embedded />
                </TabsContent>
                <TabsContent value="registro">
                  {/* Conteúdo original da página de Indicadores */}
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
                </CardHeader>
                <CardContent>
                  {/* Remover campo de filtro de texto */}
                      <div className="space-y-8">
                        {isIndicatorsLoading || isFunnelsLoading ? (
                      <p className="text-muted-foreground text-center py-8">
                            Carregando indicadores...
                          </p>
                        ) : funnels && funnels.length > 0 ? (
                          funnels.map((funnel) => {
                            const funnelIndicators = filteredIndicatorsByFunnel[funnel.id] || [];
                            const sortedStages = (funnel.stages || []).sort((a: any, b: any) => a.stage_order - b.stage_order);
                            const colCount = 3 + sortedStages.length + 1;
                            return (
                              <div key={funnel.id} className="mb-8">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">{funnel.name}
                                  {(crmUser?.role === 'master' || crmUser?.role === 'admin') && (
                                    <Button size="sm" variant="outline" onClick={() => { setSelectedFunnelId(funnel.id); setShowColumnsModal(true); }}>
                                      Colunas
                                    </Button>
                                  )}
                                </h3>
                                {/* Modal de configuração de colunas */}
                                {showColumnsModal && selectedFunnelId === funnel.id && (
                                  <Dialog open={showColumnsModal} onOpenChange={setShowColumnsModal}>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Configurar colunas do funil</DialogTitle>
                                      </DialogHeader>
                                      <form onSubmit={e => { e.preventDefault(); saveColumnsConfig(funnel.id, columnsConfig[funnel.id]); }}>
                                        <div className="space-y-2 mb-4">
                                          {allColumns.map(col => (
                                            <div key={col.key} className="flex items-center gap-2">
                                              <Checkbox
                                                checked={columnsConfig[funnel.id]?.includes(col.key)}
                                                onCheckedChange={checked => {
                                                  setColumnsConfig(prev => ({
                                                    ...prev,
                                                    [funnel.id]: checked
                                                      ? [...(prev[funnel.id] || []), col.key]
                                                      : (prev[funnel.id] || []).filter(k => k !== col.key)
                                                  }));
                                                }}
                                              />
                                              <span>{col.label}</span>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                          <Button type="button" variant="outline" onClick={() => setShowColumnsModal(false)}>Cancelar</Button>
                                          <Button type="submit">Salvar</Button>
                                        </div>
                                      </form>
                                    </DialogContent>
                                  </Dialog>
                                )}
                                <div className="overflow-x-auto">
                                  <table className="min-w-full border-separate border-spacing-y-1">
                                    <thead>
                                      <tr className="bg-muted">
                                        {columnsConfig[funnel.id]?.includes('period') && <th className="px-2 py-1 text-left font-semibold">Período</th>}
                                        {columnsConfig[funnel.id]?.includes('month') && <th className="px-2 py-1 text-left font-semibold">Mês</th>}
                                        {columnsConfig[funnel.id]?.includes('year') && <th className="px-2 py-1 text-left font-semibold">Ano</th>}
                                        {columnsConfig[funnel.id]?.includes('last_stage') && (
                                          <th className="px-2 py-1 text-left font-semibold">
                                            {sortedStages.length > 0 ? sortedStages[sortedStages.length - 1].name : 'Última etapa'}
                                          </th>
                                        )}
                                        {columnsConfig[funnel.id]?.includes('sales_value') && <th className="px-2 py-1 text-left font-semibold">Valor das Vendas</th>}
                                        {columnsConfig[funnel.id]?.includes('ticket_medio') && <th className="px-2 py-1 text-left font-semibold">Ticket Médio</th>}
                                        {columnsConfig[funnel.id]?.includes('taxa_conversao') && <th className="px-2 py-1 text-left font-semibold">Taxa de conversão</th>}
                                        {columnsConfig[funnel.id]?.includes('conversao_funil') && <th className="px-2 py-1 text-left font-semibold">Conversão do funil</th>}
                                        {columnsConfig[funnel.id]?.includes('media_recomendacoes') && <th className="px-2 py-1 text-left font-semibold">Média de Recomendações</th>}
                                        <th className="px-2 py-1 text-center font-semibold">Ações</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {funnelIndicators.length === 0 ? (
                                        <tr>
                                          <td colSpan={10} className="text-muted-foreground text-center py-4">Nenhum indicador registrado para este funil.</td>
                                        </tr>
                                      ) : (
                                        funnelIndicators.map((indicator) => {
                                          // Cálculos auxiliares
                                          const lastStage = sortedStages[sortedStages.length - 1];
                                          const penultimateStage = sortedStages[sortedStages.length - 2];
                                          const firstStage = sortedStages[0];
                                          const lastValue = (indicator.values || []).find((v: any) => v.stage_id === lastStage?.id)?.value || 0;
                                          const penultimateValue = (indicator.values || []).find((v: any) => v.stage_id === penultimateStage?.id)?.value || 0;
                                          const firstValue = (indicator.values || []).find((v: any) => v.stage_id === firstStage?.id)?.value || 0;
                                          const salesValue = indicator.sales_value || 0;
                                          const recommendationsCount = indicator.recommendations_count || 0;
                                          // Ticket Médio
                                          const ticketMedio = lastValue > 0 ? salesValue / lastValue : 0;
                                          // Taxa de conversão
                                          const taxaConversao = penultimateValue > 0 ? (lastValue / penultimateValue) * 100 : 0;
                                          // Conversão do funil
                                          const conversaoFunil = firstValue > 0 ? (lastValue / firstValue) * 100 : 0;
                                          // Média de Recomendações (associada à última etapa)
                                          const mediaRecomendacoes = lastValue > 0 ? recommendationsCount / lastValue : 0;
                                          return (
                                            <tr key={indicator.id} className="bg-white border-b last:border-b-0">
                                              {columnsConfig[funnel.id]?.includes('period') && (
                                                <td className="px-2 py-1">{
                                                  indicator.period_start && indicator.period_end
                                                    ? `De ${new Date(indicator.period_start).toLocaleDateString('pt-BR')} até ${new Date(indicator.period_end).toLocaleDateString('pt-BR')}`
                                                    : '-'
                                                }</td>
                                              )}
                                              {columnsConfig[funnel.id]?.includes('month') && (
                                                <td className="px-2 py-1">{String(indicator.month_reference).padStart(2, '0')}</td>
                                              )}
                                              {columnsConfig[funnel.id]?.includes('year') && (
                                                <td className="px-2 py-1">{indicator.year_reference}</td>
                                              )}
                                              {columnsConfig[funnel.id]?.includes('last_stage') && (
                                                <td className="px-2 py-1">{lastStage?.name || '-'}</td>
                                              )}
                                              {columnsConfig[funnel.id]?.includes('sales_value') && (
                                                <td className="px-2 py-1">{salesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                              )}
                                              {columnsConfig[funnel.id]?.includes('ticket_medio') && (
                                                <td className="px-2 py-1">{ticketMedio > 0 ? ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</td>
                                              )}
                                              {columnsConfig[funnel.id]?.includes('taxa_conversao') && (
                                                <td className="px-2 py-1">{penultimateValue > 0 ? taxaConversao.toFixed(1) + '%' : '-'}</td>
                                              )}
                                              {columnsConfig[funnel.id]?.includes('conversao_funil') && (
                                                <td className="px-2 py-1">{firstValue > 0 ? conversaoFunil.toFixed(1) + '%' : '-'}</td>
                                              )}
                                              {columnsConfig[funnel.id]?.includes('media_recomendacoes') && (
                                                <td className="px-2 py-1">{lastValue > 0 ? mediaRecomendacoes.toFixed(2) : '-'}</td>
                                              )}
                                              {/* Ações */}
                                              <td className="px-2 py-1 text-center">
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
                        </div>
                            );
                          })
                        ) : (
                          <p className="text-muted-foreground text-center py-8">
                            Nenhum funil encontrado.
                          </p>
                    )}
                  </div>
                </CardContent>
              </Card>
                  <IndicatorModal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    companyId={companyId}
                    indicator={selectedIndicator}
                  />
                </TabsContent>
              </Tabs>
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
            <div className="space-y-4">
              {/* Filtro por período */}
              <div className="flex gap-2 items-end">
                <div>
                  <label>Data início</label>
                  <input type="date" value={filters.periodStart} onChange={e => setFilters(f => ({ ...f, periodStart: e.target.value }))} className="block border rounded px-2 py-1" />
                </div>
                <div>
                  <label>Data fim</label>
                  <input type="date" value={filters.periodEnd} onChange={e => setFilters(f => ({ ...f, periodEnd: e.target.value }))} className="block border rounded px-2 py-1" />
                </div>
              </div>
              {/* Filtro por mês */}
              <div>
                <label>Mês</label>
                <select value={filters.month} onChange={e => setFilters(f => ({ ...f, month: e.target.value }))} className="block border rounded px-2 py-1">
                  <option value="">Todos</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              {/* Filtro por ano */}
              <div>
                <label>Ano</label>
                <select value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))} className="block border rounded px-2 py-1">
                  <option value="">Todos</option>
                  {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              {/* Filtro por funil (se houver 2+) */}
              {funnels && funnels.length > 1 && (
                <div>
                  <label>Funil</label>
                  <select value={filters.funnelId} onChange={e => setFilters(f => ({ ...f, funnelId: e.target.value }))} className="block border rounded px-2 py-1">
                    <option value="">Todos</option>
                    {funnels.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Filtro por equipe (apenas admin/master) */}
              {(crmUser?.role === 'admin' || crmUser?.role === 'master') && (
                <div>
                  <label>Equipe</label>
                  <select value={filters.teamId} onChange={e => setFilters(f => ({ ...f, teamId: e.target.value }))} className="block border rounded px-2 py-1">
                    <option value="">Todas</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Filtro por usuário (apenas admin/master) */}
              {(crmUser?.role === 'admin' || crmUser?.role === 'master') && (
                <div>
                  <label>Usuário</label>
                  <select value={filters.userId} onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))} className="block border rounded px-2 py-1">
                    <option value="">Todos</option>
                    {crmUsers.map(user => (
                      <option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setFilters({ periodStart: '', periodEnd: '', month: '', year: '', funnelId: '', teamId: '', userId: '' })}>Limpar filtros</Button>
                <Button type="button" onClick={() => setShowFiltersModal(false)}>Aplicar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CrmIndicadores;
