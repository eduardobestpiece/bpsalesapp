
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Funnel = Tables<'funnels'>;
type FunnelInsert = TablesInsert<'funnels'>;
type FunnelUpdate = TablesUpdate<'funnels'>;

export const useFunnels = (companyId?: string | null, status: 'active' | 'archived' | 'all' = 'all') => {
  const { selectedCompanyId } = useCompany();
  const effectiveCompanyId = companyId || selectedCompanyId;

  debugLog('=== USE FUNNELS HOOK ===');
  debugLog('CompanyId recebido:', companyId);
  debugLog('SelectedCompanyId:', selectedCompanyId);
  debugLog('EffectiveCompanyId:', effectiveCompanyId);
  debugLog('Status:', status);

  return useQuery({
    queryKey: ['funnels', effectiveCompanyId, status],
    queryFn: async () => {
      debugLog('=== EXECUTANDO QUERY FUNNELS ===');
      
      if (!effectiveCompanyId) {
        debugLog('Nenhum effectiveCompanyId, retornando array vazio');
        return [];
      }

      let query = supabase
        .from('funnels')
        .select(`*, stages:funnel_stages!funnel_id(*)`)
        .eq('company_id', effectiveCompanyId)
        .order('name');

      if (status !== 'all') {
        debugLog('Aplicando filtro de status:', status);
        query = query.eq('status', status);
      }

      debugLog('Query final:', query);

      const { data, error } = await query;

      debugLog('Resultado da query:');
      debugLog('Data:', data);
      debugLog('Error:', error);
      debugLog('Número de funis retornados:', data?.length || 0);

      if (error) {
        debugLog('ERRO na query:', error);
        throw error;
      }

      return data;
    },
    enabled: !!effectiveCompanyId
  });
};

export const useCreateFunnel = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  return useMutation({
    mutationFn: async (funnel: FunnelInsert) => {
      
      const { data, error } = await supabase
        .from('funnels')
        .insert([funnel])
        .select()
        .single();

      if (error) {
        throw error;
      }

      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnels', selectedCompanyId] });
    }
  });
};

export const useUpdateFunnel = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  return useMutation({
    mutationFn: async ({ id, ...funnel }: FunnelUpdate & { id: string }) => {
      
      const { data, error } = await supabase
        .from('funnels')
        .update(funnel)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnels', selectedCompanyId] });
    }
  });
};

export const useDeleteFunnel = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  return useMutation({
    mutationFn: async (id: string) => {
      
      const { error } = await supabase
        .from('funnels')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) {
        throw error;
      }

      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnels', selectedCompanyId] });
    }
  });
};

export const usePermanentlyDeleteFunnel = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  return useMutation({
    mutationFn: async (id: string) => {
      debugLog('=== PERMANENTLY DELETE FUNNEL ===');
      debugLog('FunnelId:', id);
      
      // 1. Primeiro, limpar as referências no funil (recommendation_stage_id, meeting_stage_id, etc.)
      const { error: clearRefsError } = await supabase
        .from('funnels')
        .update({
          recommendation_stage_id: null,
          meeting_scheduled_stage_id: null,
          meeting_completed_stage_id: null
        })
        .eq('id', id);

      if (clearRefsError) {
        debugLog('ERRO ao limpar referências do funil:', clearRefsError);
        throw clearRefsError;
      }

      debugLog('Referências do funil limpas com sucesso');

      // 2. Buscar todas as etapas do funil para deletar em ordem
      const { data: stages, error: fetchStagesError } = await supabase
        .from('funnel_stages')
        .select('id, conversion_stage_id')
        .eq('funnel_id', id)
        .order('created_at', { ascending: false }); // Ordem reversa para deletar dependências primeiro

      if (fetchStagesError) {
        debugLog('ERRO ao buscar etapas:', fetchStagesError);
        throw fetchStagesError;
      }

      debugLog('Etapas encontradas:', stages?.length || 0);

      // 3. Deletar etapas uma por uma, começando pelas que não são referenciadas
      if (stages && stages.length > 0) {
        // Primeiro, limpar todas as referências conversion_stage_id
        const { error: clearConversionRefsError } = await supabase
          .from('funnel_stages')
          .update({ conversion_stage_id: null })
          .eq('funnel_id', id);

        if (clearConversionRefsError) {
          debugLog('ERRO ao limpar referências de conversão:', clearConversionRefsError);
          throw clearConversionRefsError;
        }

        debugLog('Referências de conversão limpas');

        // Agora deletar todas as etapas
        const { error: deleteStagesError } = await supabase
          .from('funnel_stages')
          .delete()
          .eq('funnel_id', id);

        if (deleteStagesError) {
          debugLog('ERRO ao deletar etapas:', deleteStagesError);
          throw deleteStagesError;
        }

        debugLog('Todas as etapas deletadas com sucesso');
      }

      // 4. Finalmente, excluir o funil
      const { error: funnelError } = await supabase
        .from('funnels')
        .delete()
        .eq('id', id);

      if (funnelError) {
        debugLog('ERRO ao excluir funil:', funnelError);
        throw funnelError;
      }

      debugLog('Funil excluído permanentemente com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnels', selectedCompanyId] });
    }
  });
};

