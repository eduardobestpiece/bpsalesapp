
import { useState } from 'react';
import { CrmHeader } from '@/components/Layout/CrmHeader';
import { PerformanceFilters } from '@/components/CRM/Performance/PerformanceFilters';
import { PerformanceStats } from '@/components/CRM/Performance/PerformanceStats';
import { useIndicators } from '@/hooks/useIndicators';
import { useFunnels } from '@/hooks/useFunnels';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FunnelComparisonChart } from '@/components/CRM/Performance/FunnelChart';
import { aggregateFunnelIndicators } from '@/utils/calculationHelpers';

interface PerformanceFilters {
  funnelId: string;
  teamId?: string;
  userId?: string;
  period: 'day' | 'week' | 'month';
}

const CrmPerformance = ({ embedded = false }: { embedded?: boolean }) => {
  const { companyId, crmUser } = useCrmAuth();
  const [filters, setFilters] = useState<PerformanceFilters | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'funnel'>('overview');
  
  const { data: indicators = [] } = useIndicators(
    companyId, 
    filters?.userId || crmUser?.id
  );
  
  const { data: funnels = [] } = useFunnels(companyId);

  const selectedFunnel = filters ? funnels.find(f => f.id === filters.funnelId) : null;

  // Process indicators data to create funnel chart data
  const getFunnelChartData = () => {
    if (!selectedFunnel || !filters) return [];

    // Filter indicators by funnel and period
    const relevantIndicators = indicators.filter(indicator => {
      if (indicator.funnel_id !== filters.funnelId) return false;
      
      // Here you would implement period filtering logic
      // For now, we'll take the most recent indicator
      return true;
    });

    if (relevantIndicators.length === 0) return [];

    const latestIndicator = relevantIndicators[0];
    
    return selectedFunnel.stages
      .sort((a, b) => a.stage_order - b.stage_order)
      .map(stage => {
        const stageValue = latestIndicator.values?.find(v => v.stage_id === stage.id);
        return {
          id: stage.id,
          name: stage.name,
          actual: stageValue?.value || 0,
          target: stage.target_value || 0,
          targetPercentage: stage.target_percentage
        };
      });
  };

  // Função para montar dados do gráfico duplo e comparativo
  const getFunnelComparisonData = () => {
    if (!selectedFunnel || !filters) return { stages: [], comparativo: [] };
    const orderedStages = selectedFunnel.stages?.sort((a, b) => a.stage_order - b.stage_order) || [];
    // Dados semanais
    const weekly = aggregateFunnelIndicators(
      indicators.filter(i => i.funnel_id === selectedFunnel.id),
      orderedStages,
      'week'
    );
    // Dados mensais
    const monthly = aggregateFunnelIndicators(
      indicators.filter(i => i.funnel_id === selectedFunnel.id),
      orderedStages,
      'month'
    );
    // Monta array para o gráfico duplo
    const stages = orderedStages.map((stage, idx) => ({
      name: stage.name,
      weeklyValue: weekly[idx]?.value || 0,
      weeklyConversion: weekly[idx]?.conversion || 0,
      monthlyValue: monthly[idx]?.value || 0,
      monthlyConversion: monthly[idx]?.conversion || 0,
    }));
    // Comparativo: exemplo com conversão final, recomendações, vendas
    const lastStage = stages[stages.length - 1];
    const recommendations = indicators.filter(i => i.funnel_id === selectedFunnel.id && i.recommendations_count).reduce((sum, i) => sum + (i.recommendations_count || 0), 0);
    const vendas = indicators.filter(i => i.funnel_id === selectedFunnel.id && i.sales_value).reduce((sum, i) => sum + (i.sales_value || 0), 0);
    const comparativo = [
      { label: 'Conversão', value: lastStage ? `${lastStage.monthlyConversion}%` : '-' },
      { label: 'Recomendações', value: recommendations },
      { label: 'Vendas', value: vendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
      { label: 'Comparativo', value: 'Período anterior' },
    ];
    return { stages, comparativo };
  };

  const funnelComparisonData = getFunnelComparisonData();

  const getPerformanceStats = () => {
    // Mock data for now - in a real implementation, this would be calculated from actual data
    return {
      totalLeads: 150,
      totalSales: 23,
      conversionRate: 15.3,
      averageTicket: 2500,
      totalRevenue: 57500,
      previousPeriodComparison: {
        leadsChange: 12.5,
        salesChange: -5.2,
        revenueChange: 8.7
      }
    };
  };

  const funnelData = getFunnelChartData();
  const statsData = getPerformanceStats();

  const funnelTabContent = (
    <div className="space-y-6">
      {/* Filtros dinâmicos */}
      <PerformanceFilters onFiltersChange={setFilters} funnelOnly />
      {/* Gráfico do funil e comparativo */}
      <FunnelComparisonChart
        stages={funnelComparisonData.stages}
        comparativo={funnelComparisonData.comparativo}
      />
    </div>
  );

  const content = (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="overview">Performance Geral</TabsTrigger>
        <TabsTrigger value="funnel">Funil</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        {/* Filters */}
        <PerformanceFilters onFiltersChange={setFilters} />
        {filters && (
          <>
            {/* Statistics */}
            <PerformanceStats {...statsData} />
            {/* Show message instead of non-existent FunnelChart */}
            {funnelData.length > 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2">Dados do funil carregados</h3>
                <p className="text-muted-foreground">
                  {funnelData.length} etapas encontradas para o funil {selectedFunnel?.name}
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2">Sem dados de performance</h3>
                <p className="text-muted-foreground">
                  Não há indicadores registrados para este funil no período selecionado.
                </p>
              </div>
            )}
          </>
        )}
        {!filters && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Selecione os filtros</h3>
            <p className="text-muted-foreground">
              Configure os filtros acima para visualizar a performance do funil.
            </p>
          </div>
        )}
      </TabsContent>
      <TabsContent value="funnel">{funnelTabContent}</TabsContent>
    </Tabs>
  );

  if (embedded) {
    return (
      <>
        {/* Removido título e subtítulo do modo embedded */}
        {content}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
      <CrmHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-1">
            <div className="bg-white rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold">Performance</h2>
                <p className="text-muted-foreground">
                  Acompanhe o desempenho dos funis e resultados
                </p>
              </div>
              {content}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CrmPerformance;
