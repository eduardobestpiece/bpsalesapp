
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { PatrimonyChart } from './PatrimonyChart';
import { useAdvancedCalculations } from '@/hooks/useAdvancedCalculations';
import { Administrator, Product } from '@/types/entities';

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
  
  // Patrimônio na contemplação com valorização
  const patrimonioNaContemplacaoCalculado = patrimonioNaContemplacao * Math.pow(1 + taxaValorizacao, contemplationMonth / 12);
  
  // Patrimônio ao final
  const patrimonioAoFinal = patrimonioNaContemplacaoCalculado * Math.pow(1 + taxaValorizacao, (product.termMonths - contemplationMonth) / 12);
  
  // CÁLCULOS CORRETOS BASEADOS NAS FÓRMULAS FORNECIDAS

  // 1. Ganhos mensais
  const ganhosMensaisBase = propertyData.type === 'short-stay' 
    ? (propertyData.dailyRate || 0) * 30 * ((propertyData.occupancyRate || 70) / 100) - propertyData.fixedCosts
    : (propertyData.monthlyRent || 0) - propertyData.fixedCosts;
  
  const ganhosMensais = ganhosMensaisBase * numeroImoveis;

  // 2. Parcela mensal do consórcio
  const parcelaMensalConsorcio = creditValue / product.termMonths;
  
  // 3. Parcela pós-contemplação (após término do consórcio)
  const parcelaPosPosContemplacao = parcelaMensalConsorcio;
  
  // 4. Fluxo de caixa antes do fim do consórcio (240 meses)
  const fluxoCaixaAntes = ganhosMensais - parcelaMensalConsorcio;
  
  // 5. Fluxo de caixa após fim do consórcio (sem parcela)
  const fluxoCaixaApos = ganhosMensais;
  
  // 6. Valor pago do próprio bolso (parcelas pagas até contemplação)
  const pagoProprioBolso = parcelaMensalConsorcio * contemplationMonth;
  
  // 7. Valor pago pelo inquilino (ganhos dos imóveis durante todo o período)
  const mesesAposContemplacao = product.termMonths - contemplationMonth;
  const pagoInquilino = ganhosMensais * mesesAposContemplacao;
  
  // 8. Capital em caixa (fluxo de caixa acumulado após contemplação)
  const capitalEmCaixa = fluxoCaixaAntes * mesesAposContemplacao;
  
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
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-emerald-200 dark:border-[#A86F57]/40">
              <Label className="text-sm text-emerald-700 dark:text-[#A86F57] font-medium">Pago pelo Inquilino</Label>
              <div className="text-2xl font-bold text-emerald-900 dark:text-white">
                {formatCurrency(pagoInquilino)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-indigo-200 dark:border-[#A86F57]/40">
              <Label className="text-sm text-indigo-700 dark:text-[#A86F57] font-medium">Capital em Caixa</Label>
              <div className="text-2xl font-bold text-indigo-900 dark:text-white">
                {formatCurrency(capitalEmCaixa)}
              </div>
              <Badge variant="outline" className="text-xs bg-white/50 dark:bg-[#131313]/50 dark:text-white dark:border-[#A86F57]/40">
                {((capitalEmCaixa / creditValue) * 100).toFixed(1)}%
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
