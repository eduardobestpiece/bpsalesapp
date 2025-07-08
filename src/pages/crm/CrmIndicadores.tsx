
import { useState } from 'react';
import { CrmHeader } from '@/components/Layout/CrmHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Archive } from 'lucide-react';
import { IndicatorModal } from '@/components/CRM/IndicatorModal';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useIndicators } from '@/hooks/useIndicators';
import { useFunnels } from '@/hooks/useFunnels';

const CrmIndicadores = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { crmUser } = useCrmAuth();
  const companyId = crmUser?.company_id || '';
  const { data: indicators, isLoading: isIndicatorsLoading } = useIndicators(companyId, crmUser?.id);
  const { data: funnels, isLoading: isFunnelsLoading } = useFunnels(companyId, 'active');

  const handleEdit = (indicator: any) => {
    setSelectedIndicator(indicator);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedIndicator(null);
  };

  const filteredIndicators = (indicators || []).filter(indicator =>
    indicator.period_date.includes(searchTerm) ||
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
      <CrmHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-full mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-1">
            <div className="bg-white rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold">Indicadores</h2>
                <p className="text-muted-foreground">
                  Registre e acompanhe seus números e resultados
                </p>
              </div>

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
                        // Ordenar etapas por stage_order
                        const sortedStages = (funnel.stages || []).sort((a: any, b: any) => a.stage_order - b.stage_order);
                        return (
                          <div key={funnel.id} className="mb-8">
                            <h3 className="font-bold text-lg mb-2">{funnel.name}</h3>
                            {/* Cabeçalho dinâmico */}
                            <div
                              className={`grid grid-cols-[120px_80px_80px${sortedStages.length > 0 ? `_repeat(${sortedStages.length},1fr)` : ''}_100px] gap-2 font-semibold bg-muted rounded px-2 py-1 mb-2`}
                            >
                              <div>Período</div>
                              <div>Mês</div>
                              <div>Ano</div>
                              {sortedStages.map((stage: any) => (
                                <div key={stage.id}>{stage.name}</div>
                              ))}
                              <div>Ações</div>
                            </div>
                            {/* Linhas dos indicadores */}
                            {funnelIndicators.length === 0 ? (
                              <div className="text-muted-foreground text-center py-4">Nenhum indicador registrado para este funil.</div>
                            ) : (
                              funnelIndicators.map((indicator) => (
                                <div key={indicator.id} className={`grid grid-cols-[120px_80px_80px${sortedStages.length > 0 ? `_repeat(${sortedStages.length},1fr)` : ''}_100px] gap-2 items-center border-b last:border-b-0 py-2`}>
                                  <div>{new Date(indicator.period_date).toLocaleDateString('pt-BR')}</div>
                                  <div>{String(indicator.month_reference).padStart(2, '0')}</div>
                                  <div>{indicator.year_reference}</div>
                                  {sortedStages.map((stage: any) => {
                                    const valueObj = (indicator.values || []).find((v: any) => v.stage_id === stage.id);
                                    return (
                                      <div key={stage.id} className="text-center">{valueObj ? valueObj.value : '-'}</div>
                                    );
                                  })}
                                  <div className="flex gap-2 justify-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(indicator)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {}}
                                    >
                                      <Archive className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
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
    </div>
  );
};

export default CrmIndicadores;
