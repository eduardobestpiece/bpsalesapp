import { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Settings, Home, DollarSign, Search, ArrowUp, ArrowRight } from 'lucide-react';

interface SimulatorMenuProps {
  onNavigate?: (section: string) => void;
  onToggleSection?: (section: string) => void;
  embutido?: 'com' | 'sem';
  setEmbutido?: (embutido: 'com' | 'sem') => void;
}

export const SimulatorMenu = ({ onNavigate, onToggleSection, embutido, setEmbutido }: SimulatorMenuProps) => {
  const location = useLocation();
  if (location.pathname !== '/simulador') return null;

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [doubleClickSection, setDoubleClickSection] = useState<string | null>(null);
  const clickTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const handleClick = (section: string) => {
    // Limpar timeout anterior se existir
    if (clickTimeouts.current[section]) {
      clearTimeout(clickTimeouts.current[section]);
      delete clickTimeouts.current[section];
      
      // Duplo clique detectado
      handleDoubleClick(section);
      return;
    }

    // Primeiro clique - navegar para a seção
    handleSingleClick(section);

    // Configurar timeout para detectar duplo clique
    clickTimeouts.current[section] = setTimeout(() => {
      delete clickTimeouts.current[section];
    }, 300); // 300ms para detectar duplo clique
  };

  const handleSingleClick = (section: string) => {
    // Desmarcar todos os outros itens - apenas este fica ativo
    setActiveSection(section);
    setDoubleClickSection(null);
    
    if (onNavigate) {
      onNavigate(section);
    }
    
    // Scroll para a seção correspondente com offset de 50px
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
        const elementPosition = element.offsetTop;
        const offsetPosition = elementPosition - 50; // 50px acima do elemento
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleDoubleClick = (section: string) => {
    // Desmarcar todos os outros itens - apenas este fica ativo
    setActiveSection(section);
    setDoubleClickSection(section);
    
    // Primeiro navegar para a seção
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
        const elementPosition = element.offsetTop;
        const offsetPosition = elementPosition - 50; // 50px acima do elemento
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
    
    // Depois ocultar as seções conforme especificação
    if (onToggleSection) {
      onToggleSection(section);
    }
  };

  const handleEmbutidoClick = (tipo: 'com' | 'sem') => {
    if (setEmbutido) {
      setEmbutido(tipo);
    }
  };

  const getIconStyle = (section: string) => {
    const isActive = activeSection === section;
    const isDoubleClicked = doubleClickSection === section;
    
    if (isDoubleClicked) {
      // Duplo clique ativo
      return {
        backgroundColor: 'var(--brand-primary)',
        color: '#131313'
      };
    } else if (isActive) {
      // Clique único ativo
      return {
        backgroundColor: '#131313',
        color: 'var(--brand-primary)'
      };
    } else {
      // Estado padrão
      return {
        backgroundColor: '#131313',
        color: '#333333'
      };
    }
  };

  const getEmbutidoIconStyle = (tipo: 'com' | 'sem') => {
    const isActive = embutido === tipo;
    
    if (isActive) {
      // Ativo
      return {
        backgroundColor: '#131313',
        color: 'var(--brand-primary)'
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
    { key: 'settings', icon: Settings, label: 'Ir para Montagem de Cotas' },
    { key: 'dollar', icon: DollarSign, label: 'Ir para Alavancagem Financeira' },
    { key: 'home', icon: Home, label: 'Ir para Alavancagem Patrimonial' },
    { key: 'search', icon: Search, label: 'Ir para Tabela Detalhada' }
  ];

  const embutidoItems = [
    { key: 'sem', icon: ArrowUp, label: 'Sem embutido', tipo: 'sem' as const },
    { key: 'com', icon: ArrowRight, label: 'Com embutido', tipo: 'com' as const }
  ];

  return (
    <TooltipProvider>
      <div className="fixed right-2 top-1/2 transform -translate-y-1/2 z-50">
        {/* Primeiro menu - Navegação */}
        <div 
          className="rounded-lg shadow-lg p-2 mb-3"
          style={{
            backgroundColor: '#131313',
            border: '1px solid #333333'
          }}
        >
          <div className="flex flex-col space-y-2">
            {menuItems.map(({ key, icon: Icon, label }) => {
              const style = getIconStyle(key);
              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-10.8 h-10.8 p-0 transition-all duration-200 hover:scale-110 rounded"
                      onClick={() => handleClick(key)}
                      style={{
                        backgroundColor: style.backgroundColor,
                        color: style.color
                      }}
                    >
                      <Icon size={21} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="left"
                    className="bg-[#131313] border border-[#333333] text-white"
                  >
                    <p>{label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Segundo menu - Embutido */}
        <div 
          className="rounded-lg shadow-lg p-2"
          style={{
            backgroundColor: '#131313',
            border: '1px solid #333333'
          }}
        >
          <div className="flex flex-col space-y-2">
            {embutidoItems.map(({ key, icon: Icon, label, tipo }) => {
              const style = getEmbutidoIconStyle(tipo);
              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-10.8 h-10.8 p-0 transition-all duration-200 hover:scale-110 rounded"
                      onClick={() => handleEmbutidoClick(tipo)}
                      style={{
                        backgroundColor: style.backgroundColor,
                        color: style.color
                      }}
                    >
                      <Icon size={21} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="left"
                    className="bg-[#131313] border border-[#333333] text-white"
                  >
                    <p>{label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}; 