
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FunnelWithStages } from '@/types/crm';

export const useFunnels = () => {
  return useQuery({
    queryKey: ['funnels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnels')
        .select(`
          *,
          stages:funnel_stages(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching funnels:', error);
        // Se o erro for de RLS (usuário não autenticado), retornar array vazio
        if (error.code === 'PGRST301' || error.message.includes('RLS')) {
          return [] as FunnelWithStages[];
        }
        throw error;
      }

      return data as FunnelWithStages[];
    },
  });
};

export const useCreateFunnel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (funnelData: any) => {
      const { data, error } = await supabase
        .from('funnels')
        .insert(funnelData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
    },
  });
};

export const useUpdateFunnel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...funnelData }: any) => {
      const { data, error } = await supabase
        .from('funnels')
        .update(funnelData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
    },
  });
};
