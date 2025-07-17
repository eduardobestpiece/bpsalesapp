
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

// Contexto para compartilhar dados do simulador
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
  // Funções para carregar dados
  loadInstallmentTypes: (administratorId: string) => Promise<void>;
  loadReducoesParcela: (administratorId: string) => Promise<void>;
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
      className="flex h-16 shrink-0 items-center gap-4 border-b border-border dark:border-[#A86F57]/20 px-4 bg-background dark:bg-[#1E1E1E] sticky top-0 z-40 w-full"
      style={{
        left: isCollapsed ? '3rem' : '16rem',
        width: `calc(100% - ${isCollapsed ? '3rem' : '16rem'})`,
        transition: 'left 0.2s ease-linear, width 0.2s ease-linear'
      }}
    >
      <SidebarTrigger className="-ml-1 text-foreground dark:text-white" />
      <ThemeSwitch />
      <div className="flex items-center space-x-2 text-sm text-muted-foreground dark:text-gray-300 bg-muted/50 dark:bg-[#A86F57]/10 px-3 py-1.5 rounded-full">
        <span className="font-medium">Faça a sua simulação</span>
      </div>
      
      {/* Campos de configuração - Expandidos para ocupar 70% do espaço */}
      {isSimulatorPage && (
        <div className="hidden lg:flex items-center gap-4 ml-auto flex-1" style={{ maxWidth: '70%' }}>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-muted-foreground">Modalidade</label>
          <Select 
            value={simulatorContext.simulationData.searchType} 
            onValueChange={v => handleFieldChange('searchType', v === 'contribution' ? 'contribution' : 'credit')}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contribution">Aporte</SelectItem>
              <SelectItem value="credit">Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-muted-foreground">
            {simulatorContext.simulationData.searchType === 'contribution' ? 'Valor do aporte' : 'Valor do crédito'}
          </label>
          <Input
            type="number"
            value={simulatorContext.simulationData.value || ''}
            onChange={e => handleFieldChange('value', e.target.value ? Number(e.target.value) : 0)}
            placeholder="0,00"
            className="h-8 text-xs"
          />
        </div>
        
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-muted-foreground">Número de parcelas</label>
          <Select
            value={simulatorContext.simulationData.term.toString()}
            onValueChange={v => handleTermChange(Number(v))}
          >
            <SelectTrigger className="h-8 text-xs">
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
        
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-muted-foreground">Tipo de Parcela</label>
          <Select 
            value={simulatorContext.simulationData.installmentType} 
            onValueChange={v => handleFieldChange('installmentType', v)}
          >
            <SelectTrigger className="h-8 text-xs">
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
        
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-muted-foreground">Mês Contemplação</label>
          <Input
            type="number"
            value={simulatorContext.simulationData.contemplationMonth || ''}
            onChange={e => handleFieldChange('contemplationMonth', e.target.value ? Number(e.target.value) : 6)}
            placeholder="6"
            min={6}
            max={120}
            className="h-8 text-xs"
          />
        </div>
        
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
      
      {/* Botão de configurações para mobile e telas médias */}
      {isSimulatorPage && (
        <div className="lg:hidden ml-auto">
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
  const { companyId } = useCrmAuth();
  
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
  
  return (
    <CompanyProvider defaultCompanyId={companyId || ''}>
      <SimulatorContext.Provider value={simulatorContextValue}>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background dark:bg-[#131313] overflow-x-hidden">
            <SimulatorSidebar />
            <SidebarInset className="flex-1">
              <SimulatorHeader />
              <main className="flex-1 p-6 bg-background dark:bg-[#131313]">
                {children}
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </SimulatorContext.Provider>
    </CompanyProvider>
  );
};
