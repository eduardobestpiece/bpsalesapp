import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { UserRole } from '@/types/crm';

export interface PermissionConfig {
  canAccessConfigurations: boolean;
  canAccessGestao: boolean;
  canAccessMasterConfig: boolean;
  canManageUsers: boolean;
  canAccessPerfil: boolean;
  canAccessLeads: boolean;
  canAccessSimulator: boolean;
}

export function usePermissions(): PermissionConfig {
  const { userRole, crmUser } = useCrmAuth();

  if (!userRole || !crmUser) {
    return {
      canAccessConfigurations: false,
      canAccessGestao: false,
      canAccessMasterConfig: false,
      canManageUsers: false,
      canAccessPerfil: false,
      canAccessLeads: false,
      canAccessSimulator: false,
    };
  }

  // Master: acesso total
  if (userRole === 'master') {
    return {
      canAccessConfigurations: true,
      canAccessGestao: true,
      canAccessMasterConfig: true,
      canManageUsers: true,
      canAccessPerfil: true,
      canAccessLeads: true,
      canAccessSimulator: true,
    };
  }

  // Administrador: acesso a Configurações e Gestão (exceto Master Config e Simulador)
  if (userRole === 'admin') {
    return {
      canAccessConfigurations: true,
      canAccessGestao: true,
      canAccessMasterConfig: false,
      canManageUsers: true,
      canAccessPerfil: true,
      canAccessLeads: true,
      canAccessSimulator: false, // Administrador não tem acesso ao Simulador
    };
  }

  // Colaborador: acesso limitado
  if (userRole === 'user') {
    return {
      canAccessConfigurations: false, // Colaborador não tem acesso às configurações
      canAccessGestao: false, // Colaborador não tem acesso à gestão
      canAccessMasterConfig: false,
      canManageUsers: false,
      canAccessPerfil: true, // Apenas aba Perfil via rota direta
      canAccessLeads: false,  // Colaborador não tem acesso aos leads
      canAccessSimulator: false, // Colaborador não tem acesso ao Simulador
    };
  }

  // Leader: acesso intermediário (pode ser expandido no futuro)
  if (userRole === 'leader') {
    return {
      canAccessConfigurations: false,
      canAccessGestao: true,
      canAccessMasterConfig: false,
      canManageUsers: false,
      canAccessPerfil: true,
      canAccessLeads: true,
      canAccessSimulator: false, // Leader não tem acesso ao Simulador
    };
  }

  // Submaster: acesso similar ao admin
  if (userRole === 'submaster') {
    return {
      canAccessConfigurations: true,
      canAccessGestao: true,
      canAccessMasterConfig: false,
      canManageUsers: true,
      canAccessPerfil: true,
      canAccessLeads: true,
      canAccessSimulator: false, // Submaster não tem acesso ao Simulador
    };
  }

  // Fallback: sem permissões
  return {
    canAccessConfigurations: false,
    canAccessGestao: false,
    canAccessMasterConfig: false,
    canManageUsers: false,
    canAccessPerfil: false,
    canAccessLeads: false,
    canAccessSimulator: false,
  };
}

// Hook para verificar se o usuário pode acessar uma página específica
export function usePageAccess(page: 'configurations' | 'gestao' | 'master-config' | 'perfil' | 'leads'): boolean {
  const permissions = usePermissions();

  switch (page) {
    case 'configurations':
      return permissions.canAccessConfigurations;
    case 'gestao':
      return permissions.canAccessGestao;
    case 'master-config':
      return permissions.canAccessMasterConfig;
    case 'perfil':
      return permissions.canAccessPerfil;
    case 'leads':
      return permissions.canAccessLeads;
    default:
      return false;
  }
}

// Hook para verificar se o usuário pode gerenciar usuários
export function useCanManageUsers(): boolean {
  const permissions = usePermissions();
  return permissions.canManageUsers;
}

// Hook para verificar se o usuário pode acessar o Simulador
export function useCanAccessSimulator(): boolean {
  const permissions = usePermissions();
  return permissions.canAccessSimulator;
}