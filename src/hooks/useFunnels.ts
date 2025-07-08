
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

// Funções utilitárias para manipular etapas do funil
export const insertFunnelStages = async (funnelId: string, stages: any[]) => {
  if (!stages.length) return;
  const stagesToInsert = stages.map(stage => ({
    ...stage,
    funnel_id: funnelId,
    created_at: undefined,
    updated_at: undefined,
    id: undefined,
  }));
  const { error } = await supabase.from('funnel_stages').insert(stagesToInsert);
  if (error) throw error;
};

export const updateFunnelStages = async (funnelId: string, stages: any[]) => {
  for (const stage of stages) {
    if (stage.id) {
      // Atualizar etapa existente
      const { error } = await supabase.from('funnel_stages').update({
        name: stage.name,
        stage_order: stage.stage_order,
        target_percentage: stage.target_percentage,
        target_value: stage.target_value,
        updated_at: new Date().toISOString(),
      }).eq('id', stage.id);
      if (error) throw error;
    } else {
      // Inserir nova etapa
      await insertFunnelStages(funnelId, [stage]);
    }
  }
};

export const deleteFunnelStages = async (stageIds: string[]) => {
  if (!stageIds.length) return;
  const { error } = await supabase.from('funnel_stages').delete().in('id', stageIds);
  if (error) throw error;
};
