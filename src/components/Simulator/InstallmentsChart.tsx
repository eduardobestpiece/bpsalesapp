import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Settings, Home } from 'lucide-react';

interface InstallmentsChartProps {
  data: { mes: number; valorParcela: number; somaParcelas: number; patrimonio: number; patrimonioAnual: number; receitaMes: number; receitaMenosCustos: number; custos: number; rendaPassiva: number; rendaPassivaAcumulada: number; fluxoCaixa: number }[];
  showLegend?: boolean;
}

const gray1 = '#ededed';
const gray2 = '#e5e5e5';
const grayLine = '#444444';
const fundo = '#131313';
const marrom = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary') || 'var(--brand-primary)';
const gridColor = '#2E2E2E';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Calcular número de imóveis
    const patrimonioNaContemplacao = payload[0]?.payload?.patrimonioNaContemplacao || 0;
    const valorAlavanca = payload[0]?.payload?.valorAlavancaNum || 1;
    const numeroImoveis = valorAlavanca > 0 ? patrimonioNaContemplacao / valorAlavanca : 0;
    return (
      <div style={{ background: fundo, borderRadius: 16, border: '1px solid #444', padding: 16, color: gray1, minWidth: 200 }}>
        <div style={{ color: marrom, fontWeight: 700, marginBottom: 8 }}>Mês: {label}</div>
        {payload.map((entry: any, idx: number) => (
          <div key={entry.dataKey} style={{ color: idx % 2 === 0 ? gray1 : gray2, fontWeight: 500, marginBottom: 2 }}>
            <span style={{ color: idx % 2 === 0 ? gray1 : gray2, fontWeight: 700 }}>{entry.name}</span>: <span style={{ color: idx % 2 === 0 ? gray1 : gray2 }}>{typeof entry.value === 'number' ? `R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : entry.value}</span>
          </div>
        ))}
        <div style={{ color: gray1, fontWeight: 500, marginTop: 8 }}>
          <span style={{ fontWeight: 700 }}>Imóveis:</span> {numeroImoveis.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
        </div>
      </div>
    );
  }
  return null;
};

// Componente customizado para o ponto da casinha
const CasaDot = (props: any) => {
  const { cx, cy, payload } = props;
  // Só renderiza se for o primeiro ponto de patrimônio > 0
  if (!payload || !payload.patrimonio || payload.mes !==  payload.pontoCasaMes) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={12} fill={marrom.trim() || 'var(--brand-primary)'} />
      <foreignObject x={cx - 8} y={cy - 8} width={16} height={16} style={{ pointerEvents: 'none' }}>
        <Home size={16} color="white" style={{ display: 'block', margin: 0 }} />
      </foreignObject>
    </g>
  );
};

export const InstallmentsChart = ({ data, showLegend = true }: InstallmentsChartProps) => {
  const [highlight, setHighlight] = useState('patrimonio');

  const getLineColor = (key: string) => {
    if (highlight === key) return marrom;
    return grayLine;
  };

  const handleLegendClick = (e: any) => {
    if (highlight === e.dataKey) {
      setHighlight('patrimonio');
    } else {
      setHighlight(e.dataKey);
    }
  };

  // Encontrar o primeiro mês onde o patrimônio é adquirido
  const patrimonioAdquiridoIndex = data.findIndex(item => item.patrimonio > 0);
  const pontoCasaMes = patrimonioAdquiridoIndex !== -1 ? data[patrimonioAdquiridoIndex]?.mes : null;
  // Adiciona info ao payload para o dot customizado
  const dataWithCasa = data.map(d => ({ ...d, pontoCasaMes }));

  return (
    <div className="w-full h-96 pb-8" style={{ paddingBottom: 56 }}>
      <h2 className="text-xl font-bold mb-2">Evolução Patrimonial</h2>
      {showLegend && (
        <div className="mb-2">
          <ResponsiveContainer width="100%" height={40}>
            <Legend onClick={handleLegendClick} />
          </ResponsiveContainer>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dataWithCasa} margin={{ top: 0, right: 30, left: 20, bottom: 56 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="mes"
            label={{ value: 'Ano', position: 'insideBottom', offset: -10, fill: '#444444' }}
            tick={{ fill: '#444444', fontWeight: 700, fontSize: 14 }}
            tickFormatter={(mes: number) => String(Math.ceil(mes / 12))}
            interval={11}
          />
          <YAxis label={{ value: 'R$', angle: -90, position: 'insideLeft' }} tick={{ fill: '#444444' }} tickFormatter={v => `R$ ${v.toLocaleString('pt-BR')}`} />
          <Tooltip content={<CustomTooltip />} />
          {/* Renderizar todas as linhas exceto patrimônio */}
          <Line type="monotone" dataKey="valorParcela" stroke={highlight === 'valorParcela' ? marrom : grayLine} name="Parcela do mês" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="somaParcelas" stroke={highlight === 'somaParcelas' ? marrom : grayLine} name="Soma das parcelas" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="receitaMes" stroke={highlight === 'receitaMes' ? marrom : grayLine} name="Receita do Mês" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="receitaMenosCustos" stroke={highlight === 'receitaMenosCustos' ? marrom : grayLine} name="Receita - Custos" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="custos" stroke={highlight === 'custos' ? marrom : grayLine} name="Custos" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="rendaPassiva" stroke={highlight === 'rendaPassiva' ? marrom : grayLine} name="Renda passiva" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="rendaPassivaAcumulada" stroke={highlight === 'rendaPassivaAcumulada' ? marrom : grayLine} name="Renda passiva acumulada" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="fluxoCaixa" stroke={highlight === 'fluxoCaixa' ? marrom : grayLine} name="Fluxo de caixa" strokeWidth={2} dot={false} />
          {/* Linha do Patrimônio por último para sobrepor as demais */}
          <Line type="monotone" dataKey="patrimonio" stroke={highlight === 'patrimonio' ? marrom : grayLine} name="Patrimônio" strokeWidth={2} dot={<CasaDot />} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}; 