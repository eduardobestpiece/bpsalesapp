
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const funnelColors = [
  'from-primary-500 to-primary-300', // azul principal
  'from-green-500 to-green-300',     // verde
  'from-yellow-400 to-yellow-200',   // amarelo
  'from-orange-500 to-orange-300',   // laranja
  'from-purple-500 to-purple-300',   // roxo
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

export const FunnelComparisonChart: React.FC<FunnelComparisonChartProps> = ({ stages, comparativo }) => {
  // Função para calcular largura relativa das etapas
  const getWidth = (idx: number, type: 'weekly' | 'monthly') => {
    const max = Math.max(...stages.map(s => type === 'weekly' ? s.weeklyValue : s.monthlyValue), 1);
    const val = type === 'weekly' ? stages[idx].weeklyValue : stages[idx].monthlyValue;
    return `${60 + (val / max) * 40}%`;
  };

  const [showComparativoModal, setShowComparativoModal] = useState(false);

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full items-center justify-center">
      {/* Funil visual central */}
      <div className="flex flex-col items-center w-full max-w-xs md:max-w-sm">
        <h3 className="text-center font-bold mb-2 text-lg">FUNIL DE VENDAS</h3>
        <div className="flex flex-col items-center w-full">
          {stages.map((stage, idx) => (
            <div
              key={stage.name}
              className={`w-full flex items-center justify-center mb-[-18px] z-${10-idx}`}
              style={{ zIndex: 10 - idx }}
            >
              <div
                className={`transition-all duration-300 bg-gradient-to-r ${funnelColors[idx % funnelColors.length]} rounded-b-2xl rounded-t-[${idx === 0 ? '1.5rem' : '0'}] shadow-lg flex flex-col items-center justify-center`}
                style={{
                  width: getWidth(idx, 'weekly'),
                  minHeight: 48 - idx * 2,
                  maxWidth: '100%',
                  marginBottom: idx < stages.length - 1 ? -18 : 0,
                  borderRadius: idx === 0 ? '1.5rem 1.5rem 1rem 1rem' : '1rem',
                  boxShadow: '0 4px 16px 0 rgba(0,0,0,0.08)',
                }}
              >
                <span className="font-bold text-white text-base drop-shadow-md">{stage.name}</span>
                <span className="text-white text-xs drop-shadow-md">{stage.weeklyValue} / {stage.monthlyValue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Dados semanais e mensais lado a lado */}
      <div className="flex-1 flex flex-col md:flex-row gap-8 w-full">
        {/* Dados Semanais */}
        <div className="flex-1">
          <h3 className="text-center font-bold mb-2">DADOS SEMANAIS</h3>
          {stages.map((stage, idx) => (
            <div key={stage.name} className="flex items-center mb-2">
              <div className="w-10 text-right text-xs font-bold">{stage.weeklyValue}</div>
              <div className="flex-1 flex flex-col items-center">
                <div className="bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold truncate w-full text-center">
                  {stage.name}
                </div>
                <div className="text-[10px] text-gray-500">Conversão {stage.weeklyConversion}%</div>
              </div>
            </div>
          ))}
        </div>
        {/* Dados Mensais */}
        <div className="flex-1">
          <h3 className="text-center font-bold mb-2">DADOS MENSAIS</h3>
          {stages.map((stage, idx) => (
            <div key={stage.name} className="flex items-center mb-2">
              <div className="flex-1 flex flex-col items-center">
                <div className="bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold truncate w-full text-center">
                  {stage.name}
                </div>
                <div className="text-[10px] text-gray-500">Conversão {stage.monthlyConversion}%</div>
              </div>
              <div className="w-10 text-left text-xs font-bold">{stage.monthlyValue}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Comparativo */}
      <div className="flex flex-col items-center min-w-[180px]">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-bold">COMPARATIVO</h3>
          <button className="ml-2 p-1 rounded hover:bg-gray-100" title="Detalhar comparativo" onClick={() => setShowComparativoModal(true)}>
            <span role="img" aria-label="engrenagem">⚙️</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {comparativo.map((item, idx) => (
            <div key={idx} className="border rounded-lg px-3 py-2 text-xs text-center min-w-[70px]">
              <div className="font-semibold">{item.label}</div>
              <div>{item.value}</div>
            </div>
          ))}
        </div>
        {/* Modal de detalhamento do comparativo */}
        <Dialog open={showComparativoModal} onOpenChange={setShowComparativoModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhamento do Comparativo</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {comparativo.map((item, idx) => (
                <div key={idx} className="flex justify-between border-b pb-1">
                  <span className="font-semibold">{item.label}</span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button className="px-4 py-2 rounded bg-primary-500 text-white" onClick={() => setShowComparativoModal(false)}>
                Fechar
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
