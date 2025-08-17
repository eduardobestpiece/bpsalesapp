import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ID da empresa Best Piece (BP Sales)
const DEFAULT_COMPANY_ID = '334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b';

// Dados hardcoded da BP Sales como fallback
const FALLBACK_BRANDING = {
  company_id: DEFAULT_COMPANY_ID,
  logo_horizontal_url: 'https://jbhocghbieqxjwsdstgm.supabase.co/storage/v1/object/public/branding/334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b/horizontal.png?v=1754695770366',
  logo_horizontal_dark_url: 'https://jbhocghbieqxjwsdstgm.supabase.co/storage/v1/object/public/branding/334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b/horizontal_dark.png?v=1754695673945',
  primary_color: '#e50f5f',
  secondary_color: '#7c032e',
  border_radius_px: 5,
  updated_at: '2025-08-08 19:40:35.598304+00'
};

export const useDefaultBranding = () => {
  const { data: branding, isLoading, error } = useQuery({
    queryKey: ['default_branding', DEFAULT_COMPANY_ID],
    queryFn: async () => {
      console.log('🔍 Buscando branding da BP Sales...');
      
      try {
        const { data, error } = await supabase
          .from('company_branding')
          .select('*')
          .eq('company_id', DEFAULT_COMPANY_ID)
          .maybeSingle();
        
        if (error) {
          console.error('❌ Erro ao buscar branding:', error);
          console.log('🔄 Usando fallback da BP Sales...');
          return FALLBACK_BRANDING;
        }
        
        if (data) {
          console.log('✅ Branding encontrado:', data);
          return data;
        } else {
          console.log('🔄 Nenhum dado encontrado, usando fallback da BP Sales...');
          return FALLBACK_BRANDING;
        }
      } catch (err) {
        console.error('❌ Erro inesperado:', err);
        console.log('🔄 Usando fallback da BP Sales...');
        return FALLBACK_BRANDING;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    retry: 3,
  });

  return {
    branding,
    isLoading,
    error,
    companyId: DEFAULT_COMPANY_ID,
  };
}; 