
import { useState, useEffect } from 'react';
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
  period: 'day' | 'week' | 'month' | 'custom';
  start?: string;
  end?: string;
  month?: number;
  year?: number;
}

const CrmPerformance = ({ embedded = false }: { embedded?: boolean }) => {
  const { companyId, crmUser } = useCrmAuth();
  const [filters, setFilters] = useState<PerformanceFilters | null>(null);
  const [activeTab, setActiveTab] = useState<'funnel'>('funnel');
  
  const { data: indicators = [] } = useIndicators(
    companyId, 
    filters?.userId || crmUser?.id
  );
  
  const { data: funnels = [] } = useFunnels(companyId);

  const selectedFunnel = filters ? funnels.find(f => f.id === filters.funnelId) : null;

  // Exibir automaticamente o funil do primeiro disponível
  useEffect(() => {
    if (!filters && funnels.length > 0) {
      setFilters({
        funnelId: funnels[0].id,
        period: 'custom',
      });
    }
  }, [filters, funnels]);

  // Process indicators data to create funnel chart data
  const getFunnelChartData = () => {
    if (!selectedFunnel || !filters) return [];

    // Novo filtro customizado de período
    const relevantIndicators = indicators.filter(indicator => {
      if (indicator.funnel_id !== filters.funnelId) return false;
      // Filtro por intervalo de datas
      if (filters.period === 'custom') {
        if (filters.start && indicator.period_start < filters.start) return false;
        if (filters.end && indicator.period_end > filters.end) return false;
        if (filters.month && String(indicator.month_reference) !== String(filters.month)) return false;
        if (filters.year && String(indicator.year_reference) !== String(filters.year)) return false;
      }
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

  // Função para montar dados do gráfico duplo e comparativo, agora com comparativo do período anterior
  const getFunnelComparisonData = () => {
    if (!selectedFunnel || !filters) return { stages: [], comparativo: [] };
    const orderedStages = selectedFunnel.stages?.sort((a, b) => a.stage_order - b.stage_order) || [];
    // Filtrar indicadores conforme perfil do usuário
    let filteredIndicators = indicators.filter(i => i.funnel_id === selectedFunnel.id);
    if (crmUser?.role === 'user') {
      filteredIndicators = filteredIndicators.filter(i => i.user_id === crmUser.id);
    } else if (crmUser?.role === 'leader') {
      // Suporte a múltiplas equipes se necessário
      const teamIds = Array.isArray(crmUser.team_id) ? crmUser.team_id : [crmUser.team_id];
      filteredIndicators = filteredIndicators.filter(i => teamIds.includes(i.team_id));
    } else if (crmUser?.role === 'admin' || crmUser?.role === 'master') {
      filteredIndicators = filteredIndicators.filter(i => i.company_id === companyId);
    }
    // Filtros customizados
    if (filters.period === 'custom') {
      if (filters.start) filteredIndicators = filteredIndicators.filter(i => i.period_start >= filters.start);
      if (filters.end) filteredIndicators = filteredIndicators.filter(i => i.period_end <= filters.end);
      if (filters.month) filteredIndicators = filteredIndicators.filter(i => String(i.month_reference) === String(filters.month));
      if (filters.year) filteredIndicators = filteredIndicators.filter(i => String(i.year_reference) === String(filters.year));
    }
    // Agrupar por mês/ano para comparação correta
    const groupByMonthYear = {};
    filteredIndicators.forEach(ind => {
      const key = `${ind.year_reference}-${ind.month_reference}`;
      if (!groupByMonthYear[key]) groupByMonthYear[key] = [];
      groupByMonthYear[key].push(ind);
    });
    const months = Object.keys(groupByMonthYear).sort().reverse();
    const latestMonth = months[0];
    const previousMonth = months[1];
    const periodIndicators = groupByMonthYear[latestMonth] || [];
    const previousIndicators = groupByMonthYear[previousMonth] || [];
    // Dados mensais atuais e anteriores
    const monthly = aggregateFunnelIndicators(periodIndicators, orderedStages, 'month');
    const previousMonthly = aggregateFunnelIndicators(previousIndicators, orderedStages, 'month');
    // Monta array para o gráfico duplo
    const stages = orderedStages.map((stage, idx) => ({
      name: stage.name,
      weeklyValue: monthly[idx]?.value || 0,
      weeklyConversion: monthly[idx]?.conversion || 0,
      previousWeeklyValue: previousMonthly[idx]?.value || 0,
      monthlyValue: monthly[idx]?.value || 0,
      monthlyConversion: monthly[idx]?.conversion || 0,
    }));
    // Comparativo: exemplo com conversão final, recomendações, vendas
    const lastStage = stages[stages.length - 1];
    const recommendations = periodIndicators.filter(i => i.recommendations_count).reduce((sum, i) => sum + (i.recommendations_count || 0), 0);
    const vendas = periodIndicators.filter(i => i.sales_value).reduce((sum, i) => sum + (i.sales_value || 0), 0);
    const comparativo = [
      { label: 'Conversão', value: lastStage ? `${lastStage.monthlyConversion}%` : '-' },
      { label: 'Recomendações', value: recommendations },
      { label: 'Vendas', value: vendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
      { label: 'Comparativo', value: previousMonth ? 'Período anterior' : '0%' },
    ];
    return { stages, comparativo };
  };

  // Função utilitária para montar o label do período
  function getPeriodoLabel() {
    if (!filters) return 'Todo Período';
    if (filters.period === 'custom' && filters.start && filters.end) {
      return `De ${new Date(filters.start).toLocaleDateString('pt-BR')} até ${new Date(filters.end).toLocaleDateString('pt-BR')}`;
    }
    if (filters.month && filters.year) {
      const mes = new Date(2000, filters.month - 1, 1).toLocaleString('pt-BR', { month: 'long' });
      return `${mes.charAt(0).toUpperCase() + mes.slice(1)} de ${filters.year}`;
    }
    if (filters.year) {
      return `${filters.year}`;
    }
    return 'Todo Período';
  }

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
        periodoLabel={getPeriodoLabel()}
      />
    </div>
  );

  const content = (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="funnel">Funil</TabsTrigger>
      </TabsList>
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
