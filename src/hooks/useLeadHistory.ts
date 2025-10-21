import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeadHistoryItem {
  id: string;
  lead_id: string;
  action_type: 'created' | 'updated' | 'moved' | 'observation_added' | 'observation_deleted' | 'field_changed' | 'deleted';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  description: string;
  performed_by: string;
  company_id: string;
  created_at: string;
  metadata?: any;
  performed_by_user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function useLeadHistory(leadId: string | undefined, companyId: string | undefined) {
  return useQuery({
    queryKey: ['lead_history', leadId, companyId],
    enabled: !!leadId && !!companyId,
    queryFn: async (): Promise<LeadHistoryItem[]> => {
      if (!leadId || !companyId) return [];

      const { data, error } = await (supabase as any)
        .from('lead_history')
        .select(`
          *,
          performed_by_user:crm_users!lead_history_performed_by_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .eq('lead_id', leadId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar histórico do lead:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 0, // Sempre buscar dados frescos
    refetchOnWindowFocus: true, // Refazer busca quando a janela ganhar foco
  });
}

// Função para invalidar cache do histórico
export function invalidateLeadHistory(queryClient: any, leadId: string, companyId: string) {
  queryClient.invalidateQueries({
    queryKey: ['lead_history', leadId, companyId]
  });
}

// Função para registrar histórico manualmente (para casos específicos)
export async function logLeadHistory(
  leadId: string,
  actionType: LeadHistoryItem['action_type'],
  description: string,
  companyId: string,
  fieldName?: string,
  oldValue?: string,
  newValue?: string,
  metadata?: any
) {
  const { error } = await supabase
    .from('lead_history')
    .insert([{
      lead_id: leadId,
      action_type: actionType,
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue,
      description,
      performed_by: (await supabase.auth.getUser()).data.user?.id,
      company_id: companyId,
      metadata
    }]);

  if (error) {
    console.error('Erro ao registrar histórico:', error);
    throw error;
  }
}
