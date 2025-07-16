
import { useMemo } from 'react';
import { Administrator, Product, Property, InstallmentCalculation, PostContemplationCalculation, CapitalGainCalculation, LeverageCalculation } from '@/types/entities';

interface AdvancedCalculationParams {
  administrator: Administrator;
  product: Product;
  property?: Property;
  contemplationMonth: number;
  installmentType: 'full' | 'half' | 'reduced';
  capitalGainDiscount?: number; // % de deságio na compra
}

export const useAdvancedCalculations = (params: AdvancedCalculationParams) => {
  const {
    administrator,
    product,
    property,
    contemplationMonth,
    installmentType,
    capitalGainDiscount = 0
  } = params;

  // Cálculo das parcelas mensais
  const installmentCalculations = useMemo((): InstallmentCalculation[] => {
    const calculations: InstallmentCalculation[] = [];
    let currentCreditValue = product.nominalCreditValue;

    for (let month = 1; month <= product.termMonths; month++) {
      // Atualização anual do crédito (simplificado para demonstração)
      if (month > administrator.updateGracePeriod && month % 12 === administrator.updateMonth) {
        currentCreditValue *= 1.06; // 6% IPCA exemplo
      }

      const adminTax = currentCreditValue * (product.adminTaxPct / 100);
      const reserveFund = currentCreditValue * (product.reserveFundPct / 100);
      const insurance = currentCreditValue * (product.insurancePct / 100);
      const totalTaxes = adminTax + reserveFund + insurance;

      // Parcela cheia
      const fullInstallment = (currentCreditValue + totalTaxes) / product.termMonths;

      // Meia parcela
      const halfInstallment = ((currentCreditValue / 2) + totalTaxes) / product.termMonths;

      // Parcela reduzida (duas abordagens - usando abordagem A)
      const reducedInstallment = ((currentCreditValue / (product.reducedPercentage / 100)) + totalTaxes) / product.termMonths;

      calculations.push({
        month,
        fullInstallment,
        halfInstallment,
        reducedInstallment,
        creditValue: currentCreditValue,
        adminTax,
        reserveFund,
        insurance,
        totalTaxes
      });
    }

    return calculations;
  }, [administrator, product]);

  // Cálculo pós-contemplação
  const postContemplationCalculations = useMemo((): PostContemplationCalculation[] => {
    if (contemplationMonth >= product.termMonths) return [];

    const calculations: PostContemplationCalculation[] = [];
    const contemplationData = installmentCalculations[contemplationMonth - 1];
    
    // Soma das parcelas pagas até a contemplação
    let totalPaid = 0;
    for (let i = 0; i < contemplationMonth; i++) {
      const installment = installmentCalculations[i];
      switch (installmentType) {
        case 'half':
          totalPaid += installment.halfInstallment;
          break;
        case 'reduced':
          totalPaid += installment.reducedInstallment;
          break;
        default:
          totalPaid += installment.fullInstallment;
      }
    }

    const remainingBalance = contemplationData.creditValue - totalPaid;
    const remainingMonths = product.termMonths - contemplationMonth;
    
    for (let month = contemplationMonth + 1; month <= product.termMonths; month++) {
      const monthlyInstallment = remainingBalance / remainingMonths;
      const paidSoFar = totalPaid + ((month - contemplationMonth) * monthlyInstallment);
      
      calculations.push({
        month,
        remainingBalance: remainingBalance - ((month - contemplationMonth) * monthlyInstallment),
        postContemplationInstallment: monthlyInstallment,
        paidAmount: paidSoFar,
        remainingMonths: product.termMonths - month
      });
    }

    return calculations;
  }, [installmentCalculations, contemplationMonth, product.termMonths, installmentType]);

  // Cálculo de ganho de capital
  const capitalGainCalculations = useMemo((): CapitalGainCalculation[] => {
    if (capitalGainDiscount === 0) return [];

    const calculations: CapitalGainCalculation[] = [];
    const purchaseMonth = contemplationMonth;
    
    for (let month = purchaseMonth; month <= product.termMonths; month++) {
      const monthData = installmentCalculations[month - 1];
      const purchaseCost = monthData.creditValue * (1 - capitalGainDiscount / 100);
      const totalProfit = monthData.creditValue - purchaseCost;
      const monthlyProfit = totalProfit / (month - purchaseMonth + 1);
      const profitPercentage = (totalProfit / purchaseCost) * 100;

      calculations.push({
        month,
        currentCreditValue: monthData.creditValue,
        purchaseCost,
        monthlyProfit,
        profitPercentage,
        totalProfit
      });
    }

    return calculations;
  }, [installmentCalculations, contemplationMonth, capitalGainDiscount, product.termMonths]);

  // Cálculo de alavancagem patrimonial
  const leverageCalculations = useMemo((): LeverageCalculation[] => {
    if (!property) return [];

    const calculations: LeverageCalculation[] = [];
    let cumulativeCashFlow = 0;

    for (let month = contemplationMonth + 1; month <= product.termMonths; month++) {
      let grossRevenue = 0;
      let netRevenue = 0;

      if (property.type === 'short-stay') {
        grossRevenue = (property.dailyRate || 0) * 30 * ((property.occupancyRatePct || 80) / 100);
        netRevenue = grossRevenue * 0.85 - property.fixedMonthlyCosts; // 15% taxa admin
      } else {
        grossRevenue = property.monthlyRent || 0;
        netRevenue = grossRevenue - property.fixedMonthlyCosts;
      }

      const postContemplation = postContemplationCalculations.find(p => p.month === month);
      const installmentPayment = postContemplation?.postContemplationInstallment || 0;
      
      const cashFlow = netRevenue - installmentPayment;
      cumulativeCashFlow += cashFlow;
      
      const initialInvestment = property.initialValue * 0.2; // 20% entrada
      const roi = (cumulativeCashFlow / initialInvestment) * 100;

      calculations.push({
        month,
        grossRevenue,
        netRevenue,
        installmentPayment,
        cashFlow,
        cumulativeCashFlow,
        roi
      });
    }

    return calculations;
  }, [property, contemplationMonth, product.termMonths, postContemplationCalculations]);

  // Indicadores resumidos
  const summaryIndicators = useMemo(() => {
    const totalPaidByConsortium = installmentCalculations
      .slice(0, contemplationMonth)
      .reduce((sum, calc) => {
        switch (installmentType) {
          case 'half': return sum + calc.halfInstallment;
          case 'reduced': return sum + calc.reducedInstallment;
          default: return sum + calc.fullInstallment;
        }
      }, 0);

    const finalCreditValue = installmentCalculations[installmentCalculations.length - 1]?.creditValue || 0;
    const totalCapitalGain = capitalGainCalculations.reduce((sum, calc) => sum + calc.totalProfit, 0);
    const totalCashFlow = leverageCalculations.reduce((sum, calc) => sum + calc.cashFlow, 0);
    const finalROI = leverageCalculations[leverageCalculations.length - 1]?.roi || 0;

    return {
      totalPaidByConsortium,
      finalCreditValue,
      totalCapitalGain,
      totalCashFlow,
      finalROI,
      percentagePaidByConsortium: (totalPaidByConsortium / finalCreditValue) * 100
    };
  }, [installmentCalculations, capitalGainCalculations, leverageCalculations, contemplationMonth, installmentType]);

  return {
    installmentCalculations,
    postContemplationCalculations,
    capitalGainCalculations,
    leverageCalculations,
    summaryIndicators
  };
};
