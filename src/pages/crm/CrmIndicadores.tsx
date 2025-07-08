
import { useState } from 'react';
import { CrmHeader } from '@/components/Layout/CrmHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Archive } from 'lucide-react';
import { IndicatorModal } from '@/components/CRM/IndicatorModal';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

const CrmIndicadores = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { crmUser } = useCrmAuth();
  const companyId = crmUser?.company_id || '';

  // Mock data para demonstração
  const indicators = [
    {
      id: '1',
      period_date: '2024-01-15',
      funnel_name: 'Vendas Online',
      month_reference: 1,
      year_reference: 2024,
      total_leads: 150,
      conversions: 12,
      conversion_rate: '8%'
    },
    {
      id: '2',
      period_date: '2024-01-22',
      funnel_name: 'Vendas Presencial',
      month_reference: 1,
      year_reference: 2024,
      total_leads: 89,
      conversions: 8,
      conversion_rate: '9%'
    }
  ];

  const handleEdit = (indicator: any) => {
    setSelectedIndicator(indicator);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedIndicator(null);
  };

  const filteredIndicators = indicators.filter(indicator =>
    indicator.period_date.includes(searchTerm) ||
    indicator.funnel_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

                  <div className="space-y-4">
                    {filteredIndicators.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        {searchTerm ? 'Nenhum indicador encontrado para a pesquisa.' : 'Nenhum indicador registrado. Registre o primeiro indicador para começar.'}
                      </p>
                    ) : (
                      filteredIndicators.map((indicator) => (
                        <div
                          key={indicator.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                              <p className="font-medium">{new Date(indicator.period_date).toLocaleDateString('pt-BR')}</p>
                              <p className="text-sm text-muted-foreground">Data do Período</p>
                            </div>
                            <div>
                              <p className="text-sm">{indicator.funnel_name}</p>
                              <p className="text-sm text-muted-foreground">Funil</p>
                            </div>
                            <div>
                              <p className="text-sm">{indicator.total_leads}</p>
                              <p className="text-sm text-muted-foreground">Total de Leads</p>
                            </div>
                            <div>
                              <p className="text-sm">{indicator.conversions}</p>
                              <p className="text-sm text-muted-foreground">Conversões</p>
                            </div>
                            <div>
                              <Badge variant="outline">{indicator.conversion_rate}</Badge>
                              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
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
