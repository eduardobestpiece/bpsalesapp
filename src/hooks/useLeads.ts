
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadWithRelations } from '@/types/crm';
import { useCompany } from '@/contexts/CompanyContext';

export const useLeads = () => {
  const { selectedCompanyId } = useCompany();
  
  // console.log('[useLeads] Hook chamado:', {
  //   selectedCompanyId,
  //   timestamp: new Date().toISOString()
  // });
  
  const result = useQuery({
    queryKey: ['leads', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      // console.log('[useLeads] Executando query para buscar leads...');
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
      // console.log('[useLeads] Dados retornados:', {
      //   companyId: selectedCompanyId,
      //   leadsCount: data?.length || 0,
      //   leads: data?.map((l: any) => ({
      //     id: l.id,
      //     name: l.name,
      //     current_stage_id: l.current_stage_id,
      //     current_stage_name: l.current_stage?.name
      //   }))
      // });
      return data;
    },
    enabled: !!selectedCompanyId
  });

  // console.log('[useLeads] Hook retornando:', {
  //   companyId: selectedCompanyId,
  //   isLoading: result.isLoading,
  //   isError: result.isError,
  //   dataLength: result.data?.length || 0,
  //   data: result.data?.map((l: any) => ({
  //     id: l.id,
  //     name: l.name,
  //     current_stage_id: l.current_stage_id,
  //     current_stage_name: l.current_stage?.name
  //   }))
  // });

  return result;
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

let lastUpdateTime = 0;
const UPDATE_THROTTLE = 1000; // 1 segundo entre atualizações

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  return useMutation({
    mutationFn: async ({ id, ...leadData }: any) => {
      const now = Date.now();
      
      // Throttling: evitar múltiplas atualizações muito próximas
      if (now - lastUpdateTime < UPDATE_THROTTLE) {
        // console.log('[useUpdateLead] Throttling: atualização muito próxima da anterior, aguardando...');
        await new Promise(resolve => setTimeout(resolve, UPDATE_THROTTLE - (now - lastUpdateTime)));
      }
      
      lastUpdateTime = Date.now();
      
      // console.log('[useUpdateLead] Iniciando atualização:', { id, leadData });

      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[useUpdateLead] Erro na atualização:', error);
        throw error;
      }

      // console.log('[useUpdateLead] Atualização bem-sucedida:', data);
      return data;
    },
    onSuccess: () => {
      // console.log('[useUpdateLead] Invalidando queries...');
      // Invalidar todas as queries relacionadas a leads
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      // Invalidar especificamente a query com companyId
      if (selectedCompanyId) {
        queryClient.invalidateQueries({ queryKey: ['leads', selectedCompanyId] });
      }
      // console.log('[useUpdateLead] Queries invalidadas com sucesso');
    },
  });
};
