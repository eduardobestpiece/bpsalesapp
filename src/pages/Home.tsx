
import { useNavigate } from 'react-router-dom';
import { Calculator, BarChart2, Settings } from 'lucide-react';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { useQuery } from '@tanstack/react-query';

export default function Home() {
  const navigate = useNavigate();
  const { userRole, companyId } = useCrmAuth();
  const [pagePermissions, setPagePermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Buscar keys de páginas do módulo Configurações
  const { data: settingsKeys = [] } = useQuery({
    queryKey: ['app_pages_settings_keys_home'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_pages')
        .select('key')
        .eq('module', 'settings');
      return (data || []).map((r: any) => r.key as string);
    }
  });

  useEffect(() => {
    if (!companyId || !userRole) {
      setLoading(false);
      return;
    }
    
    supabase
      .from('role_page_permissions')
      .select('*')
      .eq('company_id', companyId)
      .eq('role', userRole)
      .then(({ data }) => {
        const perms: Record<string, boolean> = {};
        data?.forEach((row: any) => {
          perms[row.page] = row.allowed;
        });
        setPagePermissions(perms);
        setLoading(false);
      });
  }, [companyId, userRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const canAccessSettings = (
    (settingsKeys.length > 0 && settingsKeys.some(k => pagePermissions[k] !== false)) ||
    userRole === 'admin' || userRole === 'master'
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50/80 via-white to-primary-100 dark:from-[#131313] dark:via-[#1E1E1E] dark:to-[#161616] p-4">
      {/* Botão de alternância de tema */}
      <div className="absolute top-4 right-4">
        <ThemeSwitch />
      </div>
      
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-primary-900 dark:text-white text-center drop-shadow">
        Bem-vindo à Plataforma Monteo
      </h1>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-3xl justify-center">
        {/* Botão Simulador */}
        {pagePermissions['simulator'] !== false && (
          <button
            onClick={() => navigate('/simulador')}
            className="flex-1 bg-white dark:bg-[#1F1F1F] rounded-3xl shadow-xl p-10 flex flex-col items-center hover:bg-primary-50 dark:hover:bg-[#161616] transition border border-primary-100 dark:border-[#A86F57]/20 group focus:outline-none focus:ring-2 focus:ring-primary-300 dark:focus:ring-[#A86F57]/50"
          >
            <Calculator className="h-14 w-14 mb-4 group-hover:scale-110 transition" style={{ color: 'var(--brand-primary, #A86F57)' }} />
            <span className="text-2xl font-semibold text-primary-700 dark:text-white mb-2">Simulador</span>
            <span className="text-primary-500 dark:text-gray-300 text-center">Acesse o simulador de propostas.</span>
          </button>
        )}
        
        {/* Botão CRM */}
        {pagePermissions['indicadores'] !== false && (
          <button
            onClick={() => navigate('/crm/indicadores')}
            className="flex-1 bg-white dark:bg-[#1F1F1F] rounded-3xl shadow-xl p-10 flex flex-col items-center hover:bg-secondary-50 dark:hover:bg-[#161616] transition border border-secondary-100 dark:border-[#A86F57]/20 group focus:outline-none focus:ring-2 focus:ring-secondary-300 dark:focus:ring-[#A86F57]/50"
          >
            <BarChart2 className="h-14 w-14 mb-4 group-hover:scale-110 transition" style={{ color: 'var(--brand-primary, #A86F57)' }} />
            <span className="text-2xl font-semibold text-secondary-700 dark:text-white mb-2">CRM</span>
            <span className="text-secondary-500 dark:text-gray-300 text-center">Acesse o CRM e veja os indicadores de vendas.</span>
          </button>
        )}

        {/* Botão Configurações */}
        {canAccessSettings && (
          <button
            onClick={() => navigate('/configuracoes/simulador')}
            className="flex-1 bg-white dark:bg-[#1F1F1F] rounded-3xl shadow-xl p-10 flex flex-col items-center hover:bg-muted/40 dark:hover:bg-[#161616] transition border border-muted-100 dark:border-[#A86F57]/20 group focus:outline-none focus:ring-2 focus:ring-muted-300 dark:focus:ring-[#A86F57]/50"
          >
            <Settings className="h-14 w-14 mb-4 group-hover:scale-110 transition" style={{ color: 'var(--brand-primary, #A86F57)' }} />
            <span className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Configurações</span>
            <span className="text-gray-500 dark:text-gray-300 text-center">Gerencie o Simulador, CRM e permissões.</span>
          </button>
        )}
      </div>
    </div>
  );
}
