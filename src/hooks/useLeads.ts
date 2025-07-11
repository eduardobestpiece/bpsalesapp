
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadWithRelations } from '@/types/crm';
import { useCompany } from '@/contexts/CompanyContext';

export const useLeads = () => {
  const { selectedCompanyId } = useCompany();
  return useQuery({
    queryKey: ['leads', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const { data, error } = await supabase
        .from('leads')
        .select(`*, responsible:crm_users!responsible_id(first_name, last_name), funnel:funnels(name), current_stage:funnel_stages(name), source:sources(name)`)
        .eq('status', 'active')
        .eq('company_id', selectedCompanyId)
        .order('created_at', { ascending: false });
      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('RLS')) {
          return [];
        }
        throw error;
      }
      return data;
    },
    enabled: !!selectedCompanyId
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  return useMutation({
    mutationFn: async (leadData: any) => {
      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...leadData, company_id: selectedCompanyId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', selectedCompanyId] });
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...leadData }: any) => {
      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};
