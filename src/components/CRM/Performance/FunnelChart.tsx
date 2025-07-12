
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
}

export const FunnelComparisonChart: React.FC<FunnelComparisonChartProps & { filterType?: 'user' | 'team', filterId?: string, users?: any[], teams?: any[], onCompare?: (compareId: string) => void, compareData?: any, compareStages?: any[] }> = ({ stages, comparativo, filterType, filterId, users = [], teams = [], onCompare, compareData, periodoLabel, compareStages = [] }) => {
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

  return (
    <div className="flex flex-col w-full items-center justify-center">
      {/* Título */}
      <div className="w-full flex flex-col items-center mb-2">
        <h2 className="text-xl font-bold">Resultados do Funil {ultimaEtapa?.name || ''}</h2>
      </div>
      {/* Legendas */}
      <div className="flex w-full justify-between mb-2">
        <span className="text-xs text-muted-foreground">Média semanal</span>
        <span className="text-xs text-muted-foreground text-right min-w-[90px]">{periodoLabel || 'Todo Período'}</span>
      </div>
      <div className="flex w-full gap-8">
        {/* Dados da média semanal e do período */}
        <div className="flex flex-col gap-2 min-w-[180px]">
          <div className="font-semibold">Média semanal</div>
          <div>Conversão do funil (semana): {conversaoSemanal.toFixed(1)}%</div>
          <div>Valor das vendas: {valorVendasSemanal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          <div>Ticket Médio: {ticketMedioSemanal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          <div>Média de Recomendações: {mediaRecomendacoesSemanal}</div>
          <div className="font-semibold mt-4">Período</div>
          <div>Conversão do funil: {conversaoPeriodo.toFixed(1)}%</div>
          <div>Valor das vendas: {valorVendasPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          <div>Ticket Médio: {ticketMedioPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          <div>Média de Recomendações: {mediaRecomendacoesPeriodo}</div>
        </div>
        {/* Gráfico do funil */}
        <div className="flex-1 flex flex-col items-center">
          {/* Funil colorido */}
          <div className="flex flex-col items-center w-full max-w-xs md:max-w-sm">
            <div className="flex flex-col items-center w-full">
              {stages.map((stage, idx) => {
                const diff = stage.value - (stage.compareValue || 0);
                const isUp = diff > 0;
                const isDown = diff < 0;
                return (
                  <div
                    key={stage.name}
                    className="w-full flex items-center justify-center mb-1 z-[${10-idx}]"
                    style={{ zIndex: 10 - idx }}
                  >
                    {/* Comparativo visual à esquerda da faixa, alinhado verticalmente */}
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
                        marginBottom: idx < stages.length - 1 ? 4 : 0, // Espaçamento mínimo
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
      {/* Comparativo geral após o header */}
      <div className="flex flex-col items-center min-w-[180px] mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-bold">COMPARATIVO</h3>
          {canCompare && (
            <button className="ml-2 p-1 rounded hover:bg-gray-100" title="Comparar com outro" onClick={() => setShowComparativoModal(true)}>
              <span role="img" aria-label="comparar">🔀</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {comparativo.map((item, idx) => (
            <div key={idx} className="border rounded-lg px-3 py-2 text-xs text-center min-w-[70px]">
              <div className="font-semibold">{item.label}</div>
              <div>
                {item.value}
                {typeof item.diff !== 'undefined' && (
                  <span className={`ml-2 font-bold ${Number(item.diff) > 0 ? 'text-green-600' : Number(item.diff) < 0 ? 'text-red-600' : 'text-gray-400'}`}>{Number(item.diff) > 0 ? `+${item.diff}%` : `${item.diff}%`}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Modal de filtro comparativo permanece igual */}
      {canCompare && (
        <Dialog open={showComparativoModal} onOpenChange={setShowComparativoModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Comparar Funil</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Comparar com:</label>
                <Select value={compareId} onValueChange={setCompareId}>
                  <SelectTrigger>
                    <SelectValue placeholder={filterType === 'user' ? 'Selecione outro usuário' : 'Selecione outra equipe'} />
                  </SelectTrigger>
                  <SelectContent>
                    {filterType === 'user' && users.filter(u => u.id !== filterId).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.first_name} {u.last_name}</SelectItem>
                    ))}
                    {filterType === 'team' && teams.filter(t => t.id !== filterId).map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Funil Atual</h4>
                  {stages.map((stage, idx) => (
                    <div key={stage.name} className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{stage.name}</span>
                      <span className="text-xs">{stage.value} / {stage.compareValue}</span>
                    </div>
                  ))}
                </div>
                {compareData && (
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Comparativo</h4>
                    {compareData.stages.map((stage, idx) => (
                      <div key={stage.name} className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{stage.name}</span>
                        <span className="text-xs">{stage.value} / {stage.compareValue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button className="px-4 py-2 rounded bg-primary-500 text-white" onClick={() => { onCompare && onCompare(compareId); setShowComparativoModal(false); }}>
                  Comparar
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
