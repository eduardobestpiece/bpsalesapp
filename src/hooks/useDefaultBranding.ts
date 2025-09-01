import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ID da empresa Best Piece (BP Sales)
const DEFAULT_COMPANY_ID = '334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b';

// Dados hardcoded da BP Sales como fallback
const FALLBACK_BRANDING = {
  company_id: DEFAULT_COMPANY_ID,
  logo_horizontal_url: 'https://jbhocghbieqxjwsdstgm.supabase.co/storage/v1/object/public/branding/334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b/horizontal.png?v=1754695770366',
  logo_horizontal_dark_url: 'https://jbhocghbieqxjwsdstgm.supabase.co/storage/v1/object/public/branding/334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b/horizontal_dark.png?v=1754695673945',
  primary_color: '#E50F5E',
  secondary_color: '#7c032e',
  border_radius_px: 5,
  updated_at: '2025-08-08 19:40:35.598304+00'
};

export const useDefaultBranding = () => {
  // Temporariamente usando dados hardcoded para resolver o problema
  const branding = FALLBACK_BRANDING;
  const isLoading = false;
  const error = null;

  return {
    branding,
    isLoading,
    error,
    companyId: DEFAULT_COMPANY_ID,
  };
}; 