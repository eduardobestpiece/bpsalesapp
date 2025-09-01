import { useEffect, useState } from 'react';

interface LogoProps {
  className?: string;
  onClick?: () => void;
  lightUrl?: string | null;
  darkUrl?: string | null;
  alt?: string;
}

export const Logo = ({ className = "h-10 w-auto max-w-[140px]", onClick, lightUrl, darkUrl, alt = 'Logo' }: LogoProps) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Forçar dark mode
  
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

  // Se não há URLs fornecidas, usar fallback
  if (!lightUrl && !darkUrl) {
    return (
      <div className={`${className} bg-gray-700 text-white flex items-center justify-center rounded px-4 py-2`}>
        BP Sales
      </div>
    );
  }

  // Usar as URLs fornecidas, sem fallbacks
  const resolvedLight = lightUrl;
  const resolvedDark = darkUrl || lightUrl; // Se não há dark, usar light

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