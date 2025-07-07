
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { SimulatorData } from '@/types/simulator';
import { Home, TrendingUp, DollarSign, Calculator } from 'lucide-react';
import { calculateConsortium, calculateAirbnb, calculatePatrimonialEvolution } from '@/utils/calculations';

interface ResultsPanelProps {
  data: SimulatorData;
  showResults: boolean;
}

export const ResultsPanel = ({ data, showResults }: ResultsPanelProps) => {
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

  // Calculate real results
  const consortiumCalc = calculateConsortium(data);
  const airbnbCalc = calculateAirbnb(consortiumCalc);
  const evolutionData = calculatePatrimonialEvolution(data);

  const getResultTitle = () => {
    switch (data.simulationType) {
      case 'installment': return 'Crédito Calculado';
      case 'credit': return 'Valor da Parcela';
      case 'income': return 'Valor da Parcela para Renda';
    }
  };

  const getResultValue = () => {
    switch (data.simulationType) {
      case 'installment': return `R$ ${consortiumCalc.creditValue.toLocaleString('pt-BR')}`;
      case 'credit': return `R$ ${consortiumCalc.installmentAfterContemplation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      case 'income': return `R$ ${consortiumCalc.installmentAfterContemplation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
  };

  const finalEvolution = evolutionData[evolutionData.length - 1];
  const totalPatrimony = finalEvolution.equity;
  const grossPassiveIncome = finalEvolution.passiveIncome;
  const netPassiveIncome = grossPassiveIncome * 0.8; // Considering 20% expenses

  return (
    <div className="space-y-6">
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
              <div className="text-2xl font-bold">R$ {totalPatrimony.toLocaleString('pt-BR')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Renda Passiva Bruta</div>
              <div className="text-2xl font-bold">R$ {grossPassiveIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Renda Passiva Líquida</div>
              <div className="text-2xl font-bold text-green-600">R$ {netPassiveIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
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
                  <span className="font-medium">R$ {consortiumCalc.creditValue.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Parcela Antes da Contemplação:</span>
                  <span className="font-medium">R$ {consortiumCalc.installmentBeforeContemplation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Parcela Após Contemplação:</span>
                  <span className="font-medium">R$ {consortiumCalc.installmentAfterContemplation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total de Parcelas:</span>
                  <span className="font-medium">{consortiumCalc.installments}</span>
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
                  <span className="font-medium">R$ {airbnbCalc.paidPropertyValue.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Diária:</span>
                  <span className="font-medium">R$ {airbnbCalc.dailyRate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Ocupação:</span>
                  <span className="font-medium">{airbnbCalc.occupancyRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Receita Mensal:</span>
                  <span className="font-medium">R$ {airbnbCalc.receivedRental.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Geração de Caixa:</span>
                  <span className={`font-medium ${airbnbCalc.activeCashGeneration > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {airbnbCalc.activeCashGeneration.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                      return [`R$ ${Number(value).toLocaleString('pt-BR')}`, name];
                    }}
                    labelFormatter={(month) => `Mês ${month}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="properties" 
                    stroke="#d97706" 
                    strokeWidth={3}
                    dot={{ fill: '#d97706', strokeWidth: 2, r: 6 }}
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
            <CardTitle>Evolução da Renda Passiva</CardTitle>
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
                    formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Renda Passiva']}
                    labelFormatter={(month) => `Mês ${month}`}
                  />
                  <Bar 
                    dataKey="passiveIncome" 
                    fill="#d97706"
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
            Em {data.simulationTime} meses: {finalEvolution.properties} imóveis • R$ {netPassiveIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de renda líquida
          </Badge>
        </div>
      </div>
    </div>
  );
};
