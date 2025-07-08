
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Source } from '@/types/crm';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

export const useSources = () => {
  const { companyId, user } = useCrmAuth();
  
  return useQuery({
    queryKey: ['sources', companyId],
    queryFn: async () => {
      if (!companyId || !user) {
        throw new Error('Company ID or user not available');
      }

      console.log('Fetching sources for company:', companyId);
      
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error fetching sources:', error);
        throw error;
      }

      console.log('Sources fetched:', data);
      return data as Source[];
    },
    enabled: !!companyId && !!user,
  });
};
