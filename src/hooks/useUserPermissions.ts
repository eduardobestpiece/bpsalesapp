import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';

interface UserPermission {
  module_name: string;
  can_view: string;
  can_edit: string;
  can_create: string;
  can_archive: string;
  can_deactivate: string;
}

// Mapeamento de roles (key para nome de exibição)
const roleMapping = [
  { key: 'master', name: 'Master' },
  { key: 'submaster', name: 'Submaster' },
  { key: 'admin', name: 'Administrador' },
  { key: 'leader', name: 'Líder' },
  { key: 'user', name: 'Usuário' },
];

export const useUserPermissions = () => {
  const { crmUser, userRole } = useCrmAuth();
  
  // Tentar usar o CompanyProvider, mas não falhar se não estiver disponível
  let selectedCompanyId: string | null = null;
  try {
    const companyContext = useCompany();
    selectedCompanyId = companyContext.selectedCompanyId;
  } catch (error) {
    // Se não estiver dentro do CompanyProvider, usar company_id do usuário
    selectedCompanyId = crmUser?.company_id || null;
  }

  const effectiveCompanyId = selectedCompanyId || crmUser?.company_id;

  const { data: userPermissions = [], isLoading, error } = useQuery({
    queryKey: ['user_permissions', effectiveCompanyId, crmUser?.id],
    queryFn: async () => {
      // Permissões desativadas na plataforma: retornar vazio e liberar acesso
      return [];
    },
    enabled: !!effectiveCompanyId && !!crmUser?.id,
  });

  // Função para verificar se o usuário pode acessar um módulo
  const canAccessModule = (moduleName: string, action: 'view' | 'edit' | 'create' | 'archive' | 'deactivate' = 'view'): boolean => {
    // Se o sistema de permissões estiver desativado/indisponível, liberar tudo
    const permissionsDisabled = !!error || userPermissions.length === 0;
    if (permissionsDisabled) return true;
    // Master sempre tem acesso total
    if (userRole === 'master') return true;
    
    // Para admin e outros roles, verificar permissões customizadas
    const modulePermission = userPermissions.find(p => p.module_name === moduleName);
    if (!modulePermission) {
      // Sem registro específico => permitir por padrão
      return true;
    }

    const permissionValue = modulePermission[`can_${action}` as keyof UserPermission] as string;
    // console.log(`[DEBUG] Módulo: ${moduleName}, Ação: ${action}, Valor: ${permissionValue}`);
    
    // Verificar se tem permissão baseada no valor
    switch (permissionValue) {
      case 'company':
      case 'team':
      case 'personal':
      case 'allowed':
        return true;
      case 'none':
        return false;
      default:
        return false;
    }
  };

  // Função específica para verificar acesso ao simulador
  const canAccessSimulator = (): boolean => {
    // console.log(`[DEBUG] === VERIFICAÇÃO SIMULADOR ===`);
    // console.log(`[DEBUG] userRole: ${userRole}`);
    // console.log(`[DEBUG] userPermissions encontradas:`, userPermissions);
    
    const modulePermission = userPermissions.find(p => p.module_name === 'simulator');
    // console.log(`[DEBUG] modulePermission encontrada:`, modulePermission);
    
    if (modulePermission) {
      // console.log(`[DEBUG] can_view value: ${modulePermission.can_view}`);
    }
    
    const hasAccess = canAccessModule('simulator', 'view');
    // console.log(`[DEBUG] canAccessSimulator final: ${hasAccess}`);
    // console.log(`[DEBUG] === FIM VERIFICAÇÃO SIMULADOR ===`);
    return hasAccess;
  };

  // Função específica para verificar acesso às configurações do simulador
  const canAccessSimulatorConfig = (): boolean => {
    // console.log(`[DEBUG] === VERIFICAÇÃO SIMULADOR CONFIG ===`);
    // console.log(`[DEBUG] userRole: ${userRole}`);
    // console.log(`[DEBUG] userPermissions encontradas:`, userPermissions);
    
    const modulePermission = userPermissions.find(p => p.module_name === 'simulator-config');
    // console.log(`[DEBUG] modulePermission encontrada:`, modulePermission);
    
    if (modulePermission) {
      // console.log(`[DEBUG] can_view value: ${modulePermission.can_view}`);
    }

    const hasAccess = canAccessModule('simulator-config', 'view');
    // console.log(`[DEBUG] canAccessSimulatorConfig final: ${hasAccess}`);
    // console.log(`[DEBUG] === FIM VERIFICAÇÃO SIMULADOR CONFIG ===`);
    return hasAccess;
  };

  // Função para verificar se pode acessar o módulo simulador (qualquer página)
  const canAccessSimulatorModule = (): boolean => {
    // Master sempre tem acesso total
    if (userRole === 'master') return true;
    
    // Verificar se tem acesso a pelo menos uma das páginas do simulador
    const canAccessSimulatorPage = canAccessModule('simulator', 'view');
    const canAccessConfigPage = canAccessModule('simulator-config', 'view');
    
    const hasAccess = canAccessSimulatorPage || canAccessConfigPage;
    // console.log(`[DEBUG] canAccessSimulatorModule: ${hasAccess} (simulator: ${canAccessSimulatorPage}, config: ${canAccessConfigPage})`);
    
    return hasAccess;
  };

  // Funções específicas para configurações do simulador
  const canEditSimulatorConfig = (): boolean => {
    // Master sempre tem acesso total
    if (userRole === 'master') return true;
    
    const hasAccess = canAccessModule('simulator-config', 'edit');
    // console.log(`[DEBUG] canEditSimulatorConfig: ${hasAccess}`);
    return hasAccess;
  };

  const canCreateSimulatorConfig = (): boolean => {
    // Master sempre tem acesso total
    if (userRole === 'master') return true;
    
    const hasAccess = canAccessModule('simulator-config', 'create');
    // console.log(`[DEBUG] canCreateSimulatorConfig: ${hasAccess}`);
    return hasAccess;
  };

  const canArchiveSimulatorConfig = (): boolean => {
    // Master sempre tem acesso total
    if (userRole === 'master') return true;
    
    const hasAccess = canAccessModule('simulator-config', 'archive');
    // console.log(`[DEBUG] canArchiveSimulatorConfig: ${hasAccess}`);
    return hasAccess;
  };

  return {
    userRole, // Adicionando userRole ao retorno
    userPermissions,
    canAccessModule,
    canAccessSimulator,
    canAccessSimulatorConfig,
    canAccessSimulatorModule,
    canEditSimulatorConfig,
    canCreateSimulatorConfig,
    canArchiveSimulatorConfig,
    isLoading: isLoading || !crmUser || !effectiveCompanyId,
    error,
  };
}; 