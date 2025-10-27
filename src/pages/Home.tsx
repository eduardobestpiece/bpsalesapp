
import { useNavigate } from 'react-router-dom';
import { Calculator, Settings, Users } from 'lucide-react';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useEffect } from 'react';
import { useDefaultBranding } from '@/hooks/useDefaultBranding';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useCanAccessSimulator, usePermissions } from '@/hooks/usePermissions';
import { CompanyProvider } from '@/contexts/CompanyContext';

function HomeContent() {
  const navigate = useNavigate();
  const { userRole } = useCrmAuth();
  const { branding: defaultBranding, isLoading: brandingLoading } = useDefaultBranding();
  
  // Hook para verificar permissões customizadas do usuário
  const { canAccessSimulator, canAccessSimulatorConfig, isLoading: permissionsLoading } = useUserPermissions();
  
  // Hook para verificar permissões do Simulador baseadas em role
  const canAccessSimulatorByRole = useCanAccessSimulator();
  
  // Hook para verificar permissões gerais
  const permissions = usePermissions();

  // Debug: Log das permissões e dados do usuário
  useEffect(() => {
    console.log('🔍 DEBUG HOME - Dados do usuário:', {
      userRole,
      crmUser: crmUser ? { id: crmUser.id, email: crmUser.email, role: crmUser.role } : null,
      permissions,
      canAccessGestao: permissions.canAccessGestao
    });
  }, [userRole, crmUser, permissions]);

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
      
      {/* Debug Info */}
      <div className="mb-4 p-4 bg-black/20 rounded-lg text-xs text-gray-300">
        <div>Role: {userRole || 'N/A'}</div>
        <div>canAccessGestao: {permissions.canAccessGestao ? '✅' : '❌'}</div>
        <div>canAccessConfigurations: {permissions.canAccessConfigurations ? '✅' : '❌'}</div>
        <div>canAccessSimulator: {permissions.canAccessSimulator ? '✅' : '❌'}</div>
      </div>
      
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
