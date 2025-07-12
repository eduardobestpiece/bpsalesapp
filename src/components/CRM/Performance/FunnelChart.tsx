
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUp, ArrowDown } from 'lucide-react';

const funnelColors = [
  'from-primary-500 to-primary-300', // azul principal
  'from-primary-500 to-primary-300', // azul principal (repetido para manter padrão)
  'from-primary-500 to-primary-300', // azul principal
  'from-primary-500 to-primary-300', // azul principal
  'from-green-500 to-green-300',     // degradê verde na última faixa
];

interface StageData {
  name: string;
  weeklyValue?: number;
  weeklyConversion?: number;
  monthlyValue?: number;
  monthlyConversion?: number;
  previousWeeklyValue?: number;
  value?: number;
  compareValue?: number;
}

interface FunnelComparisonChartProps {
  stages: StageData[];
  comparativo: { label: string; value: string | number; diff?: string | number }[];
  periodoLabel?: string;
  funnelName?: string;
}

export const FunnelComparisonChart: React.FC<FunnelComparisonChartProps & { filterType?: 'user' | 'team', filterId?: string, users?: any[], teams?: any[], onCompare?: (compareId: string) => void, compareData?: any, compareStages?: any[] }> = ({ stages, comparativo, filterType, filterId, users = [], teams = [], onCompare, compareData, periodoLabel, compareStages = [], funnelName }) => {
  // Função para calcular largura relativa das etapas (cada faixa menor que a anterior)
  const getWidth = (idx: number) => {
    // Se a última faixa tiver nome grande, aumentar largura de todas proporcionalmente
    const lastNameLength = stages[stages.length - 1]?.name.length || 0;
    const extra = lastNameLength > 18 ? 20 : lastNameLength > 12 ? 10 : 0;
    const base = 100 + extra;
    const step = 12;
    return `${base - idx * step}%`;
  };

  // Todas as faixas com a mesma altura
  const fixedHeight = 56;

  // Impedir quebra de linha nos textos
  const noWrap = 'whitespace-nowrap overflow-hidden text-ellipsis';

  // Função para calcular tamanho da fonte da última faixa
  const getFontSize = (idx: number) => {
    if (idx === stages.length - 1 && stages[idx].name.length > 12) {
      return 'text-sm';
    }
    return 'text-base';
  };

  const [showComparativoModal, setShowComparativoModal] = useState(false);
  const [compareId, setCompareId] = useState('');
  // Só exibe botão de comparação se filtrado para usuário ou equipe específica
  const canCompare = filterType && filterId;

  // Novo: calcular dados da média semanal e do período
  const numSemanas = 4; // Exemplo fixo, ajustar para cálculo real se necessário
  const soma = (arr: any[], key: string) => arr.reduce((sum, i) => sum + (i[key] || 0), 0);
  const primeiraEtapa = stages[0];
  const ultimaEtapa = stages[stages.length - 1];
  // Dados da média semanal
  const conversaoSemanal = primeiraEtapa && ultimaEtapa && primeiraEtapa.value > 0 ? ((ultimaEtapa.value / primeiraEtapa.value) / numSemanas) * 100 : 0;
  const valorVendasSemanal = soma(stages, 'value') / numSemanas;
  const ticketMedioSemanal = ultimaEtapa && ultimaEtapa.value > 0 ? (valorVendasSemanal / ultimaEtapa.value) : 0;
  const mediaRecomendacoesSemanal = 0; // Implementar cálculo real se necessário
  // Dados do período
  const conversaoPeriodo = primeiraEtapa && ultimaEtapa && primeiraEtapa.value > 0 ? (ultimaEtapa.value / primeiraEtapa.value) * 100 : 0;
  const valorVendasPeriodo = soma(stages, 'value');
  const ticketMedioPeriodo = ultimaEtapa && ultimaEtapa.value > 0 ? (valorVendasPeriodo / ultimaEtapa.value) : 0;
  const mediaRecomendacoesPeriodo = 0; // Implementar cálculo real se necessário

  // Função auxiliar para card de métrica com fontes menores
  function MetricCard({ label, value }: { label: string; value: string | number }) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 flex flex-col items-center shadow-sm min-w-[140px] mb-2">
        <span className="text-xs text-muted-foreground mb-1 font-medium">{label}</span>
        <span className="text-lg font-bold tracking-tight">{value}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full items-center justify-center">
      {/* Linha de cards e título alinhados */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        {/* Cards de Média semanal à esquerda */}
        <div className="flex flex-col gap-2 min-w-[160px] items-center">
          <span className="text-xs text-muted-foreground font-semibold mb-1">Dados semanais</span>
          <MetricCard label="Conversão do funil (semana)" value={`${conversaoSemanal.toFixed(1)}%`} />
          <MetricCard label="Valor das vendas (semana)" value={valorVendasSemanal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <MetricCard label="Ticket Médio (semana)" value={ticketMedioSemanal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <MetricCard label="Média de Recomendações (semana)" value={mediaRecomendacoesSemanal} />
        </div>
        {/* Título centralizado */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold text-center">Resultados do Funil {funnelName || ''}</h2>
        </div>
        {/* Cards de Período à direita */}
        <div className="flex flex-col gap-2 min-w-[160px] items-center">
          <span className="text-xs text-muted-foreground font-semibold mb-1">Dados do Período</span>
          <MetricCard label="Conversão do funil (período)" value={`${conversaoPeriodo.toFixed(1)}%`} />
          <MetricCard label="Valor das vendas (período)" value={valorVendasPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <MetricCard label="Ticket Médio (período)" value={ticketMedioPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <MetricCard label="Média de Recomendações (período)" value={mediaRecomendacoesPeriodo} />
        </div>
      </div>
      {/* Gráfico do funil abaixo */}
      <div className="flex w-full gap-8 items-start justify-between">
        <div className="flex-1 flex flex-col items-center">
          <div className="flex flex-col items-center w-full max-w-xs md:max-w-sm">
            <div className="flex flex-col items-center w-full">
              {stages.map((stage, idx) => {
                const diff = stage.value - (stage.compareValue || 0);
                const isUp = diff > 0;
                const isDown = diff < 0;
                return (
                  <div
                    key={stage.name}
                    className={`w-full flex items-center justify-center mb-1 z-[${10-idx}]`}
                    style={{ zIndex: 10 - idx }}
                  >
                    <div className="flex items-center justify-center w-14 mr-2">
                      {typeof stage.compareValue === 'undefined' ? (
                        <span className="text-xs text-gray-400">0%</span>
                      ) : diff !== 0 ? (
                        <span className={`flex items-center font-bold text-xs ${isUp ? 'text-green-600' : 'text-red-600'}`}> 
                          {isUp && <ArrowUp className="w-4 h-4 mr-1" />} 
                          {isDown && <ArrowDown className="w-4 h-4 mr-1" />} 
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">0%</span>
                      )}
                    </div>
                    <div
                      className={`transition-all duration-300 bg-gradient-to-r ${funnelColors[idx % funnelColors.length]} shadow-lg flex items-center justify-between px-6`}
                      style={{
                        width: getWidth(idx),
                        height: fixedHeight,
                        maxWidth: '100%',
                        marginBottom: idx < stages.length - 1 ? 4 : 0,
                        borderRadius: idx === 0 ? '1rem 1rem 0.5rem 0.5rem' : idx === stages.length - 1 ? '0 0 1rem 1rem' : '0.5rem',
                        boxShadow: '0 4px 16px 0 rgba(0,0,0,0.08)',
                      }}
                    >
                      <span className={`font-bold text-white text-base drop-shadow-md w-16 text-left ${noWrap}`}>{stage.value}</span>
                      <div className="flex-1 flex flex-col items-center">
                        <span className={`font-bold text-white drop-shadow-md text-center text-base ${noWrap}`}>{stage.name}</span>
                        <span className={`text-xs text-white drop-shadow-md ${noWrap}`}>{idx < stages.length - 1 ? `Conversão ${(stage.value && stages[idx + 1]?.value ? ((stages[idx + 1].value / stage.value) * 100).toFixed(1) : '0')}%` : ''}</span>
                      </div>
                      <span className={`font-bold text-white text-base drop-shadow-md w-16 text-right ${noWrap}`}>{stage.compareValue}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
