
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimulationDataPanel } from './SimulationDataPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, Home, DollarSign, TrendingUp, Clock, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SimulatorConfigModal } from './SimulatorConfigModal';
import { useSimulatorSync } from '@/hooks/useSimulatorSync';
import { DetailTable } from './DetailTable';
import { CreditAccessPanel } from './CreditAccessPanel';
import { PatrimonialLeverageNew } from './PatrimonialLeverageNew';
import { useSimulatorContext } from '@/components/Layout/SimulatorLayout';
import { CapitalGainSection } from './CapitalGainSection';
import { useCompany } from '@/contexts/CompanyContext';
import { formatCurrency } from '@/lib/utils';

export const NewSimulatorLayout = ({ manualTerm }: { manualTerm?: number }) => {
  console.log('[NewSimulatorLayout] Componente iniciando...');
  
  const { 
    simulationData, 
    setSimulationData,
    updateSimulationMode,
    updateSimulationValue,
    updateInstallments,
    updateInstallmentType
  } = useSimulatorSync();
  
  // Usar o contexto do simulador
  const simulatorContext = useSimulatorContext();
  const { selectedCompanyId } = useCompany();
  
  // Estado principal dos dados da simulação - sincronizado com o contexto
  const [localSimulationData, setLocalSimulationData] = useState({
    administrator: '',
    consortiumType: 'property' as 'property' | 'vehicle',
    installmentType: simulatorContext.simulationData.installmentType,
    value: simulatorContext.simulationData.value,
    term: simulatorContext.simulationData.term,
    updateRate: 6,
    searchType: simulatorContext.simulationData.searchType,
    contemplationMonth: simulatorContext.simulationData.contemplationMonth,
    bidType: '',
  });

  // Estados para o menu lateral
  const [visibleSections, setVisibleSections] = useState({
    credit: true,
    leverage: true,
    detail: true,
    capital: true
  });

  // Refs para navegação
  const creditSectionRef = useRef<HTMLDivElement>(null);
  const leverageSectionRef = useRef<HTMLDivElement>(null);
  const detailSectionRef = useRef<HTMLDivElement>(null);
  const capitalSectionRef = useRef<HTMLDivElement>(null);

  // Estado para posição do menu lateral - agora sem limitações
  const [menuPosition, setMenuPosition] = useState(50); // 50% = centro

  // Sincronizar campos do topo com simulationData e com o contexto global
  const handleFieldChange = (field: string, value: any) => {
    console.log(`[NewSimulatorLayout] Campo alterado: ${field} = ${value}`);
    const startTime = performance.now();
    
    setLocalSimulationData((prev) => ({ ...prev, [field]: value }));
    
    // Sincronizar com o contexto global do simulador
    if (field === 'searchType') {
      updateSimulationMode(value === 'contribution' ? 'aporte' : 'credito');
    } else if (field === 'value') {
      updateSimulationValue(value);
    } else if (field === 'term') {
      updateInstallments(value);
    } else if (field === 'installmentType') {
      updateInstallmentType(value === 'full' ? 'full' : value === 'half' ? 'half' : 'reduced');
    } else if (field === 'contemplationMonth') {
      // Atualizar o mês de contemplação no contexto global
      simulatorContext.setSimulationData(prev => ({
        ...prev,
        contemplationMonth: value
      }));
    }
    
    const endTime = performance.now();
    console.log(`[NewSimulatorLayout] Atualização de campo concluída em ${(endTime - startTime).toFixed(2)}ms`);
  };

  // Função para acompanhar a rolagem - agora sem limitações
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Calcular a posição baseada na rolagem - sem limitações
      const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
      
      // Menu pode percorrer toda a página (0% a 100%)
      const newPosition = Math.max(5, Math.min(95, scrollPercentage));
      setMenuPosition(newPosition);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Buscar administradora padrão e opções de parcelas
  useEffect(() => {
    console.log('[NewSimulatorLayout] Iniciando busca de dados...');
    const startTime = performance.now();
    
    const fetchInstallmentTypes = async () => {
      let adminId = localSimulationData.administrator;
      if (!adminId) {
        console.log('[NewSimulatorLayout] Buscando administradora padrão...');
        const adminStartTime = performance.now();
        
        // Buscar administradora padrão
        const { data: admins } = await supabase
          .from('administrators')
          .select('id')
          .eq('is_default', true)
          .limit(1);
        
        const adminEndTime = performance.now();
        console.log(`[NewSimulatorLayout] Administradora carregada em ${(adminEndTime - adminStartTime).toFixed(2)}ms`);
        
        adminId = admins?.[0]?.id || '';
        if (adminId && !localSimulationData.administrator) {
          setLocalSimulationData((prev) => ({ ...prev, administrator: adminId }));
        }
      }
      
      if (adminId) {
        console.log('[NewSimulatorLayout] Carregando tipos de parcelas...');
        const typesStartTime = performance.now();
        
        // Usar as funções do contexto para carregar dados
        await simulatorContext.loadInstallmentTypes(adminId);
        await simulatorContext.loadReducoesParcela(adminId);
        
        const typesEndTime = performance.now();
        console.log(`[NewSimulatorLayout] Tipos de parcelas carregados em ${(typesEndTime - typesStartTime).toFixed(2)}ms`);
        console.log('[NewSimulatorLayout] Dados carregados com sucesso');
      }
      
      const endTime = performance.now();
      console.log(`[NewSimulatorLayout] Total de carregamento: ${(endTime - startTime).toFixed(2)}ms`);
    };
    fetchInstallmentTypes();
  }, [localSimulationData.administrator, simulatorContext]);

  const [parcelaSelecionada, setParcelaSelecionada] = useState<string>('');
  const [tiposParcela, setTiposParcela] = useState<any[]>([]);
  const [tipoParcelaSelecionado, setTipoParcelaSelecionado] = useState<string>('full');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [installmentTypes, setInstallmentTypes] = useState<any[]>([]);

  // Adicionar estado para sincronizar parcelas
  const [selectedTerm, setSelectedTerm] = useState<number | undefined>(undefined);

  // Adicionar estados para adminTaxPercent e reserveFundPercent
  const [adminTaxPercent, setAdminTaxPercent] = useState<number | undefined>(undefined);
  const [reserveFundPercent, setReserveFundPercent] = useState<number | undefined>(undefined);

  // Estado para reduções de parcela
  const [reducoesParcela, setReducoesParcela] = useState<any[]>([]);



  // Atualizar ao receber do painel de dados
  useEffect(() => {
    if ((simulationData as any).adminTaxPercent !== undefined) setAdminTaxPercent((simulationData as any).adminTaxPercent);
    if ((simulationData as any).reserveFundPercent !== undefined) setReserveFundPercent((simulationData as any).reserveFundPercent);
  }, [(simulationData as any).adminTaxPercent, (simulationData as any).reserveFundPercent]);

  // Atualizar selectedTerm ao mudar no simulador
  const handleTermChange = (value: number) => {
    setSelectedTerm(value);
    handleFieldChange('term', value);
  };

  // Sincronizar dados locais com o contexto
  useEffect(() => {
    console.log('[NewSimulatorLayout] Sincronizando dados com contexto global...');
    const startTime = performance.now();
    
    setLocalSimulationData(prev => ({
      ...prev,
      searchType: simulatorContext.simulationData.searchType,
      value: simulatorContext.simulationData.value,
      term: simulatorContext.simulationData.term,
      installmentType: simulatorContext.simulationData.installmentType,
      contemplationMonth: simulatorContext.simulationData.contemplationMonth,
    }));
    
    const endTime = performance.now();
    console.log(`[NewSimulatorLayout] Sincronização concluída em ${(endTime - startTime).toFixed(2)}ms`);
  }, [simulatorContext.simulationData]);

  // Se houver valor manual vindo do modal, ele se sobrepõe
  const termValue = manualTerm !== undefined && manualTerm !== null ? manualTerm : localSimulationData.term;

  // Estado para crédito acessado
  const [creditoAcessado, setCreditoAcessado] = useState<number | null>(null);
  
  // Monitorar mudanças no crédito acessado
  useEffect(() => {
    if (creditoAcessado !== null) {
      console.log(`[NewSimulatorLayout] Crédito acessado atualizado: ${formatCurrency(creditoAcessado)}`);
    }
  }, [creditoAcessado]);

  // Estado para créditos selecionados (cotas)
  const [selectedCredits, setSelectedCredits] = useState<any[]>([]);

  // Estado para embutido
  const [embutido, setEmbutido] = useState<'com' | 'sem'>('com');

  // Funções do menu lateral
  const handleNavigate = (section: string) => {
    const refs = {
      settings: creditSectionRef,
      home: leverageSectionRef,
      search: detailSectionRef,
      capital: capitalSectionRef
    };

    const ref = refs[section as keyof typeof refs];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleToggleSection = (section: string) => {
    if (section === 'all') {
      setVisibleSections({
        credit: true,
        leverage: true,
        detail: true,
        capital: true
      });
    } else {
      const sectionMap = {
        settings: 'credit',
        home: 'leverage',
        search: 'detail',
        capital: 'capital'
      };

      const targetSection = sectionMap[section as keyof typeof sectionMap];
      if (targetSection) {
        setVisibleSections(prev => ({
          ...prev,
          [targetSection]: !prev[targetSection as keyof typeof prev]
        }));
      }
    }
  };



  return (
    <div className="flex flex-col gap-6 h-full relative w-full max-w-full">
      {/* Menu Lateral Fixo à Direita - Ajustado para não causar corte */}
      <div 
        className="fixed right-4 z-50 transition-all duration-300 ease-in-out"
        style={{ top: `${menuPosition}%`, transform: 'translateY(-50%)' }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1">
          <div className="flex flex-col space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:scale-110"
              onClick={() => handleNavigate('settings')}
              title="Configurações"
            >
              <Settings size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 hover:scale-110"
              onClick={() => handleNavigate('home')}
              title="Alavancagem"
            >
              <Home size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200 hover:scale-110"
              onClick={() => handleNavigate('capital')}
              title="Ganho de Capital"
            >
              <DollarSign size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
              title="Financeiro"
            >
              <TrendingUp size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200 hover:scale-110"
              title="Histórico"
            >
              <Clock size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 hover:scale-110"
              onClick={() => handleNavigate('search')}
              title="Detalhamento"
            >
              <Search size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Seção de crédito - sem campos duplicados */}
      {visibleSections.credit && (
        <div ref={creditSectionRef}>
          {/* Campos agora estão no cabeçalho */}
        </div>
      )}

      {/* Seção de Crédito Acessado */}
      {visibleSections.credit && (
        <div className="w-full">
          <CreditAccessPanel 
            data={localSimulationData} 
            onCreditoAcessado={setCreditoAcessado}
            onSelectedCreditsChange={setSelectedCredits}
          />
        </div>
      )}

      {/* Seção de Alavancagem Patrimonial - Entre crédito acessado e detalhamento */}
      {visibleSections.leverage && (
        <div ref={leverageSectionRef} className="w-full">
          <PatrimonialLeverageNew 
            simulationData={localSimulationData} 
            creditoAcessado={creditoAcessado}
            embutido={embutido}
            setEmbutido={setEmbutido}
          />
        </div>
      )}

      {/* Seção de Ganho de Capital */}
      {visibleSections.capital && (
        <div ref={capitalSectionRef} className="w-full">
          <CapitalGainSection 
            creditoAcessado={creditoAcessado}
            contemplationMonth={localSimulationData.contemplationMonth || 60}
            installmentType={localSimulationData.installmentType}
            product={{ nominalCreditValue: localSimulationData.value, termMonths: termValue }}
            administrator={{ 
              administrationRate: 0.27,
              updateMonth: 8,
              gracePeriodDays: 90,
              inccRate: 6,
              postContemplationAdjustment: 0.5,
              maxEmbeddedPercentage: 25
            }}
            embutido={embutido}
            selectedCredits={selectedCredits}
          />
        </div>
      )}

      {/* Seção de Detalhamento */}
      {visibleSections.detail && (
        <div ref={detailSectionRef} className="w-full">
          <DetailTable 
            product={{ nominalCreditValue: localSimulationData.value, termMonths: termValue }}
            administrator={{ 
              administrationRate: 0.27,
              updateMonth: 8, // Agosto
              gracePeriodDays: 90, // 90 dias de carência
              inccRate: 6, // Taxa INCC 6%
              postContemplationAdjustment: 0.5, // Ajuste pós contemplação 0.5%
              maxEmbeddedPercentage: 25 // Máximo embutido 25%
            }}
            contemplationMonth={localSimulationData.contemplationMonth || 60}
            selectedCredits={selectedCredits}
            creditoAcessado={creditoAcessado || localSimulationData.value}
            embutido={embutido}
            installmentType={localSimulationData.installmentType}
          />
        </div>
      )}

      {/* Modal de configurações */}
      <SimulatorConfigModal
        open={simulatorContext.showConfigModal}
        onClose={() => simulatorContext.setShowConfigModal(false)}
        onApply={() => simulatorContext.setShowConfigModal(false)}
        onSaveAndApply={() => simulatorContext.setShowConfigModal(false)}
        onReset={() => {}}
        setManualTerm={() => {}}
        selectedTerm={selectedTerm}
        setSelectedTerm={setSelectedTerm}
        adminTaxPercent={adminTaxPercent}
        reserveFundPercent={reserveFundPercent}
        // Novos props para sincronização de filtros principais
        searchType={localSimulationData.searchType}
        setSearchType={v => handleFieldChange('searchType', v)}
        value={localSimulationData.value}
        setValue={v => handleFieldChange('value', v)}
        term={localSimulationData.term}
        setTerm={v => handleTermChange(v)}
        installmentType={localSimulationData.installmentType}
        setInstallmentType={v => handleFieldChange('installmentType', v)}
        contemplationMonth={localSimulationData.contemplationMonth}
        setContemplationMonth={v => handleFieldChange('contemplationMonth', v)}
      />
    </div>
  );
};
