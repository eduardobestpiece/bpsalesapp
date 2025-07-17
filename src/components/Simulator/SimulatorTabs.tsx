
import { UnifiedSimulator } from './UnifiedSimulator';
import { SimulatorProvider } from '@/contexts/SimulatorContext';

export const SimulatorTabs = () => {
  return (
    <SimulatorProvider>
      <div className="w-full">
        <UnifiedSimulator />
      </div>
    </SimulatorProvider>
  );
};
