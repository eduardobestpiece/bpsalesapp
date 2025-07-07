
import { Header } from '@/components/Layout/Header';
import { SimulatorTabs } from '@/components/Simulator/SimulatorTabs';
import { TrendingUp, Shield, Calculator, Target } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-accent/5">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12 text-center space-y-6">
            <div className="inline-flex items-center space-x-2 bg-primary-100/50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
              <Shield className="h-4 w-4" />
              <span>Simulação Confiável e Precisa</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Simulador de
              <span className="text-gradient-primary block mt-2">Alavancagem Patrimonial</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Simule suas estratégias de investimento e descubra como multiplicar seu patrimônio através de consórcios imobiliários
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 hover:shadow-md transition-all duration-300">
                <div className="bg-gradient-primary p-3 rounded-xl w-fit mx-auto mb-4">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Cálculos Precisos</h3>
                <p className="text-gray-600 text-sm">Algoritmos avançados para simulações realistas</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 hover:shadow-md transition-all duration-300">
                <div className="bg-gradient-success p-3 rounded-xl w-fit mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Múltiplos Cenários</h3>
                <p className="text-gray-600 text-sm">Compare diferentes estratégias de investimento</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 hover:shadow-md transition-all duration-300">
                <div className="bg-gradient-accent p-3 rounded-xl w-fit mx-auto mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Metas Realistas</h3>
                <p className="text-gray-600 text-sm">Defina objetivos alcançáveis para seu patrimônio</p>
              </div>
            </div>
          </div>
          
          {/* Simulator Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-1">
            <div className="bg-white rounded-[calc(1.5rem-4px)] p-8 shadow-sm">
              <SimulatorTabs />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
