
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CrmUser } from '@/types/crm';
import { simInfoLog } from '@/lib/devlog';

export const useCrmUsers = (companyId?: string) => {
  // console.log('[useCrmUsers] Hook chamado com companyId:', companyId);
  
  return useQuery({
    queryKey: companyId ? ['crm-users', companyId] : ['crm-users'],
    queryFn: async () => {
      // console.log('[useCrmUsers] Executando query para buscar usuários...');
      // console.log('[useCrmUsers] CompanyId:', companyId);
      
      let query = supabase
        .from('crm_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      
      // console.log('[useCrmUsers] Resultado da query:', { data, error });
      // console.log('[useCrmUsers] Número de usuários retornados:', data?.length || 0);

      if (error) {
        console.error('[useCrmUsers] Erro na query:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};

export const useCrmUsersByCompany = (companyId?: string | null) => {
      // console.log('[useCrmUsersByCompany] Hook chamado com companyId:', companyId);
  
  return useQuery({
    queryKey: ['crm-users', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      // console.log('[useCrmUsersByCompany] Executando query para buscar usuários...');
              // console.log('[useCrmUsersByCompany] CompanyId:', companyId);
      
      simInfoLog('[USERS-QUERY] fetching by company', { companyId });
      const { data, error } = await supabase
        .from('crm_users')
        .select('*')
        .eq('status', 'active')
        .eq('company_id', companyId as string)
        .order('created_at', { ascending: false });

      // console.log('[useCrmUsersByCompany] Resultado da query:', { data, error });
      // console.log('[useCrmUsersByCompany] Número de usuários retornados:', data?.length || 0);

      simInfoLog('[USERS-QUERY] result', { count: data?.length ?? 0, error });
      if (error) {
        console.error('[useCrmUsersByCompany] Erro na query:', error);
        if (error.code === 'PGRST301' || error.message.includes('RLS')) {
          return [] as CrmUser[];
        }
        throw error;
      }

      return data as CrmUser[];
    }
  });
};

export const useCreateCrmUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: any) => {
      const { data, error } = await supabase
        .from('crm_users')
        .insert(userData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a crm-users
      queryClient.invalidateQueries({ queryKey: ['crm-users'] });
      // Também invalidar queries específicas por empresa
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'crm-users' && query.queryKey.length > 1 
      });
      // console.log('[useCreateCrmUser] Queries invalidadas com sucesso');
    },
  });
};

export const useUpdateCrmUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...userData }: any) => {
          // console.log('[useUpdateCrmUser] ===== INÍCIO DA ATUALIZAÇÃO =====');
    // console.log('[useUpdateCrmUser] ID do usuário:', id);
    // console.log('[useUpdateCrmUser] Dados recebidos:', userData);
      
      // Preparar dados para atualização, tratando valores nulos
      const updateData = { ...userData };
      
      // Se team_id for string vazia, converter para null
      if (updateData.team_id === '') {
        updateData.team_id = null;
      }
      
      // console.log('[useUpdateCrmUser] Dados preparados para atualização:', updateData);
      
      // Primeiro, verificar o estado atual do usuário
      // console.log('[useUpdateCrmUser] Verificando estado atual do usuário...');
      const { data: currentUser, error: currentError } = await supabase
        .from('crm_users')
        .select('*')
        .eq('id', id)
        .single();
      
      // console.log('[useUpdateCrmUser] Estado atual do usuário:', currentUser);
      // console.log('[useUpdateCrmUser] Erro ao buscar usuário atual:', currentError);
      
      // Primeiro, tentar fazer o update sem retornar dados
      // Usar uma abordagem mais específica para evitar problemas de RLS
      // console.log('[useUpdateCrmUser] Iniciando UPDATE...');
      const { error: updateError } = await supabase
        .from('crm_users')
        .update({
          role: updateData.role,
          team_id: updateData.team_id,
          first_name: updateData.first_name,
          last_name: updateData.last_name,
          phone: updateData.phone,
          email: updateData.email,
          company_id: updateData.company_id,
          status: updateData.status
        })
        .eq('id', id);

      // console.log('[useUpdateCrmUser] Resultado do UPDATE:', { updateError });

      if (updateError) {
        console.error('[useUpdateCrmUser] Erro na atualização:', updateError);
        
        // Se for erro de RLS, tentar uma abordagem alternativa
        if (updateError.code === 'PGRST301' || updateError.message.includes('RLS')) {
          console.log('[useUpdateCrmUser] Erro de RLS detectado, tentando abordagem alternativa...');
          
          // Tentar atualizar apenas campos específicos
          const { error: altError } = await supabase
            .from('crm_users')
            .update({
              role: updateData.role,
              team_id: updateData.team_id,
              first_name: updateData.first_name,
              last_name: updateData.last_name,
              phone: updateData.phone,
              email: updateData.email,
              company_id: updateData.company_id,
              status: updateData.status
            })
            .eq('id', id);
            
          console.log('[useUpdateCrmUser] Resultado da abordagem alternativa:', { altError });
          
          if (altError) {
            console.error('[useUpdateCrmUser] Erro na abordagem alternativa:', altError);
            throw altError;
          }
          
          console.log('[useUpdateCrmUser] Atualização alternativa bem-sucedida');
        } else {
          throw updateError;
        }
      } else {
        console.log('[useUpdateCrmUser] Atualização bem-sucedida');
      }

      // Buscar o usuário atualizado separadamente
      console.log('[useUpdateCrmUser] Buscando usuário atualizado com ID:', id);
      const { data: updatedUser, error: fetchError } = await supabase
        .from('crm_users')
        .select('*')
        .eq('id', id)
        .single();

      console.log('[useUpdateCrmUser] Resultado da busca:', { updatedUser, fetchError });

      if (fetchError) {
        console.warn('[useUpdateCrmUser] Erro ao buscar usuário atualizado:', fetchError);
        // Não falhar se não conseguir buscar o usuário atualizado
        // Retornar os dados que foram enviados para atualização
        console.log('[useUpdateCrmUser] Retornando dados enviados como fallback');
        return { id, ...userData };
      }

      console.log('[useUpdateCrmUser] Usuário atualizado recuperado:', updatedUser);
      
      // Verificar se a atualização foi realmente aplicada
      console.log('[useUpdateCrmUser] ===== VERIFICAÇÃO PÓS-UPDATE =====');
      console.log('[useUpdateCrmUser] Dados enviados:', { role: updateData.role, team_id: updateData.team_id });
      console.log('[useUpdateCrmUser] Dados retornados:', { role: updatedUser.role, team_id: updatedUser.team_id });
      
      if (updatedUser.role !== updateData.role || updatedUser.team_id !== updateData.team_id) {
        console.warn('[useUpdateCrmUser] ⚠️ ATUALIZAÇÃO NÃO FOI APLICADA COMPLETAMENTE!');
        console.warn('[useUpdateCrmUser] Esperado:', { role: updateData.role, team_id: updateData.team_id });
        console.warn('[useUpdateCrmUser] Atual:', { role: updatedUser.role, team_id: updatedUser.team_id });
        
        // Tentar uma verificação adicional
        console.log('[useUpdateCrmUser] Fazendo verificação adicional...');
        const { data: doubleCheck, error: doubleCheckError } = await supabase
          .from('crm_users')
          .select('role, team_id')
          .eq('id', id)
          .single();
        
        console.log('[useUpdateCrmUser] Verificação adicional:', { doubleCheck, doubleCheckError });
      } else {
        console.log('[useUpdateCrmUser] ✅ Atualização aplicada com sucesso!');
      }
      
      console.log('[useUpdateCrmUser] ===== FIM DA ATUALIZAÇÃO =====');
      return updatedUser;
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a crm-users
      queryClient.invalidateQueries({ queryKey: ['crm-users'] });
      // Também invalidar queries específicas por empresa
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'crm-users' && query.queryKey.length > 1 
      });
      console.log('[useUpdateCrmUser] Queries invalidadas com sucesso');
    },
  });
};
