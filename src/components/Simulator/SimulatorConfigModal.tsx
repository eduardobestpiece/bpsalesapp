import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from '../ui/use-toast';
import { Tooltip } from '../ui/tooltip';
import { Info } from 'lucide-react';

interface SimulatorConfigModalProps {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  onSaveAndApply: () => void;
  onReset: () => void;
}

type Administrator = Database['public']['Tables']['administrators']['Row'];
type BidType = Database['public']['Tables']['bid_types']['Row'];
type InstallmentType = Database['public']['Tables']['installment_types']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

const manualFields = [
  'parcelas',
  'taxaAdministracao',
  'fundoReserva',
  'reducaoParcela',
  'atualizacaoAnual',
  'atualizacaoAnualCredito',
];

type ManualFieldsState = {
  parcelas: boolean;
  taxaAdministracao: boolean;
  fundoReserva: boolean;
  reducaoParcela: boolean;
  atualizacaoAnual: boolean;
  atualizacaoAnualCredito: boolean;
};

const initialManualFields: ManualFieldsState = {
  parcelas: false,
  taxaAdministracao: false,
  fundoReserva: false,
  reducaoParcela: false,
  atualizacaoAnual: false,
  atualizacaoAnualCredito: false,
};

// Opções para o campo de aplicação da redução de parcela
const applicationsOptions = [
  { value: 'installment', label: 'Parcela' },
  { value: 'admin_tax', label: 'Taxa de administração' },
  { value: 'reserve_fund', label: 'Fundo de reserva' },
  { value: 'insurance', label: 'Seguro' },
];

