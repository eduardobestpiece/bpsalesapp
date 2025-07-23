
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { House } from 'lucide-react';
import { useState } from 'react';
import { generateConsortiumInstallments } from '@/utils/consortiumInstallments';

interface ChartDataPoint {
  month: number;
  patrimony: number;
  income: number;
  cashFlow: number;
  isContemplation: boolean;
  patrimonioInicial?: number;
  valorizacaoMes?: number;
  valorizacaoAcumulada?: number;
  acumuloCaixa?: number;
  parcelaTabelaMes?: number; // Valor exato da tabela de detalhamento
  parcelasPagas?: number;
}

interface PatrimonyChartProps {
  data: ChartDataPoint[];
  // Parâmetros necessários para gerar os dados da tabela de detalhamento
  product?: any;
  administrator?: any;
  contemplationMonth?: number;
  installmentType?: string;
  creditoAcessado?: number;
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

    // Calcular valores
    const patrimonioInicial = data.patrimonioInicial || 0;
    const valorizacaoMes = data.valorizacaoMes || 0;
    const valorizacaoAcumulada = data.valorizacaoAcumulada || 0;
    const acumuloCaixa = data.acumuloCaixa || 0;
    const parcelaTabelaMes = data.parcelaTabelaMes || 0; // Valor exato da tabela
    const parcelasPagas = data.parcelasPagas || 0;
    const ganho = data.cashFlow + valorizacaoMes;
    const ganhoTotal = valorizacaoAcumulada + acumuloCaixa;

    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        {active && payload && payload.length ? (
          <div className="custom-tooltip">
            <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#222' }}>
              {payload[0]?.payload?.month
                ? `Mês: ${payload[0].payload.month}`
                : label
                  ? `Mês: ${label}`
                  : ''}
            </div>
            <p className="text-primary">
              <span className="font-medium">Patrimônio:</span> {formatCurrency(data.patrimony)}
            </p>
            <p className="text-success">
              <span className="font-medium">Rendimentos:</span> {formatCurrency(data.income)}
            </p>
            <p className="text-warning">
              <span className="font-medium">Fluxo de Caixa:</span> {formatCurrency(data.cashFlow)}
            </p>
            <p className="text-blue-600">
              <span className="font-medium">Acúmulo de Caixa:</span> {formatCurrency(acumuloCaixa)}
            </p>
            <p className="text-purple-600">
              <span className="font-medium">Valorização:</span> {formatCurrency(valorizacaoMes)}
            </p>
            <p className="text-indigo-600">
              <span className="font-medium">Valorização Acumulada:</span> {formatCurrency(valorizacaoAcumulada)}
            </p>
            <p className="text-orange-600">
              <span className="font-medium">Ganho:</span> {formatCurrency(ganho)}
            </p>
            <p className="text-green-600">
              <span className="font-medium">Ganho Total:</span> {formatCurrency(ganhoTotal)}
            </p>
            <p className="text-red-600">
              <span className="font-medium">Parcela do mês (tabela):</span> {formatCurrency(parcelaTabelaMes)}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Parcelas pagas:</span> {formatCurrency(parcelasPagas)}
            </p>
            {data.isContemplation && (
              <p className="text-primary font-bold text-sm mt-2">📍 Contemplação</p>
            )}
          </div>
        ) : null}
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
          r={12} 
          fill="#fff" 
          stroke="#A86F57" 
          strokeWidth={3}
        />
        <foreignObject x={cx - 10} y={cy - 10} width={20} height={20}>
          <div className="flex items-center justify-center w-full h-full">
            <House className="w-5 h-5" style={{ color: "#A86F57" }} />
          </div>
        </foreignObject>
      </g>
    );
  }
  
  return null;
};

// Função para sincronizar os dados do gráfico com a tabela de detalhamento
const synchronizeWithTable = (
  chartData: ChartDataPoint[],
  product: any,
  administrator: any,
  contemplationMonth: number,
  installmentType: string,
  creditoAcessado: number
): ChartDataPoint[] => {
  if (!product || !administrator) {
    console.warn('[PatrimonyChart] Parâmetros insuficientes para sincronização com tabela');
    return chartData;
  }

  try {
    // Gerar dados da tabela de detalhamento com os mesmos parâmetros
    const tableData = generateConsortiumInstallments({
      product,
      administrator,
      contemplationMonth,
      selectedCredits: [],
      creditoAcessado,
      embutido: 'com', // ou 'sem', dependendo da configuração
      installmentType,
      maxEmbeddedPercentage: administrator.maxEmbeddedPercentage || 25
    });

    console.log('[PatrimonyChart] Sincronizando dados da tabela:', tableData.slice(0, 5));

    // Sincronizar os valores de parcela do gráfico com a tabela
    return chartData.map((point, index) => {
      const tableEntry = tableData.find(entry => entry.month === point.month);
      
      if (tableEntry) {
        return {
          ...point,
          parcelaTabelaMes: tableEntry.installmentValue // Valor exato da tabela
        };
      }
      
      return {
        ...point,
        parcelaTabelaMes: 0
      };
    });
  } catch (error) {
    console.error('[PatrimonyChart] Erro na sincronização com tabela:', error);
    return chartData;
  }
};

export const PatrimonyChart = ({ 
  data, 
  product, 
  administrator, 
  contemplationMonth = 24, 
  installmentType = 'full',
  creditoAcessado = 0
}: PatrimonyChartProps) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState<any>(null);

  // Sincronizar dados do gráfico com a tabela de detalhamento
  const synchronizedData = synchronizeWithTable(
    data,
    product,
    administrator,
    contemplationMonth,
    installmentType,
    creditoAcessado
  );

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

  const handleClick = (data: any) => {
    if (tooltipVisible && tooltipData && tooltipData.month === data.month) {
      setTooltipVisible(false);
      setTooltipData(null);
    } else {
      setTooltipVisible(true);
      setTooltipData(data);
    }
  };

  return (
    <div className="w-full h-96 relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={synchronizedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
          onClick={handleClick}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="rgba(200, 200, 200, 0.3)" />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatXAxis}
            interval="preserveStartEnd"
          />
          <YAxis tickFormatter={formatYAxis} />
          <Tooltip 
            content={<CustomTooltip />} 
            active={tooltipVisible}
            payload={tooltipData ? [tooltipData] : []}
          />
          <Line 
            type="monotone" 
            dataKey="patrimony" 
            stroke="#A86F57" 
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={{ r: 8, fill: "#A86F57" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
