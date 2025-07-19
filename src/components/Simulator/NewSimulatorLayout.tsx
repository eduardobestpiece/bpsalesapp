
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

export const NewSimulatorLayout = ({ manualTerm }: { manualTerm?: number }) => {
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

  // Estado para controlar seções ocultas por clique duplo
  const [sectionsHiddenByDoubleClick, setSectionsHiddenByDoubleClick] = useState<string | null>(null);

  // Sincronizar campos do topo com simulationData e com o contexto global
  const handleFieldChange = (field: string, value: any) => {
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
  };

  // Menu fixo abaixo do cabeçalho - posicionado logo abaixo do header fixo
  useEffect(() => {
    // Menu fixo logo abaixo do cabeçalho fixo
    // Altura do cabeçalho + pequena margem
    const headerHeight = 60; // Altura do header fixo
    const menuOffset = 10; // Pequena margem abaixo do header
    
    const fixedPosition = headerHeight + menuOffset;
    setMenuPosition(fixedPosition);
  }, []);

  // Buscar administradora padrão e opções de parcelas
  useEffect(() => {
    const fetchInstallmentTypes = async () => {
      let adminId = localSimulationData.administrator;
      if (!adminId) {
        // Buscar administradora padrão
        const { data: admins } = await supabase
          .from('administrators')
          .select('id')
          .eq('is_default', true)
          .limit(1);
        adminId = admins?.[0]?.id || '';
        if (adminId && !localSimulationData.administrator) {
          setLocalSimulationData((prev) => ({ ...prev, administrator: adminId }));
        }
      }
      if (adminId) {
        // Usar as funções do contexto para carregar dados
        await simulatorContext.loadInstallmentTypes(adminId);
        await simulatorContext.loadReducoesParcela(adminId);
      }
    };
    fetchInstallmentTypes();
  }, [localSimulationData.administrator]);

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
    setLocalSimulationData(prev => ({
      ...prev,
      searchType: simulatorContext.simulationData.searchType,
      value: simulatorContext.simulationData.value,
      term: simulatorContext.simulationData.term,
      installmentType: simulatorContext.simulationData.installmentType,
      contemplationMonth: simulatorContext.simulationData.contemplationMonth,
    }));
  }, [simulatorContext.simulationData]);

  // Se houver valor manual vindo do modal, ele se sobrepõe
  const termValue = manualTerm !== undefined && manualTerm !== null ? manualTerm : localSimulationData.term;

  // Estado para crédito acessado
  const [creditoAcessado, setCreditoAcessado] = useState<number | null>(null);

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

  // Nova função para lidar com clique único/duplo/triplo
  const handleMenuClick = (section: string) => {
    // Clique único: navegar para a seção
    handleNavigate(section);
    
    // Verificar se é clique duplo
    const now = Date.now();
    const lastClick = (window as any).lastMenuClick || 0;
    const timeDiff = now - lastClick;
    
    if (timeDiff < 300) { // Clique duplo detectado
      const sectionMap = {
        settings: 'credit',
        home: 'leverage',
        search: 'detail',
        capital: 'capital'
      };
      
      const targetSection = sectionMap[section as keyof typeof sectionMap];
      
      if (sectionsHiddenByDoubleClick === targetSection) {
        // Clique triplo: mostrar todas as seções
        setSectionsHiddenByDoubleClick(null);
        setVisibleSections({
          credit: true,
          leverage: true,
          detail: true,
          capital: true
        });
      } else {
        // Clique duplo: ocultar outras seções
        setSectionsHiddenByDoubleClick(targetSection);
        setVisibleSections({
          credit: targetSection === 'credit',
          leverage: targetSection === 'leverage',
          detail: targetSection === 'detail',
          capital: targetSection === 'capital'
        });
      }
    }
    
    (window as any).lastMenuClick = now;
  };


  return (
    <div className="flex flex-col gap-6 h-full relative w-full max-w-full">
      {/* Menu Lateral Fixo à Direita - Posicionado logo abaixo do header fixo */}
      <div 
        className="fixed right-4 z-50"
        style={{ top: `${menuPosition}px` }}
      >
        <div 
          className="rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1"
          style={{ backgroundColor: '#131313' }}
        >
          <div className="flex flex-col space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-white hover:text-[#AA715A] transition-all duration-200 hover:scale-110 active:bg-[#AA715A] active:text-[#131313]"
              onClick={() => handleMenuClick('settings')}
              title="Configurações"
            >
              <Settings size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-white hover:text-[#AA715A] transition-all duration-200 hover:scale-110 active:bg-[#AA715A] active:text-[#131313]"
              onClick={() => handleMenuClick('home')}
              title="Alavancagem"
            >
              <Home size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-white hover:text-[#AA715A] transition-all duration-200 hover:scale-110 active:bg-[#AA715A] active:text-[#131313]"
              onClick={() => handleMenuClick('capital')}
              title="Ganho de Capital"
            >
              <DollarSign size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-white hover:text-[#AA715A] transition-all duration-200 hover:scale-110 active:bg-[#AA715A] active:text-[#131313]"
              title="Financeiro"
            >
              <TrendingUp size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-white hover:text-[#AA715A] transition-all duration-200 hover:scale-110 active:bg-[#AA715A] active:text-[#131313]"
              title="Histórico"
            >
              <Clock size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-white hover:text-[#AA715A] transition-all duration-200 hover:scale-110 active:bg-[#AA715A] active:text-[#131313]"
              onClick={() => handleMenuClick('search')}
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
