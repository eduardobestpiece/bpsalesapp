
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Lead, 
  Sale, 
  CrmUser, 
  Funnel, 
  Source, 
  FunnelWithStages,
  LeadWithRelations,
  SaleWithRelations 
} from '@/types/crm';

// Hook para buscar leads
export const useLeads = (companyId?: string) => {
  return useQuery({
    queryKey: ['leads', companyId],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`
          *,
          responsible:crm_users(first_name, last_name),
          funnel:funnels(name),
          current_stage:funnel_stages(name),
          source:sources(name)
        `)
        .eq('status', 'active');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LeadWithRelations[];
    },
    enabled: !!companyId,
  });
};

// Hook para buscar vendas
export const useSales = (companyId?: string) => {
  return useQuery({
    queryKey: ['sales', companyId],
    queryFn: async () => {
      let query = supabase
        .from('sales')
        .select(`
          *,
          lead:leads(name),
          responsible:crm_users(first_name, last_name),
          team:teams(name)
        `)
        .eq('status', 'active');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SaleWithRelations[];
    },
    enabled: !!companyId,
  });
};

// Hook para buscar usuários CRM
export const useCrmUsers = (companyId?: string) => {
  return useQuery({
    queryKey: ['crm-users', companyId],
    queryFn: async () => {
      let query = supabase
        .from('crm_users')
        .select('*')
        .eq('status', 'active');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CrmUser[];
    },
    enabled: !!companyId,
  });
};

// Hook para buscar funis
export const useFunnels = (companyId?: string) => {
  return useQuery({
    queryKey: ['funnels', companyId],
    queryFn: async () => {
      let query = supabase
        .from('funnels')
        .select(`
          *,
          stages:funnel_stages(*)
        `)
        .eq('status', 'active');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FunnelWithStages[];
    },
    enabled: !!companyId,
  });
};

// Hook para buscar origens
export const useSources = (companyId?: string) => {
  return useQuery({
    queryKey: ['sources', companyId],
    queryFn: async () => {
      let query = supabase
        .from('sources')
        .select('*')
        .eq('status', 'active');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Source[];
    },
    enabled: !!companyId,
  });
};

// Mutation para criar lead
export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('leads')
        .insert(leadData)
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

// Mutation para criar venda
export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (saleData: Omit<Sale, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('sales')
        .insert(saleData)
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

// Mutation para atualizar lead
export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
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
