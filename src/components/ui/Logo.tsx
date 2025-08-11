import { useEffect, useState } from 'react';

interface LogoProps {
  className?: string;
  onClick?: () => void;
  lightUrl?: string | null;
  darkUrl?: string | null;
  alt?: string;
}

export const Logo = ({ className = "h-10 w-auto max-w-[140px]", onClick, lightUrl, darkUrl, alt = 'Logo' }: LogoProps) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
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

  // Fallbacks padrão (logo Monteo)
  const fallbackLight = "/monteo_policromia_horizontal (1).png";
  const fallbackDark = "/monteo_dark_logo.png";

  const resolvedLight = lightUrl || fallbackLight;
  const resolvedDark = darkUrl || fallbackDark;

  return (
    <div className="cursor-pointer" onClick={onClick}>
      {/* Logo para modo claro */}
      <img 
        src={resolvedLight} 
        alt={alt} 
        className={`${className} ${isDarkMode ? 'hidden' : 'block'}`} 
        style={{ height: '40px', width: 'auto', maxWidth: '140px', objectFit: 'contain' }}
      />
      {/* Logo para modo escuro */}
      <img 
        src={resolvedDark} 
        alt={alt} 
        className={`${className} ${isDarkMode ? 'block' : 'hidden'}`} 
        style={{ height: '40px', width: 'auto', maxWidth: '140px', objectFit: 'contain' }}
      />
    </div>
  );
};