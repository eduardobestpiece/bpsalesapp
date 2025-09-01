import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLeadCustomFieldValues = (leadId: string) => {
  return useQuery({
    queryKey: ['lead_custom_field_values', leadId],
    queryFn: async () => {
      // console.log('[useLeadCustomFieldValues] Executando query para leadId:', leadId);
      
      if (!leadId) {
        // console.log('[useLeadCustomFieldValues] leadId vazio, retornando array vazio');
        return [];
      }

      const { data, error } = await supabase
        .from('lead_custom_field_values')
        .select(`
          *,
          custom_fields (
            id,
            name,
            field_type,
            is_required,
            options,
            min_value,
            max_value,
            description
          )
        `)
        .eq('lead_id', leadId);

      // console.log('[useLeadCustomFieldValues] Resultado da query:', {
      //   data,
      //   error,
      //   dataLength: data?.length,
      //   leadId
      // });

      if (error) {
        console.error('[useLeadCustomFieldValues] Erro na query:', error);
        throw error;
      }

      // console.log('[useLeadCustomFieldValues] Retornando dados:', data || []);
      return data || [];
    },
    enabled: !!leadId
  });
};

export const useSaveLeadCustomFieldValues = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      leadId, 
      customFieldValues 
    }: { 
      leadId: string; 
      customFieldValues: Record<string, any>; 
    }) => {
      // Buscar as regras de validação dos campos personalizados
      const customFieldIds = Object.keys(customFieldValues);
      if (customFieldIds.length > 0) {
        const { data: customFields, error: fieldsError } = await supabase
          .from('custom_fields')
          .select('id, name, field_type, min_value, max_value, is_required')
          .in('id', customFieldIds);

        if (fieldsError) {
          console.error('[useSaveLeadCustomFieldValues] Erro ao buscar campos personalizados:', fieldsError);
          throw fieldsError;
        }

        // Validar valores
        const validationErrors: string[] = [];
        const fieldsMap = new Map(customFields?.map(field => [field.id, field]) || []);

        Object.entries(customFieldValues).forEach(([fieldId, value]) => {
          const field = fieldsMap.get(fieldId);
          if (!field) return;

          // Validar campo obrigatório
          if (field.is_required && (!value || value === '')) {
            validationErrors.push(`Campo "${field.name}" é obrigatório`);
            return;
          }

          // Validar valores mínimos e máximos para campos numéricos
          if (field.field_type === 'number' && value !== '' && value !== null && value !== undefined) {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
              validationErrors.push(`Campo "${field.name}" deve ser um número válido`);
              return;
            }

            if (field.min_value !== null && field.min_value !== undefined) {
              const minValue = parseFloat(field.min_value);
              if (numValue < minValue) {
                validationErrors.push(`Campo "${field.name}" deve ser maior ou igual a ${minValue}`);
              }
            }

            if (field.max_value !== null && field.max_value !== undefined) {
              const maxValue = parseFloat(field.max_value);
              if (numValue > maxValue) {
                validationErrors.push(`Campo "${field.name}" deve ser menor ou igual a ${maxValue}`);
              }
            }
          }
        });

        if (validationErrors.length > 0) {
          throw new Error(`Erros de validação: ${validationErrors.join(', ')}`);
        }
      }

      // Converter os valores para o formato da tabela
      const valuesToInsert = Object.entries(customFieldValues)
        .filter(([_, value]) => {
          const shouldInclude = value !== '' && value !== null && value !== undefined;
          return shouldInclude;
        })
        .map(([customFieldId, value]) => {
          const processedValue = Array.isArray(value) ? JSON.stringify(value) : String(value);
          return {
            lead_id: leadId,
            custom_field_id: customFieldId,
            value: processedValue
          };
        });

      // console.log('[useSaveLeadCustomFieldValues] Valores para inserir:', valuesToInsert);

      // Se não há valores para salvar, retornar
      if (valuesToInsert.length === 0) {
        // console.log('[useSaveLeadCustomFieldValues] Nenhum valor para salvar');
        return [];
      }

      // Remover valores existentes para este lead
      // console.log('[useSaveLeadCustomFieldValues] Removendo valores existentes para lead:', leadId);
      const { error: deleteError } = await supabase
        .from('lead_custom_field_values')
        .delete()
        .eq('lead_id', leadId);

      if (deleteError) {
        console.error('[useSaveLeadCustomFieldValues] Erro ao remover valores existentes:', deleteError);
        throw deleteError;
      }

      // Inserir novos valores
      // console.log('[useSaveLeadCustomFieldValues] Inserindo novos valores:', valuesToInsert);
      const { data, error } = await supabase
        .from('lead_custom_field_values')
        .insert(valuesToInsert)
        .select();

      if (error) {
        console.error('[useSaveLeadCustomFieldValues] Erro ao inserir valores:', error);
        throw error;
      }

      // console.log('[useSaveLeadCustomFieldValues] Valores salvos com sucesso:', data);
      return data;
    },
    onSuccess: (data, { leadId }) => {
      // console.log('[useSaveLeadCustomFieldValues] onSuccess chamado:', { data, leadId });
      queryClient.invalidateQueries({ queryKey: ['lead_custom_field_values', leadId] });
    },
    onError: (error, variables) => {
      console.error('[useSaveLeadCustomFieldValues] onError chamado:', { error, variables });
    }
  });
}; 