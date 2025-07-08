
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CrmUser } from '@/types/crm';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

export const useCrmUsers = () => {
  const { companyId, user } = useCrmAuth();
  
  return useQuery({
    queryKey: ['crm-users', companyId],
    queryFn: async () => {
      if (!companyId || !user) {
        throw new Error('Company ID or user not available');
      }

      console.log('Fetching CRM users for company:', companyId);
      
      const { data, error } = await supabase
        .from('crm_users')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('first_name');

      if (error) {
        console.error('Error fetching CRM users:', error);
        throw error;
      }

      console.log('CRM users fetched:', data);
      return data as CrmUser[];
    },
    enabled: !!companyId && !!user,
  });
};
