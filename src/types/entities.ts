
// Entidades configuráveis conforme documentação

export interface Administrator {
  id: string;
  name: string;
  updateIndex: 'IPCA' | 'INCC' | 'IGPM';
  updateMonth: number; // 1-12 para mês fixo
  updateInterval?: number; // alternativo: a cada X parcelas
  updateGracePeriod: number; // meses de carência
  maxEmbeddedPercentage: number; // % máximo de embutido
  availableBidTypes: BidType[];
  isDefault?: boolean;
}

export interface Product {
  id: string;
  administratorId: string;
  name: string;
  nominalCreditValue: number;
  termMonths: number;
  adminTaxPct: number;
  reserveFundPct: number;
  insurancePct: number;
  reducedPercentage: number; // Para parcelas reduzidas
  advanceInstallments: number; // Parcelas na adesão
}

export interface BidType {
  id: 'SORTEIO' | 'LIVRE' | 'FIXO' | 'FIDELIDADE' | 'MISTO';
  name: string;
  params: {
    minBidPct?: number;
    maxBidPct?: number;
    allowsEmbedded?: boolean;
    fixedPct?: number;
    minContribMonths?: number;
    embeddedPct?: number;
    ownPct?: number;
  };
}

export interface Property {
  id: string;
  type: 'short-stay' | 'commercial' | 'residential';
  initialValue: number;
  realEstateFeePct?: number;
  dailyRate?: number; // Para short-stay
  monthlyRent?: number; // Para comercial/residencial
  fixedMonthlyCosts: number;
  occupancyRatePct?: number; // Para short-stay
  annualAppreciationPct: number;
  contemplationMonth?: number;
  contemplationFrequency?: number;
}

export interface InstallmentCalculation {
  month: number;
  fullInstallment: number;
  halfInstallment: number;
  reducedInstallment: number;
  creditValue: number;
  adminTax: number;
  reserveFund: number;
  insurance: number;
  totalTaxes: number;
}

export interface PostContemplationCalculation {
  month: number;
  remainingBalance: number;
  postContemplationInstallment: number;
  paidAmount: number;
  remainingMonths: number;
}

export interface CapitalGainCalculation {
  month: number;
  currentCreditValue: number;
  purchaseCost: number;
  monthlyProfit: number;
  profitPercentage: number;
  totalProfit: number;
}

export interface LeverageCalculation {
  month: number;
  grossRevenue: number;
  netRevenue: number;
  installmentPayment: number;
  cashFlow: number;
  cumulativeCashFlow: number;
  roi: number;
}
