
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { House } from 'lucide-react';
import { useState } from 'react';

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
              <span className="font-medium">Parcela do mês:</span> {formatCurrency(parcelaTabelaMes)}
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

// Função para gerar dados reais usando EXATAMENTE a mesma lógica da DetailTable
const generateRealPatrimonyData = (
  chartData: ChartDataPoint[],
  product: any,
  administrator: any,
  contemplationMonth: number,
  installmentType: string,
  creditoAcessado: number
): ChartDataPoint[] => {
  if (!product || !administrator) {
    console.warn('[PatrimonyChart] Parâmetros insuficientes para gerar dados reais');
    return chartData.map(point => ({ ...point, parcelaTabelaMes: 0 }));
  }

  try {
    // Gerar dados usando EXATAMENTE a mesma lógica da DetailTable
    const totalMonths = Math.min(chartData.length, product.termMonths || 240);
    const baseCredit = creditoAcessado || 0;
    
    // Usar valores customizados se disponíveis, senão usar os valores padrão
    const adminTaxRate = administrator.administrationRate || 0.27;
    const reserveFundRate = 0.01; // 1% padrão
    
    // Variáveis para controle pós-contemplação (IGUAL À TABELA)
    let saldoDevedorAcumulado = 0;
    let valorBaseInicial = 0;
    let creditoAcessadoContemplacao = 0;
    let valorParcelaFixo = 0;
    
    const resultData = chartData.map((point, index) => {
      const month = point.month;
      
      // Calcular crédito e crédito acessado (IGUAL À TABELA)
      const credito = baseCredit; // Simplificado para manter consistência
      const creditoAcessadoMes = creditoAcessado;
      
      // Calcular taxa de administração e fundo de reserva (IGUAL À TABELA)
      let taxaAdmin, fundoReserva;
      
      if (month <= contemplationMonth) {
        // Antes da contemplação: calcula sobre o crédito normal
        taxaAdmin = credito * adminTaxRate;
        fundoReserva = credito * reserveFundRate;
      } else {
        // Após a contemplação: calcula sobre o crédito acessado da contemplação
        if (creditoAcessadoContemplacao === 0) {
          creditoAcessadoContemplacao = creditoAcessado;
        }
        taxaAdmin = creditoAcessadoContemplacao * adminTaxRate;
        fundoReserva = creditoAcessadoContemplacao * reserveFundRate;
      }
      
      // Calcular o saldo devedor (IGUAL À TABELA)
      if (month === 1) {
        // Primeiro mês: soma de Crédito + Taxa de Administração + Fundo de Reserva
        valorBaseInicial = credito + taxaAdmin + fundoReserva;
        saldoDevedorAcumulado = valorBaseInicial;
      } else if (month <= contemplationMonth) {
        // Antes da contemplação: (Crédito + Taxa + Fundo Reserva) - soma das parcelas anteriores
        const valorBase = credito + taxaAdmin + fundoReserva;
        const somaParcelasAnteriores = resultData.slice(0, month - 1).reduce((sum, row) => {
          return sum + (row.parcelaTabelaMes || 0);
        }, 0);
        saldoDevedorAcumulado = valorBase - somaParcelasAnteriores;
      } else {
        // Após a contemplação: nova lógica baseada no crédito acessado
        if (month === contemplationMonth + 1) {
          // Primeiro mês após contemplação: saldo baseado no crédito acessado
          const valorBasePosContemplacao = creditoAcessadoContemplacao + taxaAdmin + fundoReserva;
          const somaParcelasAteContemplacao = resultData.slice(0, contemplationMonth).reduce((sum, row) => {
            return sum + (row.parcelaTabelaMes || 0);
          }, 0);
          saldoDevedorAcumulado = valorBasePosContemplacao - somaParcelasAteContemplacao;
        } else {
          // Meses seguintes após contemplação
          const saldoAnterior = resultData[month - 2]?.saldoDevedor || 0;
          const parcelaAnterior = resultData[month - 2]?.parcelaTabelaMes || 0;
          
          // Verificar se é um mês de atualização anual após contemplação
          const isAnnualUpdateAfterContemplation = (month - 1) % 12 === 0 && month > contemplationMonth;
          
          if (isAnnualUpdateAfterContemplation) {
            // Atualização anual sobre o próprio saldo devedor
            const annualUpdateRate = administrator.inccRate || 6;
            saldoDevedorAcumulado = saldoAnterior + (saldoAnterior * annualUpdateRate / 100) - parcelaAnterior;
          } else {
            // Mês normal após contemplação: saldo anterior menos parcela
            saldoDevedorAcumulado = saldoAnterior - parcelaAnterior;
          }
        }
      }
      
      // Calcular valor da parcela (IGUAL À TABELA)
      let installmentValue;
      
      if (month <= contemplationMonth) {
        // Antes da contemplação: usar regras da parcela (cheia ou especial)
        if (installmentType === 'full') {
          // Parcela cheia: (Valor do Crédito + Taxa de Administração + Fundo de Reserva) / Prazo
          installmentValue = (credito + taxaAdmin + fundoReserva) / (product.termMonths || 240);
        } else {
          // Parcela especial: aplicar reduções conforme configuração
          const reductionPercent = 0.5; // 50% de redução padrão
          const principal = credito * (1 - reductionPercent);
          installmentValue = (principal + taxaAdmin + fundoReserva) / (product.termMonths || 240);
        }
      } else {
        // Após contemplação: REGRA IGUAL PARA AMBOS OS TIPOS (IGUAL À TABELA)
        // Saldo devedor / (Prazo - número de Parcelas pagas)
        const parcelasPagas = contemplationMonth;
        const prazoRestante = (product.termMonths || 240) - parcelasPagas;
        
        if (month === contemplationMonth + 1) {
          // Primeiro mês após contemplação: calcular parcela fixa baseada no saldo devedor
          installmentValue = saldoDevedorAcumulado / prazoRestante;
          valorParcelaFixo = installmentValue; // Fixar o valor para os próximos meses
        } else {
          // Meses seguintes: usar o valor fixo até próxima atualização
          installmentValue = valorParcelaFixo;
          
          // Verificar se é mês de atualização anual
          const isAnnualUpdate = (month - 1) % 12 === 0 && month > contemplationMonth;
          if (isAnnualUpdate) {
            // Recalcular parcela com saldo devedor atualizado
            const parcelasPagasAteAgora = month - 1;
            const prazoRestanteAtualizado = (product.termMonths || 240) - parcelasPagasAteAgora;
            
            // REGRA IGUAL PARA AMBOS OS TIPOS: saldo devedor / prazo restante
            installmentValue = saldoDevedorAcumulado / prazoRestanteAtualizado;
            valorParcelaFixo = installmentValue; // Atualizar valor fixo
          }
        }
      }
      
      // Garantir que a parcela nunca seja negativa
      installmentValue = Math.max(installmentValue, 0.01);
      
      return {
        ...point,
        parcelaTabelaMes: installmentValue,
        saldoDevedor: saldoDevedorAcumulado
      };
    });

    return resultData;
  } catch (error) {
    console.error('[PatrimonyChart] Erro na geração de dados reais:', error);
    return chartData.map(point => ({ ...point, parcelaTabelaMes: 0 }));
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

  // Gerar dados reais usando a mesma lógica da DetailTable
  const synchronizedData = generateRealPatrimonyData(
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
