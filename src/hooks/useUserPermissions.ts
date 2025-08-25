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
      if (!effectiveCompanyId || !crmUser?.id) return [];

      // Obter o nome de exibição da função do usuário atual
      const currentUserRoleDisplayName = roleMapping.find(r => r.key === crmUser.role)?.name;
      console.log(`[DEBUG] Função do usuário (key): ${crmUser.role}, Nome de exibição: ${currentUserRoleDisplayName}`);

      const { data, error } = await supabase
        .from('custom_permissions')
        .select(`
          *,
          permission_details (
            module_name,
            can_view,
            can_edit,
            can_create,
            can_archive,
            can_deactivate
          )
        `)
        .eq('company_id', effectiveCompanyId);

      if (error) {
        console.error('Erro ao buscar permissões do usuário:', error);
        return [];
      }

      console.log('[DEBUG] Permissões brutas do Supabase:', data);

      // Filtrar permissões que se aplicam ao usuário atual
      const applicablePermissions = data.filter(permission => {
        console.log(`[DEBUG] Verificando permissão:`, permission);
        console.log(`[DEBUG] userRole (key): ${crmUser.role}, detail_value (DB): ${permission.detail_value}`);
        
        switch (permission.level) {
          case 'Função':
            // Verificar se o nome de exibição da função do usuário corresponde ao detail_value da permissão
            const hasRole = permission.detail_value === currentUserRoleDisplayName;
            console.log(`[DEBUG] Função - Comparando '${permission.detail_value}' com '${currentUserRoleDisplayName}'. Resultado: ${hasRole}`);
            return hasRole;
          
          case 'Time':
            // Verificar se o usuário pertence ao time especificado
            const hasTeam = permission.team_id === crmUser?.team_id;
            console.log(`[DEBUG] Time - hasTeam: ${hasTeam}`);
            return hasTeam;

          case 'Usuário':
            // Verificar se a permissão é para o usuário específico
            const hasUser = permission.user_id === crmUser?.id;
            console.log(`[DEBUG] Usuário - hasUser: ${hasUser}`);
            return hasUser;
          
          default:
            return false;
        }
      });

      console.log('[DEBUG] Permissões aplicáveis (após filtro):', applicablePermissions);

      // Mapear os detalhes das permissões para um formato mais fácil de usar
      const mappedPermissions = applicablePermissions.flatMap(p => 
        p.permission_details.map(detail => ({
          module_name: detail.module_name,
          can_view: detail.can_view,
          can_edit: detail.can_edit,
          can_create: detail.can_create,
          can_archive: detail.can_archive,
          can_deactivate: detail.can_deactivate,
        }))
      );
      
      return mappedPermissions;
    },
    enabled: !!effectiveCompanyId && !!crmUser?.id,
  });

  // Função para verificar se o usuário pode acessar um módulo
  const canAccessModule = (moduleName: string, action: 'view' | 'edit' | 'create' | 'archive' | 'deactivate' = 'view'): boolean => {
    // Master sempre tem acesso total
    if (userRole === 'master') return true;
    
    // Para admin e outros roles, verificar permissões customizadas
    const modulePermission = userPermissions.find(p => p.module_name === moduleName);
    if (!modulePermission) {
      console.log(`[DEBUG] Nenhuma permissão encontrada para módulo: ${moduleName}`);
      // Se não há permissão customizada definida, master, submaster e admin têm acesso por padrão
      if (userRole === 'master' || userRole === 'submaster' || userRole === 'admin') {
        console.log(`[DEBUG] ${userRole} sem permissão customizada para ${moduleName}. Acesso concedido por padrão.`);
        return true;
      }
      return false;
    }

    const permissionValue = modulePermission[`can_${action}` as keyof UserPermission] as string;
    console.log(`[DEBUG] Módulo: ${moduleName}, Ação: ${action}, Valor: ${permissionValue}`);
    
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
    console.log(`[DEBUG] === VERIFICAÇÃO SIMULADOR ===`);
    console.log(`[DEBUG] userRole: ${userRole}`);
    console.log(`[DEBUG] userPermissions encontradas:`, userPermissions);
    
    const modulePermission = userPermissions.find(p => p.module_name === 'simulator');
    console.log(`[DEBUG] modulePermission encontrada:`, modulePermission);
    
    if (modulePermission) {
      console.log(`[DEBUG] can_view value: ${modulePermission.can_view}`);
    }
    
    const hasAccess = canAccessModule('simulator', 'view');
    console.log(`[DEBUG] canAccessSimulator final: ${hasAccess}`);
    console.log(`[DEBUG] === FIM VERIFICAÇÃO SIMULADOR ===`);
    return hasAccess;
  };

  // Função específica para verificar acesso às configurações do simulador
  const canAccessSimulatorConfig = (): boolean => {
    console.log(`[DEBUG] === VERIFICAÇÃO SIMULADOR CONFIG ===`);
    console.log(`[DEBUG] userRole: ${userRole}`);
    console.log(`[DEBUG] userPermissions encontradas:`, userPermissions);
    
    const modulePermission = userPermissions.find(p => p.module_name === 'simulator-config');
    console.log(`[DEBUG] modulePermission encontrada:`, modulePermission);
    
    if (modulePermission) {
      console.log(`[DEBUG] can_view value: ${modulePermission.can_view}`);
    }

    const hasAccess = canAccessModule('simulator-config', 'view');
    console.log(`[DEBUG] canAccessSimulatorConfig final: ${hasAccess}`);
    console.log(`[DEBUG] === FIM VERIFICAÇÃO SIMULADOR CONFIG ===`);
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
    console.log(`[DEBUG] canAccessSimulatorModule: ${hasAccess} (simulator: ${canAccessSimulatorPage}, config: ${canAccessConfigPage})`);
    
    return hasAccess;
  };

  // Funções específicas para configurações do simulador
  const canEditSimulatorConfig = (): boolean => {
    // Master sempre tem acesso total
    if (userRole === 'master') return true;
    
    const hasAccess = canAccessModule('simulator-config', 'edit');
    console.log(`[DEBUG] canEditSimulatorConfig: ${hasAccess}`);
    return hasAccess;
  };

  const canCreateSimulatorConfig = (): boolean => {
    // Master sempre tem acesso total
    if (userRole === 'master') return true;
    
    const hasAccess = canAccessModule('simulator-config', 'create');
    console.log(`[DEBUG] canCreateSimulatorConfig: ${hasAccess}`);
    return hasAccess;
  };

  const canArchiveSimulatorConfig = (): boolean => {
    // Master sempre tem acesso total
    if (userRole === 'master') return true;
    
    const hasAccess = canAccessModule('simulator-config', 'archive');
    console.log(`[DEBUG] canArchiveSimulatorConfig: ${hasAccess}`);
    return hasAccess;
  };

  return {
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