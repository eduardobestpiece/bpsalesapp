import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

// Cor padrão global (fora dos módulos)
const GLOBAL_DEFAULT_COLOR = '#E50F5E';

// Cor padrão para módulos (quando não há empresa selecionada)
const MODULE_DEFAULT_COLOR = '#E50F5E';

export const useGlobalColors = () => {
  const { selectedCompanyId } = useCompany();

  // Buscar branding da empresa selecionada
  const { data: companyBranding } = useQuery({
    queryKey: ['company_branding', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return null;
      
      const { data, error } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .maybeSingle();
      
      if (error || !data) return null;
      return data;
    },
    enabled: !!selectedCompanyId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });

  // Aplicar cores CSS globais
  useEffect(() => {
    const root = document.documentElement;
    
    if (companyBranding?.primary_color) {
      // Para módulos: usar cor primária da empresa selecionada
      root.style.setProperty('--brand-primary', companyBranding.primary_color);
      root.style.setProperty('--brand-secondary', companyBranding.secondary_color || '#6B7280');
      root.style.setProperty('--brand-radius', `${companyBranding.border_radius_px || 8}px`);
      
      // Converter para HSL para as variáveis CSS do Tailwind
      const primaryHex = companyBranding.primary_color;
      const primaryHSL = hexToHSL(primaryHex);
      root.style.setProperty('--brand-primary-hsl', primaryHSL);
    } else {
      // Para módulos sem empresa: usar cor padrão dos módulos
      root.style.setProperty('--brand-primary', MODULE_DEFAULT_COLOR);
      root.style.setProperty('--brand-secondary', '#6B7280');
      root.style.setProperty('--brand-radius', '8px');
      
      const defaultHSL = hexToHSL(MODULE_DEFAULT_COLOR);
      root.style.setProperty('--brand-primary-hsl', defaultHSL);
    }
  }, [companyBranding]);

  return {
    globalDefaultColor: GLOBAL_DEFAULT_COLOR,
    moduleDefaultColor: MODULE_DEFAULT_COLOR,
    companyPrimaryColor: companyBranding?.primary_color || MODULE_DEFAULT_COLOR,
    companySecondaryColor: companyBranding?.secondary_color || '#6B7280',
    companyBorderRadius: companyBranding?.border_radius_px || 8,
    companyBranding,
  };
};

// Função auxiliar para converter HEX para HSL
function hexToHSL(hex: string): string {
  // Remove o # se presente
  hex = hex.replace('#', '');
  
  // Converte para RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
} 