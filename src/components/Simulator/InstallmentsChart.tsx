import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Settings } from 'lucide-react';

interface InstallmentsChartProps {
  data: { mes: number; valorParcela: number; somaParcelas: number; patrimonio: number; patrimonioAnual: number; receitaMes: number; receitaMenosCustos: number; custos: number; rendaPassiva: number; rendaPassivaAcumulada: number; fluxoCaixa: number }[];
  showLegend?: boolean;
}

const gray1 = '#ededed';
const gray2 = '#e5e5e5';
const grayLine = '#444444';
const fundo = '#131313';
const marrom = '#A86E57';
const gridColor = '#2E2E2E';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: fundo, borderRadius: 16, border: '1px solid #444', padding: 16, color: gray1, minWidth: 200 }}>
        <div style={{ color: marrom, fontWeight: 700, marginBottom: 8 }}>Mês: {label}</div>
        {payload.map((entry: any, idx: number) => (
          <div key={entry.dataKey} style={{ color: idx % 2 === 0 ? gray1 : gray2, fontWeight: 500, marginBottom: 2 }}>
            <span style={{ color: idx % 2 === 0 ? gray1 : gray2, fontWeight: 700 }}>{entry.name}</span>: <span style={{ color: idx % 2 === 0 ? gray1 : gray2 }}>{typeof entry.value === 'number' ? `R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
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

  return (
    <div className="w-full h-96 mt-8">
      {showLegend && (
        <div className="mb-2">
          <ResponsiveContainer width="100%" height={40}>
            <Legend onClick={handleLegendClick} />
          </ResponsiveContainer>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="mes"
            label={{ value: 'Ano', position: 'insideBottom', offset: -10, fill: '#444444' }}
            tick={{ fill: '#444444', fontWeight: 700, fontSize: 14 }}
            tickFormatter={(mes) => Math.ceil(mes / 12)}
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
          <Line type="monotone" dataKey="patrimonio" stroke={highlight === 'patrimonio' ? marrom : grayLine} name="Patrimônio" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}; 