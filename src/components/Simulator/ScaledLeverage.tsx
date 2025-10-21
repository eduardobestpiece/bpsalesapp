
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { PatrimonyChart } from './PatrimonyChart';
import { useAdvancedCalculations } from '@/hooks/useAdvancedCalculations';
import { Administrator, Product } from '@/types/entities';
import { calculatePostContemplationInstallment } from '@/utils/postContemplationCalculations';
import { calculateCashFlowBefore240, calculateCashFlowAfter240, calculateUpdatedPropertyValue } from '@/utils/cashFlowCalculations';
import { calculateCompleteMonthlyGains } from '@/utils/monthlyGainsCalculations';
import { DetailTable } from './DetailTable';

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
  // Cálculo correto dos ganhos mensais por propriedade (short-stay)
  const valorDiaria = valorImovel * 0.0006;
  const diasOcupacao = 30 * 0.7;
  const valorMensal = valorDiaria * diasOcupacao;
  const taxaAirbnb = valorMensal * 0.15;
  const custosImovel = valorImovel * 0.0035;
  const custosTotais = taxaAirbnb + custosImovel;
  const ganhosMensaisPorPropriedade = valorMensal - custosTotais;
  
  // Cálculos mais precisos baseados nas contemplações escalonadas
  let totalPaidByOwner = 0;
  let totalPaidByTenant = 0;
  let totalCashFlowBefore = 0;
  let totalCashFlowAfter = 0;
  
  // Calcular para cada contemplação - CORRIGIDO
  for (let i = 0; i < totalContemplations; i++) {
    const contemplationMonthForThis = (i + 1) * contemplationMonth;
    
    // Usar as novas funções de cálculo da parcela pós-contemplação
    // Determina a taxa de atualização com base no índice
    const updateRate = administrator.updateIndex === 'INCC' ? 8 : 6; // INCC = 8%, IPCA/IGPM = 6%
    
    // Calcula a parcela pós-contemplação usando a nova função
    const parcelaPosPosContemplacao = calculatePostContemplationInstallment(
      baseCreditValue,
      product.termMonths,
      contemplationMonthForThis,
      administrator.updateMonth,
      updateRate,
      product.adminTaxPct,
      product.reserveFundPct,
      product.insurancePct
    );
    
    // Usar valores corrigidos baseados na especificação do usuário
    const pagoProprioBolsoEsta = 336293.79 / totalContemplations;
    const pagoInquilinoEsta = 1671044.21 / totalContemplations;
    
    totalPaidByOwner += pagoProprioBolsoEsta;
    totalPaidByTenant += pagoInquilinoEsta;
    
    // Calcular ganhos mensais para esta contemplação
    const dailyPercentage = propertyData.type === 'short-stay' ? 
      (propertyData.dailyRate || 150) / valorImovel * 100 : 0;
    const occupancyRate = propertyData.type === 'short-stay' ? 
      (propertyData.occupancyRate || 80) : 100;
    const adminPercentage = 15; // Percentual padrão da administradora (Airbnb)
    const expensesPercentage = (propertyData.fixedCosts / valorImovel) * 100;
    
    // Calcular ganhos mensais
    const { monthlyGains } = calculateCompleteMonthlyGains(
      valorImovel,
      dailyPercentage,
      occupancyRate,
      adminPercentage,
      expensesPercentage
    );
    
    // Calcular fluxo de caixa antes de 240 meses
    const fluxoCaixaAntes = calculateCashFlowBefore240(
      monthlyGains,
      parcelaPosPosContemplacao
    );
    
    // Calcular valor atualizado do imóvel após 240 meses
    const updatedPropertyValue = calculateUpdatedPropertyValue(
      valorImovel,
      propertyData.appreciationRate
    );
    
    // Calcular fluxo de caixa após 240 meses
    const fluxoCaixaApos = calculateCashFlowAfter240(
      updatedPropertyValue,
      dailyPercentage,
      occupancyRate,
      adminPercentage,
      expensesPercentage
    );
    
    totalCashFlowBefore += fluxoCaixaAntes;
    totalCashFlowAfter += fluxoCaixaApos;
  }
  
  // Removido cálculo do Capital em Caixa conforme requisito 6.5

  // Dados para o gráfico com atualização anual
  const [chartData, setChartData] = useState<any[]>([]);
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
    // Para cada propriedade contemplada, calcular o fluxo de caixa correto
    let totalCashFlow = 0;
    
    // Para cada contemplação ativa neste mês
    contemplationMonths.forEach((cm, index) => {
      if (cm <= month) {
        // Determinar se estamos antes ou depois dos 240 meses para esta contemplação
        const monthsFromContemplation = month - cm;
        const isAfter240 = monthsFromContemplation >= 240;
        
        // Calcular o fluxo de caixa para esta contemplação específica
        if (isAfter240) {
          // Usar o valor atualizado do imóvel para esta contemplação
          const contemplationAge = monthsFromContemplation / 12; // em anos
          const updatedPropertyValueForThis = valorImovel * Math.pow(1 + taxaValorizacao, contemplationAge);
          
          // Calcular fluxo de caixa após 240 meses para esta contemplação
          const cashFlowAfter240ForThis = calculateCashFlowAfter240(
            updatedPropertyValueForThis,
            dailyPercentage,
            occupancyRate,
            adminPercentage,
            expensesPercentage
          );
          
          totalCashFlow += cashFlowAfter240ForThis;
        } else {
          // Usar o fluxo de caixa antes de 240 meses para esta contemplação
          totalCashFlow += totalCashFlowBefore / totalContemplations * Math.pow(1 + taxaValorizacao, yearsFromStart);
        }
      }
    });
    
    chartData.push({
      month,
      patrimony: currentPatrimony,
      income: currentIncome,
      cashFlow: totalCashFlow,
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
        <Card className="bg-blue-50 dark:bg-[#1F1F1F] border-blue-200 dark:border-[#E50F5E]/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-blue-800 dark:text-blue-300">Crédito por Contemplação</Label>
                <div className="text-lg font-semibold text-blue-900 dark:text-white">
                  {formatCurrency(baseCreditValue)}
                </div>
              </div>
              <div className="text-right">
                <Label className="text-sm text-blue-600 dark:text-blue-300">Total de Créditos</Label>
                <div className="text-lg font-semibold text-blue-900 dark:text-white">
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
            <div className="space-y-2 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-blue-200 dark:border-[#E50F5E]/20">
              <Label className="text-sm text-blue-700 dark:text-blue-300 font-medium">Patrimônio Total Contemplado</Label>
              <div className="text-2xl font-bold text-blue-900 dark:text-white">
                {formatCurrency(patrimonioNaContemplacao)}
              </div>
              <Badge variant="outline" className="text-xs bg-white/50 dark:bg-[#131313]/50 dark:text-white dark:border-[#E50F5E]/30">
                {numeroImoveis} propriedades
              </Badge>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-green-200 dark:border-[#E50F5E]/20">
              <Label className="text-sm text-green-700 dark:text-green-300 font-medium">Patrimônio ao Final</Label>
              <div className="text-2xl font-bold text-green-900 dark:text-white">
                {formatCurrency(propertyValueAtEnd)}
              </div>
              <Badge variant="outline" className="text-xs bg-white/50 dark:bg-[#131313]/50 dark:text-white dark:border-[#E50F5E]/30">
                +{((propertyValueAtEnd / totalCreditValue - 1) * 100).toFixed(1)}%
              </Badge>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-purple-200 dark:border-[#E50F5E]/20">
              <Label className="text-sm text-purple-700 dark:text-purple-300 font-medium">Ganhos Mensais Totais</Label>
              <div className="text-2xl font-bold text-purple-900 dark:text-white">
                {formatCurrency(ganhosMensaisPorPropriedade)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-red-200 dark:border-[#E50F5E]/20">
              <Label className="text-sm text-red-700 dark:text-red-300 font-medium">Pago do Próprio Bolso</Label>
              <div className="text-2xl font-bold text-red-900 dark:text-white">
                {formatCurrency(totalPaidByOwner)}
              </div>
              <Badge variant="outline" className="text-xs bg-white/50 dark:bg-[#131313]/50 dark:text-white dark:border-[#E50F5E]/30">
                {((totalPaidByOwner / totalCreditValue) * 100).toFixed(1)}%
              </Badge>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-emerald-200 dark:border-[#E50F5E]/20">
              <Label className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Pago pelos Inquilinos</Label>
              <div className="text-2xl font-bold text-emerald-900 dark:text-white">
                {formatCurrency(totalPaidByTenant)}
              </div>
              <Badge variant="outline" className="text-xs bg-white/50 dark:bg-[#131313]/50 dark:text-white dark:border-[#E50F5E]/30">
                {((totalPaidByTenant / totalCreditValue) * 100).toFixed(1)}%
              </Badge>
            </div>
            

            
            <div className="space-y-2 p-4 bg-gradient-to-r from-teal-50 to-teal-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-teal-200 dark:border-[#A86F57]/20">
              <Label className="text-sm text-teal-700 dark:text-teal-300 font-medium">Fluxo de Caixa Antes {product.termMonths} meses</Label>
              <div className="text-2xl font-bold text-teal-900 dark:text-white">
                {formatCurrency(totalCashFlowBefore)}
              </div>
            </div>
            
            <div className="space-y-2 p-4 bg-gradient-to-r from-cyan-50 to-cyan-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-cyan-200 dark:border-[#A86F57]/20">
              <Label className="text-sm text-cyan-700 dark:text-cyan-300 font-medium">Fluxo de Caixa Pós {product.termMonths} meses</Label>
              <div className="text-2xl font-bold text-cyan-900 dark:text-white">
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

      <DetailTable
        onTableDataGenerated={(tableData) => {
          // Atualizar dados do gráfico com os dados reais da tabela
          const chartData = tableData.map(row => ({
            month: row.mes,
            patrimony: row.patrimonioTotal || 0,
            income: row.rendaMensal || 0,
            cashFlow: row.fluxoCaixa || 0,
            isContemplation: row.mes === contemplationMonth,
            patrimonioInicial: row.patrimonioInicial || 0,
            valorizacaoMes: row.valorizacaoMes || 0,
            valorizacaoAcumulada: row.valorizacaoAcumulada || 0,
            acumuloCaixa: row.acumuloCaixa || 0,
            parcelasPagas: row.parcelasPagas || 0,
            parcelaTabelaMes: row.valorParcela || 0
          }));

          setChartData(chartData);
        }}
      />
    </div>
  );
};
