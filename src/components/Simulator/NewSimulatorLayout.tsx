
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimulationDataPanel } from './SimulationDataPanel';
import { SimulationResultsPanel } from './SimulationResultsPanel';

export const NewSimulatorLayout = () => {
  const [simulationData, setSimulationData] = useState({
    administrator: '',
    consortiumType: 'property',
    installmentType: 'full',
    value: 0,
    term: 240,
    updateRate: 8,
    searchType: 'contribution'
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left Panel - Simulation Data (25% on desktop, 100% on mobile) */}
      <div className="w-full lg:w-1/4 order-1 lg:order-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Dados da Simulação</CardTitle>
          </CardHeader>
          <CardContent>
            <SimulationDataPanel 
              data={simulationData}
              onChange={setSimulationData}
            />
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Results (75% on desktop, 100% on mobile) */}
      <div className="w-full lg:w-3/4 order-2 lg:order-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <SimulationResultsPanel data={simulationData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
