
import { SimulatorData, ConsortiumCalculation, AirbnbCalculation, CommercialPropertyCalculation, CapitalGainCalculation } from '@/types/simulator';

export const calculateConsortium = (data: SimulatorData): ConsortiumCalculation => {
  const creditValue = data.simulationType === 'credit' ? data.value : 
                     data.simulationType === 'installment' ? data.value * data.simulationTime : 
                     200000; // Default for income-based

  const administrationTax = 25; // 25% default
  const insurance = 2; // 2% default
  const reserveFund = 3; // 3% default
  const inccIpca = 6; // 6% annual
  
  const installments = data.simulationTime;
  const monthlyAdminTax = (administrationTax / 100) * creditValue / installments;
  const monthlyInsurance = (insurance / 100) * creditValue / installments;
  const monthlyReserveFund = (reserveFund / 100) * creditValue / installments;
  
  const baseInstallment = creditValue / installments;
  const fullInstallment = baseInstallment + monthlyAdminTax + monthlyInsurance + monthlyReserveFund;
  const reducedInstallment = data.installmentType === 'reduced' ? fullInstallment * 0.5 : fullInstallment;
  
  const debtBalance = creditValue * 0.8; // Assuming 20% paid initially
  const embedded = creditValue * 0.15; // 15% embedded value
  const bidValue = creditValue * 0.12; // 12% bid value
  
  return {
    creditValue,
    administrationTax,
    insurance,
    reserveFund,
    inccIpca,
    installments,
    debtBalance,
    embedded,
    bidValue,
    installmentBeforeContemplation: reducedInstallment,
    installmentAfterContemplation: fullInstallment
  };
};

export const calculateAirbnb = (consortiumData: ConsortiumCalculation): AirbnbCalculation => {
  const propertyValue = consortiumData.creditValue;
  const paidPropertyValue = propertyValue * 0.2; // 20% down payment
  const dailyRate = 150; // R$ 150/day default
  const occupancyRate = 80; // 80% occupancy
  const monthlyDays = 30;
  
  const receivedRental = (dailyRate * monthlyDays * occupancyRate / 100);
  const miscExpenses = 500; // R$ 500 monthly expenses
  const consortiumInstallment = consortiumData.installmentAfterContemplation;
  
  const activeCashGeneration = receivedRental - miscExpenses - consortiumInstallment;
  const cashFlowPercentage = (activeCashGeneration / paidPropertyValue) * 100;
  const cashFlow = activeCashGeneration;
  const opportunityCost = paidPropertyValue * 0.01; // 1% monthly opportunity cost
  
  return {
    propertyValue,
    paidPropertyValue,
    dailyRate,
    occupancyRate,
    receivedRental,
    miscExpenses,
    consortiumInstallment,
    activeCashGeneration,
    cashFlowPercentage,
    cashFlow,
    opportunityCost
  };
};

export const calculateCommercialProperty = (consortiumData: ConsortiumCalculation): CommercialPropertyCalculation => {
  const propertyValue = consortiumData.creditValue;
  const paidPropertyValue = propertyValue * 0.2; // 20% down payment
  const monthlyRent = propertyValue * 0.008; // 0.8% monthly rent yield
  const miscExpenses = 300; // R$ 300 monthly expenses
  const consortiumInstallment = consortiumData.installmentAfterContemplation;
  
  const activeCashGeneration = monthlyRent - miscExpenses - consortiumInstallment;
  const cashFlowPercentage = (activeCashGeneration / paidPropertyValue) * 100;
  const cashFlow = activeCashGeneration;
  const opportunityCost = paidPropertyValue * 0.01; // 1% monthly opportunity cost
  
  return {
    propertyValue,
    paidPropertyValue,
    monthlyRent,
    miscExpenses,
    consortiumInstallment,
    activeCashGeneration,
    cashFlowPercentage,
    cashFlow,
    opportunityCost
  };
};

export const calculateCapitalGain = (purchasePercentage: number, creditValue: number, paidInstallments: number): CapitalGainCalculation => {
  const monteoPayment = (creditValue * purchasePercentage) / 100;
  const profit = monteoPayment - paidInstallments;
  
  return {
    purchasePercentage,
    creditValue,
    paidInstallments,
    profit
  };
};

export const calculatePatrimonialEvolution = (data: SimulatorData) => {
  const consortiumCalc = calculateConsortium(data);
  const airbnbCalc = calculateAirbnb(consortiumCalc);
  
  const contemplationMonths = data.contemplationPeriod;
  const totalMonths = data.simulationTime;
  const propertiesAcquired = Math.floor(totalMonths / contemplationMonths);
  
  const evolution = [];
  let totalProperties = 0;
  let totalEquity = 0;
  let totalPassiveIncome = 0;
  
  for (let month = 0; month <= totalMonths; month += contemplationMonths) {
    if (month > 0) {
      totalProperties++;
      totalEquity += airbnbCalc.paidPropertyValue;
      totalPassiveIncome += airbnbCalc.activeCashGeneration;
    }
    
    evolution.push({
      month,
      properties: totalProperties,
      equity: totalEquity,
      passiveIncome: totalPassiveIncome
    });
  }
  
  return evolution;
};

