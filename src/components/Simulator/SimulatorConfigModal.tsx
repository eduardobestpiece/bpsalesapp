import React, { useState, useEffect } from 'react';
import { FullScreenModal } from '../ui/FullScreenModal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from '../ui/use-toast';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useSimulatorContext } from '@/components/Layout/SimulatorLayout';

interface SimulatorConfigModalProps {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  onSaveAndApply: (config: Record<string, unknown>) => void;
  onReset: () => void;
  // Props para sincronização com o header
  searchType: string;
  setSearchType: (v: string) => void;
  value: number;
  setValue: (v: number) => void;
  term: number;
  setTerm: (v: number) => void;
  installmentType: string;
  setInstallmentType: (v: string) => void;
  contemplationMonth?: number;
  setContemplationMonth?: (v: number) => void;
  agioPercent: number;
  setAgioPercent: (v: number) => void;
  administratorId: string | null;
  setAdministratorId: (v: string) => void;
}

type Administrator = Database['public']['Tables']['administrators']['Row'];
type InstallmentType = Database['public']['Tables']['installment_types']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

export const SimulatorConfigModal: React.FC<SimulatorConfigModalProps> = ({
  open,
  onClose,
  onApply,
  onSaveAndApply,
  onReset,
  searchType,
  setSearchType,
  value,
  setValue,
  term,
  setTerm,
  installmentType,
  setInstallmentType,
  contemplationMonth = 6,
  setContemplationMonth,
  agioPercent,
  setAgioPercent,
  administratorId,
  setAdministratorId,
}) => {
  const { user, crmUser, companyId } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const simCtx = useSimulatorContext();
  
  // Estados locais para os campos
  const [localSearchType, setLocalSearchType] = useState(searchType);
  const [localValue, setLocalValue] = useState(value);
  const [localTerm, setLocalTerm] = useState(term);
  const [localInstallmentType, setLocalInstallmentType] = useState(installmentType);
  const [localContemplationMonth, setLocalContemplationMonth] = useState(contemplationMonth);
  const [localAdminTaxPercent, setLocalAdminTaxPercent] = useState<number>(0);
  const [localReserveFundPercent, setLocalReserveFundPercent] = useState<number>(0);
  const [localAnnualUpdateRate, setLocalAnnualUpdateRate] = useState<number>(6);
  const [isAdminTaxCustomized, setIsAdminTaxCustomized] = useState<boolean>(false);
  const [isReserveFundCustomized, setIsReserveFundCustomized] = useState<boolean>(false);
  const [isAnnualUpdateCustomized, setIsAnnualUpdateCustomized] = useState<boolean>(false);
  // Adicionar estado local para Ágio (%)
  const [localAgioPercent, setLocalAgioPercent] = useState<number>(agioPercent);
  // Administradora sincronizada
  const [selectedAdministratorId, setSelectedAdministratorIdLocal] = useState<string | null>(administratorId);

  // Dados do banco
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [installmentTypes, setInstallmentTypes] = useState<InstallmentType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reducoesParcela, setReducoesParcela] = useState<Array<{ id: string; name: string }>>([]);

  // Estados selecionados
  const [selectedCreditType, setSelectedCreditType] = useState<string | null>(null);

  // Controle de mudanças
  const [hasChanges, setHasChanges] = useState(false);

  // Sincronizar estados locais com props quando modal abrir
  useEffect(() => {
    if (open) {
      // Definir valores padrão se não estiverem definidos
      const defaultSearchType = searchType || 'contribution';
      const defaultValue = value || 0;
      const defaultTerm = term || 120;
      const defaultInstallmentType = installmentType || 'full';
      const defaultContemplationMonth = contemplationMonth || 6;
      
      setLocalSearchType(defaultSearchType);
      setLocalValue(defaultValue);
      setLocalTerm(defaultTerm);
      setLocalInstallmentType(defaultInstallmentType);
      setLocalContemplationMonth(defaultContemplationMonth);
      setLocalAgioPercent(agioPercent);
      setSelectedAdministratorIdLocal(administratorId);
      setHasChanges(false);
    }
  }, [open, searchType, value, term, installmentType, contemplationMonth, agioPercent, administratorId]);

  // Detectar mudanças
  useEffect(() => {
    const changed = 
      localSearchType !== searchType ||
      localValue !== value ||
      localTerm !== term ||
      localInstallmentType !== installmentType ||
      localContemplationMonth !== contemplationMonth ||
      localAgioPercent !== agioPercent ||
      selectedAdministratorId !== administratorId;
    
    setHasChanges(changed);
  }, [localSearchType, localValue, localTerm, localInstallmentType, localContemplationMonth, localAgioPercent, selectedAdministratorId, searchType, value, term, installmentType, contemplationMonth, agioPercent, administratorId]);

  // Ao mudar administradora local, propagar para global
  useEffect(() => {
    if (selectedAdministratorId) {
      setAdministratorId(selectedAdministratorId);
    }
  }, [selectedAdministratorId]);

  // Buscar administradoras
  useEffect(() => {
    if (!open || !selectedCompanyId) return;
    
    const fetchAdministrators = async () => {
      const { data, error } = await supabase
        .from('administrators')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .eq('is_archived', false)
        .order('name');
      
      if (!error && data) {
        setAdministrators(data);
        // Usar a administradora salva pelo usuário, ou a padrão se não houver
        const savedAdmin = data.find(a => a.id === selectedAdministratorId);
        const defaultAdmin = data.find(a => a.is_default) || data[0];
        const adminToSelect = savedAdmin || defaultAdmin;
        if (adminToSelect) {
          setSelectedAdministratorIdLocal(adminToSelect.id);
        }
      }
    };
    
    fetchAdministrators();
  }, [open, selectedCompanyId]);

  // Buscar tipos de parcelas
  useEffect(() => {
    if (!selectedAdministratorId) return;
    
    const fetchInstallmentTypes = async () => {
      if (!selectedAdministratorId || selectedAdministratorId.trim() === '') return;
      
      const { data, error } = await supabase
        .from('installment_types')
        .select('*')
        .eq('administrator_id', selectedAdministratorId)
        .eq('is_archived', false)
        .order('installment_count');
      
      if (!error && data) {
        setInstallmentTypes(data);
        // Definir número de parcelas padrão se não estiver definido
        if (data.length > 0 && !localTerm) {
          const defaultTerm = data.find(it => it.is_default) || data[0];
          setLocalTerm(defaultTerm.installment_count);
        }
      }
    };
    
      fetchInstallmentTypes();
  }, [selectedAdministratorId, localTerm]);

  // Buscar produtos
  useEffect(() => {
    if (!selectedAdministratorId) return;
    
    const fetchProducts = async () => {
      if (!selectedAdministratorId || selectedAdministratorId.trim() === '') return;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('administrator_id', selectedAdministratorId)
        .eq('is_archived', false);
      
      if (!error && data) {
        setProducts(data);
        // Definir tipo de crédito padrão
        if (data.length > 0) {
          const defaultProduct = data.find(p => p.is_default) || data[0];
          setSelectedCreditType(defaultProduct.type);
        }
      }
    };
    
    fetchProducts();
  }, [selectedAdministratorId]);

  // Buscar reduções de parcela
  useEffect(() => {
    if (!selectedAdministratorId || !selectedCompanyId) return;
    
    const fetchReducoesParcela = async () => {
      if (!selectedAdministratorId || selectedAdministratorId.trim() === '') return;
      
      const { data, error } = await supabase
        .from('installment_reductions')
        .select('id, name')
        .eq('administrator_id', selectedAdministratorId)
        .eq('company_id', selectedCompanyId)
        .eq('is_archived', false);
      
      if (!error && data) {
        setReducoesParcela(data);
        // Definir tipo de parcela padrão se não estiver definido
        if (data.length > 0 && !localInstallmentType) {
          const defaultReduction = data.find(r => r.is_default) || data[0];
          setLocalInstallmentType(defaultReduction.id);
        }
      }
    };
    
    fetchReducoesParcela();
  }, [selectedAdministratorId, selectedCompanyId, localInstallmentType]);

  // Buscar valores da parcela selecionada (taxa de administração, fundo de reserva e atualização anual)
  useEffect(() => {
    if (!selectedAdministratorId || !localTerm) return;
    
    const fetchInstallmentDetails = async () => {
      if (!selectedAdministratorId || selectedAdministratorId.trim() === '') return;
      
      const { data, error } = await supabase
        .from('installment_types')
        .select('admin_tax_percent, reserve_fund_percent, annual_update_rate')
        .eq('administrator_id', selectedAdministratorId)
        .eq('installment_count', localTerm)
        .eq('is_archived', false)
        .limit(1);
      
      if (!error && data && data.length > 0) {
        const installment = data[0];
        
        // Só atualizar se não foram customizados pelo usuário
        if (!isAdminTaxCustomized) {
          setLocalAdminTaxPercent(installment.admin_tax_percent || 0);
        }
        if (!isReserveFundCustomized) {
          setLocalReserveFundPercent(installment.reserve_fund_percent || 0);
        }
        if (!isAnnualUpdateCustomized) {
          setLocalAnnualUpdateRate(installment.annual_update_rate || 6);
        }
      } else {
        if (!isAdminTaxCustomized) {
          setLocalAdminTaxPercent(0);
        }
        if (!isReserveFundCustomized) {
          setLocalReserveFundPercent(0);
        }
        if (!isAnnualUpdateCustomized) {
          setLocalAnnualUpdateRate(6);
        }
      }
    };
    
    fetchInstallmentDetails();
  }, [selectedAdministratorId, localTerm, isAdminTaxCustomized, isReserveFundCustomized, isAnnualUpdateCustomized]);

  // Definir tipos de crédito baseado nos produtos
  const creditTypes = Array.from(new Set(products.map(p => p.type))).filter(Boolean);
  
  // Função para traduzir tipos de crédito
  const translateCreditType = (type: string) => {
    const translations: { [key: string]: string } = {
      'property': 'Imóvel',
      'car': 'Carro',
      'residential': 'Residencial',
      'commercial': 'Comercial',
      'land': 'Terreno',
    };
    return translations[type] || type;
  };

  // Função para aplicar mudanças
  const handleApply = () => {
    console.debug('[Sim/ConfigModal] Aplicar acionado');
    
    setSearchType(localSearchType);
    
    setValue(localValue);
    
    setTerm(localTerm);
    
    setInstallmentType(localInstallmentType);
    
    if (setContemplationMonth) {
      setContemplationMonth(localContemplationMonth);
    }

    setAgioPercent(localAgioPercent);
    setAdministratorId(selectedAdministratorId || '');
    
    // Aplicar no contexto global do simulador diretamente
    simCtx.setSimulationData((prev: any) => ({
      ...prev,
      searchType: localSearchType,
      value: localValue,
      term: localTerm,
      installmentType: localInstallmentType,
      contemplationMonth: localContemplationMonth,
    }));

    toast({ title: 'Configurações aplicadas!' });
    onApply();
  };

  // Função para salvar e aplicar
  const handleSaveAndApply = async () => {
    console.debug('[Sim/ConfigModal] Salvar e Aplicar acionado');
    try {
      
      // Montar snapshot de configuração
      const config = {
        searchType: localSearchType,
        value: localValue,
        term: localTerm,
        installmentType: localInstallmentType,
        contemplationMonth: localContemplationMonth,
        administratorId: selectedAdministratorId,
        creditType: selectedCreditType,
        adminTaxPercent: localAdminTaxPercent,
        reserveFundPercent: localReserveFundPercent,
        annualUpdateRate: localAnnualUpdateRate,
        isAdminTaxCustomized,
        isReserveFundCustomized,
        isAnnualUpdateCustomized,
        agioPercent: localAgioPercent,
        // Novos campos do modal
        administratorName: administrators.find(a => a.id === selectedAdministratorId)?.name || '',
        creditTypeLabel: selectedCreditType ? translateCreditType(selectedCreditType) : '',
        installmentTypeLabel: localInstallmentType === 'full' ? 'Parcela Cheia' : reducoesParcela.find(r => r.id === localInstallmentType)?.name || '',
        aporteValue: localValue, // Valor do aporte
        // Inclusões: embutido e leverageConfig completos
        embutido: simCtx.embutido,
        leverageConfig: simCtx.leverageConfig || null,
      } as any;

      console.debug('[Sim/ConfigModal] snapshot ->', config);

      // APICAR IMEDIATAMENTE NA UI E FECHAR MODAL
      setSearchType(config.searchType);
      setValue(config.value);
      setTerm(config.term);
      setInstallmentType(config.installmentType);
      if (setContemplationMonth) setContemplationMonth(config.contemplationMonth);
      setAgioPercent(localAgioPercent);
      setAdministratorId(selectedAdministratorId || '');

      // Atualizar o contexto global do simulador diretamente
      simCtx.setSimulationData((prev: any) => ({
        ...prev,
        searchType: config.searchType,
        value: config.value,
        term: config.term,
        installmentType: config.installmentType,
        contemplationMonth: config.contemplationMonth,
      }));
      if (simCtx.setLeverageConfig) simCtx.setLeverageConfig(config.leverageConfig || undefined);
      if (simCtx.setEmbutido) simCtx.setEmbutido(config.embutido || 'com');

      // Chamar o callback do pai (fecha o modal)
      if (onSaveAndApply) {
        onSaveAndApply(config);
      }

      // SALVAR EM SEGUNDO PLANO (sem travar UI)
      const effectiveCompanyId = companyId;
      if (!effectiveCompanyId) {
        console.warn('[SimulatorConfigModal] companyId ausente ao salvar');
      } else {
        // Usar SEMPRE o crmUser.id, pois o FK referencia crm_users.id
        const uid = crmUser?.id;
        if (!uid) {
          console.warn('[SimulatorConfigModal] uid (crmUser.id) ausente ao salvar');
        } else {
          console.log('[SimulatorConfigModal] Salvando snapshot (async):', { uid, companyId: effectiveCompanyId, config });
          const { error: upsertError } = await supabase
            .from('simulator_configurations')
            .upsert(
              [{ user_id: uid, company_id: effectiveCompanyId, configuration: config }],
              { onConflict: 'user_id,company_id' }
            );
          if (upsertError) {
            console.error('[SimulatorConfigModal] Erro no upsert:', upsertError);
            toast({ title: 'Erro ao salvar configurações', variant: 'destructive' });
          } else {
            console.log('[SimulatorConfigModal] Snapshot salvo com sucesso');
            toast({ title: 'Configurações salvas!' });
          }
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[SimulatorConfigModal] Exceção ao salvar/aplicar:', errorMessage);
      toast({ title: 'Erro inesperado!', description: errorMessage, variant: 'destructive' });
    }
  };

  // Função para resetar
  const handleReset = () => {
    setLocalSearchType(searchType);
    setLocalValue(value);
    setLocalTerm(term);
    setLocalInstallmentType(installmentType);
    setLocalContemplationMonth(contemplationMonth);
    toast({ title: 'Configurações redefinidas!' });
    onReset();
  };

  // Handlers com debug para inputs do modal
  const onChangeSearchType = (v: string) => { console.debug('[Sim/ConfigModal] searchType ->', v); setLocalSearchType(v); };
  const onChangeValue = (e: React.ChangeEvent<HTMLInputElement>) => { const val = Number(e.target.value); console.debug('[Sim/ConfigModal] value ->', val); setLocalValue(val); };
  const onChangeTerm = (v: string) => { const num = Number(v); console.debug('[Sim/ConfigModal] term ->', num); setLocalTerm(num); };
  const onChangeInstallmentType = (v: string) => { console.debug('[Sim/ConfigModal] installmentType ->', v); setLocalInstallmentType(v); };
  const onChangeContemplationMonth = (e: React.ChangeEvent<HTMLInputElement>) => { const num = Number(e.target.value); console.debug('[Sim/ConfigModal] contemplationMonth ->', num); setLocalContemplationMonth(num); };
  const onChangeAgio = (e: React.ChangeEvent<HTMLInputElement>) => { const num = Number(e.target.value); console.debug('[Sim/ConfigModal] agioPercent ->', num); setLocalAgioPercent(num); };
  const onChangeAdministrator = (v: string) => { console.debug('[Sim/ConfigModal] administratorId ->', v); setSelectedAdministratorIdLocal(v); };
  const onChangeCreditType = (v: string) => { console.debug('[Sim/ConfigModal] creditType ->', v); setSelectedCreditType(v); };
  const onChangeAdminTax = (e: React.ChangeEvent<HTMLInputElement>) => { const num = Number(e.target.value); console.debug('[Sim/ConfigModal] adminTaxPercent ->', num); setLocalAdminTaxPercent(num); setIsAdminTaxCustomized(true); };
  const onChangeReserveFund = (e: React.ChangeEvent<HTMLInputElement>) => { const num = Number(e.target.value); console.debug('[Sim/ConfigModal] reserveFundPercent ->', num); setLocalReserveFundPercent(num); setIsReserveFundCustomized(true); };
  const onChangeAnnualUpdate = (e: React.ChangeEvent<HTMLInputElement>) => { const num = Number(e.target.value); console.debug('[Sim/ConfigModal] annualUpdateRate ->', num); setLocalAnnualUpdateRate(num); setIsAnnualUpdateCustomized(true); };

  return (
    <FullScreenModal
      isOpen={open}
      onClose={onClose}
      title="Mais configurações"
      hasChanges={hasChanges}
      actions={
        <>
          {/* Removido botão Redefinir e Aplicar */}
          <Button onClick={handleSaveAndApply}>
            Salvar e Aplicar
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Linha 1: Administradora */}
          <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Administradora</label>
            <Select
              value={selectedAdministratorId || ''}
              onValueChange={onChangeAdministrator}
            >
            <SelectTrigger className="w-full bg-[#2A2A2A] border-gray-600 text-white hover:bg-[#3A3A3A] focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Selecione uma administradora..." />
              </SelectTrigger>
            <SelectContent className="bg-[#2A2A2A] border-gray-600">
                {administrators.map((admin) => (
                <SelectItem key={admin.id} value={admin.id} className="text-white hover:bg-[#3A3A3A]">
                  {admin.name}
                </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        {/* Linha 2: Tipo de Crédito */}
          <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Tipo de Crédito</label>
            <Select
              value={selectedCreditType || ''}
              onValueChange={onChangeCreditType}
            >
            <SelectTrigger className="w-full bg-[#2A2A2A] border-gray-600 text-white hover:bg-[#3A3A3A] focus:ring-2 focus:ring-blue-500">
              <SelectValue placeholder="Selecione um tipo de crédito..." />
              </SelectTrigger>
            <SelectContent className="bg-[#2A2A2A] border-gray-600">
                {creditTypes.map((type) => (
                <SelectItem key={type} value={type} className="text-white hover:bg-[#3A3A3A]">
                    {translateCreditType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        {/* Linha 3: Tipo de Parcela */}
          <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Tipo de Parcela</label>
            <Select
            value={localInstallmentType}
            onValueChange={onChangeInstallmentType}
            >
            <SelectTrigger className="w-full bg-[#2A2A2A] border-gray-600 text-white hover:bg-[#3A3A3A] focus:ring-2 focus:ring-blue-500">
              <SelectValue placeholder="Selecione o tipo de parcela..." />
              </SelectTrigger>
            <SelectContent className="bg-[#2A2A2A] border-gray-600">
              <SelectItem value="full" className="text-white hover:bg-[#3A3A3A]">
                Parcela Cheia
              </SelectItem>
              {reducoesParcela.map((reducao) => (
                <SelectItem key={reducao.id} value={reducao.id} className="text-white hover:bg-[#3A3A3A]">
                  {reducao.name}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>

        {/* Linha 4: Número de parcelas, Mês Contemplação e Ágio (%) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Número de parcelas */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Número de parcelas</label>
            <Select
              value={localTerm.toString()}
              onValueChange={onChangeTerm}
            >
              <SelectTrigger className="w-full bg-[#2A2A2A] border-gray-600 text-white hover:bg-[#3A3A3A] focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Selecione o número de parcelas..." />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-gray-600">
                {installmentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.installment_count.toString()} className="text-white hover:bg-[#3A3A3A]">
                    {type.installment_count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mês Contemplação */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Mês Contemplação</label>
            <Input
              type="number"
              value={localContemplationMonth}
              onChange={onChangeContemplationMonth}
              placeholder="6"
              min={1}
              className="w-full bg-[#2A2A2A] border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Ágio (%) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Ágio (%)</label>
            <Input
              type="number"
              value={localAgioPercent}
              onChange={onChangeAgio}
              placeholder="17"
              min={0}
              max={100}
              step={0.1}
              className="w-full bg-[#2A2A2A] border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Linha 5: Modalidade e Valor do aporte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Modalidade */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Modalidade</label>
            <Select
              value={localSearchType}
              onValueChange={onChangeSearchType}
            >
              <SelectTrigger className="w-full bg-[#2A2A2A] border-gray-600 text-white hover:bg-[#3A3A3A] focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Selecione a modalidade..." />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-gray-600">
                <SelectItem value="contribution" className="text-white hover:bg-[#3A3A3A]">
                  Aporte
                </SelectItem>
                <SelectItem value="credit" className="text-white hover:bg-[#3A3A3A]">
                  Crédito
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Valor do aporte */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Valor do aporte</label>
            <Input
              type="number"
              value={localValue}
              onChange={onChangeValue}
              placeholder="0,00"
              className="w-full bg-[#2A2A2A] border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Linha 6: Taxa de administração (%), Fundo de reserva (%) e Atualização anual (%) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Taxa de administração (%) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Taxa de administração (%)</label>
            <Input
              type="number"
              value={localAdminTaxPercent}
              onChange={onChangeAdminTax}
              placeholder="0,00"
              className="w-full bg-[#2A2A2A] border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fundo de reserva (%) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Fundo de reserva (%)</label>
            <Input
              type="number"
              value={localReserveFundPercent}
              onChange={onChangeReserveFund}
              placeholder="0,00"
              className="w-full bg-[#2A2A2A] border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Atualização anual (%) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Atualização anual (%)</label>
            <Input
              type="number"
              value={localAnnualUpdateRate}
              onChange={onChangeAnnualUpdate}
              placeholder="6,00"
              className="w-full bg-[#2A2A2A] border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </FullScreenModal>
  );
};