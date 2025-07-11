
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const funnelColors = [
  'from-primary-500 to-primary-300', // azul principal
  'from-primary-500 to-primary-300', // azul principal (repetido para manter padrão)
  'from-primary-500 to-primary-300', // azul principal
  'from-primary-500 to-primary-300', // azul principal
  'from-green-500 to-green-300',     // degradê verde na última faixa
];

interface StageData {
  name: string;
  weeklyValue: number;
  weeklyConversion: number;
  monthlyValue: number;
  monthlyConversion: number;
}

interface FunnelComparisonChartProps {
  stages: StageData[];
  comparativo: { label: string; value: string | number }[];
}

export const FunnelComparisonChart: React.FC<FunnelComparisonChartProps & { filterType?: 'user' | 'team', filterId?: string, users?: any[], teams?: any[], onCompare?: (compareId: string) => void, compareData?: any }> = ({ stages, comparativo, filterType, filterId, users = [], teams = [], onCompare, compareData }) => {
  // Função para calcular largura relativa das etapas (cada faixa menor que a anterior)
  const getWidth = (idx: number) => {
    const base = 100;
    const step = 12;
    // Última faixa pode ser maior se o nome for grande
    if (idx === stages.length - 1 && stages[idx].name.length > 12) {
      return `${base - idx * step + 8}%`;
    }
    return `${base - idx * step}%`;
  };

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
  return (
    <div className="flex flex-col md:flex-row gap-8 w-full items-center justify-center">
      {/* Funil colorido */}
      <div className="flex flex-col items-center w-full max-w-xs md:max-w-sm">
        <h3 className="text-center font-bold mb-2 text-lg">FUNIL DE VENDAS</h3>
        <div className="flex flex-col items-center w-full">
          {stages.map((stage, idx) => (
            <div
              key={stage.name}
              className="w-full flex items-center justify-center mb-2 z-[${10-idx}]"
              style={{ zIndex: 10 - idx }}
            >
              <div
                className={`transition-all duration-300 bg-gradient-to-r ${funnelColors[idx % funnelColors.length]} shadow-lg flex items-center justify-between px-6 py-3`}
                style={{
                  width: getWidth(idx),
                  minHeight: 44,
                  maxWidth: '100%',
                  marginBottom: idx < stages.length - 1 ? 8 : 0, // Espaçamento maior
                  borderRadius: idx === 0 ? '1rem 1rem 0.5rem 0.5rem' : idx === stages.length - 1 ? '0 0 1rem 1rem' : '0.5rem', // Menos arredondado
                  boxShadow: '0 4px 16px 0 rgba(0,0,0,0.08)',
                }}
              >
                <span className="font-bold text-white text-base drop-shadow-md w-16 text-left">{stage.weeklyValue}</span>
                <div className="flex-1 flex flex-col items-center">
                  <span className={`font-bold text-white drop-shadow-md text-center ${getFontSize(idx)}`}>{stage.name}</span>
                  <span className="text-xs text-white drop-shadow-md">{idx > 0 ? `Conversão ${stage.weeklyConversion}%` : ''}</span>
                </div>
                <span className="font-bold text-white text-base drop-shadow-md w-16 text-right">{stage.monthlyValue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Comparativo */}
      <div className="flex flex-col items-center min-w-[180px]">
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
              <div>{item.value}</div>
            </div>
          ))}
        </div>
        {/* Modal de filtro comparativo */}
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
                        <span className="text-xs">{stage.weeklyValue} / {stage.monthlyValue}</span>
                      </div>
                    ))}
                  </div>
                  {compareData && (
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">Comparativo</h4>
                      {compareData.stages.map((stage, idx) => (
                        <div key={stage.name} className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{stage.name}</span>
                          <span className="text-xs">{stage.weeklyValue} / {stage.monthlyValue}</span>
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
    </div>
  );
};
