
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
}

export const ScaledLeverage = ({ administrator, product, propertyData, installmentType, simulationData, contemplationMonth, valorImovel }: ScaledLeverageProps) => {
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

  // Calcular valores agregados para múltiplas propriedades baseado no valor de simulação
  const totalCreditValue = baseCreditValue * totalContemplations;
  const propertyValueAtEnd = totalCreditValue * Math.pow(1 + propertyData.appreciationRate / 100, product.termMonths / 12);
  
  // Simulação baseada nos dados de simulação
  const totalPaidByOwner = simulationData.searchType === 'contribution' 
    ? simulationData.value * product.termMonths * totalContemplations // Para aporte
    : baseCreditValue * 0.4 * totalContemplations; // Para crédito, estimativa de 40% pago pelo proprietário
    
  const totalPaidByTenant = totalCreditValue - totalPaidByOwner;
  const savedCapital = totalCreditValue - totalPaidByOwner;
  
  // Fluxo de caixa estimado baseado no número de propriedades
  const monthlyIncomePerProperty = propertyData.type === 'short-stay' 
    ? (propertyData.dailyRate || 150) * 30 * ((propertyData.occupancyRate || 80) / 100) * 0.85
    : (propertyData.monthlyRent || 2500);
  
  const netIncomePerProperty = monthlyIncomePerProperty - propertyData.fixedCosts;
  const cashFlowBeforeEnd = netIncomePerProperty * totalContemplations * 0.7; // 70% após parcelas
  const cashFlowAfterEnd = netIncomePerProperty * totalContemplations;

  // Dados para o gráfico
  const chartData = [];
  for (let month = 1; month <= product.termMonths; month++) {
    // Quantas propriedades já foram contempladas até este mês
    const contemplatedProperties = contemplationMonths.filter(cm => cm <= month).length;
    
    const currentPatrimony = contemplatedProperties * baseCreditValue * 
      Math.pow(1 + propertyData.appreciationRate / 100, month / 12);
    
    const currentIncome = contemplatedProperties * netIncomePerProperty;
    const currentCashFlow = currentIncome * 0.7; // Estimativa após parcelas
    
    chartData.push({
      month,
      patrimony: currentPatrimony,
      income: currentIncome,
      cashFlow: currentCashFlow,
      isContemplation: contemplationMonths.includes(month)
    });
  }

  return (
    <div className="space-y-6">
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
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Patrimônio Total Contemplado</Label>
              <div className="text-xl font-semibold text-primary">
                {formatCurrency(totalCreditValue)}
              </div>
              <Badge variant="outline" className="text-xs">
                {totalContemplations} propriedades
              </Badge>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Patrimônio ao Final</Label>
              <div className="text-xl font-semibold text-success">
                {formatCurrency(propertyValueAtEnd)}
              </div>
              <Badge variant="outline" className="text-xs">
                +{((propertyValueAtEnd / totalCreditValue - 1) * 100).toFixed(1)}%
              </Badge>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Pago do Próprio Bolso</Label>
              <div className="text-xl font-semibold text-destructive">
                {formatCurrency(totalPaidByOwner)}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Pago pelos Inquilinos</Label>
              <div className="text-xl font-semibold text-success">
                {formatCurrency(totalPaidByTenant)}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Capital Guardado</Label>
              <div className="text-xl font-semibold text-primary">
                {formatCurrency(savedCapital)}
              </div>
              <Badge variant="outline" className="text-xs">
                {((savedCapital / totalCreditValue) * 100).toFixed(1)}%
              </Badge>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Fluxo de Caixa Antes</Label>
              <div className="text-xl font-semibold text-success">
                {formatCurrency(cashFlowBeforeEnd)}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Fluxo de Caixa Após</Label>
              <div className="text-xl font-semibold text-success">
                {formatCurrency(cashFlowAfterEnd)}
              </div>
            </div>
            
            {installmentType !== 'full' && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Parcelas Pós-Contemplação</Label>
                <div className="text-xl font-semibold text-warning">
                  {formatCurrency(totalPaidByTenant / (product.termMonths / 2))}
                </div>
                <Badge variant="outline" className="text-xs">
                  Média mensal
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico Patrimonial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolução Patrimonial Escalonada</CardTitle>
        </CardHeader>
        <CardContent>
          <PatrimonyChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
};
