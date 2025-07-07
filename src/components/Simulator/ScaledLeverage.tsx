
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
}

export const ScaledLeverage = ({ administrator, product, propertyData, installmentType }: ScaledLeverageProps) => {
  const [contemplationFrequency, setContemplationFrequency] = useState(60); // A cada 5 anos
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calcular quantas contemplações ocorrerão
  const totalContemplations = Math.floor(product.termMonths / contemplationFrequency);
  const contemplationMonths = Array.from({ length: totalContemplations }, (_, i) => (i + 1) * contemplationFrequency);

  // Calcular valores agregados para múltiplas propriedades
  const propertyValueAtContemplation = product.nominalCreditValue * totalContemplations;
  const propertyValueAtEnd = propertyValueAtContemplation * Math.pow(1 + propertyData.appreciationRate / 100, product.termMonths / 12);
  
  // Simulação simplificada para múltiplas propriedades
  const totalPaidByOwner = (product.nominalCreditValue * 0.4) * totalContemplations; // Estimativa de 40% pago pelo proprietário
  const totalPaidByTenant = propertyValueAtContemplation - totalPaidByOwner;
  const savedCapital = propertyValueAtContemplation - totalPaidByOwner;
  
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
    
    const currentPatrimony = contemplatedProperties * product.nominalCreditValue * 
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
      {/* Controle de Frequência de Contemplação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Frequência de Contemplação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Label>A cada {contemplationFrequency} meses ({(contemplationFrequency / 12).toFixed(1)} anos)</Label>
            <Slider
              value={[contemplationFrequency]}
              onValueChange={(value) => setContemplationFrequency(value[0])}
              min={12}
              max={120}
              step={12}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>1 ano</span>
              <span>10 anos</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Label htmlFor="frequency-input">Ou digite a frequência (meses):</Label>
            <Input
              id="frequency-input"
              type="number"
              value={contemplationFrequency}
              onChange={(e) => setContemplationFrequency(Math.min(Math.max(12, Number(e.target.value)), 120))}
              min={12}
              max={120}
              step={12}
              className="w-24"
            />
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <Label className="text-sm">Total de Contemplações Esperadas: {totalContemplations}</Label>
            <div className="text-xs text-muted-foreground mt-1">
              Contemplações nos meses: {contemplationMonths.join(', ')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados da Alavancagem Escalonada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados da Alavancagem Escalonada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Patrimônio na Contemplação</Label>
              <div className="text-xl font-semibold text-primary">
                {formatCurrency(propertyValueAtContemplation)}
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
                +{((propertyValueAtEnd / propertyValueAtContemplation - 1) * 100).toFixed(1)}%
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
                {((savedCapital / propertyValueAtContemplation) * 100).toFixed(1)}%
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
