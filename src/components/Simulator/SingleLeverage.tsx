
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { PatrimonyChart } from './PatrimonyChart';
import { useAdvancedCalculations } from '@/hooks/useAdvancedCalculations';
import { Administrator, Product } from '@/types/entities';
import { calculateDailyValue, calculateOccupancyDays, calculateMonthlyValue, calculateAirbnbFee, calculatePropertyCosts, calculateTotalCosts, calculateMonthlyGains, calculateCompleteMonthlyGains } from '@/utils/monthlyGainsCalculations';
import { calculatePostContemplationInstallment } from '@/utils/postContemplationCalculations';
import { calculateCashFlowBefore240, calculateCashFlowAfter240, calculateUpdatedPropertyValue } from '@/utils/cashFlowCalculations';
import { calculatePaidFromOwnPocket, calculatePaidByTenant } from '@/utils/paidValuesCalculations';

interface PropertyData {
  type: 'short-stay' | 'commercial' | 'residential';
  dailyRate?: number;
  monthlyRent?: number;
  occupancyRate?: number;
  fixedCosts: number;
  appreciationRate: number;
}

interface SingleLeverageProps {
  administrator: Administrator;
  product: Product;
  propertyData: PropertyData;
  installmentType: 'full' | 'half' | 'reduced';
  simulationData: {
    administrator: string;
    consortiumType: 'property' | 'vehicle';
    installmentType: string;
    value: number;
    term: number;
    updateRate: number;
    searchType: 'contribution' | 'credit';
    bidType?: string;
  };
  contemplationMonth: number;
  valorImovel: number;
  numeroImoveis?: number;
  patrimonioContemplacao?: number;
}

