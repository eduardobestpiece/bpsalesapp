
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CrmPerformance from './CrmPerformance';

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
                                <h3 className="font-bold text-lg mb-2">{funnel.name}</h3>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full border-separate border-spacing-y-1">
                                    <thead>
                                      <tr className="bg-muted">
                                        <th className="px-2 py-1 text-left font-semibold">Período</th>
                                        <th className="px-2 py-1 text-left font-semibold">Mês</th>
                                        <th className="px-2 py-1 text-left font-semibold">Ano</th>
                                        {sortedStages.map((stage: any) => (
                                          <th key={stage.id} className="px-2 py-1 text-left font-semibold">{stage.name}</th>
                                        ))}
                                        <th className="px-2 py-1 text-center font-semibold">Ações</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {funnelIndicators.length === 0 ? (
                                        <tr>
                                          <td colSpan={3 + sortedStages.length + 1} className="text-muted-foreground text-center py-4">Nenhum indicador registrado para este funil.</td>
                                        </tr>
                                      ) : (
                                        funnelIndicators.map((indicator) => (
                                          <tr key={indicator.id} className="bg-white border-b last:border-b-0">
                                            <td className="px-2 py-1">{new Date(indicator.period_date).toLocaleDateString('pt-BR')}</td>
                                            <td className="px-2 py-1">{String(indicator.month_reference).padStart(2, '0')}</td>
                                            <td className="px-2 py-1">{indicator.year_reference}</td>
                                            {sortedStages.map((stage: any) => {
                                              const valueObj = (indicator.values || []).find((v: any) => v.stage_id === stage.id);
                                              return (
                                                <td key={stage.id} className="px-2 py-1 text-center">{valueObj ? valueObj.value : '-'}</td>
                                              );
                                            })}
                                            <td className="px-2 py-1 text-center">
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
                                            </td>
                                          </tr>
                                        ))
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
