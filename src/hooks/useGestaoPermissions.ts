import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';

interface GestaoPermissions {
  canView: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canDeactivate: boolean;
}

export const useGestaoPermissions = (): GestaoPermissions => {
  const { crmUser, userRole } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  
  const effectiveCompanyId = selectedCompanyId || crmUser?.company_id;

  const { data: permissions = [] } = useQuery({
    queryKey: ['gestao_permissions', effectiveCompanyId, crmUser?.id],
    queryFn: async () => {
      if (!effectiveCompanyId || !crmUser?.id) return [];

      // Obter o nome de exibição da função do usuário atual
      const roleMapping = [
        { key: 'master', name: 'Master' },
        { key: 'submaster', name: 'Submaster' },
        { key: 'admin', name: 'Administrador' },
        { key: 'leader', name: 'Líder' },
        { key: 'user', name: 'Usuário' },
      ];
      
      const currentUserRoleDisplayName = roleMapping.find(r => r.key === crmUser.role)?.name;

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
        console.error('Erro ao buscar permissões de gestão:', error);
        return [];
      }

      // Filtrar permissões que se aplicam ao usuário atual
      const applicablePermissions = data.filter(permission => {
        switch (permission.level) {
          case 'Função':
            return permission.detail_value === currentUserRoleDisplayName;
          case 'Time':
            return permission.team_id === crmUser?.team_id;
          case 'Usuário':
            return permission.user_id === crmUser?.id;
          default:
            return false;
        }
      });

      return applicablePermissions;
    },
    enabled: !!effectiveCompanyId && !!crmUser?.id,
  });

  // Verificar permissões específicas para o módulo 'management' (que corresponde à aba de Gestão)
  const gestaoPermissions = permissions.flatMap(permission => 
    permission.permission_details?.filter(detail => detail.module_name === 'management') || []
  );



  // Se não há permissões específicas, usar permissões padrão baseadas no role
  const defaultPermissions = {
    master: { canView: true, canEdit: true, canCreate: true, canDeactivate: true },
    admin: { canView: true, canEdit: true, canCreate: true, canDeactivate: true },
    leader: { canView: true, canEdit: false, canCreate: false, canDeactivate: false },
    user: { canView: false, canEdit: false, canCreate: false, canDeactivate: false },
  };

  // Se há permissões específicas, usar elas; senão, usar padrões
  if (gestaoPermissions.length > 0) {
    const canView = gestaoPermissions.some(p => p.can_view === 'allowed');
    const canEdit = gestaoPermissions.some(p => p.can_edit === 'allowed');
    const canCreate = gestaoPermissions.some(p => p.can_create === 'allowed');
    const canDeactivate = gestaoPermissions.some(p => p.can_deactivate === 'allowed');



    return {
      canView,
      canEdit,
      canCreate,
      canDeactivate,
    };
  }



  // Usar permissões padrão baseadas no role
  return defaultPermissions[userRole as keyof typeof defaultPermissions] || defaultPermissions.user;
}; 