
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Team } from '@/types/crm';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

export const useTeams = () => {
  const { companyId, user } = useCrmAuth();
  
  return useQuery({
    queryKey: ['teams', companyId],
    queryFn: async () => {
      if (!companyId || !user) {
        throw new Error('Company ID or user not available');
      }

      console.log('Fetching teams for company:', companyId);
      
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error fetching teams:', error);
        throw error;
      }

      console.log('Teams fetched:', data);
      return data as Team[];
    },
    enabled: !!companyId && !!user,
  });
};
