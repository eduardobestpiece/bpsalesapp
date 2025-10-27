import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useCanAccessSimulator } from '@/hooks/usePermissions';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { AccessDenied } from './AccessDenied';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: string;
  requiredAction?: 'view' | 'edit' | 'create' | 'archive' | 'deactivate';
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredModule,
  requiredAction = 'view',
  fallbackPath = '/simulador'
}) => {
  const { userRole } = useCrmAuth();
  const { canAccessModule, canAccessSimulatorModule, isLoading } = useUserPermissions();
  const canAccessSimulatorByRole = useCanAccessSimulator();
  const location = useLocation();

  // Se for master, sempre permitir acesso
  if (userRole === 'master') {
    return <>{children}</>;
  }

  // Se estiver carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não especificou módulo, permitir acesso
  if (!requiredModule) {
    return <>{children}</>;
  }

  // Caso especial para simulador: verificar se pode acessar o módulo
  if (requiredModule === 'simulator') {
    // Primeiro verificar se tem permissão baseada em role
    if (!canAccessSimulatorByRole) {
      return <AccessDenied moduleName="o Simulador" action="acessar" />;
    }
    
    // Depois verificar permissões customizadas
    const canAccessSimulatorModuleResult = canAccessSimulatorModule();
    if (!canAccessSimulatorModuleResult) {
      return <AccessDenied moduleName="o Simulador" action="acessar" />;
    }
    
    // Se pode acessar o módulo, verificar se pode acessar a página específica
    const canAccessPage = canAccessModule('simulator', 'view');
    if (!canAccessPage) {
      // Se não pode acessar a página principal, redirecionar para configurações
      return <Navigate to="/simulador/configuracoes" replace />;
    }
    
    return <>{children}</>;
  }

  // Verificar se tem permissão para o módulo
  const hasPermission = canAccessModule(requiredModule, requiredAction);

  if (!hasPermission) {
    // Mostrar página de acesso negado
    const moduleNames: { [key: string]: string } = {
      'simulator': 'o Simulador',
      'simulator-config': 'as Configurações do Simulador',
      'management': 'a Gestão',
      'crm-config': 'as Configurações do CRM',
      'indicators': 'os Indicadores',
      'leads': 'os Leads'
    };

    const actionNames: { [key: string]: string } = {
      'view': 'visualizar',
      'edit': 'editar',
      'create': 'criar',
      'archive': 'arquivar',
      'deactivate': 'desativar'
    };

    return (
      <AccessDenied 
        moduleName={moduleNames[requiredModule] || requiredModule}
        action={actionNames[requiredAction] || requiredAction}
      />
    );
  }

  return <>{children}</>;
}; 