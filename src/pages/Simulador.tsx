
import { SimulatorLayout } from '@/components/Layout/SimulatorLayout';
import { NewSimulatorLayout } from '@/components/Simulator/NewSimulatorLayout';
import { SimulatorProvider } from '@/contexts/SimulatorContext';

const Simulador = () => {
  return (
    <SimulatorLayout>
      <div className="w-full max-w-none mx-auto overflow-x-hidden">
        <div className="bg-background/90 backdrop-blur-sm rounded-3xl shadow-xl border border-border/50 p-1 mx-2 md:mx-4">
          <div className="bg-card rounded-[calc(1.5rem-4px)] p-4 md:p-6 lg:p-8 shadow-sm min-h-[600px] overflow-x-hidden">
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
