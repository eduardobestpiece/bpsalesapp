
import { useState, useEffect } from 'react';
import { CrmHeader } from '@/components/Layout/CrmHeader';
import { PerformanceFilters } from '@/components/CRM/Performance/PerformanceFilters';
import { PerformanceStats } from '@/components/CRM/Performance/PerformanceStats';
import { useIndicators } from '@/hooks/useIndicators';
import { useFunnels } from '@/hooks/useFunnels';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FunnelComparisonChart } from '@/components/CRM/Performance/FunnelChart';
import { aggregateFunnelIndicators } from '@/utils/calculationHelpers';
import { differenceInCalendarWeeks, parseISO } from 'date-fns';
import { useCrmUsers } from '@/hooks/useCrmUsers';
import { useTeams } from '@/hooks/useTeams';

interface PerformanceFilters {
  funnelId: string;
  teamId?: string;
  userId?: string;
  period: 'day' | 'week' | 'month' | 'custom';
  start?: string;
  end?: string;
  month?: number;
  year?: number;
  compareId?: string; // Novo: receber compareId do filtro
}

const CrmPerformance = ({ embedded = false }: { embedded?: boolean }) => {
  const { crmUser } = useCrmAuth();
  const { selectedCompanyId, setSelectedCompanyId } = useCompany();
  const [filters, setFilters] = useState<PerformanceFilters | null>(null);
  const [activeTab, setActiveTab] = useState<'funnel'>('funnel');

  // Garantir que para não-masters, a empresa selecionada seja a do usuário
  useEffect(() => {
    if (crmUser && crmUser.role !== 'master' && crmUser.company_id && selectedCompanyId !== crmUser.company_id) {
      setSelectedCompanyId(crmUser.company_id);
    }
  }, [crmUser, selectedCompanyId, setSelectedCompanyId]);

  // Determinar userId a ser passado para o hook useIndicators
  let userIdForIndicators: string | undefined = undefined;
  if (filters?.userId && filters.userId !== 'all') {
    userIdForIndicators = filters.userId;
  } else if (crmUser?.role === 'user') {
    userIdForIndicators = crmUser.id;
  }
  console.log('[CrmPerformance] Chamada do useIndicators:', {companyId: selectedCompanyId, userId: userIdForIndicators, filtroTime: filters?.teamId});
  
  const { data: indicators = [] } = useIndicators(
    selectedCompanyId,
    userIdForIndicators
  );
  
  const { data: funnels = [] } = useFunnels(selectedCompanyId);
  const { data: crmUsers = [] } = useCrmUsers();
  const { data: teams = [] } = useTeams();

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

    let relevantIndicators = indicators.filter(indicator => indicator.funnel_id === filters.funnelId);
    
    // Filtro por time: pegar IDs dos usuários do time selecionado
    if (filters.teamId && filters.teamId !== 'all') {
      const teamMembers = crmUsers.filter(u => u.team_id === filters.teamId).map(u => u.id);
      relevantIndicators = relevantIndicators.filter(indicator => teamMembers.includes(indicator.user_id));
    } else if (filters.userId && filters.userId !== 'all') {
      // Quando usuário está selecionado, filtra apenas por ele, sem lógica extra
      relevantIndicators = relevantIndicators.filter(indicator => indicator.user_id === filters.userId);
    } else if (crmUser?.role === 'leader') {
      // Se não há filtro de usuário, mostrar todos os membros dos times que lidera + ele mesmo
      const leaderTeams = teams.filter(t => t.leader_id === crmUser.id).map(t => t.id);
      const teamMembers = crmUsers.filter(u => leaderTeams.includes(u.team_id)).map(u => u.id);
      relevantIndicators = relevantIndicators.filter(indicator => teamMembers.includes(indicator.user_id) || indicator.user_id === crmUser.id);
    } else if (crmUser?.role === 'user') {
      relevantIndicators = relevantIndicators.filter(indicator => indicator.user_id === crmUser.id);
    }
    
    // Filtro por intervalo de datas
    if (filters.period === 'custom') {
      if (filters.start) relevantIndicators = relevantIndicators.filter(i => i.period_start >= filters.start);
      if (filters.end) relevantIndicators = relevantIndicators.filter(i => i.period_end <= filters.end);
      if (filters.month) relevantIndicators = relevantIndicators.filter(i => String(i.month_reference) === String(filters.month));
      if (filters.year) relevantIndicators = relevantIndicators.filter(i => String(i.year_reference) === String(filters.year));
    }
    console.log('[CrmPerformance] Indicadores filtrados usados no gráfico:', relevantIndicators);
    relevantIndicators.forEach(ind => {
      console.log('[CrmPerformance] Indicator', ind.id, 'values:', ind.values);
    });
    if (relevantIndicators.length === 0) return [];

    // Corrigir: usar agregação dos indicadores filtrados
    const orderedStages = selectedFunnel.stages?.sort((a, b) => a.stage_order - b.stage_order) || [];
    const aggregatedStages = aggregateFunnelIndicators(relevantIndicators, orderedStages, 'month', true);
    return orderedStages.map((stage, idx) => ({
          id: stage.id,
          name: stage.name,
      actual: aggregatedStages[idx]?.value || 0,
          target: stage.target_value || 0,
          targetPercentage: stage.target_percentage
    }));
  };

  // Novo: receber compareId do filtro
  const [compareData, setCompareData] = useState(null);

  // Função para buscar indicadores do time/usuário a ser comparado
  const getCompareIndicators = (compareId: string, type: 'team' | 'user') => {
    if (!selectedFunnel) return [];
    let compareIndicators = indicators.filter(i => i.funnel_id === selectedFunnel.id);
    if (type === 'team') {
      const teamMembers = crmUsers.filter(u => u.team_id === compareId).map(u => u.id);
      compareIndicators = compareIndicators.filter(i => teamMembers.includes(i.user_id));
    } else if (type === 'user') {
      compareIndicators = compareIndicators.filter(i => i.user_id === compareId);
    }
    // Filtros customizados
    if (filters?.period === 'custom') {
      if (filters.start) compareIndicators = compareIndicators.filter(i => i.period_start >= filters.start);
      if (filters.end) compareIndicators = compareIndicators.filter(i => i.period_end <= filters.end);
      if (filters.month) compareIndicators = compareIndicators.filter(i => String(i.month_reference) === String(filters.month));
      if (filters.year) compareIndicators = compareIndicators.filter(i => String(i.year_reference) === String(filters.year));
    }
    return compareIndicators;
  };

  // Função para calcular percentuais de diferença
  const calculateDiff = (main, compare) => {
    if (!main || !compare) return 0;
    if (compare === 0) return 0;
    return (((main - compare) / compare) * 100).toFixed(1);
  };

  // Função para montar dados do gráfico duplo e comparativo, agora com comparação
  const getFunnelComparisonData = () => {
    if (!selectedFunnel || !filters) return { stages: [], comparativo: [], compareStages: [] };
    const orderedStages = selectedFunnel.stages?.sort((a, b) => a.stage_order - b.stage_order) || [];
    
    // Filtrar indicadores conforme perfil do usuário
    let filteredIndicators = indicators.filter(i => i.funnel_id === selectedFunnel.id);
    
    // Aplicar filtro por equipe corretamente
    if (filters.teamId && filters.teamId !== 'all') {
      const teamMembers = crmUsers.filter(u => u.team_id === filters.teamId).map(u => u.id);
      filteredIndicators = filteredIndicators.filter(i => teamMembers.includes(i.user_id));
    } else if (filters.userId && filters.userId !== 'all') {
      filteredIndicators = filteredIndicators.filter(i => i.user_id === filters.userId);
    } else if (crmUser?.role === 'leader') {
      // Corrigir: buscar todos os times onde o usuário é leader_id
      const leaderTeams = teams.filter(t => t.leader_id === crmUser.id).map(t => t.id);
      const teamMembers = crmUsers.filter(u => leaderTeams.includes(u.team_id)).map(u => u.id);
      filteredIndicators = filteredIndicators.filter(i => teamMembers.includes(i.user_id) || i.user_id === crmUser.id);
    } else if (crmUser?.role === 'user') {
      filteredIndicators = filteredIndicators.filter(i => i.user_id === crmUser.id);
    }
    
    // Filtros customizados
    if (filters.period === 'custom') {
      if (filters.start) filteredIndicators = filteredIndicators.filter(i => i.period_start >= filters.start);
      if (filters.end) filteredIndicators = filteredIndicators.filter(i => i.period_end <= filters.end);
      if (filters.month) filteredIndicators = filteredIndicators.filter(i => String(i.month_reference) === String(filters.month));
      if (filters.year) filteredIndicators = filteredIndicators.filter(i => String(i.year_reference) === String(filters.year));
    }
    
    // Indicadores do comparativo
    let compareIndicators = [];
    let compareType: 'team' | 'user' | null = null;
    if (filters.compareId) {
      if (filters.teamId && filters.teamId !== 'all') {
        compareType = 'team';
        compareIndicators = getCompareIndicators(filters.compareId, 'team');
      } else if (filters.userId && filters.userId !== 'all') {
        compareType = 'user';
        compareIndicators = getCompareIndicators(filters.compareId, 'user');
      }
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
    const periodIndicators = groupByMonthYear[latestMonth] || [];
    
    // Agrupar comparativo
    let comparePeriodIndicators = [];
    if (compareIndicators.length > 0) {
      const groupCompare = {};
      compareIndicators.forEach(ind => {
        const key = `${ind.year_reference}-${ind.month_reference}`;
        if (!groupCompare[key]) groupCompare[key] = [];
        groupCompare[key].push(ind);
      });
      comparePeriodIndicators = groupCompare[latestMonth] || [];
    }
    
    // Dados mensais atuais
    const monthly = aggregateFunnelIndicators(periodIndicators, orderedStages, 'month', true);
    const compareMonthly = aggregateFunnelIndicators(comparePeriodIndicators, orderedStages, 'month', true);
    
    // Monta array para o gráfico duplo
    const stages = orderedStages.map((stage, idx) => ({
      name: stage.name,
      value: monthly[idx]?.value || 0,
      compareValue: compareMonthly[idx]?.value || 0,
      diff: calculateDiff(monthly[idx]?.value || 0, compareMonthly[idx]?.value || 0),
    }));
    
    // Comparativo: exemplo com conversão final, recomendações, vendas
    const lastStage = stages[stages.length - 1];
    const firstStage = stages[0];
    const recommendations = periodIndicators.filter(i => i.recommendations_count).reduce((sum, i) => sum + (i.recommendations_count || 0), 0);
    const vendas = periodIndicators.filter(i => i.sales_value).reduce((sum, i) => sum + (i.sales_value || 0), 0);
    
    // Cálculos do período
    const conversaoFunil = firstStage && lastStage && firstStage.value > 0 ? (lastStage.value / firstStage.value) * 100 : 0;
    const ticketMedio = lastStage && lastStage.value > 0 ? vendas / lastStage.value : 0;
    
    // Cálculos do comparativo
    const compareLastStage = stages[stages.length - 1];
    const compareFirstStage = stages[0];
    const compareVendas = comparePeriodIndicators.filter(i => i.sales_value).reduce((sum, i) => sum + (i.sales_value || 0), 0);
    const compareConversaoFunil = compareFirstStage && compareLastStage && compareFirstStage.compareValue > 0 ? (compareLastStage.compareValue / compareFirstStage.compareValue) * 100 : 0;
    const compareTicketMedio = compareLastStage && compareLastStage.compareValue > 0 ? compareVendas / compareLastStage.compareValue : 0;
    
    // Percentuais de diferença
    const diffConversao = calculateDiff(conversaoFunil, compareConversaoFunil);
    const diffTicket = calculateDiff(ticketMedio, compareTicketMedio);
    
    // Comparativo final
    const comparativo = [
      { label: 'Conversão', value: conversaoFunil.toFixed(1) + '%', diff: diffConversao },
      { label: 'Vendas', value: vendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), diff: calculateDiff(vendas, compareVendas) },
      { label: 'Ticket Médio', value: ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), diff: diffTicket },
    ];
    
    return { stages, comparativo, compareStages: compareMonthly };
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

  // Função para calcular dados agregados do funil (período e semana) e métricas detalhadas
  function getAggregatedFunnelData() {
    if (!selectedFunnel || !filters) return { periodStages: [], weeklyStages: [], numWeeks: 1, vendasPeriodo: 0, vendasSemanal: 0, ticketMedioPeriodo: 0, ticketMedioSemanal: 0, recomendacoesPeriodo: 0, recomendacoesSemanal: 0, etapaRecomendacoesPeriodo: 0, etapaRecomendacoesSemanal: 0, somaPrimeiraEtapaPeriodo: 0, somaUltimaEtapaPeriodo: 0, somaPrimeiraEtapaSemanal: 0, somaUltimaEtapaSemanal: 0, numIndicadores: 1 };
    
    // Filtrar indicadores conforme perfil do usuário
    let filteredIndicators = indicators.filter(i => i.funnel_id === selectedFunnel.id);
    
    // Aplicar filtro por equipe corretamente
    if (filters.teamId && filters.teamId !== 'all') {
      const teamMembers = crmUsers.filter(u => u.team_id === filters.teamId).map(u => u.id);
      filteredIndicators = filteredIndicators.filter(i => teamMembers.includes(i.user_id));
    } else if (filters.userId && filters.userId !== 'all') {
      filteredIndicators = filteredIndicators.filter(i => i.user_id === filters.userId);
    } else if (crmUser?.role === 'user') {
      filteredIndicators = filteredIndicators.filter(i => i.user_id === crmUser.id);
    }
    
    // Filtros customizados
    if (filters.period === 'custom') {
      if (filters.start) filteredIndicators = filteredIndicators.filter(i => i.period_start >= filters.start);
      if (filters.end) filteredIndicators = filteredIndicators.filter(i => i.period_end <= filters.end);
      if (filters.month) filteredIndicators = filteredIndicators.filter(i => String(i.month_reference) === String(filters.month));
      if (filters.year) filteredIndicators = filteredIndicators.filter(i => String(i.year_reference) === String(filters.year));
    }
    
    // Calcular número de semanas do período filtrado
    let numWeeks = 1;
    if (filteredIndicators.length > 0) {
      const minDate = filteredIndicators.reduce((min, i) => i.period_start && i.period_start < min ? i.period_start : min, filteredIndicators[0].period_start);
      const maxDate = filteredIndicators.reduce((max, i) => i.period_end && i.period_end > max ? i.period_end : max, filteredIndicators[0].period_end);
      if (minDate && maxDate) {
        numWeeks = Math.max(1, differenceInCalendarWeeks(parseISO(maxDate), parseISO(minDate)) + 1);
      }
    }
    const numIndicadores = filteredIndicators.length || 1;
    
    // Agregar valores por etapa do funil (usando aggregateFunnelIndicators para garantir soma correta)
    const orderedStages = selectedFunnel.stages?.sort((a, b) => a.stage_order - b.stage_order) || [];
    const periodStages = aggregateFunnelIndicators(filteredIndicators, orderedStages, 'month', true);
    const weeklyStages = aggregateFunnelIndicators(filteredIndicators, orderedStages, 'week', true);
    
    // Soma primeira/última etapa
    const somaPrimeiraEtapaPeriodo = periodStages[0]?.value || 0;
    const somaUltimaEtapaPeriodo = periodStages[periodStages.length - 1]?.value || 0;
    const somaPrimeiraEtapaSemanal = weeklyStages[0]?.value || 0;
    const somaUltimaEtapaSemanal = weeklyStages[weeklyStages.length - 1]?.value || 0;
    
    // Vendas e ticket médio
    const vendasPeriodo = filteredIndicators.reduce((sum, i) => sum + (i.sales_value || 0), 0);
    const vendasSemanal = numWeeks > 0 ? vendasPeriodo / numWeeks : 0;
    const ticketMedioPeriodo = somaUltimaEtapaPeriodo > 0 ? vendasPeriodo / somaUltimaEtapaPeriodo : 0;
    const ticketMedioSemanal = somaUltimaEtapaSemanal > 0 ? vendasSemanal / somaUltimaEtapaSemanal : 0;
    
    // Recomendações
    const recomendacoesPeriodo = filteredIndicators.reduce((sum, i) => sum + (i.recommendations_count || 0), 0);
    // Etapa de recomendações: buscar etapa que contenha 'reuni' ou 'recomend'
    const etapaRecomendacoes = orderedStages.find(s => s.name.toLowerCase().includes('reuni') || s.name.toLowerCase().includes('recomend'));
    const etapaRecomendacoesPeriodo = etapaRecomendacoes ? periodStages.find(s => s.name === etapaRecomendacoes.name)?.value || 0 : 0;
    const etapaRecomendacoesSemanal = etapaRecomendacoes ? weeklyStages.find(s => s.name === etapaRecomendacoes.name)?.value || 0 : 0;
    const mediaRecomendacoesPeriodo = etapaRecomendacoesPeriodo > 0 ? recomendacoesPeriodo / etapaRecomendacoesPeriodo : 0;
    const mediaRecomendacoesSemanal = etapaRecomendacoesSemanal > 0 ? (recomendacoesPeriodo / numWeeks) / etapaRecomendacoesSemanal : 0;
    
    return {
      periodStages,
      weeklyStages,
      numWeeks,
      vendasPeriodo,
      vendasSemanal,
      ticketMedioPeriodo,
      ticketMedioSemanal,
      recomendacoesPeriodo,
      recomendacoesSemanal: recomendacoesPeriodo / numWeeks,
      etapaRecomendacoesPeriodo,
      etapaRecomendacoesSemanal,
      mediaRecomendacoesPeriodo,
      mediaRecomendacoesSemanal,
      somaPrimeiraEtapaPeriodo,
      somaUltimaEtapaPeriodo,
      somaPrimeiraEtapaSemanal,
      somaUltimaEtapaSemanal,
      numIndicadores
    };
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

  // Dentro do funnelTabContent, passar os dados corretos para o FunnelChart
  const {
    periodStages = [],
    weeklyStages = [],
    numWeeks = 1,
    vendasPeriodo = 0,
    vendasSemanal = 0,
    ticketMedioPeriodo = 0,
    ticketMedioSemanal = 0,
    recomendacoesPeriodo = 0,
    recomendacoesSemanal = 0,
    etapaRecomendacoesPeriodo = 0,
    etapaRecomendacoesSemanal = 0,
    mediaRecomendacoesPeriodo = 0,
    mediaRecomendacoesSemanal = 0,
    somaPrimeiraEtapaPeriodo = 0,
    somaUltimaEtapaPeriodo = 0,
    somaPrimeiraEtapaSemanal = 0,
    somaUltimaEtapaSemanal = 0,
    numIndicadores = 1
  } = getAggregatedFunnelData() || {};

  const funnelTabContent = (
    <div>
      {/* Filtros dinâmicos */}
      <PerformanceFilters onFiltersChange={setFilters} funnelOnly />
      {/* Gráfico do funil e comparativo */}
      {selectedFunnel && periodStages.length > 0 && weeklyStages.length > 0 ? (
        <FunnelComparisonChart
          stages={periodStages}
          weeklyStages={weeklyStages}
          numWeeks={numWeeks}
          vendasPeriodo={vendasPeriodo}
          vendasSemanal={vendasSemanal}
          ticketMedioPeriodo={ticketMedioPeriodo}
          ticketMedioSemanal={ticketMedioSemanal}
          recomendacoesPeriodo={recomendacoesPeriodo}
          recomendacoesSemanal={recomendacoesSemanal}
          etapaRecomendacoesPeriodo={etapaRecomendacoesPeriodo}
          etapaRecomendacoesSemanal={etapaRecomendacoesSemanal}
          mediaRecomendacoesPeriodo={mediaRecomendacoesPeriodo}
          mediaRecomendacoesSemanal={mediaRecomendacoesSemanal}
          somaPrimeiraEtapaPeriodo={somaPrimeiraEtapaPeriodo}
          somaUltimaEtapaPeriodo={somaUltimaEtapaPeriodo}
          somaPrimeiraEtapaSemanal={somaPrimeiraEtapaSemanal}
          somaUltimaEtapaSemanal={somaUltimaEtapaSemanal}
          numIndicadores={numIndicadores}
          comparativo={funnelComparisonData.comparativo}
          compareStages={funnelComparisonData.compareStages}
          periodoLabel={getPeriodoLabel()}
          funnelName={selectedFunnel?.name || ''}
            />
          ) : (
        <div className="text-center text-muted-foreground py-8">Nenhum dado para exibir o funil.</div>
      )}
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
