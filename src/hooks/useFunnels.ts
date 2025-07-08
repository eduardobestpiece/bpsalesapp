
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Funnel = Tables<'funnels'>;
type FunnelInsert = TablesInsert<'funnels'>;
type FunnelUpdate = TablesUpdate<'funnels'>;

export const useFunnels = (companyId?: string | null, status: 'active' | 'archived' | 'all' = 'active') => {
  const { companyId: authCompanyId } = useCrmAuth();
  const effectiveCompanyId = companyId || authCompanyId;

  return useQuery({
    queryKey: ['funnels', effectiveCompanyId, status],
    queryFn: async () => {
      if (!effectiveCompanyId) {
        console.log('No company ID available for funnels query');
        return [];
      }

      let query = supabase
        .from('funnels')
        .select(`*, stages:funnel_stages(*)`)
        .eq('company_id', effectiveCompanyId)
        .order('name');

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching funnels:', error);
        throw error;
      }

      return data;
    },
    enabled: !!effectiveCompanyId
  });
};

export const useCreateFunnel = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCrmAuth();

  return useMutation({
    mutationFn: async (funnel: FunnelInsert) => {
      console.log('Creating funnel:', funnel);
      const { data, error } = await supabase
        .from('funnels')
        .insert([funnel])
        .select()
        .single();

      if (error) {
        console.error('Error creating funnel:', error);
        throw error;
      }

      console.log('Funnel created:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnels', companyId] });
    }
  });
};

export const useUpdateFunnel = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCrmAuth();

  return useMutation({
    mutationFn: async ({ id, ...funnel }: FunnelUpdate & { id: string }) => {
      console.log('Updating funnel:', id, funnel);
      const { data, error } = await supabase
        .from('funnels')
        .update(funnel)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating funnel:', error);
        throw error;
      }

      console.log('Funnel updated:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnels', companyId] });
    }
  });
};

export const useDeleteFunnel = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCrmAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting funnel:', id);
      const { error } = await supabase
        .from('funnels')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) {
        console.error('Error deleting funnel:', error);
        throw error;
      }

      console.log('Funnel deleted:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnels', companyId] });
    }
  });
};
