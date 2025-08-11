
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUp, ArrowDown } from 'lucide-react';

const funnelColors = [
  'from-[#AA725B] to-[#93614C]', // degradê marrom principal
  'from-[#AA725B] to-[#93614C]', // degradê marrom principal (repetido para manter padrão)
  'from-[#AA725B] to-[#93614C]', // degradê marrom principal
  'from-[#AA725B] to-[#93614C]', // degradê marrom principal
  'from-[#AA725B] to-[#93614C]', // degradê marrom principal (mantido para consistência)
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
  weeklyStages: StageData[];
  numWeeks: number;
  vendasPeriodo: number;
  vendasSemanal: number;
  ticketMedioPeriodo: number;
  ticketMedioSemanal: number;
  recomendacoesPeriodo: number;
  recomendacoesSemanal: number;
  etapaRecomendacoesPeriodo: number;
  etapaRecomendacoesSemanal: number;
  mediaRecomendacoesPeriodo: number;
  mediaRecomendacoesSemanal: number;
  somaPrimeiraEtapaPeriodo: number;
  somaUltimaEtapaPeriodo: number;
  somaPrimeiraEtapaSemanal: number;
  somaUltimaEtapaSemanal: number;
  numIndicadores: number;
  comparativo: { label: string; value: string | number; diff?: string | number }[];
  periodoLabel?: string;
  funnelName?: string;
}

