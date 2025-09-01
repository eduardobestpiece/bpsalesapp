import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type LossReason = Tables<'loss_reasons'>;
type LossReasonInsert = TablesInsert<'loss_reasons'>;
type LossReasonUpdate = TablesUpdate<'loss_reasons'>;

export const useLossReasons = () => {
  const { selectedCompanyId } = useCompany();

  return useQuery({
    queryKey: ['loss_reasons', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) {
        return [];
      }

      const { data, error } = await supabase
        .from('loss_reasons')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .eq('status', 'active')
        .order('name');

      if (error) {
        throw error;
      }

      return data as LossReason[];
    },
    enabled: !!selectedCompanyId
  });
};

export const useCreateLossReason = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  return useMutation({
    mutationFn: async (lossReason: LossReasonInsert) => {
      const { data, error } = await supabase
        .from('loss_reasons')
        .insert([lossReason])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loss_reasons', selectedCompanyId] });
    }
  });
};

export const useUpdateLossReason = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  return useMutation({
    mutationFn: async ({ id, ...lossReason }: LossReasonUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('loss_reasons')
        .update(lossReason)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loss_reasons', selectedCompanyId] });
    }
  });
};

export const useDeleteLossReason = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('loss_reasons')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loss_reasons', selectedCompanyId] });
    }
  });
}; 