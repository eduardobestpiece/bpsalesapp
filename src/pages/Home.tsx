import { useNavigate } from 'react-router-dom';
import { Calculator, BarChart2 } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50/80 via-white to-primary-100 p-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-primary-900 text-center drop-shadow">Bem-vindo à Plataforma Monteo</h1>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl justify-center">
        <button
          onClick={() => navigate('/')}
          className="flex-1 bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center hover:bg-primary-50 transition border border-primary-100 group focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          <Calculator className="h-14 w-14 text-primary-600 mb-4 group-hover:scale-110 transition" />
          <span className="text-2xl font-semibold text-primary-700 mb-2">Simulador</span>
          <span className="text-primary-500 text-center">Acesse o simulador de consórcio patrimonial.</span>
        </button>
        <button
          onClick={() => navigate('/crm/indicadores')}
          className="flex-1 bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center hover:bg-secondary-50 transition border border-secondary-100 group focus:outline-none focus:ring-2 focus:ring-secondary-300"
        >
          <BarChart2 className="h-14 w-14 text-secondary-600 mb-4 group-hover:scale-110 transition" />
          <span className="text-2xl font-semibold text-secondary-700 mb-2">CRM</span>
          <span className="text-secondary-500 text-center">Acesse o CRM e veja os indicadores de vendas.</span>
        </button>
      </div>
    </div>
  );
} 