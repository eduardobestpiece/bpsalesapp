
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SaleWithRelations } from '@/types/crm';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';

export const useSales = () => {
  const { companyId, user } = useCrmAuth();
  
  return useQuery({
    queryKey: ['sales', companyId],
    queryFn: async () => {
      if (!companyId || !user) {
        throw new Error('Company ID or user not available');
      }

      console.log('Fetching sales for company:', companyId);
      
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          lead:leads(name),
          responsible:crm_users!responsible_id(first_name, last_name),
          team:teams(name)
        `)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('sale_date', { ascending: false });

      if (error) {
        console.error('Error fetching sales:', error);
        throw error;
      }

      console.log('Sales fetched:', data);
      return data as SaleWithRelations[];
    },
    enabled: !!companyId && !!user,
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (saleData: any) => {
      console.log('Creating sale:', saleData);
      
      const { data, error } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (error) {
        console.error('Error creating sale:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venda registrada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating sale:', error);
      toast.error('Erro ao registrar venda');
    },
  });
};

export const useUpdateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...saleData }: any) => {
      console.log('Updating sale:', id, saleData);
      
      const { data, error } = await supabase
        .from('sales')
        .update(saleData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating sale:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venda atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating sale:', error);
      toast.error('Erro ao atualizar venda');
    },
  });
};