export const SimulatorConfigModal: React.FC<SimulatorConfigModalProps> = ({
  open,
  onClose,
  onApply,
  onSaveAndApply,
  onReset,
}) => {
  const { selectedCompanyId } = useCompany();
  
  // Estado individual dos campos
  const [manualFieldsState, setManualFieldsState] = useState<ManualFieldsState>(initialManualFields);

  // Dados do Supabase
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [bidTypes, setBidTypes] = useState<BidType[]>([]);
  const [installmentTypes, setInstallmentTypes] = useState<InstallmentType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Seleções do usuário
  const [selectedAdministratorId, setSelectedAdministratorId] = useState<string | null>(null);
  const [selectedBidTypeId, setSelectedBidTypeId] = useState<string | null>(null);
  const [selectedInstallmentTypeId, setSelectedInstallmentTypeId] = useState<string | null>(null);
  const [selectedCreditType, setSelectedCreditType] = useState<string | null>(null);

  // Estados para campos dinâmicos
  const [adminTax, setAdminTax] = useState<string>('');
  const [reserveFund, setReserveFund] = useState<string>('');
  const [insuranceMode, setInsuranceMode] = useState<'incluir' | 'nao_incluir'>('nao_incluir');
  const [insurancePercent, setInsurancePercent] = useState<string>('1');

  // Estados para Atualização Anual (campo novo com padrão 6%)
  const [annualUpdate, setAnnualUpdate] = useState<string>('6');

  // Estados para Redução de Parcela
  const [reductionPercent, setReductionPercent] = useState<string>('');
  const [reductionApplications, setReductionApplications] = useState<string[]>([]);
  
  // Estados para Atualização Anual do Crédito
  const [updatePercent, setUpdatePercent] = useState<string>('');
  const [updateType, setUpdateType] = useState<string>('');
  const [updateMonth, setUpdateMonth] = useState<string>('');
  const [updateGrace, setUpdateGrace] = useState<string>('');

  // Buscar administradoras ao abrir o modal
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
        const defaultAdmin = data.find((a) => a.is_default);
        setSelectedAdministratorId(defaultAdmin ? defaultAdmin.id : data[0]?.id || null);
      }
    };
    fetchAdministrators();
  }, [open, selectedCompanyId]);

  // Buscar tipos de crédito ao selecionar administradora
  useEffect(() => {
    if (!selectedAdministratorId) return;
    const fetchBidTypes = async () => {
      const { data, error } = await supabase
        .from('bid_types')
        .select('*')
        .eq('administrator_id', selectedAdministratorId)
        .eq('is_archived', false)
        .order('name');
      if (!error && data) {
        setBidTypes(data);
        setSelectedBidTypeId(data[0]?.id || null);
      }
    };
    fetchBidTypes();
  }, [selectedAdministratorId]);

  // Buscar parcelas ao selecionar administradora
  useEffect(() => {
    if (!selectedAdministratorId) return;
    const fetchInstallmentTypes = async () => {
      const { data, error } = await supabase
        .from('installment_types')
        .select('*')
        .eq('administrator_id', selectedAdministratorId)
        .eq('is_archived', false)
        .order('installment_count');
      if (!error && data) {
        setInstallmentTypes(data);
        setSelectedInstallmentTypeId(data[0]?.id || null);
      }
    };
    fetchInstallmentTypes();
  }, [selectedAdministratorId]);

  // Buscar produtos ao selecionar administradora
  useEffect(() => {
    if (!selectedAdministratorId) return;
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('administrator_id', selectedAdministratorId)
        .eq('is_archived', false);
      if (!error && data) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    };
    fetchProducts();
  }, [selectedAdministratorId]);

  // Buscar product_installment_types ao selecionar produto
  const [productInstallmentTypes, setProductInstallmentTypes] = useState<{ product_id: string, installment_type_id: string }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedProductId) return;
    const fetchProductInstallmentTypes = async () => {
      const { data, error } = await supabase
        .from('product_installment_types')
        .select('product_id, installment_type_id')
        .eq('product_id', selectedProductId);
      if (!error && data) {
        setProductInstallmentTypes(data);
      } else {
        setProductInstallmentTypes([]);
      }
    };
    fetchProductInstallmentTypes();
  }, [selectedProductId]);

  // Atualizar selectedProductId ao trocar administradora ou tipo de crédito
  useEffect(() => {
    if (products.length > 0 && selectedCreditType) {
      const product = products.find(p => p.type === selectedCreditType);
      setSelectedProductId(product?.id || null);
    } else {
      setSelectedProductId(null);
    }
  }, [products, selectedCreditType]);

  // Extrair tipos únicos dos produtos e traduzir para português
  const creditTypes = Array.from(new Set(products.map(p => p.type))).filter(Boolean);
  
  // Função para traduzir tipos de crédito
  const translateCreditType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'property':
        return 'Imóvel';
      case 'vehicle':
        return 'Veículo';
      default:
        return type;
    }
  };

  // Resetar tipo de crédito selecionado ao trocar administradora
  useEffect(() => {
    if (creditTypes.length > 0) {
      setSelectedCreditType(creditTypes[0]);
    } else {
      setSelectedCreditType(null);
    }
  }, [selectedAdministratorId, creditTypes.length]);

  // Resetar parcela selecionada se não existir mais ao trocar administradora ou tipo de crédito
  useEffect(() => {
    if (!manualFieldsState.parcelas) {
      const validInstallments = installmentTypes.filter(
        it => it.administrator_id === selectedAdministratorId && it.type === selectedCreditType
      );
      if (!validInstallments.find(it => it.id === selectedInstallmentTypeId)) {
        setSelectedInstallmentTypeId(validInstallments[0]?.id || null);
      }
    }
  }, [selectedAdministratorId, selectedCreditType, installmentTypes, manualFieldsState.parcelas]);

  // Atualizar valores automáticos ao trocar parcela (Sistema)
  useEffect(() => {
    if (!manualFieldsState.taxaAdministracao && selectedInstallmentTypeId) {
      const selected = installmentTypes.find((it) => it.id === selectedInstallmentTypeId);
      setAdminTax(selected?.admin_tax_percent?.toString() || '');
    }
  }, [manualFieldsState.taxaAdministracao, selectedInstallmentTypeId, installmentTypes]);

  useEffect(() => {
    if (!manualFieldsState.fundoReserva && selectedInstallmentTypeId) {
      const selected = installmentTypes.find((it) => it.id === selectedInstallmentTypeId);
      setReserveFund(selected?.reserve_fund_percent?.toString() || '');
    }
  }, [manualFieldsState.fundoReserva, selectedInstallmentTypeId, installmentTypes]);

  // Atualizar seguro automático ao trocar parcela (Sistema)
  useEffect(() => {
    if (insuranceMode === 'incluir' && !manualFieldsState.parcelas && selectedInstallmentTypeId) {
      const selected = installmentTypes.find((it) => it.id === selectedInstallmentTypeId);
      setInsurancePercent(selected?.insurance_percent?.toString() || '1');
    }
  }, [insuranceMode, manualFieldsState.parcelas, selectedInstallmentTypeId, installmentTypes]);

  // Buscar valores automáticos para Redução de Parcela (Sistema)
  useEffect(() => {
    if (!manualFieldsState.reducaoParcela && selectedInstallmentTypeId) {
      const fetchReduction = async () => {
        const { data } = await supabase
          .from('installment_reductions')
          .select('*')
          .eq('administrator_id', selectedAdministratorId)
          .eq('company_id', selectedCompanyId)
          .eq('is_archived', false)
          .limit(1);
        if (data && data.length > 0) {
          setReductionPercent(data[0].reduction_percent?.toString() || '');
          setReductionApplications(data[0].applications || []);
        } else {
          setReductionPercent('');
          setReductionApplications([]);
        }
      };
      fetchReduction();
    }
  }, [manualFieldsState.reducaoParcela, selectedInstallmentTypeId, selectedAdministratorId, selectedCompanyId]);

  // Buscar valores automáticos para Atualização Anual do Crédito (Sistema)
  useEffect(() => {
    if (!manualFieldsState.atualizacaoAnualCredito && selectedAdministratorId) {
      const admin = administrators.find(a => a.id === selectedAdministratorId);
      setUpdateType(admin?.credit_update_type || '');
      setUpdateMonth(admin?.update_month?.toString() || '');
      setUpdateGrace(admin?.grace_period_days?.toString() || '');
      
      // Definir percentual baseado no tipo de crédito
      if (selectedCreditType === 'property') {
        setUpdatePercent('INCC');
      } else if (selectedCreditType === 'vehicle') {
        setUpdatePercent('IPCA');
      } else {
        setUpdatePercent('');
      }
    }
  }, [manualFieldsState.atualizacaoAnualCredito, selectedAdministratorId, administrators, selectedCreditType]);

  // Resetar valores ao abrir modal
  useEffect(() => {
    if (open) {
      // Se houver configuração salva, carregar os valores
      const loadConfig = async () => {
        const userId = localStorage.getItem('user_id');
        if (!userId || !selectedCompanyId) return;
        const { data } = await supabase
          .from('simulator_configurations')
          .select('configuration')
          .eq('user_id', userId)
          .eq('company_id', selectedCompanyId)
          .single();
        if (data && data.configuration) {
          const config = data.configuration;
          setSelectedAdministratorId(config.administratorId || null);
          setSelectedBidTypeId(config.bidTypeId || null);
          setSelectedInstallmentTypeId(config.installmentTypeId || null);
          setSelectedCreditType(config.creditType || null);
          setManualFieldsState(config.manualFields || initialManualFields);
          setAdminTax(config.adminTax || '');
          setReserveFund(config.reserveFund || '');
          setInsuranceMode(config.insuranceMode || 'nao_incluir');
          setInsurancePercent(config.insurancePercent || '1');
          setAnnualUpdate(config.annualUpdate || '6');
          setReductionPercent(config.reductionPercent || '');
          setReductionApplications(config.reductionApplications || []);
          setUpdatePercent(config.updatePercent || '');
          setUpdateType(config.updateType || '');
          setUpdateMonth(config.updateMonth || '');
          setUpdateGrace(config.updateGrace || '');
        } else {
          setAdminTax('');
          setReserveFund('');
          setInsuranceMode('nao_incluir');
          setInsurancePercent('1');
          setAnnualUpdate('6');
          setReductionPercent('');
          setReductionApplications([]);
          setUpdatePercent('');
          setUpdateType('');
          setUpdateMonth('');
          setUpdateGrace('');
          setManualFieldsState(initialManualFields);
          setSelectedInstallmentTypeId(null);
        }
      };
      loadConfig();
    }
  }, [open, selectedCompanyId]);

  // Função para calcular o estado do switch global
  const getGlobalSwitchState = () => {
    const values = Object.values(manualFieldsState);
    if (values.every(v => v)) return true;
    if (values.every(v => !v)) return false;
    return null; // misto
  };

  const globalSwitchState = getGlobalSwitchState();

  const handleGlobalSwitch = (checked: boolean) => {
    setManualFieldsState({
      parcelas: checked,
      taxaAdministracao: checked,
      fundoReserva: checked,
      reducaoParcela: checked,
      atualizacaoAnual: checked,
      atualizacaoAnualCredito: checked,
    });
  };

  // Alternância individual
  const handleFieldSwitch = (field: keyof ManualFieldsState, checked: boolean) => {
    setManualFieldsState((prev) => ({ ...prev, [field]: checked }));
  };

  // Aplicar localmente
  const handleApply = () => {
    toast({ title: 'Configuração aplicada localmente!' });
    onApply();
  };

  // Salvar e aplicar no Supabase
  const handleSaveAndApply = async () => {
    if (!selectedCompanyId) return;
    const config = {
      administratorId: selectedAdministratorId,
      bidTypeId: selectedBidTypeId,
      installmentTypeId: selectedInstallmentTypeId,
      creditType: selectedCreditType,
      manualFields: manualFieldsState,
      adminTax,
      reserveFund,
      insuranceMode,
      insurancePercent,
      annualUpdate,
      reductionPercent,
      reductionApplications,
      updatePercent,
      updateType,
      updateMonth,
      updateGrace,
    };
    
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        toast({ title: 'Usuário não identificado!', variant: 'destructive' });
        return;
      }
      
      const { error } = await supabase
        .from('simulator_configurations')
        .upsert([
          {
            user_id: userId,
            company_id: selectedCompanyId,
            configuration: config,
            updated_at: new Date().toISOString(),
          },
        ], { onConflict: 'user_id,company_id' });
        
      if (error) {
        toast({ title: 'Erro ao salvar configuração!', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Configuração salva e aplicada com sucesso!' });
        onSaveAndApply();
      }
    } catch (err: any) {
      toast({ title: 'Erro inesperado!', description: err.message, variant: 'destructive' });
    }
  };

  // Redefinir para padrão
  const handleReset = () => {
    setManualFieldsState(initialManualFields);
    setAdminTax('');
    setReserveFund('');
    setInsuranceMode('nao_incluir');
    setInsurancePercent('1');
    setAnnualUpdate('6');
    setReductionPercent('');
    setReductionApplications([]);
    setUpdatePercent('');
    setUpdateType('');
    setUpdateMonth('');
    setUpdateGrace('');
    toast({ title: 'Configurações redefinidas para o padrão.' });
    onReset();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex flex-col h-[80vh] max-h-[80vh] max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DialogTitle>Mais configurações</DialogTitle>
            {globalSwitchState === null && (
              <Tooltip content="Alguns campos estão em Manual, outros em Sistema">
                <Info size={16} className="text-muted-foreground" />
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">Sistema</span>
            <Switch
              checked={globalSwitchState === true}
              onCheckedChange={handleGlobalSwitch}
              className={globalSwitchState === null ? 'bg-gray-400 border border-gray-500' : ''}
            />
            <span className="text-xs">Manual</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-6 p-1">
          {/* Administradora */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Administradora</label>
            <Select
              value={selectedAdministratorId || ''}
              onValueChange={setSelectedAdministratorId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma administradora..." />
              </SelectTrigger>
              <SelectContent>
                {administrators.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>{admin.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Crédito */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Tipo de Crédito</label>
            <Select
              value={selectedCreditType || ''}
              onValueChange={setSelectedCreditType}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um tipo de crédito..." />
              </SelectTrigger>
              <SelectContent>
                {creditTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {translateCreditType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parcelas */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Parcelas</label>
              <Checkbox 
                checked={manualFieldsState.parcelas} 
                onCheckedChange={(checked) => handleFieldSwitch('parcelas', checked as boolean)} 
              />
              <span className="text-xs text-muted-foreground">Manual</span>
            </div>
            {manualFieldsState.parcelas ? (
              <Input type="number" placeholder="Número de parcelas (meses)" />
            ) : (
              <Select
                value={selectedInstallmentTypeId || ''}
                onValueChange={setSelectedInstallmentTypeId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a quantidade de parcelas..." />
                </SelectTrigger>
                <SelectContent>
                  {installmentTypes
                    .filter(it =>
                      it.administrator_id === selectedAdministratorId &&
                      productInstallmentTypes.some(pit => pit.installment_type_id === it.id)
                    )
                    .map((it) => (
                      <SelectItem key={it.id} value={it.id}>
                        {it.name} ({it.installment_count} meses)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Taxa de administração */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Taxa de administração</label>
              <Checkbox 
                checked={manualFieldsState.taxaAdministracao} 
                onCheckedChange={(checked) => handleFieldSwitch('taxaAdministracao', checked as boolean)} 
              />
              <span className="text-xs text-muted-foreground">Manual</span>
            </div>
            <Input
              type="number"
              placeholder="%"
              value={adminTax}
              onChange={(e) => setAdminTax(e.target.value)}
              disabled={!manualFieldsState.taxaAdministracao}
            />
          </div>

          {/* Fundo de reserva */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Fundo de reserva</label>
              <Checkbox 
                checked={manualFieldsState.fundoReserva} 
                onCheckedChange={(checked) => handleFieldSwitch('fundoReserva', checked as boolean)} 
              />
              <span className="text-xs text-muted-foreground">Manual</span>
            </div>
            <Input
              type="number"
              placeholder="%"
              value={reserveFund}
              onChange={(e) => setReserveFund(e.target.value)}
              disabled={!manualFieldsState.fundoReserva}
            />
          </div>

          {/* Atualização anual (novo campo) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Atualização anual</label>
              <Checkbox 
                checked={manualFieldsState.atualizacaoAnual} 
                onCheckedChange={(checked) => handleFieldSwitch('atualizacaoAnual', checked as boolean)} 
              />
              <span className="text-xs text-muted-foreground">Manual</span>
            </div>
            <Input
              type="number"
              placeholder="%"
              value={annualUpdate}
              onChange={(e) => setAnnualUpdate(e.target.value)}
              disabled={!manualFieldsState.atualizacaoAnual}
              min={0}
              max={20}
              step={0.1}
            />
          </div>

          {/* Ativar seguro */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ativar seguro</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="seguro"
                  value="nao_incluir"
                  checked={insuranceMode === 'nao_incluir'}
                  onChange={() => setInsuranceMode('nao_incluir')}
                />
                Não incluir
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="seguro"
                  value="incluir"
                  checked={insuranceMode === 'incluir'}
                  onChange={() => setInsuranceMode('incluir')}
                />
                Incluir
              </label>
            </div>
            {insuranceMode === 'incluir' && (
              <Input
                type="number"
                placeholder="%"
                value={insurancePercent}
                onChange={(e) => setInsurancePercent(e.target.value)}
              />
            )}
          </div>

          {/* Redução de parcela */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Redução de parcela</label>
              <Checkbox 
                checked={manualFieldsState.reducaoParcela} 
                onCheckedChange={(checked) => handleFieldSwitch('reducaoParcela', checked as boolean)} 
              />
              <span className="text-xs text-muted-foreground">Manual</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Percentual reduzido (%)"
                value={reductionPercent}
                onChange={(e) => setReductionPercent(e.target.value)}
                disabled={!manualFieldsState.reducaoParcela}
              />
              <Select
                value={reductionApplications[0] || ''}
                onValueChange={(value) => setReductionApplications([value])}
                disabled={!manualFieldsState.reducaoParcela}
                multiple
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aplicação" />
                </SelectTrigger>
                <SelectContent>
                  {applicationsOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Atualização anual do crédito */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Atualização anual do crédito</label>
              <Checkbox 
                checked={manualFieldsState.atualizacaoAnualCredito} 
                onCheckedChange={(checked) => handleFieldSwitch('atualizacaoAnualCredito', checked as boolean)} 
              />
              <span className="text-xs text-muted-foreground">Manual</span>
            </div>
            {/* Sistema: busca tipo da administradora */}
            {!manualFieldsState.atualizacaoAnualCredito ? (
              updateType === 'after_12_installments' ? (
                <div className="p-3 bg-muted rounded-md">
                  <span className="text-sm">Após 12 parcelas</span>
                </div>
              ) : updateType === 'specific_month' ? (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Mês de Atualização"
                    value={updateMonth}
                    disabled
                  />
                  <Input
                    type="number"
                    placeholder="Carência (em dias)"
                    value={updateGrace}
                    disabled
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="text"
                    placeholder="Tipo de Atualização"
                    value={updateType}
                    disabled
                  />
                  <Input
                    type="text"
                    placeholder="Percentual/Índice"
                    value={updatePercent}
                    disabled
                  />
                </div>
              )
            ) : (
              // Manual: campos editáveis
              <div className="grid grid-cols-2 gap-2">
                <Select value={updateType} onValueChange={setUpdateType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de Atualização" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="after_12_installments">Após 12 parcelas</SelectItem>
                    <SelectItem value="specific_month">Mês específico</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  placeholder="Percentual/Índice"
                  value={updatePercent}
                  onChange={(e) => setUpdatePercent(e.target.value)}
                />
                {updateType === 'specific_month' && (
                  <>
                    <Input
                      type="number"
                      placeholder="Mês de Atualização"
                      value={updateMonth}
                      onChange={(e) => setUpdateMonth(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Carência (em dias)"
                      value={updateGrace}
                      onChange={(e) => setUpdateGrace(e.target.value)}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={handleReset}>
            Redefinir
          </Button>
          <Button variant="secondary" onClick={handleApply}>
            Aplicar
          </Button>
          <Button onClick={handleSaveAndApply}>
            Salvar e Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};