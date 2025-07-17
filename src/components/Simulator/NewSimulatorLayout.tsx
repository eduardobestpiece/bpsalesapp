
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

export const NewSimulatorLayout = ({ manualTerm }: { manualTerm?: number }) => {
  const { 
    simulationData, 
    setSimulationData,
    updateSimulationMode,
    updateSimulationValue,
    updateInstallments,
    updateInstallmentType
  } = useSimulatorSync();
  
  // Estado principal dos dados da simulação - mantido para compatibilidade
  const [localSimulationData, setLocalSimulationData] = useState({
    administrator: '',
    consortiumType: 'property' as 'property' | 'vehicle',
    installmentType: 'full',
    value: 0,
    term: 120,
    updateRate: 6,
    searchType: 'contribution' as 'contribution' | 'credit',
    bidType: '',
  });

  // Estados para o menu lateral
  const [visibleSections, setVisibleSections] = useState({
    credit: true,
    leverage: true,
    detail: true
  });

  // Refs para navegação
  const creditSectionRef = useRef<HTMLDivElement>(null);
  const leverageSectionRef = useRef<HTMLDivElement>(null);
  const detailSectionRef = useRef<HTMLDivElement>(null);

  // Estado para campos fixos no topo - agora baseado na posição dos campos originais
  const [isFieldsFixed, setIsFieldsFixed] = useState(false);

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
    }
  };

  // Função para acompanhar a rolagem - agora baseada na posição dos campos originais
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      
      // Verificar se passou dos campos originais (aproximadamente 200px)
      setIsFieldsFixed(scrollTop > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
        const { data: installments } = await supabase
          .from('installment_types')
          .select('*')
          .eq('administrator_id', adminId)
          .eq('is_archived', false)
          .order('installment_count');
        setInstallmentTypes(installments || []);
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

  // Buscar reduções de parcela da administradora selecionada
  useEffect(() => {
    async function fetchReducoes() {
      // Corrigido: só busca se administrator for válido
      if (!localSimulationData.administrator || localSimulationData.administrator === '' || localSimulationData.administrator === null) {
        setReducoesParcela([]);
        return;
      }
      const { data: reducoes } = await supabase
        .from('installment_reductions')
        .select('id, name')
        .eq('administrator_id', localSimulationData.administrator)
        .eq('is_archived', false);
      setReducoesParcela(reducoes || []);
    }
    fetchReducoes();
  }, [localSimulationData.administrator]);

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

  // Se houver valor manual vindo do modal, ele se sobrepõe
  const termValue = manualTerm !== undefined && manualTerm !== null ? manualTerm : localSimulationData.term;

  // Estado para crédito acessado
  const [creditoAcessado, setCreditoAcessado] = useState<number | null>(null);

  // Funções do menu lateral
  const handleNavigate = (section: string) => {
    const refs = {
      settings: creditSectionRef,
      home: leverageSectionRef,
      search: detailSectionRef
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
        detail: true
      });
    } else {
      const sectionMap = {
        settings: 'credit',
        home: 'leverage',
        search: 'detail'
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

  // Componente dos campos de configuração (reutilizável)
  const ConfigurationFields = ({ className = "" }: { className?: string }) => (
    <div className={`bg-card rounded-2xl shadow border border-border p-3 md:p-4 w-full ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 items-end">
        <div className="flex flex-col gap-2">
          <label className="font-medium text-sm text-foreground">Modalidade</label>
          <Select value={localSimulationData.searchType} onValueChange={v => handleFieldChange('searchType', v === 'contribution' ? 'contribution' : 'credit')}>
            <SelectTrigger className="text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contribution">Aporte</SelectItem>
              <SelectItem value="credit">Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-sm text-foreground">
            {localSimulationData.searchType === 'contribution' ? 'Valor do aporte' : 'Valor do crédito'}
          </label>
          <Input
            type="number"
            value={localSimulationData.value || ''}
            onChange={e => handleFieldChange('value', e.target.value ? Number(e.target.value) : 0)}
            placeholder="0,00"
            className="text-sm h-9"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-sm text-foreground">Número de parcelas</label>
          <Select
            value={termValue.toString()}
            onValueChange={v => handleTermChange(Number(v))}
          >
            <SelectTrigger className="text-sm h-9">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {installmentTypes.map((it: any) => (
                <SelectItem key={it.id} value={it.installment_count.toString()}>
                  {it.installment_count}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-sm text-foreground">Tipo de Parcela</label>
          <Select value={localSimulationData.installmentType} onValueChange={v => handleFieldChange('installmentType', v)}>
            <SelectTrigger className="text-sm h-9">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Parcela Cheia</SelectItem>
              {reducoesParcela.map((red: any) => (
                <SelectItem key={red.id} value={red.id}>{red.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowConfigModal(true)}
            className="h-9 w-full sm:w-auto"
          >
            <Settings className="w-4 h-4 mr-2" />
            <span className="sm:hidden">Configurações</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 h-full relative w-full">
      {/* Menu Lateral Fixo à Direita - Ajustado para padrões da plataforma */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
        <div className="bg-primary-600 dark:bg-[#A86F57] rounded-2xl shadow-xl border border-primary-200 dark:border-[#A86F57]/30 p-3">
          <div className="flex flex-col space-y-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 p-0 text-white hover:text-primary-100 dark:hover:text-white hover:bg-primary-700 dark:hover:bg-[#8B5A47] transition-all duration-200 hover:scale-105 rounded-xl"
              onClick={() => handleNavigate('settings')}
              title="Configurações"
            >
              <Settings size={20} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 p-0 text-white hover:text-primary-100 dark:hover:text-white hover:bg-primary-700 dark:hover:bg-[#8B5A47] transition-all duration-200 hover:scale-105 rounded-xl"
              onClick={() => handleNavigate('home')}
              title="Alavancagem"
            >
              <Home size={20} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 p-0 text-white hover:text-primary-100 dark:hover:text-white hover:bg-primary-700 dark:hover:bg-[#8B5A47] transition-all duration-200 hover:scale-105 rounded-xl"
              title="Financeiro"
            >
              <DollarSign size={20} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 p-0 text-white hover:text-primary-100 dark:hover:text-white hover:bg-primary-700 dark:hover:bg-[#8B5A47] transition-all duration-200 hover:scale-105 rounded-xl"
              title="Performance"
            >
              <TrendingUp size={20} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 p-0 text-white hover:text-primary-100 dark:hover:text-white hover:bg-primary-700 dark:hover:bg-[#8B5A47] transition-all duration-200 hover:scale-105 rounded-xl"
              title="Histórico"
            >
              <Clock size={20} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 p-0 text-white hover:text-primary-100 dark:hover:text-white hover:bg-primary-700 dark:hover:bg-[#8B5A47] transition-all duration-200 hover:scale-105 rounded-xl"
              onClick={() => handleNavigate('search')}
              title="Detalhamento"
            >
              <Search size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Campos de configuração fixos no topo quando rolar */}
      {isFieldsFixed && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm">
          <div className="w-full px-2 md:px-4 lg:px-6 py-2 md:py-3 overflow-x-hidden">
            <ConfigurationFields className="!p-2 md:!p-3 !rounded-lg !shadow-sm" />
          </div>
        </div>
      )}

      {/* Bloco de campos dinâmicos acima do resultado */}
      {visibleSections.credit && (
        <div ref={creditSectionRef} className={`${isFieldsFixed ? 'pt-20 md:pt-24' : ''} w-full overflow-x-hidden`}>
          <ConfigurationFields />
        </div>
      )}

      {/* Seção de Crédito Acessado */}
      {visibleSections.credit && (
        <div className="w-full overflow-x-hidden">
          <CreditAccessPanel data={localSimulationData} onCreditoAcessado={setCreditoAcessado} />
        </div>
      )}

      {/* Seção de Alavancagem Patrimonial - Entre crédito acessado e detalhamento */}
      {visibleSections.leverage && (
        <div ref={leverageSectionRef} className="w-full overflow-x-hidden">
          <PatrimonialLeverageNew simulationData={localSimulationData} creditoAcessado={creditoAcessado} />
        </div>
      )}

      {/* Seção de Detalhamento */}
      {visibleSections.detail && (
        <div ref={detailSectionRef} className="w-full overflow-x-hidden">
          <DetailTable 
            product={{ nominalCreditValue: localSimulationData.value, termMonths: termValue }}
            administrator={{ administrationRate: 0.27 }}
            contemplationMonth={12}
          />
        </div>
      )}

      {/* Modal de configurações */}
      <SimulatorConfigModal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onApply={() => setShowConfigModal(false)}
        onSaveAndApply={() => setShowConfigModal(false)}
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
      />
    </div>
  );
};
