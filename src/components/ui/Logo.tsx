import { useEffect, useState } from 'react';

interface LogoProps {
  className?: string;
  onClick?: () => void;
}

export const Logo = ({ className = "h-10 w-auto max-w-[140px]", onClick }: LogoProps) => {
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

  return (
    <div className="cursor-pointer" onClick={onClick}>
      {/* Logo para modo claro */}
      <img 
        src="/monteo_policromia_horizontal (1).png" 
        alt="Logo Monteo" 
        className={`${className} ${isDarkMode ? 'hidden' : 'block'}`} 
      />
      {/* Logo para modo escuro */}
      <img 
        src="/monteo_dark_logo.png" 
        alt="Logo Monteo" 
        className={`${className} ${isDarkMode ? 'block' : 'hidden'}`} 
      />
    </div>
  );
};