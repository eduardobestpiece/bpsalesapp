
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Team = Tables<'teams'>;
type TeamInsert = TablesInsert<'teams'>;
type TeamUpdate = TablesUpdate<'teams'>;

export const useTeams = () => {
  const { selectedCompanyId } = useCompany();
  return useQuery({
    queryKey: ['teams', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) {
        return [];
      }
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data as Team[];
    },
    enabled: !!selectedCompanyId
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  return useMutation({
    mutationFn: async (team: TeamInsert) => {
      
      const { data, error } = await supabase
        .from('teams')
        .insert([team])
        .select()
        .single();

      if (error) {
        throw error;
      }

      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', selectedCompanyId] });
    }
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  return useMutation({
    mutationFn: async ({ id, ...team }: TeamUpdate & { id: string }) => {
      
      const { data, error } = await supabase
        .from('teams')
        .update(team)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', selectedCompanyId] });
    }
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  return useMutation({
    mutationFn: async (id: string) => {
      
      const { error } = await supabase
        .from('teams')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) {
        throw error;
      }

      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', selectedCompanyId] });
    }
  });
};
