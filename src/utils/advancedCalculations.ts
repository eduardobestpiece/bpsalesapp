
import { SimulatorData } from '@/types/simulator';

export interface AdvancedCalculationResult {
  monthlyPayment: number;
  totalPaid: number;
  creditValue: number;
  adminFee: number;
  insurance: number;
  reserveFund: number;
  totalTaxes: number;
  effectiveRate: number;
  contemplationDetails: {
    month: number;
    accumulatedPayment: number;
    remainingBalance: number;
  };
  yearlyBreakdown: {
    year: number;
    payments: number;
    creditGrowth: number;
    taxes: number;
  }[];
}

export const calculateAdvancedConsortium = (data: SimulatorData): AdvancedCalculationResult => {
  // Taxas padrão (podem ser configuradas posteriormente)
  const adminFeeRate = 0.15; // 15% ao ano
  const insuranceRate = 0.03; // 3% ao ano
  const reserveFundRate = 0.02; // 2% ao ano
  const creditGrowthRate = 0.06; // 6% ao ano (IPCA + ganho)
  
  let currentCreditValue = data.simulationType === 'credit' 
    ? data.value 
    : data.value * data.simulationTime; // Estimativa baseada na parcela
  
  const yearlyBreakdown = [];
  let totalPaid = 0;
  let accumulatedPayment = 0;
  
  for (let year = 1; year <= Math.ceil(data.simulationTime / 12); year++) {
    // Atualização anual do crédito
    if (year > 1) {
      currentCreditValue *= (1 + creditGrowthRate);
    }
    
    // Cálculo das taxas anuais
    const yearlyAdminFee = currentCreditValue * (adminFeeRate / 12);
    const yearlyInsurance = currentCreditValue * (insuranceRate / 12);
    const yearlyReserveFund = currentCreditValue * (reserveFundRate / 12);
    const yearlyTaxes = yearlyAdminFee + yearlyInsurance + yearlyReserveFund;
    
    // Parcela base (sem taxas)
    const baseParcela = data.installmentType === 'reduced' 
      ? currentCreditValue * 0.4 / data.simulationTime // Parcela reduzida (40% do valor)
      : currentCreditValue / data.simulationTime; // Parcela cheia
    
    const monthlyPayment = baseParcela + yearlyTaxes;
    const yearlyPayments = monthlyPayment * 12;
    
    yearlyBreakdown.push({
      year,
      payments: yearlyPayments,
      creditGrowth: currentCreditValue,
      taxes: yearlyTaxes * 12
    });
    
    totalPaid += yearlyPayments;
    
    // Verifica contemplação
    if (year * 12 >= data.contemplationPeriod) {
      accumulatedPayment = totalPaid * (data.contemplationPeriod / (year * 12));
    }
  }
  
  // Cálculo final
  const finalCreditValue = currentCreditValue;
  const totalTaxes = yearlyBreakdown.reduce((sum, year) => sum + year.taxes, 0);
  const adminFee = totalTaxes * (adminFeeRate / (adminFeeRate + insuranceRate + reserveFundRate));
  const insurance = totalTaxes * (insuranceRate / (adminFeeRate + insuranceRate + reserveFundRate));
  const reserveFund = totalTaxes * (reserveFundRate / (adminFeeRate + insuranceRate + reserveFundRate));
  
  const monthlyPayment = totalPaid / data.simulationTime;
  const effectiveRate = ((finalCreditValue - totalPaid) / totalPaid) * 100;
  
  return {
    monthlyPayment,
    totalPaid,
    creditValue: finalCreditValue,
    adminFee,
    insurance,
    reserveFund,
    totalTaxes,
    effectiveRate,
    contemplationDetails: {
      month: data.contemplationPeriod,
      accumulatedPayment,
      remainingBalance: finalCreditValue - accumulatedPayment
    },
    yearlyBreakdown
  };
};

export const calculateHalfInstallment = (fullCalculation: AdvancedCalculationResult): AdvancedCalculationResult => {
  // Meia parcela: 50% do crédito com taxas integrais
  const halfCredit = fullCalculation.creditValue * 0.5;
  const halfMonthlyPayment = (halfCredit / fullCalculation.yearlyBreakdown.length / 12) + 
    (fullCalculation.totalTaxes / fullCalculation.yearlyBreakdown.length / 12);
  
  return {
    ...fullCalculation,
    creditValue: halfCredit,
    monthlyPayment: halfMonthlyPayment,
    totalPaid: halfMonthlyPayment * fullCalculation.yearlyBreakdown.length * 12,
    contemplationDetails: {
      ...fullCalculation.contemplationDetails,
      remainingBalance: halfCredit - fullCalculation.contemplationDetails.accumulatedPayment
    }
  };
};

export const formatCalculationCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatCalculationPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};
