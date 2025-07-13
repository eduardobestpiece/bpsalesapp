import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Select } from '../ui/select';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useCompany } from '@/contexts/CompanyContext';
import { useEffect, useState } from 'react';
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

const manualFields = [
  'parcelas',
  'taxaAdministracao',
  'fundoReserva',
  'reducaoParcela',
  'atualizacaoAnual',
];

type ManualFieldsState = {
  parcelas: boolean;
  taxaAdministracao: boolean;
  fundoReserva: boolean;
  reducaoParcela: boolean;
  atualizacaoAnual: boolean;
};

const initialManualFields: ManualFieldsState = {
  parcelas: false,
  taxaAdministracao: false,
  fundoReserva: false,
  reducaoParcela: false,
  atualizacaoAnual: false,
};

export const SimulatorConfigModal: React.FC<SimulatorConfigModalProps> = ({
  open,
  onClose,
  onApply,
  onSaveAndApply,
  onReset,
}) => {
  const { selectedCompanyId } = useCompany();
  // Estado global Manual/Sistema
  const [isManualGlobal, setIsManualGlobal] = useState(false);
  // Estado individual dos campos
  const [manualFieldsState, setManualFieldsState] = useState<ManualFieldsState>(initialManualFields);

  // Dados do Supabase
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [bidTypes, setBidTypes] = useState<BidType[]>([]);
  const [installmentTypes, setInstallmentTypes] = useState<InstallmentType[]>([]);

  // Seleções do usuário
  const [selectedAdministratorId, setSelectedAdministratorId] = useState<string | null>(null);
  const [selectedBidTypeId, setSelectedBidTypeId] = useState<string | null>(null);
  const [selectedInstallmentTypeId, setSelectedInstallmentTypeId] = useState<string | null>(null);

  // Estados para campos dinâmicos
  const [adminTax, setAdminTax] = useState<string>('');
  const [reserveFund, setReserveFund] = useState<string>('');
  const [insuranceMode, setInsuranceMode] = useState<'incluir' | 'nao_incluir'>('nao_incluir');
  const [insurancePercent, setInsurancePercent] = useState<string>('1'); // padrão 1%

  // Estados para Redução de Parcela
  const [reductionPercent, setReductionPercent] = useState<string>('');
  const [reductionApplication, setReductionApplication] = useState<string>('');
  // Estados para Atualização Anual
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
        // Selecionar a administradora padrão
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

  // Buscar parcelas ao selecionar administradora e tipo de crédito
  useEffect(() => {
    if (!selectedAdministratorId || !selectedBidTypeId) return;
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
  }, [selectedAdministratorId, selectedBidTypeId]);

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
      // Exemplo: buscar do Supabase (ou usar dados mock)
      // Aqui, simula busca do primeiro reduction relacionado à administradora
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
          setReductionApplication(data[0].applications?.[0] || '');
        } else {
          setReductionPercent('');
          setReductionApplication('');
        }
      };
      fetchReduction();
    }
  }, [manualFieldsState.reducaoParcela, selectedInstallmentTypeId, selectedAdministratorId, selectedCompanyId]);

  // Buscar valores automáticos para Atualização Anual (Sistema)
  useEffect(() => {
    if (!manualFieldsState.atualizacaoAnual && selectedAdministratorId) {
      const admin = administrators.find(a => a.id === selectedAdministratorId);
      setUpdateType(admin?.credit_update_type || '');
      setUpdateMonth(admin?.update_month?.toString() || '');
      setUpdateGrace(admin?.grace_period_days?.toString() || '');
      // Percentual depende do tipo de crédito
      if (selectedBidTypeId) {
        // Exemplo: lógica para definir o percentual conforme tipo de crédito
        if (bidTypes.find(b => b.id === selectedBidTypeId)?.name?.toLowerCase().includes('imóvel')) {
          setUpdatePercent('INCC');
        } else if (bidTypes.find(b => b.id === selectedBidTypeId)?.name?.toLowerCase().includes('veículo')) {
          setUpdatePercent('IPCA');
        } else {
          setUpdatePercent('');
        }
      }
    }
  }, [manualFieldsState.atualizacaoAnual, selectedAdministratorId, administrators, selectedBidTypeId, bidTypes]);

  // Resetar valores ao abrir modal
  useEffect(() => {
    if (open) {
      setAdminTax('');
      setReserveFund('');
      setInsuranceMode('nao_incluir');
      setInsurancePercent('1');
      setReductionPercent('');
      setReductionApplication('');
      setUpdatePercent('');
      setUpdateType('');
      setUpdateMonth('');
      setUpdateGrace('');
    }
  }, [open]);

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
    });
  };

  // Alternância individual
  const handleFieldSwitch = (field: keyof ManualFieldsState, checked: boolean) => {
    setManualFieldsState((prev) => ({ ...prev, [field]: checked }));
  };

  // Função para montar o objeto de configuração
  const buildConfigObject = () => ({
    administratorId: selectedAdministratorId,
    bidTypeId: selectedBidTypeId,
    installmentTypeId: selectedInstallmentTypeId,
    manualFields: manualFieldsState,
    parcelasManual: manualFieldsState.parcelas ? undefined : selectedInstallmentTypeId,
    adminTax,
    reserveFund,
    insuranceMode,
    insurancePercent,
    reductionPercent,
    reductionApplication,
    updatePercent,
    updateType,
    updateMonth,
    updateGrace,
  });

  // Aplicar localmente (pode ser expandido para atualizar contexto do simulador)
  const handleApply = () => {
    toast({ title: 'Configuração aplicada localmente!' });
    // Aqui pode-se atualizar o contexto do simulador, se necessário
  };

  // Salvar e aplicar no Supabase
  const handleSaveAndApply = async () => {
    if (!selectedCompanyId) return;
    const config = buildConfigObject();
    try {
      // Buscar usuário logado (exemplo: do localStorage ou contexto)
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        toast({ title: 'Usuário não identificado!', variant: 'destructive' });
        return;
      }
      // Upsert na tabela simulator_configurations
      const { error } = await supabase
        .from('simulator_configurations')
        .upsert([
          {
            user_id: userId,
            company_id: selectedCompanyId,
            configuration: config,
            updated_at: new Date().toISOString(),
          },
        ], { onConflict: ['user_id', 'company_id'] });
      if (error) {
        toast({ title: 'Erro ao salvar configuração!', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Configuração salva e aplicada com sucesso!' });
      }
    } catch (err: any) {
      toast({ title: 'Erro inesperado!', description: err.message, variant: 'destructive' });
    }
  };

  // Redefinir para padrão
  const handleReset = () => {
    setIsManualGlobal(false);
    setManualFieldsState(initialManualFields);
    setAdminTax('');
    setReserveFund('');
    setInsuranceMode('nao_incluir');
    setInsurancePercent('1');
    setReductionPercent('');
    setReductionApplication('');
    setUpdatePercent('');
    setUpdateType('');
    setUpdateMonth('');
    setUpdateGrace('');
    toast({ title: 'Configurações redefinidas para o padrão.' });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <div className="flex flex-col h-[80vh] max-h-[80vh]">
        <div className="flex-shrink-0 flex items-center justify-between px-6 pt-6 pb-2 border-b bg-background z-10">
          <span className="flex items-center gap-2">
            Mais configurações
            {globalSwitchState === null && (
              <Tooltip content="Alguns campos estão em Manual, outros em Sistema">
                <Info size={16} className="text-muted-foreground" />
              </Tooltip>
            )}
          </span>
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
        <DialogContent className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-background">
          {/* Administradora */}
          <div>
            <label className="block font-medium">Administradora</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={selectedAdministratorId || ''}
              onChange={(e) => setSelectedAdministratorId(e.target.value)}
            >
              {administrators.map((admin) => (
                <option key={admin.id} value={admin.id}>{admin.name}</option>
              ))}
            </select>
          </div>
          {/* Tipo de Crédito */}
          <div>
            <label className="block font-medium">Tipo de Crédito</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={selectedBidTypeId || ''}
              onChange={(e) => setSelectedBidTypeId(e.target.value)}
            >
              {bidTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          {/* Parcelas */}
          <div className="flex items-center gap-2">
            <label className="font-medium">Parcelas</label>
            <Checkbox checked={manualFieldsState.parcelas} onCheckedChange={(v) => handleFieldSwitch('parcelas', v)} />
            <span className="text-xs">Manual</span>
          </div>
          {manualFieldsState.parcelas ? (
            <Input type="number" placeholder="Número de parcelas (meses)" />
          ) : (
            <select
              className="w-full border rounded px-2 py-1"
              value={selectedInstallmentTypeId || ''}
              onChange={(e) => setSelectedInstallmentTypeId(e.target.value)}
            >
              {installmentTypes.map((it) => (
                <option key={it.id} value={it.id}>{it.name} ({it.installment_count} meses)</option>
              ))}
            </select>
          )}
          {/* Taxa de administração */}
          <div className="flex items-center gap-2">
            <label className="font-medium">Taxa de administração</label>
            <Checkbox checked={manualFieldsState.taxaAdministracao} onCheckedChange={(v) => handleFieldSwitch('taxaAdministracao', v)} />
            <span className="text-xs">Manual</span>
          </div>
          <Input
            type="number"
            placeholder="%"
            value={adminTax}
            onChange={e => setAdminTax(e.target.value)}
            disabled={!manualFieldsState.taxaAdministracao}
          />
          {/* Fundo de reserva */}
          <div className="flex items-center gap-2">
            <label className="font-medium">Fundo de reserva</label>
            <Checkbox checked={manualFieldsState.fundoReserva} onCheckedChange={(v) => handleFieldSwitch('fundoReserva', v)} />
            <span className="text-xs">Manual</span>
          </div>
          <Input
            type="number"
            placeholder="%"
            value={reserveFund}
            onChange={e => setReserveFund(e.target.value)}
            disabled={!manualFieldsState.fundoReserva}
          />
          {/* Ativar seguro */}
          <div>
            <label className="font-medium">Ativar seguro</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="seguro"
                  value="nao_incluir"
                  checked={insuranceMode === 'nao_incluir'}
                  onChange={() => setInsuranceMode('nao_incluir')}
                /> Não incluir
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="seguro"
                  value="incluir"
                  checked={insuranceMode === 'incluir'}
                  onChange={() => setInsuranceMode('incluir')}
                /> Incluir
              </label>
            </div>
            {insuranceMode === 'incluir' && (
              <Input
                type="number"
                placeholder="%"
                value={insurancePercent}
                onChange={e => setInsurancePercent(e.target.value)}
              />
            )}
          </div>
          {/* Redução de parcela */}
          <div className="flex items-center gap-2">
            <label className="font-medium">Redução de parcela</label>
            <Checkbox checked={manualFieldsState.reducaoParcela} onCheckedChange={(v) => handleFieldSwitch('reducaoParcela', v)} />
            <span className="text-xs">Manual</span>
          </div>
          {manualFieldsState.reducaoParcela ? (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Percentual reduzido (%)"
                value={reductionPercent}
                onChange={e => setReductionPercent(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Aplicação"
                value={reductionApplication}
                onChange={e => setReductionApplication(e.target.value)}
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Percentual reduzido (%)"
                value={reductionPercent}
                disabled
              />
              <Input
                type="text"
                placeholder="Aplicação"
                value={reductionApplication}
                disabled
              />
            </div>
          )}
          {/* Atualização anual do crédito */}
          <div className="flex items-center gap-2">
            <label className="font-medium">Atualização anual do crédito</label>
            <Checkbox checked={manualFieldsState.atualizacaoAnual} onCheckedChange={(v) => handleFieldSwitch('atualizacaoAnual', v)} />
            <span className="text-xs">Manual</span>
          </div>
          {manualFieldsState.atualizacaoAnual ? (
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Percentual"
                value={updatePercent}
                onChange={e => setUpdatePercent(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Tipo de Atualização"
                value={updateType}
                onChange={e => setUpdateType(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Mês de Atualização"
                value={updateMonth}
                onChange={e => setUpdateMonth(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Carência (em dias)"
                value={updateGrace}
                onChange={e => setUpdateGrace(e.target.value)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Percentual"
                value={updatePercent}
                disabled
              />
              <Input
                type="text"
                placeholder="Tipo de Atualização"
                value={updateType}
                disabled
              />
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
          )}
        </DialogContent>
        <DialogFooter className="flex-shrink-0 px-6 pb-6 pt-2 border-t bg-background z-10">
          <Button variant="outline" onClick={handleReset}>Redefinir</Button>
          <Button variant="secondary" onClick={handleApply}>Aplicar</Button>
          <Button onClick={handleSaveAndApply}>Salvar e Aplicar</Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}; 