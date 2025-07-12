
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Indicator, IndicatorValue } from '@/types/crm';
import { useCompany } from '@/contexts/CompanyContext';
import { useMemo } from 'react';

interface IndicatorWithValues extends Indicator {
  values: IndicatorValue[];
  archived_at?: string | null;
}

export const useIndicators = (companyId?: string, userId?: string) => {
  const { selectedCompanyId } = useCompany();
  const effectiveCompanyId = companyId || selectedCompanyId;
  
  // Memoize the query key to prevent unnecessary re-renders
  const queryKey = useMemo(() => ['indicators', effectiveCompanyId, userId], [effectiveCompanyId, userId]);
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log('[useIndicators] Iniciando busca de indicadores para companyId:', effectiveCompanyId, 'userId:', userId);
      if (!effectiveCompanyId) {
        console.log('[useIndicators] CompanyId não fornecido, retornando array vazio');
        return [] as IndicatorWithValues[];
      }
      try {
        let query = supabase
          .from('indicators')
          .select('*, values:indicator_values(*)')
          .is('archived_at', null)
          .order('period_date', { ascending: false });
        
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
        
        // Garantir que cada indicador tenha o array 'values' preenchido
        const validData = (data || []).filter((indicator): indicator is IndicatorWithValues => {
          if (!indicator || typeof indicator !== 'object') {
            return false;
          }
          // Check for required properties
          const hasRequiredProps = indicator.id && 
                                 indicator.user_id && 
                                 indicator.funnel_id &&
                                 indicator.company_id &&
                                 typeof indicator.month_reference === 'number' &&
                                 typeof indicator.year_reference === 'number' &&
                                 indicator.created_at &&
                                 indicator.updated_at;
          if (!hasRequiredProps) {
            return false;
          }
          // Se não vier o array values, buscar manualmente
          if (!Array.isArray(indicator.values)) {
            indicator.values = [];
          }
          return true;
        });
        // Se algum indicador não tiver values, buscar manualmente
        for (const ind of validData) {
          if (!ind.values || ind.values.length === 0) {
            const { data: values } = await supabase
              .from('indicator_values')
              .select('*')
              .eq('indicator_id', ind.id);
            ind.values = values || [];
          }
        }
        return validData;
      } catch (err) {
        console.error('[useIndicators] Erro ao buscar indicadores:', err);
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