// Debug function
const debugLog = (message: string, data?: any) => {
  console.log(`[FUNNELS_HOOK_DEBUG] ${message}`, data || '');
};

// Funções utilitárias para manipular etapas do funil
export const insertFunnelStages = async (funnelId: string, stages: any[]) => {
  debugLog('=== INSERT FUNNEL STAGES ===');
  debugLog('FunnelId:', funnelId);
  debugLog('Stages recebidas:', stages);
  
  if (!stages.length) {
    debugLog('Nenhuma etapa para inserir');
    return;
  }
  
  const stagesToInsert = stages.map(stage => {
    const { id, created_at, updated_at, ...rest } = stage;
    const stageToInsert = {
      ...rest,
      funnel_id: funnelId,
    };
    debugLog('Stage preparada para inserção:', stageToInsert);
    return stageToInsert;
  });
  
  debugLog('Stages finais para inserção:', stagesToInsert);
  
  const { error } = await supabase.from('funnel_stages').insert(stagesToInsert);
  
  if (error) {
    debugLog('ERRO na inserção:', error);
    throw error;
  }
  
  debugLog('Inserção realizada com sucesso');
};

export const updateFunnelStages = async (funnelId: string, stages: any[]) => {
  debugLog('=== UPDATE FUNNEL STAGES ===');
  debugLog('FunnelId:', funnelId);
  debugLog('Stages recebidas:', stages);
  
  for (const stage of stages) {
    debugLog('Processando stage:', stage);
    
    if (stage.id) {
      // Atualizar etapa existente
      debugLog('Atualizando etapa existente com ID:', stage.id);
      
      const updateData = {
        name: stage.name,
        stage_order: stage.stage_order,
        target_percentage: stage.target_percentage,
        target_value: stage.target_value,
        is_conversion: stage.is_conversion || false,
        conversion_type: stage.conversion_type || null,
        conversion_enabled: stage.conversion_enabled || false,
        conversion_funnel_id: stage.conversion_funnel_id || null,
        conversion_stage_id: stage.conversion_stage_id || null,
        updated_at: new Date().toISOString(),
      };
      
      debugLog('Dados para atualização:', updateData);
      
      const { error } = await supabase.from('funnel_stages').update(updateData).eq('id', stage.id);
      
      if (error) {
        debugLog('ERRO na atualização:', error);
        throw error;
      }
      
      debugLog('Etapa atualizada com sucesso');
    } else {
      // Inserir nova etapa
      debugLog('Inserindo nova etapa');
      await insertFunnelStages(funnelId, [stage]);
    }
  }
  
  debugLog('Todas as etapas processadas');
};

export const deleteFunnelStages = async (stageIds: string[]) => {
  if (!stageIds.length) return;
  const { error } = await supabase.from('funnel_stages').delete().in('id', stageIds);
  if (error) throw error;
};
