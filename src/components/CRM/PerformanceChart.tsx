
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PerformanceData {
  name: string;
  value: number;
  target: number;
  percentage: number;
}

interface PerformanceChartProps {
  title: string;
  data: PerformanceData[];
}

export const PerformanceChart = ({ title, data }: PerformanceChartProps) => {
  const getBarColor = (percentage: number) => {
    if (percentage >= 100) return '#22c55e'; // Verde - acima da meta
    if (percentage >= 80) return '#eab308'; // Amarelo - próximo da meta
    return '#ef4444'; // Vermelho - abaixo da meta
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            <span className="text-blue-600">Atual: {data.value}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Meta: {data.target}</span>
          </p>
          <p className="text-sm">
            <span className={`font-medium ${data.percentage >= 100 ? 'text-green-600' : 'text-red-600'}`}>
              {data.percentage.toFixed(1)}% da meta
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legenda */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>≥ 100% da meta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>80-99% da meta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>&lt; 80% da meta</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
