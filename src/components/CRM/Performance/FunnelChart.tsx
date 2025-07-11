
import React from 'react';

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
  return (
    <div className="flex flex-row gap-8 w-full">
      {/* Funil Semanal */}
      <div className="flex-1">
        <h3 className="text-center font-bold mb-2">DADOS SEMANAIS</h3>
        {stages.map((stage, idx) => (
          <div key={stage.name} className="flex items-center mb-2">
            <div className="w-16 text-right text-xs font-bold">{stage.weeklyValue}</div>
            <div className="flex-1 flex flex-col items-center">
              <div className="bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold truncate w-full text-center">
                {stage.name}
              </div>
              {idx < stages.length - 1 && (
                <div className="text-[10px] text-gray-500">Conversão {stage.weeklyConversion}%</div>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Funil Mensal */}
      <div className="flex-1">
        <h3 className="text-center font-bold mb-2">DADOS MENSAIS</h3>
        {stages.map((stage, idx) => (
          <div key={stage.name} className="flex items-center mb-2">
            <div className="flex-1 flex flex-col items-center">
              <div className="bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold truncate w-full text-center">
                {stage.name}
              </div>
              {idx < stages.length - 1 && (
                <div className="text-[10px] text-gray-500">Conversão {stage.monthlyConversion}%</div>
              )}
            </div>
            <div className="w-16 text-left text-xs font-bold">{stage.monthlyValue}</div>
          </div>
        ))}
      </div>
      {/* Comparativo */}
      <div className="flex flex-col items-center min-w-[180px]">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-bold">COMPARATIVO</h3>
          <button className="ml-2 p-1 rounded hover:bg-gray-100" title="Configurar comparativo">
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
      </div>
    </div>
  );
};
