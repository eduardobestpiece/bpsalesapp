import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeSwitch() {
  // Sempre começa como claro
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
      className={`flex items-center justify-center w-10 h-10 rounded-full border border-input bg-background shadow transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${dark ? 'bg-gray-900 text-yellow-400' : 'bg-white text-gray-700'}`}
      onClick={() => setDark((v) => !v)}
      type="button"
    >
      {dark ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
    </button>
  );
} 