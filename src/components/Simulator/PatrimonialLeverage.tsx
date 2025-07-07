
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { SimulatorForm } from './SimulatorForm';
import { ResultsPanel } from './ResultsPanel';
import { DetailDrawer } from './DetailDrawer';
import { SimulatorData } from '@/types/simulator';

export const PatrimonialLeverage = () => {
  const [simulatorData, setSimulatorData] = useState<SimulatorData>({
    simulationType: 'installment',
    installmentType: 'full',
    simulationTime: 240,
    contemplationPeriod: 24,
    value: 0
  });
  const [showResults, setShowResults] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const handleCalculate = () => {
    setShowResults(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Panel - Simulator Form */}
      <Card className="p-6">
        <SimulatorForm 
          data={simulatorData}
          onChange={setSimulatorData}
          onCalculate={handleCalculate}
          onOpenDetails={() => setDetailDrawerOpen(true)}
        />
      </Card>

      {/* Right Panel - Results */}
      <Card className="p-6">
        <ResultsPanel 
          data={simulatorData}
          showResults={showResults}
        />
      </Card>

      <DetailDrawer 
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
      />
    </div>
  );
};
