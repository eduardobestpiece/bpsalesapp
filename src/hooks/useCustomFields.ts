import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type CustomField = Tables<'custom_fields'>;
type CustomFieldInsert = TablesInsert<'custom_fields'>;
type CustomFieldUpdate = TablesUpdate<'custom_fields'>;

export const useCustomFields = () => {
  const { selectedCompanyId } = useCompany();

  return useQuery({
    queryKey: ['custom_fields', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) {
        return [];
      }

      const { data, error } = await supabase
        .from('custom_fields')
        .select(`
          *,
          custom_field_funnels (
            funnel_id,
            stage_id
          )
        `)
        .eq('company_id', selectedCompanyId)
        .eq('status', 'active')
        .order('name');

      if (error) {
        throw error;
      }

      return data as (CustomField & { custom_field_funnels: { funnel_id: string; stage_id: string | null }[] })[];
    },
    enabled: !!selectedCompanyId
  });
};

export const useCreateCustomField = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  return useMutation({
    mutationFn: async (customField: CustomFieldInsert & { 
      required_funnel_stages?: Record<string, string>;
    }) => {
      const { required_funnel_stages, ...fieldData } = customField;
      
      // Inserir o campo personalizado
      const { data: field, error: fieldError } = await supabase
        .from('custom_fields')
        .insert([fieldData])
        .select()
        .single();

      if (fieldError) {
        throw fieldError;
      }

      // Se houver funis obrigatórios, criar as relações
      if (required_funnel_stages && Object.keys(required_funnel_stages).length > 0) {
        const funnelRelations = Object.entries(required_funnel_stages).map(([funnel_id, stage_id]) => ({
          custom_field_id: field.id,
          funnel_id: funnel_id,
          stage_id: stage_id
        }));

        const { error: relationError } = await supabase
          .from('custom_field_funnels')
          .insert(funnelRelations);

        if (relationError) {
          throw relationError;
        }
      }

      return field;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_fields', selectedCompanyId] });
    }
  });
};

export const useUpdateCustomField = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  return useMutation({
    mutationFn: async ({ 
      id, 
      required_funnel_stages, 
      ...customField 
    }: CustomFieldUpdate & { 
      id: string; 
      required_funnel_stages?: Record<string, string>;
    }) => {
      // Atualizar o campo personalizado
      const { data: field, error: fieldError } = await supabase
        .from('custom_fields')
        .update(customField)
        .eq('id', id)
        .select()
        .single();

      if (fieldError) {
        throw fieldError;
      }

      // Se houver funis obrigatórios, atualizar as relações
      if (required_funnel_stages !== undefined) {
        // Remover relações existentes
        await supabase
          .from('custom_field_funnels')
          .delete()
          .eq('custom_field_id', id);

        // Criar novas relações
        if (Object.keys(required_funnel_stages).length > 0) {
          const funnelRelations = Object.entries(required_funnel_stages).map(([funnel_id, stage_id]) => ({
            custom_field_id: id,
            funnel_id: funnel_id,
            stage_id: stage_id
          }));

          const { error: relationError } = await supabase
            .from('custom_field_funnels')
            .insert(funnelRelations);

          if (relationError) {
            throw relationError;
          }
        }
      }

      return field;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_fields', selectedCompanyId] });
    }
  });
};

export const useDeleteCustomField = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  const { userRole } = useCrmAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      // Verificar se o usuário é master
      if (userRole !== 'master') {
        throw new Error('Apenas usuários Master podem excluir campos personalizados');
      }

      // Remover relações com funis
      await supabase
        .from('custom_field_funnels')
        .delete()
        .eq('custom_field_id', id);

      // Arquivar o campo personalizado
      const { error } = await supabase
        .from('custom_fields')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_fields', selectedCompanyId] });
    }
  });
}; 