
import { Header } from '@/components/Layout/Header';
import { SimpleSimulatorForm } from '@/components/Simulator/SimpleSimulatorForm';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Simulator Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-1">
            <div className="bg-white rounded-[calc(1.5rem-4px)] p-8 shadow-sm">
              <SimpleSimulatorForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
