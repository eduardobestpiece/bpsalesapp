
import { Header } from '@/components/Layout/Header';
import { SimulatorTabs } from '@/components/Simulator/SimulatorTabs';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Simulador Financeiro
            </h1>
            <p className="text-xl text-gray-600">
              Simule suas estratégias de alavancagem patrimonial e ganho de capital
            </p>
          </div>
          
          <SimulatorTabs />
        </div>
      </main>
    </div>
  );
};

export default Index;