export const FunnelComparisonChart: React.FC<FunnelComparisonChartProps & { filterType?: 'user' | 'team', filterId?: string, users?: any[], teams?: any[], onCompare?: (compareId: string) => void, compareData?: any, compareStages?: any[] }> = ({ stages, weeklyStages, numWeeks, vendasPeriodo, vendasSemanal, ticketMedioPeriodo, ticketMedioSemanal, recomendacoesPeriodo, recomendacoesSemanal, etapaRecomendacoesPeriodo, etapaRecomendacoesSemanal, mediaRecomendacoesPeriodo, mediaRecomendacoesSemanal, somaPrimeiraEtapaPeriodo, somaUltimaEtapaPeriodo, somaPrimeiraEtapaSemanal, somaUltimaEtapaSemanal, numIndicadores, comparativo, filterType, filterId, users = [], teams = [], onCompare, compareData, periodoLabel, compareStages = [], funnelName }) => {
  // Largura relativa das etapas com redução uniforme (linear) do topo até a base
  const getWidth = (idx: number) => {
    const minPercent = 55; // largura mínima da última faixa
    const total = Math.max(stages.length, 2);
    const step = (100 - minPercent) / (total - 1);
    const width = 100 - (idx * step);
    return `${width}%`;
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

  // Função auxiliar para card de métrica com fontes menores
  function MetricCard({ label, value, cardClass }: { label: string; value: string | number; cardClass?: string }) {
    return (
      <div className={`border bg-card px-4 py-3 flex flex-col items-center shadow-sm mb-2 brand-radius ${cardClass || ''}`} style={{ borderColor: '#333333' }}>
        <span className="text-xs text-muted-foreground mb-1 font-medium">{label}</span>
        <span className="text-lg font-bold tracking-tight">{value}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full items-center justify-center">
      {/* Linha principal: três colunas (esquerda, centro, direita) */}
      <div className="w-full flex flex-col md:flex-row items-start justify-between mb-0 gap-0 md:gap-[25px]">
        {/* Esquerda: Dados semanais */}
        <div className="md:basis-1/5 w-full md:w-1/5 flex flex-col gap-2 min-w-[140px] items-start">
          <span className="text-xs text-muted-foreground font-semibold mb-0.5">Dados semanais</span>
          <MetricCard label="Conversão do funil (semana)" value={`${((somaUltimaEtapaPeriodo / somaPrimeiraEtapaPeriodo) / numWeeks * 100 || 0).toFixed(1)}%`} cardClass="w-full" />
          <MetricCard label="Valor das vendas (semana)" value={vendasSemanal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cardClass="w-full" />
          <MetricCard label="Ticket Médio (semana)" value={ticketMedioSemanal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cardClass="w-full" />
          <MetricCard label="Média de Recomendações (semana)" value={etapaRecomendacoesSemanal > 0 ? (recomendacoesSemanal / etapaRecomendacoesSemanal).toFixed(2) : '0'} cardClass="w-full" />
          <MetricCard label="Recomendações (semana)" value={recomendacoesSemanal.toFixed(0)} cardClass="w-full" />
        </div>
        {/* Centro: Título + Gráfico do funil */}
        <div className="md:basis-3/5 w-full md:w-3/5 flex flex-col items-center justify-start flex-1">
          <h2 className="text-xl font-bold text-center mb-2">Resultados do Funil {funnelName || ''}</h2>
          {/* Gráfico do funil centralizado */}
          <div className="flex w-full gap-0 items-start justify-center">
            <div className="flex flex-col items-center w-full max-w-4xl md:w-full">
              <div className="flex flex-col items-center w-full">
                {stages.map((stage, idx) => {
                  const diff = stage.value - (stage.compareValue || 0);
                  const isUp = diff > 0;
                  const isDown = diff < 0;
                  // Valor semanal da etapa (média por indicador)
                  const valorSemanalEtapa = numIndicadores > 0 ? (stage.value / numIndicadores) : 0;
                  return (
                    <div
                      key={stage.name}
                      className={`w-full flex items-center justify-center mb-1 z-[${10-idx}]`}
                      style={{ zIndex: 10 - idx }}
                    >
                      {/* Faixa do funil */}
                      <div
                        className={`transition-all duration-300 shadow-lg flex items-center justify-between px-6`}
                        style={{
                          width: getWidth(idx),
                          height: fixedHeight,
                          maxWidth: '100%',
                          marginBottom: idx < stages.length - 1 ? 4 : 0,
                          borderRadius: 'var(--brand-radius)',
                          boxShadow: '0 4px 16px 0 rgba(0,0,0,0.08)',
                          background: idx === stages.length - 1
                            ? 'linear-gradient(90deg, #21C55E, #0dad48)'
                            : 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))',
                        }}
                      >
                        {/* Esquerda dentro da faixa: valor semanal da etapa */}
                        <span className={`font-bold text-white text-base drop-shadow-md w-16 text-left ${noWrap}`}>{valorSemanalEtapa.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
                        <div className="flex-1 flex flex-col items-center">
                          <span className={`font-bold text-white drop-shadow-md text-center text-base ${noWrap}`}>{stage.name}</span>
                          <span className={`text-xs text-white drop-shadow-md ${noWrap}`}>{idx < stages.length - 1 ? `Conversão ${(stage.value && stages[idx + 1]?.value ? ((stages[idx + 1].value / stage.value) * 100).toFixed(1) : '0')}%` : ''}</span>
                        </div>
                        {/* Direita dentro da faixa: valor total da etapa no período */}
                        <span className={`font-bold text-white text-base drop-shadow-md w-16 text-right ${noWrap}`}>{stage.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {/* Direita: Dados do Período */}
        <div className="md:basis-1/5 w-full md:w-1/5 flex flex-col gap-2 min-w-[140px] items-end">
          <span className="text-xs text-muted-foreground font-semibold mb-0.5">Dados do Período</span>
          <MetricCard label="Conversão do funil (período)" value={`${(somaUltimaEtapaPeriodo / somaPrimeiraEtapaPeriodo * 100 || 0).toFixed(1)}%`} cardClass="w-full" />
          <MetricCard label="Valor das vendas (período)" value={vendasPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cardClass="w-full" />
          <MetricCard label="Ticket Médio (período)" value={ticketMedioPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cardClass="w-full" />
          <MetricCard label="Média de Recomendações (período)" value={etapaRecomendacoesPeriodo > 0 ? (recomendacoesPeriodo / etapaRecomendacoesPeriodo).toFixed(2) : '0'} cardClass="w-full" />
          <MetricCard label="Recomendações (período)" value={recomendacoesPeriodo.toFixed(0)} cardClass="w-full" />
        </div>
      </div>
    </div>
  );
};
