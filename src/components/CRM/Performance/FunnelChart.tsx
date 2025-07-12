
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
      {/* Linha única: cards esquerda, título central, cards direita, com proporções 25/50/25 */}
      <div className="w-full flex flex-col md:flex-row items-start justify-between mb-0 gap-0 md:gap-2">
        {/* Cards de Média semanal à esquerda */}
        <div className="md:basis-1/4 w-full md:w-1/4 flex flex-col gap-1 md:gap-2 min-w-[180px] items-start">
          <span className="text-xs text-muted-foreground font-semibold mb-0.5">Dados semanais</span>
          <MetricCard label="Conversão do funil (semana)" value={`${((somaUltimaEtapaPeriodo / somaPrimeiraEtapaPeriodo) / numWeeks * 100 || 0).toFixed(1)}%`} />
          <MetricCard label="Valor das vendas (semana)" value={vendasSemanal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <MetricCard label="Ticket Médio (semana)" value={ticketMedioSemanal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <MetricCard label="Média de Recomendações (semana)" value={etapaRecomendacoesSemanal > 0 ? (recomendacoesSemanal / etapaRecomendacoesSemanal).toFixed(2) : '0'} />
        </div>
        {/* Título centralizado */}
        <div className="md:basis-2/4 w-full md:w-2/4 flex flex-col items-center justify-center flex-1">
          <span className="text-xs text-muted-foreground font-semibold mb-0.5"> </span>
          <h2 className="text-xl font-bold text-center">Resultados do Funil {funnelName || ''}</h2>
        </div>
        {/* Cards de Período à direita */}
        <div className="md:basis-1/4 w-full md:w-1/4 flex flex-col gap-1 md:gap-2 min-w-[180px] items-end">
          <span className="text-xs text-muted-foreground font-semibold mb-0.5">Dados do Período</span>
          <MetricCard label="Conversão do funil (período)" value={`${(somaUltimaEtapaPeriodo / somaPrimeiraEtapaPeriodo * 100 || 0).toFixed(1)}%`} />
          <MetricCard label="Valor das vendas (período)" value={vendasPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <MetricCard label="Ticket Médio (período)" value={ticketMedioPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <MetricCard label="Média de Recomendações (período)" value={etapaRecomendacoesPeriodo > 0 ? (recomendacoesPeriodo / etapaRecomendacoesPeriodo).toFixed(2) : '0'} />
        </div>
      </div>
      {/* Gráfico do funil imediatamente abaixo, centralizado */}
      <div className="flex w-full gap-0 items-start justify-center">
        <div className="flex flex-col items-center w-full max-w-xl md:w-4/5">
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
                  {/* Comparativo fora da faixa à esquerda */}
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
                  {/* Faixa do funil */}
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
  );
};
