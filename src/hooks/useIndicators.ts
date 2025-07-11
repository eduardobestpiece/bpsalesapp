
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Indicator, IndicatorValue } from '@/types/crm';
import { useCompany } from '@/contexts/CompanyContext';

interface IndicatorWithValues extends Indicator {
  values: IndicatorValue[];
}

export const useIndicators = (companyId?: string, userId?: string) => {
  const { selectedCompanyId } = useCompany();
  const effectiveCompanyId = companyId || selectedCompanyId;
  return useQuery({
    queryKey: ['indicators', effectiveCompanyId, userId],
    queryFn: async () => {
      console.log('[useIndicators] Iniciando busca de indicadores para companyId:', effectiveCompanyId, 'userId:', userId);
      if (!effectiveCompanyId) {
        console.log('[useIndicators] CompanyId não fornecido, retornando array vazio');
        return [] as IndicatorWithValues[];
      }
      try {
        let query = supabase
          .from('indicators')
          .select(`*, values:indicator_values(*)`)
          .order('period_date', { ascending: false });
        query = query.is('archived_at', null);
        if (effectiveCompanyId) {
          query = query.eq('company_id', effectiveCompanyId);
        }
        if (userId) {
          query = query.eq('user_id', userId);
        }
        const { data, error } = await query;
        if (error) {
          if (error.code === 'PGRST301' || error.message.includes('RLS')) {
            return [] as IndicatorWithValues[];
          }
          throw error;
        }
        return data as IndicatorWithValues[];
      } catch (err) {
        return [] as IndicatorWithValues[];
      }
    },
    enabled: !!effectiveCompanyId,
    staleTime: 30000,
    gcTime: 300000,
    retry: 1,
    retryDelay: 1000,
  });
};

export const useCreateIndicator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (indicatorData: {
      indicator: Omit<Indicator, 'id' | 'created_at' | 'updated_at'>;
      values: Omit<IndicatorValue, 'id' | 'indicator_id' | 'created_at' | 'updated_at'>[];
    }) => {
      // First create the indicator
      const { data: indicator, error: indicatorError } = await supabase
        .from('indicators')
        .insert(indicatorData.indicator)
        .select()
        .single();

      if (indicatorError) throw indicatorError;

      // Then create the indicator values
      const valuesToInsert = indicatorData.values.map(value => ({
        ...value,
        indicator_id: indicator.id
      }));
      console.log('Salvando indicator_values:', valuesToInsert);

      const { error: valuesError } = await supabase
        .from('indicator_values')
        .insert(valuesToInsert);

      if (valuesError) {
        console.error('Erro ao salvar indicator_values:', valuesError);
        throw valuesError;
      }

      return indicator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] });
    },
  });
};

export const useUpdateIndicator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      indicator, 
      values 
    }: {
      id: string;
      indicator: Partial<Indicator>;
      values: Omit<IndicatorValue, 'id' | 'indicator_id' | 'created_at' | 'updated_at'>[];
    }) => {
      // Update the indicator
      const { data: updatedIndicator, error: indicatorError } = await supabase
        .from('indicators')
        .update(indicator)
        .eq('id', id)
        .select()
        .single();

      if (indicatorError) throw indicatorError;

      // Delete existing values and insert new ones
      await supabase
        .from('indicator_values')
        .delete()
        .eq('indicator_id', id);

      const valuesToInsert = values.map(value => ({
        ...value,
        indicator_id: id
      }));

      const { error: valuesError } = await supabase
        .from('indicator_values')
        .insert(valuesToInsert);

      if (valuesError) throw valuesError;

      return updatedIndicator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] });
    },
  });
};
