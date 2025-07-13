
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Indicator, IndicatorWithValues } from '@/types/crm';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

export const useIndicators = (companyId?: string) => {
  const { userRole } = useCrmAuth();
  const [indicators, setIndicators] = useState<IndicatorWithValues[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIndicators = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('indicators')
        .select(`
          *,
          user:crm_users(*),
          funnel:funnels(*),
          values:indicator_values(
            *,
            stage:funnel_stages(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching indicators:', fetchError);
        setError(fetchError.message);
        return;
      }

      const transformedData = (data || []).map(indicator => ({
        ...indicator,
        values: indicator.values || []
      })) as IndicatorWithValues[];

      setIndicators(transformedData);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Erro inesperado ao carregar indicadores');
    } finally {
      setLoading(false);
    }
  };

  const isIndicatorWithValues = (indicator: any): indicator is IndicatorWithValues => {
    return indicator && typeof indicator === 'object' && Array.isArray(indicator.values);
  };

  useEffect(() => {
    fetchIndicators();
  }, [companyId, userRole]);

  const createIndicator = async (indicatorData: Partial<Indicator>) => {
    try {
      const { data, error } = await supabase
        .from('indicators')
        .insert([indicatorData])
        .select()
        .single();

      if (error) throw error;

      await fetchIndicators();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating indicator:', error);
      return { data: null, error };
    }
  };

  const updateIndicator = async (id: string, updates: Partial<Indicator>) => {
    try {
      const { data, error } = await supabase
        .from('indicators')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchIndicators();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating indicator:', error);
      return { data: null, error };
    }
  };

  const deleteIndicator = async (id: string) => {
    try {
      const { error } = await supabase
        .from('indicators')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchIndicators();
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting indicator:', error);
      return { error };
    }
  };

  return {
    indicators,
    loading,
    error,
    refetch: fetchIndicators,
    createIndicator,
    updateIndicator,
    deleteIndicator,
  };
};
