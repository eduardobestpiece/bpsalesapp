import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, Home, DollarSign, TrendingUp, Clock, Search } from 'lucide-react';

interface SimulatorMenuProps {
  onNavigate?: (section: string) => void;
  onToggleSection?: (section: string) => void;
}

export const SimulatorMenu = ({ onNavigate, onToggleSection }: SimulatorMenuProps) => {
  const location = useLocation();
  if (location.pathname !== '/simulador') return null;

  const [clickCounts, setClickCounts] = useState<Record<string, number>>({
    settings: 0,
    home: 0,
    dollar: 0,
    trending: 0,
    clock: 0,
    search: 0
  });

  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleClick = (section: string) => {
    const newCount = (clickCounts[section] || 0) + 1;
    setClickCounts(prev => ({ ...prev, [section]: newCount }));

    if (newCount === 1) {
      // Primeiro clique: navega para a seção
      setActiveSection(section);
      if (onNavigate) {
        onNavigate(section);
      }
      
      // Scroll para a seção correspondente
      const sectionMap: Record<string, string> = {
        settings: 'top',
        home: 'alavancagem-patrimonial',
        dollar: 'ganho-capital',
        search: 'detalhamento-consorcio'
      };
      
      const targetSection = sectionMap[section];
      if (targetSection === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (targetSection) {
        const element = document.getElementById(targetSection);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else if (newCount === 2) {
      // Segundo clique: oculta outras seções
      setActiveSection(section);
      if (onToggleSection) {
        onToggleSection(section);
      }
    } else if (newCount === 3) {
      // Terceiro clique: mostra todas as seções
      setActiveSection(null);
      if (onToggleSection) {
        onToggleSection('all');
      }
      setClickCounts(prev => ({ ...prev, [section]: 0 }));
    }
  };

  const getIconStyle = (section: string) => {
    const isActive = activeSection === section;
    const clickCount = clickCounts[section] || 0;
    
    if (clickCount === 2) {
      // Duplo clique ativo
      return {
        backgroundColor: '#A86E57',
        color: '#131313'
      };
    } else if (isActive && clickCount === 1) {
      // Clique único ativo
      return {
        backgroundColor: '#131313',
        color: '#A86E57'
      };
    } else {
      // Estado padrão
      return {
        backgroundColor: '#131313',
        color: '#333333'
      };
    }
  };

  const menuItems = [
    { key: 'settings', icon: Settings, label: 'Configurações' },
    { key: 'home', icon: Home, label: 'Alavancagem' },
    { key: 'dollar', icon: DollarSign, label: 'Ganho de Capital' },
    { key: 'trending', icon: TrendingUp, label: 'Performance' },
    { key: 'clock', icon: Clock, label: 'Histórico' },
    { key: 'search', icon: Search, label: 'Detalhamento' }
  ];

  return (
    <div className="fixed right-2 top-1/2 transform -translate-y-1/2 z-50">
      <div 
        className="rounded-lg shadow-lg p-1.5"
        style={{
          backgroundColor: '#131313',
          border: '1px solid #333333'
        }}
      >
        <div className="flex flex-col space-y-1.5">
          {menuItems.map(({ key, icon: Icon, label }) => {
            const style = getIconStyle(key);
            return (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                className="w-7.2 h-7.2 p-0 transition-all duration-200 hover:scale-110 rounded"
                onClick={() => handleClick(key)}
                title={label}
                style={{
                  backgroundColor: style.backgroundColor,
                  color: style.color
                }}
                onMouseEnter={(e) => {
                  if (!activeSection || activeSection !== key) {
                    e.currentTarget.style.backgroundColor = '#333333';
                    e.currentTarget.style.color = '#131313';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!activeSection || activeSection !== key) {
                    e.currentTarget.style.backgroundColor = '#131313';
                    e.currentTarget.style.color = '#333333';
                  }
                }}
              >
                <Icon size={14} />
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 