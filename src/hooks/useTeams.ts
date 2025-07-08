
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Team = Tables<'teams'>;
type TeamInsert = TablesInsert<'teams'>;
type TeamUpdate = TablesUpdate<'teams'>;

export const useTeams = () => {
  const { companyId } = useCrmAuth();

  return useQuery({
    queryKey: ['teams', companyId],
    queryFn: async () => {
      if (!companyId) {
        console.log('No company ID available for teams query');
        return [];
      }

      console.log('Fetching teams for company:', companyId);
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error fetching teams:', error);
        throw error;
      }

      console.log('Teams fetched:', data);
      return data as Team[];
    },
    enabled: !!companyId
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCrmAuth();

  return useMutation({
    mutationFn: async (team: TeamInsert) => {
      console.log('Creating team:', team);
      const { data, error } = await supabase
        .from('teams')
        .insert([team])
        .select()
        .single();

      if (error) {
        console.error('Error creating team:', error);
        throw error;
      }

      console.log('Team created:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', companyId] });
    }
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCrmAuth();

  return useMutation({
    mutationFn: async ({ id, ...team }: TeamUpdate & { id: string }) => {
      console.log('Updating team:', id, team);
      const { data, error } = await supabase
        .from('teams')
        .update(team)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating team:', error);
        throw error;
      }

      console.log('Team updated:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', companyId] });
    }
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  const { companyId } = useCrmAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting team:', id);
      const { error } = await supabase
        .from('teams')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) {
        console.error('Error deleting team:', error);
        throw error;
      }

      console.log('Team deleted:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', companyId] });
    }
  });
};
