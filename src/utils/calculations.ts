
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
