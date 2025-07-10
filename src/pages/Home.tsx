import { useNavigate } from 'react-router-dom';
import { Calculator, BarChart2 } from 'lucide-react';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Home() {
  const navigate = useNavigate();
  const { userRole, companyId } = useCrmAuth();
  const [pagePermissions, setPagePermissions] = useState<any>({});

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from('role_page_permissions')
      .select('*')
      .eq('company_id', companyId)
      .eq('role', userRole)
      .then(({ data }) => {
        const perms: any = {};
        data?.forEach((row: any) => {
          perms[row.page] = row.allowed;
        });
        setPagePermissions(perms);
      });
  }, [companyId, userRole]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50/80 via-white to-primary-100 p-4 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-950 dark:to-gray-800">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-primary-900 text-center drop-shadow dark:text-white">Bem-vindo à Plataforma Monteo</h1>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl justify-center">
        {/* Botão Simulador */}
        {pagePermissions['simulator'] !== false && (
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center hover:bg-primary-50 transition border border-primary-100 group focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 dark:shadow-2xl"
          >
            <Calculator className="h-14 w-14 text-primary-600 mb-4 group-hover:scale-110 transition dark:text-blue-400" />
            <span className="text-2xl font-semibold text-primary-700 mb-2 dark:text-blue-200">Simulador</span>
            <span className="text-primary-500 text-center dark:text-gray-300">Acesse o simulador de propostas.</span>
          </button>
        )}
        <button
          onClick={() => navigate('/crm/indicadores')}
          className="flex-1 bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center hover:bg-secondary-50 transition border border-secondary-100 group focus:outline-none focus:ring-2 focus:ring-secondary-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 dark:shadow-2xl"
        >
          <BarChart2 className="h-14 w-14 text-secondary-600 mb-4 group-hover:scale-110 transition dark:text-blue-400" />
          <span className="text-2xl font-semibold text-secondary-700 mb-2 dark:text-blue-200">CRM</span>
          <span className="text-secondary-500 text-center dark:text-gray-300">Acesse o CRM e veja os indicadores de vendas.</span>
        </button>
      </div>
    </div>
  );
} 