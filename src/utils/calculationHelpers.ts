
// Helper functions for more precise calculations
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const calculateMonthlyRate = (annualRate: number): number => {
  return Math.pow(1 + annualRate / 100, 1/12) - 1;
};

export const calculateCompoundGrowth = (principal: number, rate: number, periods: number): number => {
  return principal * Math.pow(1 + rate, periods);
};

export const calculatePresentValue = (futureValue: number, rate: number, periods: number): number => {
  return futureValue / Math.pow(1 + rate, periods);
};

export const calculatePayback = (investment: number, monthlyReturn: number): number => {
  if (monthlyReturn <= 0) return Infinity;
  return investment / monthlyReturn;
};

export const calculateROI = (gain: number, investment: number): number => {
  if (investment <= 0) return 0;
  return (gain / investment) * 100;
};

export const validatePositiveNumber = (value: number, min: number = 0): boolean => {
  return !isNaN(value) && value > min;
};

export const validateRange = (value: number, min: number, max: number): boolean => {
  return !isNaN(value) && value >= min && value <= max;
};

/**
 * Agrupa indicadores por período (semana/mês) e etapa do funil, calculando valores e conversões.
 * @param indicators Lista de indicadores (com values)
 * @param stages Lista de etapas do funil (ordenadas)
 * @param periodType 'week' | 'month'
 * @param sumAll Se true, soma todos os registros do período filtrado (não só o mais recente)
 * @returns Array de objetos com nome da etapa, valor semanal/mensal e conversão
 */
export function aggregateFunnelIndicators(indicators, stages, periodType = 'month', sumAll = false) {
  // Agrupa por período (semana/mês)
  const groupByPeriod = {};
  indicators.forEach(ind => {
    let key;
    if (periodType === 'week') {
      // Agrupa por ano + número da semana
      const date = new Date(ind.period_start || ind.period_date);
      const year = date.getFullYear();
      const week = getWeekNumber(date);
      key = `${year}-W${week}`;
    } else {
      // Agrupa por ano + mês
      const year = ind.year_reference;
      const month = ind.month_reference;
      key = `${year}-${month}`;
    }
    if (!groupByPeriod[key]) groupByPeriod[key] = [];
    groupByPeriod[key].push(ind);
  });

  let periodIndicators = [];
  if (sumAll) {
    // Soma todos os registros de todos os períodos filtrados
    periodIndicators = Object.values(groupByPeriod).flat();
  } else {
    // Pega o período mais recente
    const periods = Object.keys(groupByPeriod).sort().reverse();
    const latestPeriod = periods[0];
    periodIndicators = groupByPeriod[latestPeriod] || [];
  }

  // Para cada etapa, soma os valores do período
  const stageData = stages.map((stage, idx) => {
    const total = periodIndicators.reduce((sum, ind) => {
      const v = ind.values?.find(val => val.stage_id === stage.id);
      return sum + (v?.value || 0);
    }, 0);
    return {
      name: stage.name,
      value: total,
      idx
    };
  });

  // Calcula conversão entre etapas
  const stageDataWithConversion = stageData.map((stage, idx, arr) => {
    if (idx === 0) {
      return { ...stage, conversion: 100 };
    }
    const prev = arr[idx - 1];
    const conversion = prev.value > 0 ? Math.round((stage.value / prev.value) * 100) : 0;
    return { ...stage, conversion };
  });

  return stageDataWithConversion;
}

// Função auxiliar para obter o número da semana do ano
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}
