
import { SimulatorLayout } from '@/components/Layout/SimulatorLayout';
import { NewSimulatorLayout } from '@/components/Simulator/NewSimulatorLayout';

const Simulador = () => {
  return (
    <SimulatorLayout>
      <div className="max-w-full mx-auto">
        <div className="bg-background/90 backdrop-blur-sm rounded-3xl shadow-xl border border-border/50 p-1">
          <div className="bg-card rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
            <NewSimulatorLayout />
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
};

export default Simulador;
