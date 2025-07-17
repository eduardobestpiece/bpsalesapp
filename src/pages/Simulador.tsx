
import { SimulatorLayout } from '@/components/Layout/SimulatorLayout';
import { NewSimulatorLayout } from '@/components/Simulator/NewSimulatorLayout';
import { SimulatorProvider } from '@/contexts/SimulatorContext';

const Simulador = () => {
  return (
    <SimulatorLayout>
      <div className="w-full overflow-x-hidden">
        <div className="bg-background/90 backdrop-blur-sm rounded-3xl shadow-xl border border-border/50 p-1 mx-1 md:mx-2 max-w-full">
          <div className="bg-card rounded-[calc(1.5rem-4px)] p-2 md:p-4 lg:p-6 shadow-sm min-h-[600px] overflow-x-hidden max-w-full">
            <SimulatorProvider>
              <NewSimulatorLayout />
            </SimulatorProvider>
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
};

export default Simulador;
