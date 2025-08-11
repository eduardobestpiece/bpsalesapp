
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CrmUser } from '@/types/crm';
import { simInfoLog } from '@/lib/devlog';

export const useCrmUsers = () => {
  return useQuery({
    queryKey: ['crm-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_users')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        // Se o erro for de RLS (usuário não autenticado), retornar array vazio
        if (error.code === 'PGRST301' || error.message.includes('RLS')) {
          return [] as CrmUser[];
        }
        throw error;
      }

      return data as CrmUser[];
    },
  });
};

export const useCrmUsersByCompany = (companyId?: string | null) => {
  return useQuery({
    queryKey: ['crm-users', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      simInfoLog('[USERS-QUERY] fetching by company', { companyId });
      const { data, error } = await supabase
        .from('crm_users')
        .select('*')
        .eq('status', 'active')
        .eq('company_id', companyId as string)
        .order('created_at', { ascending: false });

      simInfoLog('[USERS-QUERY] result', { count: data?.length ?? 0, error });
      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('RLS')) {
          return [] as CrmUser[];
        }
        throw error;
      }

      return data as CrmUser[];
    }
  });
};

export const useCreateCrmUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: any) => {
      const { data, error } = await supabase
        .from('crm_users')
        .insert(userData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-users'] });
    },
  });
};

export const useUpdateCrmUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...userData }: any) => {
      const { data, error } = await supabase
        .from('crm_users')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-users'] });
    },
  });
};
