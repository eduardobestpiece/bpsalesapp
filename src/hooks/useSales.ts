
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SaleWithRelations } from '@/types/crm';
import { useCompany } from '@/contexts/CompanyContext';

export const useSales = () => {
  const { selectedCompanyId } = useCompany();
  return useQuery({
    queryKey: ['sales', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const { data, error } = await supabase
        .from('sales')
        .select(`*, lead:leads(name), responsible:crm_users!responsible_id(first_name, last_name), team:teams(name)`)
        .eq('status', 'active')
        .eq('company_id', selectedCompanyId)
        .order('created_at', { ascending: false });
      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('RLS')) {
          return [];
        }
        // Para outros erros, retornar dados mock para demonstração
        return [];
      }
      return data;
    },
    enabled: !!selectedCompanyId
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  return useMutation({
    mutationFn: async (saleData: any) => {
      const { data, error } = await supabase
        .from('sales')
        .insert([{ ...saleData, company_id: selectedCompanyId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', selectedCompanyId] });
    },
  });
};

export const useUpdateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...saleData }: any) => {
      const { data, error } = await supabase
        .from('sales')
        .update(saleData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
};
