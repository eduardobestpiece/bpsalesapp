
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
}

export const SingleLeverage = ({ administrator, product, propertyData, installmentType }: SingleLeverageProps) => {
  const [contemplationMonth, setContemplationMonth] = useState(24);
  
  const property = {
    id: 'single-property',
    type: propertyData.type,
    initialValue: product.nominalCreditValue,
    dailyRate: propertyData.dailyRate,
    monthlyRent: propertyData.monthlyRent,
    fixedMonthlyCosts: propertyData.fixedCosts,
    occupancyRatePct: propertyData.occupancyRate,
    annualAppreciationPct: propertyData.appreciationRate,
    contemplationMonth
  };

  const { summaryIndicators, leverageCalculations } = useAdvancedCalculations({
    administrator,
    product,
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

  // Calcular valores específicos para alavancagem única
  const propertyValueAtContemplation = product.nominalCreditValue;
  const propertyValueAtEnd = propertyValueAtContemplation * Math.pow(1 + propertyData.appreciationRate / 100, product.termMonths / 12);
  const paidByOwner = summaryIndicators.totalPaidByConsortium;
  const paidByTenant = summaryIndicators.finalCreditValue - paidByOwner;
  const savedCapital = propertyValueAtContemplation - paidByOwner;
  const cashFlowBeforeEnd = leverageCalculations.length > 0 ? leverageCalculations[0]?.cashFlow || 0 : 0;
  const cashFlowAfterEnd = propertyValueAtEnd * 0.005; // 0.5% ao mês como estimativa

  // Dados para o gráfico
  const chartData = [];
  for (let month = 1; month <= product.termMonths; month++) {
    const appreciatedValue = propertyValueAtContemplation * Math.pow(1 + propertyData.appreciationRate / 100, month / 12);
    const leverageData = leverageCalculations.find(l => l.month === month);
    
    chartData.push({
      month,
      patrimony: month >= contemplationMonth ? appreciatedValue : 0,
      income: leverageData?.netRevenue || 0,
      cashFlow: leverageData?.cashFlow || 0,
      isContemplation: month === contemplationMonth
    });
  }

  return (
    <div className="space-y-6">
      {/* Controle de Contemplação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mês de Contemplação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Label>Contemplação no mês: {contemplationMonth}</Label>
            <Slider
              value={[contemplationMonth]}
              onValueChange={(value) => setContemplationMonth(value[0])}
              min={6}
              max={product.termMonths}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>6 meses</span>
              <span>{product.termMonths} meses</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Label htmlFor="contemplation-input">Ou digite o mês:</Label>
            <Input
              id="contemplation-input"
              type="number"
              value={contemplationMonth}
              onChange={(e) => setContemplationMonth(Math.min(Math.max(6, Number(e.target.value)), product.termMonths))}
              min={6}
              max={product.termMonths}
              className="w-24"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dados da Alavancagem */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados da Alavancagem Única</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Patrimônio na Contemplação</Label>
              <div className="text-xl font-semibold text-primary">
                {formatCurrency(propertyValueAtContemplation)}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Patrimônio ao Final</Label>
              <div className="text-xl font-semibold text-success">
                {formatCurrency(propertyValueAtEnd)}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Pago do Próprio Bolso</Label>
              <div className="text-xl font-semibold text-destructive">
                {formatCurrency(paidByOwner)}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Pago pelo Inquilino</Label>
              <div className="text-xl font-semibold text-success">
                {formatCurrency(paidByTenant)}
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
                <Label className="text-sm text-muted-foreground">Parcela Pós-Contemplação</Label>
                <div className="text-xl font-semibold text-warning">
                  {formatCurrency((summaryIndicators.finalCreditValue - paidByOwner) / (product.termMonths - contemplationMonth))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico Patrimonial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolução Patrimonial</CardTitle>
        </CardHeader>
        <CardContent>
          <PatrimonyChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
};
