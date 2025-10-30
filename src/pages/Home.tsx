
import { useNavigate } from 'react-router-dom';
import { Calculator, Settings, Users, LogOut, Search } from 'lucide-react';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useEffect } from 'react';
import { useDefaultBranding } from '@/hooks/useDefaultBranding';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useCanAccessSimulator, usePermissions } from '@/hooks/usePermissions';
import { CompanyProvider } from '@/contexts/CompanyContext';

function HomeContent() {
  const navigate = useNavigate();
  const { userRole, signOut } = useCrmAuth();
  const { branding: defaultBranding, isLoading: brandingLoading } = useDefaultBranding();
  
  // Hook para verificar permissões customizadas do usuário
  const { canAccessSimulator, canAccessSimulatorConfig, isLoading: permissionsLoading } = useUserPermissions();
  
  // Hook para verificar permissões do Simulador baseadas em role
  const canAccessSimulatorByRole = useCanAccessSimulator();
  
  // Hook para verificar permissões gerais
  const permissions = usePermissions();

  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#131313] via-[#1E1E1E] to-[#161616]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: defaultBranding?.primary_color || '#E50F5E' }}></div>
      </div>
    );
  }

  // Verificar permissões usando o novo sistema
  const canAccessSimulatorPage = canAccessSimulator() && canAccessSimulatorByRole;
  const canAccessConfigPage = canAccessSimulatorConfig() && canAccessSimulatorByRole;
  const canAccessSettingsModule = canAccessConfigPage || userRole === 'admin' || userRole === 'master' || permissions.canAccessPerfil;

  const handleGoToSimulator = () => {
    if (canAccessSimulatorPage) {
      navigate('/simulador');
    } else if (canAccessConfigPage) {
      navigate('/simulador/configuracoes');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/crm/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
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
            <Calculator className="h-12 w-12 mr-6 group-hover:scale-110 transition" style={{ color: defaultBranding?.primary_color || '#E50F5E' }} />
            <div className="flex-1 text-left">
              <span className="text-xl font-semibold text-white block mb-1">Simulador</span>
              <span className="text-gray-300 text-sm">Acesse o simulador de propostas.</span>
            </div>
          </button>
        )}
        
        {/* Botão Gestão */}
        {permissions.canAccessGestao && (
          <button
            onClick={() => navigate('/gestao/leads')}
            className="w-full bg-[#1F1F1F] rounded-2xl shadow-xl p-6 flex items-center hover:bg-[#161616] transition border border-white/10 group focus:outline-none focus:ring-2 focus:ring-[#e50f5f]/50"
          >
            <Users className="h-12 w-12 mr-6 group-hover:scale-110 transition" style={{ color: defaultBranding?.primary_color || '#E50F5E' }} />
            <div className="flex-1 text-left">
              <span className="text-xl font-semibold text-white block mb-1">Gestão</span>
              <span className="text-gray-300 text-sm">Gerencie leads, agendamentos e vendas.</span>
            </div>
          </button>
        )}
        
        {/* Botão Prospecção (oculto para Colaborador) */}
        {permissions.canAccessGestao && userRole !== 'user' && (
          <button
            onClick={() => navigate('/prospeccao')}
            className="w-full bg-[#1F1F1F] rounded-2xl shadow-xl p-6 flex items-center hover:bg-[#161616] transition border border-white/10 group focus:outline-none focus:ring-2 focus:ring-[#e50f5f]/50"
          >
            <Search className="h-12 w-12 mr-6 group-hover:scale-110 transition" style={{ color: defaultBranding?.primary_color || '#E50F5E' }} />
            <div className="flex-1 text-left">
              <span className="text-xl font-semibold text-white block mb-1">Prospecção</span>
              <span className="text-gray-300 text-sm">Extraia dados do Google e Instagram.</span>
            </div>
          </button>
        )}
        
        {/* Botão Configurações */}
        {canAccessSettingsModule && (
          <button
            onClick={() => navigate('/configuracoes/gestao')}
            className="w-full bg-[#1F1F1F] rounded-2xl shadow-xl p-6 flex items-center hover:bg-[#161616] transition border border-white/10 group focus:outline-none focus:ring-2 focus:ring-[#e50f5f]/50"
          >
            <Settings className="h-12 w-12 mr-6 group-hover:scale-110 transition" style={{ color: defaultBranding?.primary_color || '#E50F5E' }} />
            <div className="flex-1 text-left">
              <span className="text-xl font-semibold text-white block mb-1">Configurações</span>
              <span className="text-gray-300 text-sm">Gerencie seu perfil, empresa e usuários.</span>
            </div>
          </button>
        )}
      </div>

      {/* Botão de Logout - discreto */}
      <div className="mt-8">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
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
