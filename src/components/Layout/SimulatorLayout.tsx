
import { ReactNode, createContext, useContext, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { SimulatorSidebar } from './SimulatorSidebar';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import { SimulatorMenu } from '@/components/Simulator/SimulatorMenu';
import { useEffect } from 'react';

// Contexto para compartilhar dados do simulador
type LeverageConfig = {
  selectedLeverageId?: string;
  leverageValue?: string; // valor formatado (ex.: "R$ 500.000,00")
  leverageType?: 'simples' | 'escalonada';
  purchasePeriodMonths?: number;
  dailyPercentage?: number;
  managementPercentage?: number;
  occupancyRate?: number;
  totalExpenses?: number;
};

interface SimulatorContextType {
  simulationData: {
    searchType: 'contribution' | 'credit';
    value: number;
    term: number;
    installmentType: string;
    contemplationMonth: number;
  };
  setSimulationData: (data: any) => void;
  installmentTypes: any[];
  reducoesParcela: any[];
  showConfigModal: boolean;
  setShowConfigModal: (show: boolean) => void;
  embutido: 'com' | 'sem';
  setEmbutido: (embutido: 'com' | 'sem') => void;
  // Funções para carregar dados
  loadInstallmentTypes: (administratorId: string) => Promise<void>;
  loadReducoesParcela: (administratorId: string) => Promise<void>;
  // NOVO: Configurações de Alavancagem
  leverageConfig?: LeverageConfig;
  setLeverageConfig: (cfg: LeverageConfig | undefined) => void;
}

const SimulatorContext = createContext<SimulatorContextType | null>(null);

export const useSimulatorContext = () => {
  const context = useContext(SimulatorContext);
  if (!context) {
    throw new Error('useSimulatorContext must be used within a SimulatorProvider');
  }
  return context;
};

interface SimulatorLayoutProps {
  children: ReactNode;
}

// Componente interno do cabeçalho que usa o hook useSidebar
const SimulatorHeader = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const simulatorContext = useSimulatorContext();
  const location = useLocation();
  const isSimulatorPage = location.pathname === '/simulador';
  
  const handleFieldChange = (field: string, value: any) => {
    simulatorContext.setSimulationData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleTermChange = (value: number) => {
    handleFieldChange('term', value);
  };
  
  return (
    <header 
      className="flex min-h-16 shrink-0 items-center gap-4 border-b border-border dark:border-[#A86F57]/20 px-4 bg-background dark:bg-[#1E1E1E] fixed top-0 z-40"
      style={{
        left: isCollapsed ? '0' : '16rem',
        right: '0',
        transition: 'left 0.2s ease-linear'
      }}
    >
      <SidebarTrigger className="-ml-1 text-foreground dark:text-white" />
      <ThemeSwitch />
      <div className="flex items-center space-x-2 text-sm text-muted-foreground dark:text-gray-300 bg-muted/50 dark:bg-[#A86F57]/10 px-3 py-1.5 rounded-full">
        <span className="font-medium">Faça a sua simulação</span>
      </div>
      
      {/* Campos de configuração - Layout responsivo melhorado */}
      {isSimulatorPage && (
        <div className={`hidden ${isCollapsed ? 'lg:flex' : 'xl:flex'} items-center gap-2 ml-auto flex-1 max-w-4xl`}>
          <div className="flex flex-col gap-1 min-w-0 flex-1" style={{ width: '120px' }}>
            <label className="text-xs font-medium text-muted-foreground truncate">Modalidade</label>
            <Select 
              value={simulatorContext.simulationData.searchType} 
              onValueChange={v => { console.debug('[Sim/Header] searchType ->', v); handleFieldChange('searchType', v === 'contribution' ? 'contribution' : 'credit'); }}
            >
              <SelectTrigger className="h-8 text-xs min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contribution">Aporte</SelectItem>
                <SelectItem value="credit">Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-1 min-w-0 flex-1" style={{ width: '80px' }}>
            <label className="text-xs font-medium text-muted-foreground truncate">
              {simulatorContext.simulationData.searchType === 'contribution' ? 'Valor do aporte' : 'Valor do crédito'}
            </label>
            <Input
              type="number"
              value={simulatorContext.simulationData.value || ''}
              onChange={e => { const val = e.target.value ? Number(e.target.value) : 0; console.debug('[Sim/Header] value ->', val); handleFieldChange('value', val); }}
              placeholder="0,00"
              className="h-8 text-xs min-w-0"
            />
          </div>
          
          <div className="flex flex-col gap-1 min-w-0 flex-1" style={{ width: '80px' }}>
            <label className="text-xs font-medium text-muted-foreground truncate">Número de parcelas</label>
            <Select
              value={simulatorContext.simulationData.term.toString()}
              onValueChange={v => { const num = Number(v); console.debug('[Sim/Header] term ->', num); handleTermChange(num); }}
            >
              <SelectTrigger className="h-8 text-xs min-w-0">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {simulatorContext.installmentTypes.map((it: any) => (
                  <SelectItem key={it.id} value={it.installment_count.toString()}>
                    {it.installment_count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-1 min-w-0 flex-1" style={{ width: '80px' }}>
            <label className="text-xs font-medium text-muted-foreground truncate">Tipo de Parcela</label>
            <Select 
              value={simulatorContext.simulationData.installmentType} 
              onValueChange={v => {
                console.debug('[Sim/Header] installmentType ->', v);
                handleFieldChange('installmentType', v);
                // Sincronizar com o modal de configurações
                simulatorContext.setSimulationData((prev: any) => ({ 
                  ...prev, 
                  installmentType: v 
                }));
              }}
            >
              <SelectTrigger className="h-8 text-xs min-w-0">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Parcela Cheia</SelectItem>
                {simulatorContext.reducoesParcela.map((red: any) => (
                  <SelectItem key={red.id} value={red.id}>{red.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-1 min-w-0 flex-1" style={{ width: '80px' }}>
            <label className="text-xs font-medium text-muted-foreground truncate">Mês Contemplação</label>
            <Input
              type="number"
              value={simulatorContext.simulationData.contemplationMonth || ''}
              onChange={e => { const val = e.target.value ? Number(e.target.value) : 6; console.debug('[Sim/Header] contemplationMonth ->', val); handleFieldChange('contemplationMonth', val); }}
              placeholder="6"
              min={1}
              className="h-8 text-xs min-w-0"
            />
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => simulatorContext.setShowConfigModal(true)}
            className="h-8 w-8 p-0 flex-shrink-0" style={{ backgroundColor: '#1E1E1E' }}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {/* Botão de configurações para mobile e telas médias */}
      {isSimulatorPage && (
        <div className={`${isCollapsed ? 'lg:hidden' : 'xl:hidden'} ml-auto`}>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => simulatorContext.setShowConfigModal(true)}
            className="h-8 w-8 p-0"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      )}
    </header>
  );
};

export const SimulatorLayout = ({ children }: SimulatorLayoutProps) => {
  const { companyId, crmUser } = useCrmAuth();
  
  // Estado do contexto do simulador com funções reais
  const [simulatorContextValue, setSimulatorContextValue] = useState<SimulatorContextType>({
    simulationData: {
      searchType: 'contribution',
      value: 0,
      term: 120,
      installmentType: 'full',
      contemplationMonth: 6
    },
    setSimulationData: (data) => {
      setSimulatorContextValue(prev => ({
        ...prev,
        simulationData: typeof data === 'function' ? data(prev.simulationData) : data
      }));
    },
    installmentTypes: [],
    reducoesParcela: [],
    showConfigModal: false,
    setShowConfigModal: (show) => {
      setSimulatorContextValue(prev => ({
        ...prev,
        showConfigModal: show
      }));
    },
    embutido: 'com',
    setEmbutido: (embutido: 'com' | 'sem') => {
      setSimulatorContextValue(prev => ({
        ...prev,
        embutido
      }));
    },
    // NOVO: estado e setter de configurações de alavancagem
    leverageConfig: undefined,
    setLeverageConfig: (cfg) => {
      setSimulatorContextValue(prev => ({
        ...prev,
        leverageConfig: cfg ? { ...cfg } : undefined,
      }));
    },

    loadInstallmentTypes: async (administratorId: string) => {
      if (!administratorId) return;
      
      const { data: installments } = await supabase
        .from('installment_types')
        .select('*')
        .eq('administrator_id', administratorId)
        .eq('is_archived', false)
        .order('installment_count');
      
      setSimulatorContextValue(prev => ({
        ...prev,
        installmentTypes: installments || []
      }));
    },
    loadReducoesParcela: async (administratorId: string) => {
      if (!administratorId) return;
      
      const { data: reducoes } = await supabase
        .from('installment_reductions')
        .select('id, name')
        .eq('administrator_id', administratorId)
        .eq('is_archived', false);
      
      setSimulatorContextValue(prev => ({
        ...prev,
        reducoesParcela: reducoes || []
      }));
    }
  });

  // NOVO: garantir inicialização com dados salvos antes de renderizar children
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function initFromSavedConfig() {
      if (!companyId) {
        setIsInitialized(true);
        return;
      }
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const uid = authUser?.id;
      if (!uid) {
        setIsInitialized(true);
        return;
      }
      const { data: configs } = await supabase
        .from('simulator_configurations')
        .select('*')
        .eq('user_id', uid)
        .eq('company_id', companyId)
        .limit(1);
      if (cancelled) return;
      if (configs && configs.length > 0) {
        const conf: any = configs[0].configuration || {};
        setSimulatorContextValue(prev => ({
          ...prev,
          simulationData: {
            searchType: conf.searchType || prev.simulationData.searchType,
            value: conf.value ?? prev.simulationData.value,
            term: conf.term ?? prev.simulationData.term,
            installmentType: conf.installmentType || prev.simulationData.installmentType,
            contemplationMonth: conf.contemplationMonth ?? prev.simulationData.contemplationMonth,
          },
          embutido: conf.embutido || prev.embutido,
          leverageConfig: conf.leverageConfig || prev.leverageConfig,
        }));
      }
      setIsInitialized(true);
    }
    initFromSavedConfig();
    return () => { cancelled = true; };
  }, [crmUser?.id, companyId]);
  
  return (
    <CompanyProvider defaultCompanyId={companyId || ''}>
      <SimulatorContext.Provider value={simulatorContextValue}>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background dark:bg-[#131313]">
            <SimulatorSidebar />
            <SidebarInset className="flex-1 overflow-x-hidden pt-12">{/* reduzido o topo; laterais e inferior permanecem pelo padding do main */}
              {isInitialized ? (
                <>
                  <SimulatorHeader />
                  <main className="flex-1 p-6 bg-background dark:bg-[#131313] max-w-full">
                    {children}
                  </main>

                  {/* Menu lateral */}
                  <SimulatorMenu 
                    onNavigate={(section) => {
                      // Implementar navegação se necessário
                    }}
                    onToggleSection={(section) => {
                      // Implementar toggle de seções se necessário
                    }}
                    embutido={simulatorContextValue.embutido}
                    setEmbutido={simulatorContextValue.setEmbutido}
                  />
                </>
              ) : (
                <main className="flex-1 p-6 flex items-center justify-center">
                  <div className="text-muted-foreground">Carregando configurações do simulador...</div>
                </main>
              )}
            </SidebarInset>
          </div>
        </SidebarProvider>
      </SimulatorContext.Provider>
    </CompanyProvider>
  );
};
