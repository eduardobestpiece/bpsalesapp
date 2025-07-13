import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IndicatorWithValues {
  id: string;
  user_id: string;
  funnel_id: string;
  period_date?: string | null;
  month_reference: number;
  year_reference: number;
  company_id: string;
  created_at?: string | null;
  updated_at?: string | null;
  sales_value?: number | null;
  period_start?: string | null;
  period_end?: string | null;
  archived_at?: string | null;
  is_delayed?: boolean | null;
  recommendations_count?: number | null;
  values: Array<{
    id: string;
    stage_id: string;
    value: number;
    created_at?: string | null;
    updated_at?: string | null;
  }>;
}

export const useIndicators = (companyId?: string, userId?: string, funnelId?: string) => {
  return useQuery({
    queryKey: ['indicators', companyId, userId, funnelId],
    queryFn: async () => {
      let query = supabase
        .from('indicators')
        .select(`
          *,
          values:indicator_values(*)
        `);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (funnelId) {
        query = query.eq('funnel_id', funnelId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as IndicatorWithValues[];
    },
    enabled: !!companyId
  });
};

export const useCreateIndicator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newIndicator: Omit<IndicatorWithValues, 'id' | 'values'>) => {
      const { data, error } = await supabase
        .from('indicators')
        .insert([newIndicator])
        .select()
        .single();

      if (error) throw error;
      return data as IndicatorWithValues;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] });
      toast.success('Indicador criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar indicador: ' + error.message);
    }
  });
};

export const useUpdateIndicator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedIndicator: IndicatorWithValues) => {
      const { data, error } = await supabase
        .from('indicators')
        .update(updatedIndicator)
        .eq('id', updatedIndicator.id)
        .select()
        .single();

      if (error) throw error;
      return data as IndicatorWithValues;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] });
      toast.success('Indicador atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar indicador: ' + error.message);
    }
  });
};

export const useDeleteIndicator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('indicators')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] });
      toast.success('Indicador excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir indicador: ' + error.message);
    }
  });
};
