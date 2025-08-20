
import { useNavigate } from 'react-router-dom';
import { Calculator, BarChart2, Settings } from 'lucide-react';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { useQuery } from '@tanstack/react-query';
import { useDefaultBranding } from '@/hooks/useDefaultBranding';

export default function Home() {
  const navigate = useNavigate();
  const { userRole, companyId } = useCrmAuth();
  const [pagePermissions, setPagePermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { branding: defaultBranding, isLoading: brandingLoading } = useDefaultBranding();

  // Debug: Log do branding
  useEffect(() => {
    // logs removidos
  }, [defaultBranding]);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#131313] via-[#1E1E1E] to-[#161616]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: defaultBranding?.primary_color || '#e50f5f' }}></div>
      </div>
    );
  }

  const canAccessSettings = (
    (settingsKeys.length > 0 && settingsKeys.some(k => pagePermissions[k] !== false)) ||
    userRole === 'admin' || userRole === 'master'
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#131313] via-[#1E1E1E] to-[#161616] p-4">
      {/* Botão de alternância de tema */}
      <div className="absolute top-4 right-4">
        <ThemeSwitch />
      </div>
      
      <h1 className="text-[28px] md:text-[44px] font-bold text-white mb-4 text-center">
        Bem-vindo à Plataforma
      </h1>
      
      <div className="flex flex-col gap-6 w-full max-w-2xl">
        {/* Botão Simulador */}
        {pagePermissions['simulator'] !== false && (
          <button
            onClick={() => navigate('/simulador')}
            className="w-full bg-[#1F1F1F] rounded-2xl shadow-xl p-6 flex items-center hover:bg-[#161616] transition border border-white/10 group focus:outline-none focus:ring-2 focus:ring-[#e50f5f]/50"
          >
            <Calculator className="h-12 w-12 mr-6 group-hover:scale-110 transition" style={{ color: defaultBranding?.primary_color || '#e50f5f' }} />
            <div className="flex-1 text-left">
              <span className="text-xl font-semibold text-white block mb-1">Simulador</span>
              <span className="text-gray-300 text-sm">Acesse o simulador de propostas.</span>
            </div>
          </button>
        )}
        
        {/* Botão CRM */}
        {pagePermissions['indicadores'] !== false && (
          <button
            onClick={() => navigate('/crm/indicadores')}
            className="w-full bg-[#1F1F1F] rounded-2xl shadow-xl p-6 flex items-center hover:bg-[#161616] transition border border-white/10 group focus:outline-none focus:ring-2 focus:ring-[#e50f5f]/50"
          >
            <BarChart2 className="h-12 w-12 mr-6 group-hover:scale-110 transition" style={{ color: defaultBranding?.primary_color || '#e50f5f' }} />
            <div className="flex-1 text-left">
              <span className="text-xl font-semibold text-white block mb-1">CRM</span>
              <span className="text-gray-300 text-sm">Acesse o CRM e veja os indicadores de vendas.</span>
            </div>
          </button>
        )}

        {/* Botão Configurações */}
        {canAccessSettings && (
          <button
            onClick={() => navigate('/configuracoes/simulador')}
            className="w-full bg-[#1F1F1F] rounded-2xl shadow-xl p-6 flex items-center hover:bg-[#161616] transition border border-white/10 group focus:outline-none focus:ring-2 focus:ring-[#e50f5f]/50"
          >
            <Settings className="h-12 w-12 mr-6 group-hover:scale-110 transition" style={{ color: defaultBranding?.primary_color || '#e50f5f' }} />
            <div className="flex-1 text-left">
              <span className="text-xl font-semibold text-white block mb-1">Configurações</span>
              <span className="text-gray-300 text-sm">Gerencie o Simulador, CRM e permissões.</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
