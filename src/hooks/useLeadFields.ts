import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

export interface LeadField {
  id: string;
  name: string;
  type: string;
  required?: boolean;
  placeholder?: boolean;
  placeholder_text?: string;
  max_length?: number;
  options?: string;
  searchable?: boolean;
  multiselect?: boolean;
  checkbox_multiselect?: boolean;
  checkbox_limit?: number;
  checkbox_columns?: number;
  checkbox_options?: string;
  checkbox_button_mode?: boolean;
  money_limits?: boolean;
  money_min?: number;
  money_max?: number;
  money_currency?: string;
  slider_limits?: boolean;
  slider_min?: number;
  slider_max?: number;
  slider_step?: boolean;
  slider_step_value?: number;
  slider_start_end?: boolean;
  slider_start?: string;
  slider_end?: string;
  document_cpf?: boolean;
  document_cnpj?: boolean;
  selection_connection?: boolean;
  selection_list?: string;
  connection_addition?: boolean;
  connection_list?: string;
  sender?: string;
  order?: number;
}

export const useLeadFields = () => {
  const { selectedCompanyId } = useCompany();

  return useQuery({
    queryKey: ['lead-fields', selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_fields')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .eq('status', 'active');

      if (error) {
        console.error('Erro ao carregar campos:', error);
        throw error;
      }
      
      // Ordenar manualmente por order
      const sortedData = (data || []).sort((a, b) => (a.order || 0) - (b.order || 0));
      return sortedData as LeadField[];
    },
  });
};
