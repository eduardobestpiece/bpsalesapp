
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { House } from 'lucide-react';

interface ChartDataPoint {
  month: number;
  patrimony: number;
  income: number;
  cashFlow: number;
  isContemplation: boolean;
}

interface PatrimonyChartProps {
  data: ChartDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };

    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="font-semibold">{`Mês ${label}`}</p>
        <p className="text-primary">
          <span className="font-medium">Patrimônio:</span> {formatCurrency(data.patrimony)}
        </p>
        <p className="text-success">
          <span className="font-medium">Rendimentos:</span> {formatCurrency(data.income)}
        </p>
        <p className="text-warning">
          <span className="font-medium">Fluxo de Caixa:</span> {formatCurrency(data.cashFlow)}
        </p>
        {data.isContemplation && (
          <p className="text-primary font-bold text-sm mt-2">📍 Contemplação</p>
        )}
      </div>
    );
  }

  return null;
};

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  
  if (payload.isContemplation) {
    return (
      <g>
        <circle 
          cx={cx} 
          cy={cy} 
          r={8} 
          fill="#fff" 
          stroke="#6366f1" 
          strokeWidth={2}
        />
        <foreignObject x={cx - 8} y={cy - 8} width={16} height={16}>
          <div className="flex items-center justify-center w-full h-full">
            <House className="w-3 h-3 text-primary" />
          </div>
        </foreignObject>
      </g>
    );
  }
  
  return null;
};

export const PatrimonyChart = ({ data }: PatrimonyChartProps) => {
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const formatXAxis = (value: number) => {
    const years = Math.floor(value / 12);
    const months = value % 12;
    if (years > 0) {
      return months > 0 ? `${years}a${months}m` : `${years}a`;
    }
    return `${months}m`;
  };

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatXAxis}
            interval="preserveStartEnd"
          />
          <YAxis tickFormatter={formatYAxis} />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="patrimony" 
            stroke="#6366f1" 
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={{ r: 6, fill: "#6366f1" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
