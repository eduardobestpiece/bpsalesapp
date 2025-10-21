import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

interface LogoProps {
  className?: string;
  onClick?: () => void;
  lightUrl?: string | null;
  darkUrl?: string | null;
  alt?: string;
}

export const Logo = ({ className = "h-10 w-auto max-w-[140px]", onClick, lightUrl, darkUrl, alt = 'Logo' }: LogoProps) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Forçar dark mode
  const { selectedCompanyId } = useCompany();
  const { companyId } = useCrmAuth();
  const effectiveCompanyId = selectedCompanyId || companyId || null;

  // Buscar branding da empresa para obter logos
  const { data: branding } = useQuery({
    queryKey: ['company_branding_logo', effectiveCompanyId],
    enabled: !!effectiveCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('company_branding')
        .select('logo_square_url, logo_horizontal_url, logo_horizontal_dark_url, primary_color')
        .eq('company_id', effectiveCompanyId as string)
        .maybeSingle();
      return data as { logo_square_url?: string | null; logo_horizontal_url?: string | null; logo_horizontal_dark_url?: string | null; primary_color?: string | null } | null;
    }
  });
  
  useEffect(() => {
    // Detectar tema inicial
    const isDark = document.documentElement.classList.contains('dark') || 
                  localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);
    
    // Observar mudanças no tema
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setIsDarkMode(isDark);
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  // Resolver URLs a partir de props ou branding
  const { resolvedLight, resolvedDark } = useMemo(() => {
    // Preferir props se fornecidas
    let light: string | undefined | null = lightUrl;
    let dark: string | undefined | null = darkUrl || lightUrl;

    if (!light || !dark) {
      const square = branding?.logo_square_url || undefined;
      const horizontal = branding?.logo_horizontal_url || undefined;
      const horizontalDark = branding?.logo_horizontal_dark_url || undefined;

      // Para modo claro, priorizar horizontal; se não, usar square
      if (!light) light = horizontal || square;
      // Para modo escuro, priorizar horizontal_dark; depois horizontal; depois square
      if (!dark) dark = horizontalDark || horizontal || square || light || undefined;
    }

    return { resolvedLight: light, resolvedDark: dark };
  }, [lightUrl, darkUrl, branding]);

  // Se não há URLs resolvidas, usar fallback
  if (!resolvedLight && !resolvedDark) {
    return (
      <div className={`${className} bg-gray-700 text-white flex items-center justify-center rounded px-4 py-2`}>
        BP Sales
      </div>
    );
  }

  return (
    <div className="cursor-pointer" onClick={onClick}>
      {/* Logo para modo claro */}
      {resolvedLight && (
        <img 
          src={resolvedLight} 
          alt={alt} 
          className={`${className} ${isDarkMode ? 'hidden' : 'block'}`} 
          style={{ height: '40px', width: 'auto', maxWidth: '140px', objectFit: 'contain' }}
          onError={(e) => {
            console.error('Erro ao carregar logo light:', resolvedLight);
            e.currentTarget.style.display = 'none';
          }}

        />
      )}
      {/* Logo para modo escuro */}
      {resolvedDark && (
        <img 
          src={resolvedDark} 
          alt={alt} 
          className={`${className} ${isDarkMode ? 'block' : 'hidden'}`} 
          style={{ height: '40px', width: 'auto', maxWidth: '140px', objectFit: 'contain' }}
          onError={(e) => {
            console.error('Erro ao carregar logo dark:', resolvedDark);
            e.currentTarget.style.display = 'none';
          }}

        />
      )}
    </div>
  );
};