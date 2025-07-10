import { useNavigate } from 'react-router-dom';
import { Calculator, BarChart2 } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-primary-900 text-center drop-shadow">Bem-vindo à Plataforma Monteo</h1>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl justify-center">
        <button
          onClick={() => navigate('/')}
          className="flex-1 bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:bg-blue-50 transition border border-blue-100 group"
        >
          <Calculator className="h-14 w-14 text-blue-600 mb-4 group-hover:scale-110 transition" />
          <span className="text-xl font-semibold text-blue-700 mb-2">Simulador</span>
          <span className="text-gray-500 text-center">Acesse o simulador de consórcio patrimonial.</span>
        </button>
        <button
          onClick={() => navigate('/crm/indicadores')}
          className="flex-1 bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:bg-indigo-50 transition border border-indigo-100 group"
        >
          <BarChart2 className="h-14 w-14 text-indigo-600 mb-4 group-hover:scale-110 transition" />
          <span className="text-xl font-semibold text-indigo-700 mb-2">CRM</span>
          <span className="text-gray-500 text-center">Acesse o CRM e veja os indicadores de vendas.</span>
        </button>
      </div>
    </div>
  );
} 