
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
