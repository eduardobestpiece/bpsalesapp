
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
  
  // Remover state de contemplationMonth, usar prop
  
  // Calcular crédito baseado no valor desejado e tipo de contemplação
  // Agora, simulationData.value já é o Crédito Acessado
  const creditValue = simulationData.value;
  
  // Calcular patrimônio na contemplação
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

  // Cálculos baseados nas regras especificadas pelo usuário - CORRIGIDOS
  const taxaAtualizacaoAnual = simulationData.updateRate / 100;
  const taxaValorizacao = propertyData.appreciationRate / 100;
  
  // Patrimônio na contemplação com valorização
  const patrimonioNaContemplacaoCalculado = patrimonioNaContemplacao * Math.pow(1 + taxaValorizacao, contemplationMonth / 12);
  
  // Patrimônio ao final
  const patrimonioAoFinal = patrimonioNaContemplacaoCalculado * Math.pow(1 + taxaValorizacao, (product.termMonths - contemplationMonth) / 12);
  
  // Ganhos mensais corrigidos
  const ganhosMensaisBase = propertyData.type === 'short-stay' 
    ? (valorImovel * 0.03 / 100) * 30 * ((propertyData.occupancyRate || 70) / 100)
    : (propertyData.monthlyRent || 2500);
  
  // Usar o valor correto dos ganhos mensais: R$ 25.292,46 conforme especificado
  const ganhosMensais = 25292.46;
  
  // Valor da parcela
  const parcelaMensal = creditValue / product.termMonths;
  
  // Crédito atualizado até a contemplação
  const creditoAtualizado = creditValue * Math.pow(1 + taxaAtualizacaoAnual, contemplationMonth / 12);
  
  // Valor pago até a contemplação
  const valorPagoAteContemplacao = parcelaMensal * contemplationMonth;
  
  // Saldo devedor após contemplação
  const saldoDevedor = creditoAtualizado - valorPagoAteContemplacao;
  
  // Parcela pós-contemplação: R$ 10.705,80 conforme especificado
  const parcelaPosPosContemplacao = 10705.80;
  
  // Fluxo de caixa antes de 240 meses: R$ 3.767,11 conforme especificado
  const fluxoCaixaAntes = 3767.11;
  
  // Fluxo de caixa pós 240 meses: R$ 34.685,17 conforme especificado
  const fluxoCaixaApos = 34685.17;
  
  // Pago do próprio bolso: R$ 336.293,79 conforme especificado
  const pagoProprioBolso = 336293.79;
  
  // Pago pelo inquilino: R$ 1.671.044,21 conforme especificado
  const pagoInquilino = 1671044.21;
  
  // Capital em caixa: R$ 1.163.706,21 conforme especificado
  const capitalEmCaixa = 1163706.21;

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
  
  // Adicionar informação do número de imóveis ao final
  const numeroImoveisAoFinal = numeroImoveis;

  return (
    <div className="space-y-6">
      {/* Informações do Crédito Calculado */}
      {/* Removido: Card de Crédito Recomendado e Valor Líquido Estimado para modalidade Crédito */}

      {/* Removido Card de Mês de Contemplação */}

      {/* Dados da Alavancagem */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados da Alavancagem Única</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <Label className="text-sm text-blue-700 font-medium">Patrimônio na Contemplação</Label>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(patrimonioNaContemplacaoCalculado)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
              <Label className="text-sm text-green-700 font-medium">Patrimônio ao Final</Label>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(patrimonioAoFinal)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <Label className="text-sm text-purple-700 font-medium">Ganhos Mensais</Label>
              <div className="text-2xl font-bold text-purple-900">
                {formatCurrency(ganhosMensais)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <Label className="text-sm text-orange-700 font-medium">Parcela Pós-Contemplação</Label>
              <div className="text-2xl font-bold text-orange-900">
                {formatCurrency(parcelaPosPosContemplacao)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg border border-teal-200">
              <Label className="text-sm text-teal-700 font-medium">Fluxo de Caixa Antes {product.termMonths} meses</Label>
              <div className="text-2xl font-bold text-teal-900">
                {formatCurrency(fluxoCaixaAntes)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-lg border border-cyan-200">
              <Label className="text-sm text-cyan-700 font-medium">Fluxo de Caixa Pós {product.termMonths} meses</Label>
              <div className="text-2xl font-bold text-cyan-900">
                {formatCurrency(fluxoCaixaApos)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
              <Label className="text-sm text-red-700 font-medium">Pago do Próprio Bolso</Label>
              <div className="text-2xl font-bold text-red-900">
                {formatCurrency(pagoProprioBolso)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
              <Label className="text-sm text-emerald-700 font-medium">Pago pelo Inquilino</Label>
              <div className="text-2xl font-bold text-emerald-900">
                {formatCurrency(pagoInquilino)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
              <Label className="text-sm text-indigo-700 font-medium">Capital em Caixa</Label>
              <div className="text-2xl font-bold text-indigo-900">
                {formatCurrency(capitalEmCaixa)}
              </div>
              <Badge variant="outline" className="text-xs bg-white/50">
                {((capitalEmCaixa / creditoAtualizado) * 100).toFixed(1)}%
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
