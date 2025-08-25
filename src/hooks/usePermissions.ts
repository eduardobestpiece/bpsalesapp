import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

export interface Permission {
  id: string;
  name: string;
  level: 'Função' | 'Time' | 'Usuário';
  detail_value?: string;
  status: 'active' | 'inactive';
  company_id: string;
  team_id?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  permission_details?: PermissionDetail[];
}

export interface PermissionDetail {
  id: string;
  permission_id: string;
  module_name: string;
  can_view: string;
  can_create: string;
  can_edit: string;
  can_archive: string;
  can_deactivate: string;
}

export const usePermissions = () => {
  const { selectedCompanyId } = useCompany();
  const { companyId } = useCrmAuth();
  const effectiveCompanyId = selectedCompanyId || companyId;
  const queryClient = useQueryClient();

  // Query para carregar permissões
  const {
    data: permissions = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['permissions', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];

      const { data, error } = await supabase
        .from('custom_permissions')
        .select(`
          *,
          permission_details (*),
          teams (name),
          crm_users (first_name, last_name, email)
        `)
        .eq('company_id', effectiveCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Permission[];
    },
    enabled: !!effectiveCompanyId,
  });

  // Mutation para deletar/desativar permissão
  const deletePermissionMutation = useMutation({
    mutationFn: async (permissionId: string) => {
      const { error } = await supabase
        .from('custom_permissions')
        .update({ status: 'inactive' })
        .eq('id', permissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Permissão desativada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['permissions', effectiveCompanyId] });
    },
    onError: (error) => {
      toast.error('Erro ao desativar permissão');
      console.error('Erro ao desativar permissão:', error);
    },
  });

  // Mutation para reativar permissão
  const reactivatePermissionMutation = useMutation({
    mutationFn: async (permissionId: string) => {
      const { error } = await supabase
        .from('custom_permissions')
        .update({ status: 'active' })
        .eq('id', permissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Permissão reativada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['permissions', effectiveCompanyId] });
    },
    onError: (error) => {
      toast.error('Erro ao reativar permissão');
      console.error('Erro ao reativar permissão:', error);
    },
  });

  // Função para obter o texto do detalhamento
  const getDetailText = (permission: Permission): string => {
    switch (permission.level) {
      case 'Função':
        return permission.detail_value || '';
      case 'Time':
        return (permission as any).teams?.name || permission.detail_value || '';
      case 'Usuário':
        const user = (permission as any).crm_users;
        return user ? `${user.first_name} ${user.last_name} (${user.email})` : permission.detail_value || '';
      default:
        return '';
    }
  };

  // Função para formatar dados para a tabela
  const formatPermissionsForTable = () => {
    return permissions.map(permission => ({
      id: permission.id,
      name: permission.name,
      level: permission.level,
      detail: getDetailText(permission),
      status: permission.status,
      created_at: permission.created_at,
      updated_at: permission.updated_at,
      raw: permission
    }));
  };

  return {
    permissions,
    formattedPermissions: formatPermissionsForTable(),
    isLoading,
    error,
    refetch,
    deletePermission: deletePermissionMutation.mutate,
    reactivatePermission: reactivatePermissionMutation.mutate,
    isDeleting: deletePermissionMutation.isPending,
    isReactivating: reactivatePermissionMutation.isPending,
  };
}; 