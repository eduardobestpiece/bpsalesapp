
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { SimulatorData } from '@/types/simulator';
import { Home } from 'lucide-react';

interface ResultsPanelProps {
  data: SimulatorData;
  showResults: boolean;
}

export const ResultsPanel = ({ data, showResults }: ResultsPanelProps) => {
  if (!showResults) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Home className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Preencha os dados e clique em "Calcular" para ver os resultados</p>
        </div>
      </div>
    );
  }

  // Mock data for demonstration - replace with actual calculations
  const propertyGrowthData = [
    { month: 0, properties: 0 },
    { month: 12, properties: 1 },
    { month: 24, properties: 2 },
    { month: 36, properties: 3 },
    { month: 48, properties: 4 },
    { month: 60, properties: 5 },
  ];

  const capitalGainData = Array.from({ length: 30 }, (_, i) => ({
    month: i + 1,
    gain: Math.max(0, (i + 1) * 1000 - Math.pow(i, 1.2) * 800)
  }));

  const getResultTitle = () => {
    switch (data.simulationType) {
      case 'installment': return 'Crédito';
      case 'credit': return 'Valor da Parcela';
      case 'income': return 'Valor da Parcela';
    }
  };

  const getResultValue = () => {
    switch (data.simulationType) {
      case 'installment': return 'R$ 200.000';
      case 'credit': return 'R$ 1.250';
      case 'income': return 'R$ 1.250';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Resultados</h2>
        
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
              <div className="text-2xl font-bold">R$ 1.250.000</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Renda Passiva Cheia</div>
              <div className="text-2xl font-bold">R$ 8.500</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Renda Passiva Líquida</div>
              <div className="text-2xl font-bold text-green-600">R$ 6.750</div>
            </CardContent>
          </Card>
        </div>

        {/* Property Growth Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Evolução Patrimonial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={propertyGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} imóveis`, 'Patrimônio']}
                    labelFormatter={(month) => `Mês ${month}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="properties" 
                    stroke="#d97706" 
                    strokeWidth={3}
                    dot={{ fill: '#d97706', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Property icons overlay */}
            <div className="flex justify-between items-end mt-2 px-8">
              {propertyGrowthData.slice(1).map((point, index) => (
                <div key={index} className="flex flex-col items-center">
                  <Home className="h-6 w-6 text-amber-600 mb-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Capital Gain Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ganho de Capital</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capitalGainData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value) => [`R$ ${value}`, 'Ganho']}
                    labelFormatter={(month) => `Mês ${month}`}
                  />
                  <Bar 
                    dataKey="gain" 
                    fill="#d97706"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
