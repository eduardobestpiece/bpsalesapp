
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CrmUser } from '@/types/crm';

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
        console.error('Error fetching CRM users:', error);
        throw error;
      }

      return data as CrmUser[];
    },
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
