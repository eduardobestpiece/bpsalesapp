
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

interface ScaledLeverageProps {
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

export const ScaledLeverage = ({ administrator, product, propertyData, installmentType, simulationData, contemplationMonth, valorImovel, numeroImoveis = 0, patrimonioContemplacao }: ScaledLeverageProps) => {
  // Usar contemplationMonth como frequência de contemplação
  const [contemplationFrequency, setContemplationFrequency] = useState(contemplationMonth || 60);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calcular crédito baseado no valor desejado
  // Agora, simulationData.value já é o Crédito Acessado
  const baseCreditValue = simulationData.value;

  // Calcular quantas contemplações ocorrerão
  const totalContemplations = Math.floor(product.termMonths / contemplationMonth);
  const contemplationMonths = Array.from({ length: totalContemplations }, (_, i) => (i + 1) * contemplationMonth);

  // Aplicar os mesmos cálculos da alavancagem única para cada contemplação
  const taxaAtualizacaoAnual = simulationData.updateRate / 100;
  const taxaValorizacao = propertyData.appreciationRate / 100;
  
  // Calcular valores agregados para múltiplas propriedades
  const totalCreditValue = baseCreditValue * totalContemplations;
  const propertyValueAtEnd = totalCreditValue * Math.pow(1 + taxaValorizacao, product.termMonths / 12);
  
  // Ganhos mensais por propriedade
  const ganhosMensaisPorPropriedade = propertyData.type === 'short-stay' 
    ? (propertyData.dailyRate || 150) * 30 * ((propertyData.occupancyRate || 80) / 100)
    : (propertyData.monthlyRent || 2500);
  
  // Cálculos mais precisos baseados nas contemplações escalonadas
  let totalPaidByOwner = 0;
  let totalPaidByTenant = 0;
  let totalCashFlowBefore = 0;
  let totalCashFlowAfter = 0;
  
  // Calcular para cada contemplação
  for (let i = 0; i < totalContemplations; i++) {
    const contemplationMonthForThis = (i + 1) * contemplationMonth;
    
    // Valor da parcela e crédito atualizado para esta contemplação
    const parcelaMensal = baseCreditValue / product.termMonths;
    const creditoAtualizado = baseCreditValue * Math.pow(1 + taxaAtualizacaoAnual, contemplationMonthForThis / 12);
    const valorPagoAteContemplacao = parcelaMensal * contemplationMonthForThis * Math.pow(1 + taxaAtualizacaoAnual, contemplationMonthForThis / 24);
    const saldoDevedor = creditoAtualizado - valorPagoAteContemplacao;
    const receitaTotal = ganhosMensaisPorPropriedade * (product.termMonths - contemplationMonthForThis);
    const valorLiquidoAposContemplacao = Math.max(0, saldoDevedor - receitaTotal);
    const pagoProprioBolsoEsta = valorPagoAteContemplacao + valorLiquidoAposContemplacao;
    const pagoInquilinoEsta = creditoAtualizado - pagoProprioBolsoEsta;
    
    totalPaidByOwner += pagoProprioBolsoEsta;
    totalPaidByTenant += pagoInquilinoEsta;
    
    // Fluxo de caixa para esta contemplação
    const parcelaPosPosContemplacao = saldoDevedor / (product.termMonths - contemplationMonthForThis);
    const fluxoCaixaAntes = ganhosMensaisPorPropriedade - (propertyData.fixedCosts + parcelaPosPosContemplacao);
    const fluxoCaixaApos = ganhosMensaisPorPropriedade * Math.pow(1 + taxaValorizacao, (product.termMonths + 1) / 12) - propertyData.fixedCosts;
    
    totalCashFlowBefore += fluxoCaixaAntes;
    totalCashFlowAfter += fluxoCaixaApos;
  }
  
  const savedCapital = totalPaidByTenant;

  // Dados para o gráfico com atualização anual
  const chartData = [];
  for (let month = 1; month <= product.termMonths; month++) {
    // Quantas propriedades já foram contempladas até este mês
    const contemplatedProperties = contemplationMonths.filter(cm => cm <= month).length;
    
    // Patrimônio total com valorização
    const currentPatrimony = contemplatedProperties * baseCreditValue * 
      Math.pow(1 + taxaValorizacao, month / 12);
    
    // Rendimentos com atualização anual
    const yearsFromStart = Math.floor(month / 12);
    const currentIncome = contemplatedProperties * ganhosMensaisPorPropriedade * 
      Math.pow(1 + taxaValorizacao, yearsFromStart);
    
    // Fluxo de caixa com atualização anual
    const avgCashFlowPerProperty = (totalCashFlowBefore + totalCashFlowAfter) / (2 * totalContemplations);
    const currentCashFlow = contemplatedProperties * avgCashFlowPerProperty * 
      Math.pow(1 + taxaValorizacao, yearsFromStart);
    
    chartData.push({
      month,
      patrimony: currentPatrimony,
      income: currentIncome,
      cashFlow: currentCashFlow,
      isContemplation: contemplationMonths.includes(month)
    });
  }
  
  // Número de imóveis ao final do período
  const numeroImoveisAoFinal = totalContemplations;

  // Calcular patrimônio na contemplação
  const patrimonioNaContemplacao = patrimonioContemplacao !== undefined ? patrimonioContemplacao : totalCreditValue;

  return (
    <div className="space-y-6">
      {/* Número de imóveis */}
      <Card className="mb-2">
        <CardContent className="p-4 flex items-center gap-4">
          <Label className="text-sm font-medium">Número de imóveis:</Label>
          <span className="text-lg font-bold">{numeroImoveis}</span>
        </CardContent>
      </Card>
      {/* Informações do Crédito Calculado */}
      {simulationData.searchType === 'credit' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-blue-800">Crédito por Contemplação</Label>
                <div className="text-lg font-semibold text-blue-900">
                  {formatCurrency(baseCreditValue)}
                </div>
              </div>
              <div className="text-right">
                <Label className="text-sm text-blue-600">Total de Créditos</Label>
                <div className="text-lg font-semibold text-blue-900">
                  {formatCurrency(totalCreditValue)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Removido Card de Frequência de Contemplação */}

      {/* Dados da Alavancagem Escalonada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados da Alavancagem Escalonada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <Label className="text-sm text-blue-700 font-medium">Patrimônio Total Contemplado</Label>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(patrimonioNaContemplacao)}
              </div>
              <Badge variant="outline" className="text-xs bg-white/50">
                {numeroImoveis} propriedades
              </Badge>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
              <Label className="text-sm text-green-700 font-medium">Patrimônio ao Final</Label>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(propertyValueAtEnd)}
              </div>
              <Badge variant="outline" className="text-xs bg-white/50">
                +{((propertyValueAtEnd / totalCreditValue - 1) * 100).toFixed(1)}%
              </Badge>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <Label className="text-sm text-purple-700 font-medium">Ganhos Mensais Totais</Label>
              <div className="text-2xl font-bold text-purple-900">
                {formatCurrency(ganhosMensaisPorPropriedade * totalContemplations)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
              <Label className="text-sm text-red-700 font-medium">Pago do Próprio Bolso</Label>
              <div className="text-2xl font-bold text-red-900">
                {formatCurrency(totalPaidByOwner)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
              <Label className="text-sm text-emerald-700 font-medium">Pago pelos Inquilinos</Label>
              <div className="text-2xl font-bold text-emerald-900">
                {formatCurrency(totalPaidByTenant)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
              <Label className="text-sm text-indigo-700 font-medium">Capital em Caixa</Label>
              <div className="text-2xl font-bold text-indigo-900">
                {formatCurrency(savedCapital)}
              </div>
              <Badge variant="outline" className="text-xs bg-white/50">
                {((savedCapital / totalCreditValue) * 100).toFixed(1)}%
              </Badge>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg border border-teal-200">
              <Label className="text-sm text-teal-700 font-medium">Fluxo de Caixa Antes {product.termMonths} meses</Label>
              <div className="text-2xl font-bold text-teal-900">
                {formatCurrency(totalCashFlowBefore)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-lg border border-cyan-200">
              <Label className="text-sm text-cyan-700 font-medium">Fluxo de Caixa Pós {product.termMonths} meses</Label>
              <div className="text-2xl font-bold text-cyan-900">
                {formatCurrency(totalCashFlowAfter)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico Patrimonial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolução Patrimonial Escalonada</CardTitle>
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
