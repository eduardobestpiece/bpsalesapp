import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Settings, Home, DollarSign, Search, ArrowUp, ArrowRight, Check, X, ZoomIn, ZoomOut, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useSimulatorContext } from '@/components/Layout/SimulatorLayout';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

interface SimulatorMenuProps {
  onNavigate?: (section: string) => void;
  onToggleSection?: (section: string) => void;
  embutido?: 'com' | 'sem';
  setEmbutido?: (embutido: 'com' | 'sem') => void;
  administrator?: any; // Dados da administradora para verificar entrada especial
  onSpecialEntryChange?: (enabled: boolean) => void; // Callback para mudanças na entrada especial
}

export const SimulatorMenu = ({ onNavigate, onToggleSection, embutido, setEmbutido, administrator, onSpecialEntryChange }: SimulatorMenuProps) => {
  const location = useLocation();
  if (location.pathname !== '/simulador') return null;

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [doubleClickSection, setDoubleClickSection] = useState<string | null>(null);
  const clickTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const [administratorData, setAdministratorData] = useState<any>(null);
  const { selectedCompanyId } = useCompany();
  const simulatorContext = useSimulatorContext();
  const { crmUser } = useCrmAuth();

  // Função para buscar dados da administradora atual
  const loadCurrentAdministrator = async () => {
    try {
      // Buscar configuração salva do usuário
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: configs } = await supabase
        .from('simulator_configurations')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .eq('user_id', crmUser?.id) // Adicionar filtro por user_id
        .limit(1);

      if (configs && configs.length > 0) {
        const config = configs[0].configuration;
        const administratorId = config?.administratorId;
        
        if (administratorId) {
          // Buscar dados da administradora
          const { data: adminData } = await supabase
            .from('administrators')
            .select('*')
            .eq('id', administratorId)
            .eq('is_archived', false)
            .limit(1);

          if (adminData && adminData.length > 0) {
            const admin = adminData[0];
            setAdministratorData(admin);
          } else {
            setAdministratorData(null);
          }
        } else {
          setAdministratorData(null);
        }
      } else {
        setAdministratorData(null);
      }
    } catch (error) {
      console.error('Erro ao carregar administradora:', error);
      setAdministratorData(null);
    }
  };

  // Função para forçar atualização imediata
  const forceUpdateAdministrator = () => {
    loadCurrentAdministrator();
  };

  // Carregar dados da administradora quando o componente montar
  useEffect(() => {
    if (selectedCompanyId) {
      loadCurrentAdministrator();
    }
  }, [selectedCompanyId]);

  // Recarregar dados da administradora quando a configuração mudar
  useEffect(() => {
    const handleStorageChange = () => {
      if (selectedCompanyId) {
        loadCurrentAdministrator();
      }
    };

    // Listener para mudanças no localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Listener para mudanças customizadas
    window.addEventListener('administratorChanged', handleStorageChange);
    
    // Listener para mudanças na configuração do simulador
    window.addEventListener('simulatorConfigChanged', handleStorageChange);
    
    // Listener para quando configuração é salva
    window.addEventListener('configSaved', forceUpdateAdministrator);

    // Verificar mudanças periodicamente (a cada 3 segundos)
    const interval = setInterval(() => {
      if (selectedCompanyId) {
        loadCurrentAdministrator();
      }
    }, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('administratorChanged', handleStorageChange);
      window.removeEventListener('simulatorConfigChanged', handleStorageChange);
      window.removeEventListener('configSaved', forceUpdateAdministrator);
      clearInterval(interval);
    };
  }, [selectedCompanyId]);

  // Verificar se a administradora tem entrada especial configurada
  const hasSpecialEntry = administratorData && administratorData.special_entry_type && administratorData.special_entry_type !== 'none';
  
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

  const handleSpecialEntryClick = (type: 'with' | 'without') => {
    const enabled = type === 'with';
    simulatorContext.setSpecialEntryEnabled(enabled);
    
    // Notificar outros componentes sobre a mudança
    if (onSpecialEntryChange) {
      onSpecialEntryChange(enabled);
    }
  };

  const handleZoomClick = (action: 'increase' | 'decrease' | 'reset') => {
    switch (action) {
      case 'increase':
        simulatorContext.increaseFontSize();
        break;
      case 'decrease':
        simulatorContext.decreaseFontSize();
        break;
      case 'reset':
        simulatorContext.resetFontSize();
        break;
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

  // Itens da entrada especial (só aparecem se houver entrada especial configurada)
  const specialEntryItems = hasSpecialEntry ? [
    { key: 'with', icon: Check, label: 'Com entrada especial: O simulador considerará a entrada especial.' },
    { key: 'without', icon: X, label: 'Sem entrada especial: O simulador não considerará a entrada especial.' }
  ] : [];

  // Itens do controle de zoom das fontes
  const zoomItems = [
    { key: 'increase', icon: ZoomIn, label: 'Aumentar tamanho das fontes' },
    { key: 'decrease', icon: ZoomOut, label: 'Diminuir tamanho das fontes' },
    { key: 'reset', icon: Minus, label: 'Resetar tamanho das fontes ao normal' }
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

        {/* Terceiro menu - Entrada Especial (só aparecem se houver entrada especial configurada) */}
        {hasSpecialEntry && (
          <div 
            className="rounded-lg shadow-lg p-2 mt-3"
            style={{
              backgroundColor: '#131313',
              border: '1px solid #333333'
            }}
          >
              <div className="flex flex-col space-y-2">
                {specialEntryItems.map(({ key, icon: Icon, label }) => {
                  const isActive = (key === 'with' && simulatorContext.specialEntryEnabled) || (key === 'without' && !simulatorContext.specialEntryEnabled);
                  const style = {
                    backgroundColor: '#131313',
                    color: isActive ? '#E50F5E' : '#333333'
                  };
                  
                  return (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-10.8 h-10.8 p-0 transition-all duration-200 hover:scale-110 rounded"
                          onClick={() => handleSpecialEntryClick(key as 'with' | 'without')}
                          style={style}
                        >
                          <Icon size={21} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="left"
                        className="bg-[#131313] border border-[#333333] text-white max-w-xs"
                      >
                        <p className="text-sm">{label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
        )}
        
        {/* Quarto menu - Controle de Zoom das Fontes */}
        <div 
          className="rounded-lg shadow-lg p-2 mt-3"
          style={{
            backgroundColor: '#131313',
            border: '1px solid #333333'
          }}
        >
          <div className="flex flex-col space-y-2">
            {zoomItems.map(({ key, icon: Icon, label }) => {
              // Lógica para destacar o ícone ativo baseado no zoom atual
              const isActive = 
                (key === 'increase' && simulatorContext.fontZoom > 100) ||
                (key === 'decrease' && simulatorContext.fontZoom < 100) ||
                (key === 'reset' && simulatorContext.fontZoom === 100);
              
              const style = {
                backgroundColor: '#131313',
                color: isActive ? '#E50F5E' : '#333333'
              };
              
              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-10.8 h-10.8 p-0 transition-all duration-200 hover:scale-110 rounded"
                      onClick={() => handleZoomClick(key as 'increase' | 'decrease' | 'reset')}
                      style={style}
                    >
                      <Icon size={21} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="left"
                    className="bg-[#131313] border border-[#333333] text-white max-w-xs"
                  >
                    <p className="text-sm">{label}</p>
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