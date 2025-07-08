
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadWithRelations } from '@/types/crm';
import { toast } from 'sonner';

export const useLeads = (companyId: string) => {
  return useQuery({
    queryKey: ['leads', companyId],
    queryFn: async () => {
      console.log('Fetching leads for company:', companyId);
      
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          responsible:crm_users!responsible_id(first_name, last_name),
          funnel:funnels(name),
          current_stage:funnel_stages!current_stage_id(name),
          source:sources(name)
        `)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        throw error;
      }

      console.log('Leads fetched:', data);
      return data as LeadWithRelations[];
    },
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadData: any) => {
      console.log('Creating lead:', leadData);
      
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) {
        console.error('Error creating lead:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating lead:', error);
      toast.error('Erro ao criar lead');
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...leadData }: any) => {
      console.log('Updating lead:', id, leadData);
      
      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating lead:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating lead:', error);
      toast.error('Erro ao atualizar lead');
    },
  });
};
