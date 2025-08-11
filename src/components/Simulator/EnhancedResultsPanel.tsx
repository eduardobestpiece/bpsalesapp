
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { SimulatorData } from '@/types/simulator';
import { Home, TrendingUp, DollarSign, Calculator, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { useCalculations } from '@/hooks/useCalculations';
import { CalculationStatus } from './CalculationStatus';
import { formatCurrency } from '@/utils/calculationHelpers';

interface EnhancedResultsPanelProps {
  data: SimulatorData;
  showResults: boolean;
}

export const EnhancedResultsPanel = ({ data, showResults }: EnhancedResultsPanelProps) => {
  const { 
    consortiumData, 
    airbnbData, 
    evolutionData, 
    isCalculating, 
    calculationError 
  } = useCalculations(data);

  if (!showResults) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Calculator className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Preencha os dados e clique em "Calcular" para ver os resultados</p>
        </div>
      </div>
    );
  }

  const getResultTitle = () => {
    switch (data.simulationType) {
      case 'installment': return 'Crédito Calculado';
      case 'credit': return 'Valor da Parcela';
      case 'income': return 'Valor da Parcela para Renda';
    }
  };

  const getResultValue = () => {
    if (!consortiumData) return 'Calculando...';
    switch (data.simulationType) {
      case 'installment': return formatCurrency(consortiumData.creditValue);
      case 'credit': return formatCurrency(consortiumData.installmentAfterContemplation);
      case 'income': return formatCurrency(consortiumData.installmentAfterContemplation);
    }
  };

  // Dados para o gráfico de pizza dos custos
  const costBreakdown = consortiumData ? [
    { name: 'Principal', value: consortiumData.creditValue - (consortiumData.creditValue * (consortiumData.administrationTax + consortiumData.insurance + consortiumData.reserveFund) / 100), color: '#A86F57' },
    { name: 'Taxa Admin', value: consortiumData.creditValue * consortiumData.administrationTax / 100, color: 'var(--brand-primary)' },
    { name: 'Seguro', value: consortiumData.creditValue * consortiumData.insurance / 100, color: '#fbbf24' },
    { name: 'Fundo Reserva', value: consortiumData.creditValue * consortiumData.reserveFund / 100, color: '#fcd34d' }
  ] : [];

  const finalEvolution = evolutionData.length > 0 ? evolutionData[evolutionData.length - 1] : { equity: 0, passiveIncome: 0, properties: 0 };
  const totalPatrimony = finalEvolution.equity;
  const grossPassiveIncome = finalEvolution.passiveIncome;
  const netPassiveIncome = grossPassiveIncome * 0.8;

  return (
    <div className="space-y-6">
      <CalculationStatus 
        isCalculating={isCalculating}
        error={calculationError}
        hasResults={!!consortiumData && !!airbnbData}
      />

      {consortiumData && airbnbData && (
        <>
          <div>
            <h2 className="text-2xl font-bold mb-4">Resultados da Simulação</h2>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">{getResultTitle()}</div>
                  <div className="text-2xl font-bold text-amber-600">{getResultValue()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Patrimônio Total</div>
                  <div className="text-2xl font-bold">{formatCurrency(totalPatrimony)}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Renda Passiva Bruta</div>
                  <div className="text-2xl font-bold">{formatCurrency(grossPassiveIncome)}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Renda Passiva Líquida</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(netPassiveIncome)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Detalhes do Consórcio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Valor do Crédito:</span>
                      <span className="font-medium">{formatCurrency(consortiumData.creditValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Parcela Antes da Contemplação:</span>
                      <span className="font-medium">{formatCurrency(consortiumData.installmentBeforeContemplation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Parcela Após Contemplação:</span>
                      <span className="font-medium">{formatCurrency(consortiumData.installmentAfterContemplation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total de Parcelas:</span>
                      <span className="font-medium">{consortiumData.installments}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Detalhes do Airbnb
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Valor Pago Inicial:</span>
                      <span className="font-medium">{formatCurrency(airbnbData.paidPropertyValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Diária:</span>
                      <span className="font-medium">{formatCurrency(airbnbData.dailyRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de Ocupação:</span>
                      <span className="font-medium">{airbnbData.occupancyRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Receita Mensal:</span>
                      <span className="font-medium">{formatCurrency(airbnbData.receivedRental)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Geração de Caixa:</span>
                      <span className={`font-medium ${airbnbData.activeCashGeneration > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(airbnbData.activeCashGeneration)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cost Breakdown Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Composição dos Custos do Consórcio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {costBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {costBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Property Growth Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Evolução Patrimonial ao Longo do Tempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolutionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Meses', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Imóveis', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'properties') return [`${value} imóveis`, 'Patrimônio'];
                          return [formatCurrency(Number(value)), name];
                        }}
                        labelFormatter={(month) => `Mês ${month}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="properties" 
                        stroke="var(--brand-primary)" 
                        strokeWidth={3}
                        dot={{ fill: 'var(--brand-primary)', strokeWidth: 2, r: 6 }}
                        name="properties"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Evolução da Renda Passiva
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evolutionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Meses', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'R$', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), 'Renda Passiva']}
                        labelFormatter={(month) => `Mês ${month}`}
                      />
                      <Bar 
                        dataKey="passiveIncome" 
                        fill="var(--brand-primary)"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Summary Badge */}
            <div className="flex justify-center mt-6">
              <Badge variant="outline" className="text-lg p-3">
                Em {data.simulationTime} meses: {finalEvolution.properties} imóveis • {formatCurrency(netPassiveIncome)} de renda líquida
              </Badge>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
