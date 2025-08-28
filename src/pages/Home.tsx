
import { useNavigate } from 'react-router-dom';
import { Calculator, BarChart2, Settings } from 'lucide-react';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useEffect } from 'react';
import { useDefaultBranding } from '@/hooks/useDefaultBranding';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { CompanyProvider } from '@/contexts/CompanyContext';

function HomeContent() {
  const navigate = useNavigate();
  const { userRole } = useCrmAuth();
  const { branding: defaultBranding, isLoading: brandingLoading } = useDefaultBranding();
  
  // Hook para verificar permissões customizadas do usuário
  const { canAccessSimulator, canAccessSimulatorConfig, isLoading: permissionsLoading } = useUserPermissions();

  // Debug: Log do branding
  useEffect(() => {
    // logs removidos
  }, [defaultBranding]);

  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#131313] via-[#1E1E1E] to-[#161616]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: defaultBranding?.primary_color || '#e50f5f' }}></div>
      </div>
    );
  }

  // Verificar permissões usando o novo sistema
  const canAccessSimulatorPage = canAccessSimulator();
  const canAccessConfigPage = canAccessSimulatorConfig();
  const canAccessSettingsModule = canAccessConfigPage || userRole === 'admin' || userRole === 'master';

  const handleGoToSimulator = () => {
    if (canAccessSimulatorPage) {
      navigate('/simulador');
    } else if (canAccessConfigPage) {
      navigate('/simulador/configuracoes');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#131313] via-[#1E1E1E] to-[#161616] p-4">
      {/* Botão de alternância de tema */}
      <div className="absolute top-4 right-4">
        {/* <ThemeSwitch /> */}
      </div>
      
      <h1 className="text-[28px] md:text-[44px] font-bold text-white mb-4 text-center">
        Bem-vindo à Plataforma
      </h1>
      
      <div className="flex flex-col gap-6 w-full max-w-2xl">
        {/* Botão Simulador */}
        {(canAccessSimulatorPage || canAccessConfigPage) && (
          <button
            onClick={handleGoToSimulator}
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

        {/* Botão Configurações */}
        {canAccessSettingsModule && (
          <button
            onClick={() => navigate('/configuracoes/gestao')}
            className="w-full bg-[#1F1F1F] rounded-2xl shadow-xl p-6 flex items-center hover:bg-[#161616] transition border border-white/10 group focus:outline-none focus:ring-2 focus:ring-[#e50f5f]/50"
          >
            <Settings className="h-12 w-12 mr-6 group-hover:scale-110 transition" style={{ color: defaultBranding?.primary_color || '#e50f5f' }} />
            <div className="flex-1 text-left">
              <span className="text-xl font-semibold text-white block mb-1">Configurações</span>
              <span className="text-gray-300 text-sm">Gerencie seu perfil, empresa e usuários.</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <CompanyProvider>
      <HomeContent />
    </CompanyProvider>
  );
}
