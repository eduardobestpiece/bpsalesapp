
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FunnelWithStages } from '@/types/crm';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

export const useFunnels = () => {
  const { companyId, user } = useCrmAuth();
  
  return useQuery({
    queryKey: ['funnels', companyId],
    queryFn: async () => {
      if (!companyId || !user) {
        throw new Error('Company ID or user not available');
      }

      console.log('Fetching funnels for company:', companyId);
      
      const { data, error } = await supabase
        .from('funnels')
        .select(`
          *,
          stages:funnel_stages(*)
        `)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error fetching funnels:', error);
        throw error;
      }

      console.log('Funnels fetched:', data);
      return data as FunnelWithStages[];
    },
    enabled: !!companyId && !!user,
  });
};
