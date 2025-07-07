
export interface ConsortiumCalculation {
  creditValue: number;
  administrationTax: number;
  insurance: number;
  reserveFund: number;
  inccIpca: number;
  installments: number;
  debtBalance: number;
  embedded: number;
  bidValue: number;
  installmentBeforeContemplation: number;
  installmentAfterContemplation: number;
}

export interface AirbnbCalculation {
  propertyValue: number;
  paidPropertyValue: number;
  dailyRate: number;
  occupancyRate: number;
  receivedRental: number;
  miscExpenses: number;
  consortiumInstallment: number;
  activeCashGeneration: number;
  cashFlowPercentage: number;
  cashFlow: number;
  opportunityCost: number;
}

export interface CommercialPropertyCalculation {
  propertyValue: number;
  paidPropertyValue: number;
  monthlyRent: number;
  miscExpenses: number;
  consortiumInstallment: number;
  activeCashGeneration: number;
  cashFlowPercentage: number;
  cashFlow: number;
  opportunityCost: number;
}

export interface CapitalGainCalculation {
  purchasePercentage: number;
  creditValue: number;
  paidInstallments: number;
  profit: number;
}

export interface SimulatorData {
  simulationType: 'installment' | 'credit' | 'income';
  installmentType: 'reduced' | 'full';
  simulationTime: number;
  contemplationPeriod: number;
  value: number;
}

export interface Administrator {
  id: string;
  name: string;
  administrationTax: number;
  annualCreditUpdateRate: number;
  creditUpdateMonth: number;
  gracePeriodMonths: number;
  reserveFund: number;
  specialInitialInstallments: number;
  reducedInstallments: boolean;
  embeddedBidPercentage: number;
  bidTypes: string[];
  isDefault: boolean;
  isSystemItem: boolean;
}

export interface Product {
  id: string;
  value: number;
  type: 'property' | 'vehicle';
  administratorId: string;
}

export interface BidModality {
  id: string;
  name: string;
  administratorId: string;
  embeddedValue: number;
  clientValue: number;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  bio?: string;
  role: 'master' | 'user';
}
