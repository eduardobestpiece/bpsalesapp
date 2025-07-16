import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeSwitch() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className="flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-card hover:bg-accent/10 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      onClick={() => setDark((v) => !v)}
      type="button"
    >
      {dark ? (
        <Moon className="h-5 w-5 text-foreground" />
      ) : (
        <Sun className="h-5 w-5 text-foreground" />
      )}
    </button>
  );
} 