
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Source = Tables<'sources'>;
type SourceInsert = TablesInsert<'sources'>;
type SourceUpdate = TablesUpdate<'sources'>;

export const useSources = () => {
  const { selectedCompanyId } = useCompany();

  return useQuery({
    queryKey: ['sources', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) {
        console.log('No company ID available for sources query');
        return [];
      }

      console.log('Fetching sources for company:', selectedCompanyId);
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error fetching sources:', error);
        throw error;
      }

      console.log('Sources fetched:', data);
      return data as Source[];
    },
    enabled: !!selectedCompanyId
  });
};

export const useCreateSource = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  return useMutation({
    mutationFn: async (source: SourceInsert) => {
      console.log('Creating source:', source);
      const { data, error } = await supabase
        .from('sources')
        .insert([source])
        .select()
        .single();

      if (error) {
        console.error('Error creating source:', error);
        throw error;
      }

      console.log('Source created:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources', selectedCompanyId] });
    }
  });
};

export const useUpdateSource = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  return useMutation({
    mutationFn: async ({ id, ...source }: SourceUpdate & { id: string }) => {
      console.log('Updating source:', id, source);
      const { data, error } = await supabase
        .from('sources')
        .update(source)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating source:', error);
        throw error;
      }

      console.log('Source updated:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources', selectedCompanyId] });
    }
  });
};

export const useDeleteSource = () => {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting source:', id);
      const { error } = await supabase
        .from('sources')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) {
        console.error('Error deleting source:', error);
        throw error;
      }

      console.log('Source deleted:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources', selectedCompanyId] });
    }
  });
};