export const SingleLeverage = ({ administrator, product, propertyData, installmentType, simulationData, contemplationMonth, valorImovel, numeroImoveis = 0, patrimonioContemplacao }: SingleLeverageProps) => {
  
  const creditValue = simulationData.value;
  const patrimonioNaContemplacao = patrimonioContemplacao !== undefined ? patrimonioContemplacao : creditValue;

  const property = {
    id: 'single-property',
    type: propertyData.type,
    initialValue: creditValue,
    dailyRate: propertyData.dailyRate,
    monthlyRent: propertyData.monthlyRent,
    fixedMonthlyCosts: propertyData.fixedCosts,
    occupancyRatePct: propertyData.occupancyRate,
    annualAppreciationPct: propertyData.appreciationRate,
    contemplationMonth
  };

  const { summaryIndicators, leverageCalculations } = useAdvancedCalculations({
    administrator,
    product: { ...product, nominalCreditValue: creditValue },
    property,
    contemplationMonth,
    installmentType
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Cálculos baseados nas regras especificadas pelo usuário
  const taxaAtualizacaoAnual = simulationData.updateRate / 100;
  const taxaValorizacao = propertyData.appreciationRate / 100;
  
  // Patrimônio na contemplação (já vem valorizado do componente pai)
  const patrimonioNaContemplacaoCalculado = patrimonioContemplacao !== undefined ? patrimonioContemplacao : patrimonioNaContemplacao;
  
  console.log('=== DEBUG SINGLE LEVERAGE ===');
  console.log('patrimonioContemplacao (parâmetro):', patrimonioContemplacao);
  console.log('patrimonioNaContemplacao (local):', patrimonioNaContemplacao);
  console.log('patrimonioNaContemplacaoCalculado (final):', patrimonioNaContemplacaoCalculado);
  console.log('numeroImoveis:', numeroImoveis);
  
  // Patrimônio ao final
  const patrimonioAoFinal = patrimonioNaContemplacaoCalculado * Math.pow(1 + taxaValorizacao, (product.termMonths - contemplationMonth) / 12);
  
  // CÁLCULO LIMPO DOS GANHOS MENSAIS - RECRIADO DO ZERO
  // Cálculo direto baseado nas especificações fornecidas:
  // 1. Valor da diária: patrimônio na contemplação * 0,06%
  const valorDiaria = patrimonioNaContemplacaoCalculado * 0.0006; // 0,06%
  // 2. Ocupação: 30 × 70% = 21 dias
  const diasOcupacao = 30 * 0.7; // 70%
  // 3. Valor mensal: 21 × valor da diária
  const valorMensal = valorDiaria * diasOcupacao;
  // 4. Taxa do Airbnb: valor mensal × 15%
  const taxaAirbnb = valorMensal * 0.15; // 15%
  // 5. Custos do imóvel: patrimônio na contemplação × 0,35%
  const custosImovel = patrimonioNaContemplacaoCalculado * 0.0035; // 0,35%
  // 6. Custos totais: taxa do Airbnb + custos do imóvel
  const custosTotais = taxaAirbnb + custosImovel;
  // 7. Ganhos Mensais: valor mensal - custos totais
  const ganhosMensaisBase = valorMensal - custosTotais;
  const ganhosMensais = ganhosMensaisBase * (numeroImoveis || 1);
  
  // Debug: Log dos valores calculados
  console.log('=== NOVO CÁLCULO GANHOS MENSAIS ===');
  console.log('Patrimônio na contemplação:', patrimonioNaContemplacaoCalculado);
  console.log('1. Valor da diária (0,06%):', valorDiaria);
  console.log('2. Dias de ocupação (70%):', diasOcupacao);
  console.log('3. Valor mensal:', valorMensal);
  console.log('4. Taxa Airbnb (15%):', taxaAirbnb);
  console.log('5. Custos do imóvel (0,35%):', custosImovel);
  console.log('6. Custos totais:', custosTotais);
  console.log('7. Ganhos mensais base:', ganhosMensaisBase);
  console.log('8. Número de imóveis:', numeroImoveis);
  console.log('9. Ganhos mensais total:', ganhosMensais);

  // 2. Parcela mensal do consórcio
  const parcelaMensalConsorcio = creditValue / product.termMonths;
  
  // 3. Parcela pós-contemplação (após término do consórcio)
  // Determina a taxa de atualização com base no índice
  const updateRate = administrator.updateIndex === 'INCC' ? 8 : 6; // INCC = 8%, IPCA/IGPM = 6%
  
  // Calcula a parcela pós-contemplação
  const parcelaPosPosContemplacao = calculatePostContemplationInstallment(
    creditValue,
    product.termMonths,
    contemplationMonth,
    administrator.updateMonth,
    updateRate,
    product.adminTaxPct,
    product.reserveFundPct,
    product.insurancePct
  );
  
  // 4. Fluxo de caixa antes do fim do consórcio (240 meses)
  const fluxoCaixaAntes = calculateCashFlowBefore240(ganhosMensais, parcelaPosPosContemplacao);
  
  // 5. Fluxo de caixa após fim do consórcio (240 meses)
  // Calcular valor atualizado do imóvel após 240 meses
  const updatedPropertyValue = calculateUpdatedPropertyValue(valorImovel, propertyData.appreciationRate);
  
  // Calcular fluxo de caixa após 240 meses usando o valor atualizado do imóvel
  const dailyPercentage = propertyData.type === 'short-stay' ? 
    (propertyData.dailyRate || 150) / valorImovel * 100 : 0;
  const occupancyRate = propertyData.type === 'short-stay' ? 
    (propertyData.occupancyRate || 80) : 100;
  const adminPercentage = 15; // Percentual padrão da administradora (Airbnb)
  const expensesPercentage = (propertyData.fixedCosts / valorImovel) * 100;
  
  const fluxoCaixaApos = calculateCashFlowAfter240(
    updatedPropertyValue,
    dailyPercentage,
    occupancyRate,
    adminPercentage,
    expensesPercentage
  ) * numeroImoveis;
  
  // 6. Valor pago do próprio bolso (parcelas pagas até contemplação) - Fórmula corrigida
  const { value: pagoProprioBolso, percentage: pagoProprioBolsoPercentage } = calculatePaidFromOwnPocket(
    creditValue,
    product.termMonths,
    contemplationMonth,
    administrator.updateMonth,
    updateRate
  );
  
  // 7. Valor pago pelo inquilino (crédito inicial - pago do próprio bolso) - Fórmula corrigida
  const { value: pagoInquilino, percentage: pagoInquilinoPercentage } = calculatePaidByTenant(
    creditValue,
    pagoProprioBolso
  );
  
  const mesesAposContemplacao = product.termMonths - contemplationMonth;
  
  // Removido cálculo do Capital em Caixa conforme requisito 6.5
  
  // Dados para o gráfico com atualização anual
  const chartData = [];
  for (let month = 1; month <= product.termMonths; month++) {
    // Patrimônio com valorização
    const appreciatedValue = month >= contemplationMonth ? 
      patrimonioNaContemplacaoCalculado * Math.pow(1 + taxaValorizacao, (month - contemplationMonth) / 12) : 0;
    
    // Rendimentos com atualização anual
    const yearsFromContemplation = Math.floor((month - contemplationMonth) / 12);
    const currentIncome = month >= contemplationMonth ? 
      ganhosMensais * Math.pow(1 + taxaValorizacao, yearsFromContemplation) : 0;
    
    // Fluxo de caixa com atualização anual
    const currentCashFlow = month >= contemplationMonth ? 
      (month <= product.termMonths ? fluxoCaixaAntes : fluxoCaixaApos) * Math.pow(1 + taxaValorizacao, yearsFromContemplation) : 0;
    
    chartData.push({
      month,
      patrimony: appreciatedValue,
      income: currentIncome,
      cashFlow: currentCashFlow,
      isContemplation: month === contemplationMonth
    });
  }
  
  const numeroImoveisAoFinal = numeroImoveis;

  return (
    <div className="space-y-6">
      {/* Dados da Alavancagem */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados da Alavancagem Única</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-blue-200 dark:border-[#A86F57]/40">
              <Label className="text-sm text-blue-700 dark:text-[#A86F57] font-medium">Patrimônio na Contemplação</Label>
              <div className="text-2xl font-bold text-blue-900 dark:text-white">
                {formatCurrency(patrimonioNaContemplacaoCalculado)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-green-200 dark:border-[#A86F57]/40">
              <Label className="text-sm text-green-700 dark:text-[#A86F57] font-medium">Patrimônio ao Final</Label>
              <div className="text-2xl font-bold text-green-900 dark:text-white">
                {formatCurrency(patrimonioAoFinal)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-purple-200 dark:border-[#A86F57]/40">
              <Label className="text-sm text-purple-700 dark:text-[#A86F57] font-medium">Ganhos Mensais</Label>
              <div className="text-2xl font-bold text-purple-900 dark:text-white">
                {formatCurrency(ganhosMensais)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-orange-200 dark:border-[#A86F57]/40">
              <Label className="text-sm text-orange-700 dark:text-[#A86F57] font-medium">Parcela Pós-Contemplação</Label>
              <div className="text-2xl font-bold text-orange-900 dark:text-white">
                {formatCurrency(parcelaPosPosContemplacao)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-teal-50 to-teal-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-teal-200 dark:border-[#A86F57]/40">
              <Label className="text-sm text-teal-700 dark:text-[#A86F57] font-medium">Fluxo de Caixa Antes {product.termMonths} meses</Label>
              <div className="text-2xl font-bold text-teal-900 dark:text-white">
                {formatCurrency(fluxoCaixaAntes)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-cyan-50 to-cyan-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-cyan-200 dark:border-[#A86F57]/40">
              <Label className="text-sm text-cyan-700 dark:text-[#A86F57] font-medium">Fluxo de Caixa Pós {product.termMonths} meses</Label>
              <div className="text-2xl font-bold text-cyan-900 dark:text-white">
                {formatCurrency(fluxoCaixaApos)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-red-200 dark:border-[#A86F57]/40">
              <Label className="text-sm text-red-700 dark:text-[#A86F57] font-medium">Pago do Próprio Bolso</Label>
              <div className="text-2xl font-bold text-red-900 dark:text-white">
                {formatCurrency(pagoProprioBolso)}
              </div>
              <Badge variant="outline" className="text-xs bg-white/50 dark:bg-[#131313]/50 dark:text-white dark:border-[#A86F57]/40">
                {pagoProprioBolsoPercentage.toFixed(1)}%
              </Badge>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-emerald-200 dark:border-[#A86F57]/40">
              <Label className="text-sm text-emerald-700 dark:text-[#A86F57] font-medium">Pago pelo Inquilino</Label>
              <div className="text-2xl font-bold text-emerald-900 dark:text-white">
                {formatCurrency(pagoInquilino)}
              </div>
              <Badge variant="outline" className="text-xs bg-white/50 dark:bg-[#131313]/50 dark:text-white dark:border-[#A86F57]/40">
                {pagoInquilinoPercentage.toFixed(1)}%
              </Badge>
            </div>
            

          </div>
        </CardContent>
      </Card>

      {/* Gráfico Patrimonial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolução Patrimonial</CardTitle>
          <div className="text-sm text-muted-foreground">
            Imóveis ao final do período: <span className="font-semibold">{numeroImoveisAoFinal}</span>
          </div>
        </CardHeader>
        <CardContent>
          <PatrimonyChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
};
