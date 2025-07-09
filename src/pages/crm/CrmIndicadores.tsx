
import { useState } from 'react';
import { CrmHeader } from '@/components/Layout/CrmHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Archive, Trash2 } from 'lucide-react';
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

const CrmIndicadores = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { crmUser } = useCrmAuth();
  const companyId = crmUser?.company_id || '';
  const { data: indicators, isLoading: isIndicatorsLoading } = useIndicators(companyId, crmUser?.id);
  const { data: funnels, isLoading: isFunnelsLoading } = useFunnels(companyId, 'active');

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

  const filteredIndicators = (indicators || []).filter(indicator =>
    (indicator.period_date || '').includes(searchTerm) ||
    (indicator.funnel_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar indicadores por funil
  const indicatorsByFunnel: Record<string, any[]> = {};
  (indicators || []).forEach((indicator) => {
    if (!indicatorsByFunnel[indicator.funnel_id]) {
      indicatorsByFunnel[indicator.funnel_id] = [];
    }
    indicatorsByFunnel[indicator.funnel_id].push(indicator);
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
                    <Button onClick={() => setShowModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar Indicador
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Pesquisar por data ou funil..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                      <div className="space-y-8">
                        {isIndicatorsLoading || isFunnelsLoading ? (
                      <p className="text-muted-foreground text-center py-8">
                            Carregando indicadores...
                          </p>
                        ) : funnels && funnels.length > 0 ? (
                          funnels.map((funnel) => {
                            const funnelIndicators = indicatorsByFunnel[funnel.id] || [];
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
                                        {columnsConfig[funnel.id]?.includes('last_stage') && <th className="px-2 py-1 text-left font-semibold">Última etapa</th>}
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
    </div>
  );
};

export default CrmIndicadores;