/**
 * Calcula o valor da parcela cheia e especial conforme regras do produto.
 */
export function calcularParcelasProduto({
  credit,
  installment,
  reduction
}: {
  credit: number,
  installment: {
    installment_count: number,
    admin_tax_percent: number,
    reserve_fund_percent: number,
    insurance_percent: number,
    optional_insurance: boolean
  },
  reduction?: {
    reduction_percent: number,
    applications: string[]
  } | null
}) {
  const nParcelas = installment.installment_count;
  const taxaAdm = installment.admin_tax_percent || 0;
  const fundoReserva = installment.reserve_fund_percent || 0;
  const seguro = installment.optional_insurance ? 0 : (installment.insurance_percent || 0);
  
  // Cálculo Parcela Cheia
  const valorCheia = (credit + ((credit * taxaAdm / 100) + (credit * fundoReserva / 100) + (credit * seguro / 100))) / nParcelas;
  
  // Cálculo Parcela Especial
  let percentualReducao = 0;
  let aplicaParcela = false, aplicaTaxaAdm = false, aplicaFundoReserva = false, aplicaSeguro = false;
  
  if (reduction) {
    percentualReducao = reduction.reduction_percent / 100;
    aplicaParcela = reduction.applications?.includes('installment');
    aplicaTaxaAdm = reduction.applications?.includes('admin_tax');
    aplicaFundoReserva = reduction.applications?.includes('reserve_fund');
    aplicaSeguro = reduction.applications?.includes('insurance');
  }
  
  const principal = aplicaParcela ? credit - (credit * percentualReducao) : credit;
  const taxa = aplicaTaxaAdm ? (credit * taxaAdm / 100) - ((credit * taxaAdm / 100) * percentualReducao) : (credit * taxaAdm / 100);
  const fundo = aplicaFundoReserva ? (credit * fundoReserva / 100) - ((credit * fundoReserva / 100) * percentualReducao) : (credit * fundoReserva / 100);
  
  let seguroValor = 0;
  if (!installment.optional_insurance) {
    seguroValor = aplicaSeguro
      ? (credit * seguro / 100) - ((credit * seguro / 100) * percentualReducao)
      : (credit * seguro / 100);
  }
  
  const valorEspecial = (principal + taxa + fundo + seguroValor) / nParcelas;
  
  return { full: valorCheia, special: valorEspecial };
}

/**
 * Calcula os valores da alavancagem patrimonial baseado nos parâmetros reais
 */
export function calculateLeverageValues({
  creditValue,
  propertyValue,
  propertyCount,
  contemplationMonth,
  termMonths,
  dailyRate,
  occupancyRate,
  fixedCosts,
  appreciationRate
}: {
  creditValue: number;
  propertyValue: number;
  propertyCount: number;
  contemplationMonth: number;
  termMonths: number;
  dailyRate?: number;
  occupancyRate?: number;
  fixedCosts: number;
  appreciationRate: number;
}) {
  // 1. Ganhos mensais por imóvel
  const ganhosPorImovel = dailyRate && occupancyRate 
    ? (dailyRate * 30 * (occupancyRate / 100)) - fixedCosts
    : 0;
  
  // 2. Ganhos mensais totais
  const ganhosMensais = ganhosPorImovel * propertyCount;
  
  // 3. Parcela mensal do consórcio
  const parcelaMensalConsorcio = creditValue / termMonths;
  
  // 4. Parcela pós-contemplação (sem alteração, é a mesma parcela)
  const parcelaPosPosContemplacao = parcelaMensalConsorcio;
  
  // 5. Fluxo de caixa antes do fim do consórcio
  const fluxoCaixaAntes = ganhosMensais - parcelaMensalConsorcio;
  
  // 6. Fluxo de caixa após fim do consórcio (sem parcela do consórcio)
  const fluxoCaixaApos = ganhosMensais;
  
  // 7. Valor pago do próprio bolso (parcelas até contemplação)
  const pagoProprioBolso = parcelaMensalConsorcio * contemplationMonth;
  
  // 8. Valor pago pelo inquilino (ganhos dos imóveis após contemplação)
  const mesesAposContemplacao = termMonths - contemplationMonth;
  const pagoInquilino = ganhosMensais * mesesAposContemplacao;
  
  // 9. Capital em caixa removido conforme requisito 6.5
  
  // 10. Patrimônio na contemplação
  const patrimonioNaContemplacao = propertyValue * propertyCount;
  
  // 11. Patrimônio ao final (com valorização)
  const anosAposContemplacao = (termMonths - contemplationMonth) / 12;
  const patrimonioAoFinal = patrimonioNaContemplacao * Math.pow(1 + (appreciationRate / 100), anosAposContemplacao);
  
  return {
    ganhosMensais,
    parcelaPosPosContemplacao,
    fluxoCaixaAntes,
    fluxoCaixaApos,
    pagoProprioBolso,
    pagoInquilino,
    // capitalEmCaixa removido conforme requisito 6.5
    patrimonioNaContemplacao,
    patrimonioAoFinal
  };
}
