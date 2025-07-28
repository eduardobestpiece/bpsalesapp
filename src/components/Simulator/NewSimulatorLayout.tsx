
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

import { useSimulatorContext } from '@/components/Layout/SimulatorLayout';
import { CapitalGainSection } from './CapitalGainSection';
import { NovaAlavancagemPatrimonial } from './NovaAlavancagemPatrimonial';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

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
  const detailSectionRef = useRef<HTMLDivElement>(null);
  const capitalSectionRef = useRef<HTMLDivElement>(null);

  // Estado para posição do menu lateral - agora sem limitações
  const [menuPosition, setMenuPosition] = useState(50); // 50% = centro

  // Estado para controlar seções ocultas por clique duplo
  const [sectionsHiddenByDoubleClick, setSectionsHiddenByDoubleClick] = useState<string | null>(null);

  // Sincronizar campos do topo com simulationData e com o contexto global
  const handleFieldChange = (field: string, value: any) => {
    
    // Atualizar dados locais
    setLocalSimulationData(prev => {
      const updated = { ...prev, [field]: value };
      return updated;
    });
    
    // Atualizar contexto global do simulador
    if (simulatorContext) {
      
      switch (field) {
        case 'searchType':
          simulatorContext.setSimulationData(prev => ({
            ...prev,
            mode: value === 'contribution' ? 'aporte' : 'credito'
          }));
          break;
        case 'value':
          simulatorContext.setSimulationData(prev => ({
            ...prev,
            value: value
          }));
          break;
        case 'term':
          simulatorContext.setSimulationData(prev => ({
            ...prev,
            installments: value
          }));
          break;
        case 'installmentType':
          simulatorContext.setSimulationData(prev => ({
            ...prev,
            installmentType: value
          }));
          break;
        case 'contemplationMonth':
          // Atualizar contemplationMonth no contexto
          break;
        case 'adminTaxPercent':
          setAdminTaxPercent(value);
          setIsAdminTaxCustomized(true);
          break;
        case 'reserveFundPercent':
          setReserveFundPercent(value);
          setIsReserveFundCustomized(true);
          break;
        case 'isAdminTaxCustomized':
          setIsAdminTaxCustomized(value);
          break;
        case 'isReserveFundCustomized':
          setIsReserveFundCustomized(value);
          break;
      }
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
  const [annualUpdateRate, setAnnualUpdateRate] = useState<number | undefined>(undefined);
  const [isAdminTaxCustomized, setIsAdminTaxCustomized] = useState<boolean>(false);
  const [isReserveFundCustomized, setIsReserveFundCustomized] = useState<boolean>(false);
  const [isAnnualUpdateCustomized, setIsAnnualUpdateCustomized] = useState<boolean>(false);
  
  // Adicionar estado para armazenar dados da administradora
  const [administratorData, setAdministratorData] = useState<any>(null);
  
  // Estado para controlar recálculo automático
  const [shouldRecalculateCredit, setShouldRecalculateCredit] = useState<boolean>(false);

  // Adicionar estados para os valores da primeira linha da tabela
  const [firstRowCredit, setFirstRowCredit] = useState<number | undefined>(undefined);
  const [firstRowInstallmentValue, setFirstRowInstallmentValue] = useState<number | undefined>(undefined);
  
  // Resetar flag de recálculo após execução
  useEffect(() => {
    if (shouldRecalculateCredit) {
      // Aguardar um pouco para garantir que o recálculo foi executado
      const timer = setTimeout(() => {
        setShouldRecalculateCredit(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [shouldRecalculateCredit]);

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

  // Estado para embutido - agora usando o contexto global
  const embutido = simulatorContext.embutido;
  const setEmbutido = simulatorContext.setEmbutido;

  // Estado para armazenar o valor de crédito acessado da contemplação e outros dados
  const [creditoAcessadoContemplacao, setCreditoAcessadoContemplacao] = useState<number>(0);
  const [parcelaAfterContemplacao, setParcelaAfterContemplacao] = useState<number>(0);
  const [somaParcelasAteContemplacao, setSomaParcelasAteContemplacao] = useState<number>(0);
  const [mesContemplacao, setMesContemplacao] = useState<number>(0);

  // Funções do menu lateral
  const handleNavigate = (section: string) => {
    const refs = {
      settings: creditSectionRef,
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
      // Mostrar todas as seções
      setVisibleSections({
        credit: true,
        leverage: true,
        detail: true,
        capital: true
      });
      setSectionsHiddenByDoubleClick(null);
    } else {
      // Mapeamento das seções do menu para as seções da página
      const sectionMap = {
        settings: 'credit',
        home: 'leverage',
        dollar: 'capital',
        search: 'detail'
      };

      const targetSection = sectionMap[section as keyof typeof sectionMap];
      
      if (targetSection) {
        // Isolar apenas a seção selecionada conforme especificação
        if (section === 'settings') {
          // Engrenagem: oculta Ganho de Capital, Alavancagem patrimonial, Gráfico e Detalhamento
          setVisibleSections({
            credit: true, // Mantém configurações
            leverage: false, // Oculta alavancagem patrimonial
            detail: false, // Oculta detalhamento do consórcio
            capital: false // Oculta ganho de capital
          });
        } else if (section === 'home') {
          // Casinha: oculta Montagem de cotas, Ganho de Capital e Detalhamento
          setVisibleSections({
            credit: false, // Oculta montagem de cotas
            leverage: true, // Mantém alavancagem patrimonial
            detail: false, // Oculta detalhamento do consórcio
            capital: false // Oculta ganho de capital
          });
        } else if (section === 'dollar') {
          // Cifrão: oculta Montagem de cotas, Alavancagem patrimonial, Gráfico e Detalhamento
          setVisibleSections({
            credit: false, // Oculta montagem de cotas
            leverage: false, // Oculta alavancagem patrimonial
            detail: false, // Oculta detalhamento do consórcio
            capital: true // Mantém ganho de capital
          });
        } else if (section === 'search') {
          // Lupa: oculta Montagem de cotas, Ganho de Capital, Alavancagem patrimonial e Gráfico
          setVisibleSections({
            credit: false, // Oculta montagem de cotas
            leverage: false, // Oculta alavancagem patrimonial
            detail: true, // Mantém detalhamento do consórcio
            capital: false // Oculta ganho de capital
          });
        }
        setSectionsHiddenByDoubleClick(targetSection);
      }
    }
  };



  // Estado para o ROI da operação
  const [roiOperacao, setRoiOperacao] = useState<number | null>(null);

  // Debug do ROI
  useEffect(() => {
  }, [roiOperacao]);

  // Estado para o Ágio (%) global
  const [agioPercent, setAgioPercent] = useState(17);

  const { user, companyId } = useCrmAuth();

  // Carregar configurações salvas do usuário ao abrir o simulador
  useEffect(() => {
    async function loadUserSimulatorConfig() {
      if (!user?.id || !companyId) return;
      const { data: configs } = await supabase
        .from('simulator_configurations')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .limit(1);
      if (configs && configs.length > 0) {
        const conf = configs[0].configuration || {};
        setLocalSimulationData(prev => ({
          ...prev,
          searchType: conf.searchType || prev.searchType,
          value: conf.value || prev.value,
          term: conf.term || prev.term,
          installmentType: conf.installmentType || prev.installmentType,
          contemplationMonth: conf.contemplationMonth || prev.contemplationMonth,
          administrator: conf.administratorId || prev.administrator,
          consortiumType: conf.creditType || prev.consortiumType,
          bidType: conf.bidType || prev.bidType,
        }));
        if (conf.adminTaxPercent !== undefined) setAdminTaxPercent(conf.adminTaxPercent);
        if (conf.reserveFundPercent !== undefined) setReserveFundPercent(conf.reserveFundPercent);
        if (conf.annualUpdateRate !== undefined) setAnnualUpdateRate(conf.annualUpdateRate);
        if (conf.isAdminTaxCustomized !== undefined) setIsAdminTaxCustomized(conf.isAdminTaxCustomized);
        if (conf.isReserveFundCustomized !== undefined) setIsReserveFundCustomized(conf.isReserveFundCustomized);
        if (conf.isAnnualUpdateCustomized !== undefined) setIsAnnualUpdateCustomized(conf.isAnnualUpdateCustomized);
        if (conf.agioPercent !== undefined) setAgioPercent(conf.agioPercent);
        if (conf.embutido !== undefined) setEmbutido(conf.embutido);
        
        // Atualizar o contexto global do simulador
        if (typeof window !== 'undefined' && (window as any).simulatorContext && (window as any).simulatorContext.setSimulationData) {
          (window as any).simulatorContext.setSimulationData((prev: any) => ({
            ...prev,
            mode: conf.searchType === 'contribution' ? 'aporte' : 'credito',
            value: conf.value || prev.value,
            installments: conf.term || prev.installments,
            installmentType: conf.installmentType || prev.installmentType,
            contemplationMonth: conf.contemplationMonth || prev.contemplationMonth,
            administrator: conf.administratorId || prev.administrator,
            consortiumType: conf.creditType || prev.consortiumType,
            bidType: conf.bidType || prev.bidType,
          }));
        }
        
        // Carregar dados da administradora se houver administratorId
        if (conf.administratorId) {
          await loadAdministratorData(conf.administratorId);
        }
      }
    }
    loadUserSimulatorConfig();
  }, [user?.id, companyId]);

  // Função para carregar dados da administradora do banco
  const loadAdministratorData = async (administratorId: string) => {
    try {
      const { data, error } = await supabase
        .from('administrators')
        .select('*')
        .eq('id', administratorId)
        .eq('is_archived', false)
        .limit(1);
      
      if (!error && data && data.length > 0) {
        const adminData = data[0];
        
        // Mapear dados do banco para a interface Administrator
        const mappedAdministrator = {
          id: adminData.id,
          name: adminData.name,
          updateIndex: adminData.credit_update_type === 'annual' ? 'INCC' : 'IPCA',
          updateMonth: adminData.update_month || 8,
          updateGracePeriod: adminData.grace_period_days || 90,
          maxEmbeddedPercentage: adminData.max_embedded_percentage || 25,
          // Dados adicionais para cálculos
          administrationRate: (adminData.admin_tax_percent || 0) / 100,
          inccRate: 6, // Taxa INCC padrão
          postContemplationAdjustment: adminData.post_contemplation_adjustment || 0,
          availableBidTypes: []
        };
        
        setAdministratorData(mappedAdministrator);
        
      }
    } catch (error) {
      console.error('Erro ao carregar dados da administradora:', error);
    }
  };

  // Carregar dados da administradora quando o administratorId mudar
  useEffect(() => {
    if (localSimulationData.administrator) {
      loadAdministratorData(localSimulationData.administrator);
    } else {
      // console.log('[NewSimulatorLayout] Nenhuma administradora selecionada');
    }
  }, [localSimulationData.administrator]);

  return (
    <div className="flex flex-col gap-4 h-full relative w-full max-w-full">
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
            data={{
              ...localSimulationData,
              adminTaxPercent: adminTaxPercent,
              reserveFundPercent: reserveFundPercent,
              isAdminTaxCustomized,
              isReserveFundCustomized,
              annualUpdateRate: annualUpdateRate
            }}
            onCreditoAcessado={setCreditoAcessado}
            onSelectedCreditsChange={setSelectedCredits}
            firstRowCredit={firstRowCredit}
            firstRowInstallmentValue={firstRowInstallmentValue}
            shouldRecalculateCredit={shouldRecalculateCredit}
            embutido={embutido}
            setEmbutido={setEmbutido}
          />
        </div>
      )}



      {/* Seção de Ganho de Capital */}
      {(visibleSections.capital && (roiOperacao === null || roiOperacao >= 10)) && (
        <div ref={capitalSectionRef} id="ganho-capital" className="w-full">
          <CapitalGainSection 
            creditoAcessado={creditoAcessado}
            contemplationMonth={localSimulationData.contemplationMonth || 60}
            installmentType={localSimulationData.installmentType}
            product={{ nominalCreditValue: localSimulationData.value, termMonths: termValue }}
            administrator={administratorData || { 
              administrationRate: 0.27,
              updateMonth: 8,
              gracePeriodDays: 90,
              inccRate: 6,
              postContemplationAdjustment: 0.5,
              maxEmbeddedPercentage: 25
            }}
            embutido={embutido}
            selectedCredits={selectedCredits}
            customAnnualUpdateRate={annualUpdateRate}
            agioPercent={agioPercent}
            setAgioPercent={setAgioPercent}
            onRoiChange={setRoiOperacao}
          />
        </div>
      )}

      {/* Seção de Nova Alavancagem Patrimonial */}
      {visibleSections.leverage && (firstRowCredit > 0) && (
        <div id="alavancagem-patrimonial" className="w-full">
          <NovaAlavancagemPatrimonial 
            product={{ nominalCreditValue: firstRowCredit, termMonths: termValue }}
            administrator={administratorData || { 
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
            installmentType={localSimulationData.installmentType} // Voltar a ser dinâmico
            customAdminTaxPercent={adminTaxPercent}
            customReserveFundPercent={reserveFundPercent}
            customAnnualUpdateRate={annualUpdateRate}
            maxEmbeddedPercentage={25}
            creditoAcessadoContemplacao={creditoAcessadoContemplacao}
            parcelaAfterContemplacao={parcelaAfterContemplacao}
            somaParcelasAteContemplacao={somaParcelasAteContemplacao}
            mesContemplacao={mesContemplacao}
            parcelaInicial={firstRowInstallmentValue || 0}
            prazoTotal={termValue}
          />
        </div>
      )}

      {/* Seção de Detalhamento removida - tabela DetailTable agora está apenas no componente NovaAlavancagemPatrimonial */}
      {/* IMPORTANTE: Callback invisível para capturar dados da primeira linha mesmo sem mostrar a tabela aqui */}
      {visibleSections.detail && (
        <div style={{ display: 'none' }}>
          <DetailTable 
            product={{ nominalCreditValue: localSimulationData.value, termMonths: termValue }}
            administrator={administratorData || { 
              administrationRate: 0.27,
              updateMonth: 8,
              gracePeriodDays: 90,
              inccRate: 6,
              postContemplationAdjustment: 0.5,
              maxEmbeddedPercentage: 25
            }}
            contemplationMonth={localSimulationData.contemplationMonth || 60}
            selectedCredits={selectedCredits}
            creditoAcessado={creditoAcessado || localSimulationData.value}
            embutido={embutido}
            installmentType={localSimulationData.installmentType}
            customAdminTaxPercent={adminTaxPercent}
            customReserveFundPercent={reserveFundPercent}
            customAnnualUpdateRate={annualUpdateRate}
            agioPercent={agioPercent}
            onFirstRowData={(data) => {
              setFirstRowCredit(data.credit);
              setFirstRowInstallmentValue(data.installmentValue);
            }}
            onContemplationRowData={(data) => {
              setCreditoAcessadoContemplacao(data.creditAccessed);
              setParcelaAfterContemplacao(data.parcelaAfter);
              setSomaParcelasAteContemplacao(data.somaParcelasAteContemplacao);
              setMesContemplacao(data.mesContemplacao);
            }}
            onTableDataGenerated={(tableData) => {
              // Callback para dados da tabela (pode ser usado para outros componentes)
            }}
          />
        </div>
      )}



      {/* Modal de configurações */}
      <SimulatorConfigModal
        open={simulatorContext.showConfigModal}
        onClose={() => simulatorContext.setShowConfigModal(false)}
        onApply={() => simulatorContext.setShowConfigModal(false)}
        onSaveAndApply={(config?: any) => {
          // Se config foi passada, atualizar os valores customizados
          if (config) {
            
            let hasTaxChanges = false;
            
            if (config.adminTaxPercent !== undefined) {
              setAdminTaxPercent(config.adminTaxPercent);
              setIsAdminTaxCustomized(config.isAdminTaxCustomized || false);
            }
            if (config.reserveFundPercent !== undefined) {
              setReserveFundPercent(config.reserveFundPercent);
              setIsReserveFundCustomized(config.isReserveFundCustomized || false);
            }
            if (config.annualUpdateRate !== undefined) {
              setAnnualUpdateRate(config.annualUpdateRate);
              setIsAnnualUpdateCustomized(config.isAnnualUpdateCustomized || false);
            }
            if (config.agioPercent !== undefined) {
              setAgioPercent(config.agioPercent);
            }
            
            // Se houve mudança nas taxas, ativar recálculo automático
            if (hasTaxChanges) {
              setShouldRecalculateCredit(true);
            }
          }
          simulatorContext.setShowConfigModal(false);
        }}
        onReset={() => {}}
        // Props para sincronização de filtros principais
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
        agioPercent={agioPercent}
        setAgioPercent={setAgioPercent}
        administratorId={localSimulationData.administrator}
        setAdministratorId={v => handleFieldChange('administrator', v)}
      />
    </div>
  );
};
