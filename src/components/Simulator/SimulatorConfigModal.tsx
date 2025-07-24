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
}) => {
  const { user, companyId } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  
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

  // Dados do banco
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [installmentTypes, setInstallmentTypes] = useState<InstallmentType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reducoesParcela, setReducoesParcela] = useState<Array<{ id: string; name: string }>>([]);

  // Estados selecionados
  const [selectedAdministratorId, setSelectedAdministratorId] = useState<string | null>(null);
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
      setHasChanges(false);
    }
  }, [open, searchType, value, term, installmentType, contemplationMonth, agioPercent]);

  // Detectar mudanças
  useEffect(() => {
    const changed = 
      localSearchType !== searchType ||
      localValue !== value ||
      localTerm !== term ||
      localInstallmentType !== installmentType ||
      localContemplationMonth !== contemplationMonth ||
      localAgioPercent !== agioPercent;
    
    setHasChanges(changed);
  }, [localSearchType, localValue, localTerm, localInstallmentType, localContemplationMonth, localAgioPercent, searchType, value, term, installmentType, contemplationMonth, agioPercent]);

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
        // Selecionar administradora padrão
        const defaultAdmin = data.find(a => a.is_default) || data[0];
        if (defaultAdmin) {
          setSelectedAdministratorId(defaultAdmin.id);
        }
      }
    };
    
    fetchAdministrators();
  }, [open, selectedCompanyId]);

  // Buscar tipos de parcelas
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
    
    setSearchType(localSearchType);
    
    setValue(localValue);
    
    setTerm(localTerm);
    
    setInstallmentType(localInstallmentType);
    
    if (setContemplationMonth) {
      setContemplationMonth(localContemplationMonth);
    }

    if (typeof window !== 'undefined') {
      (window as any).globalAgioPercent = localAgioPercent;
    }
    setAgioPercent(localAgioPercent);
    
    toast({ title: 'Configurações aplicadas!' });
    onApply();
  };

  // Função para salvar e aplicar
  const handleSaveAndApply = async () => {
    try {
      
      const { data: { user: crmUser } } = await supabase.auth.getUser();
      if (!crmUser || !companyId) {
        toast({ title: 'Erro: Usuário não autenticado!', variant: 'destructive' });
        return;
      }
      
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
      };
      
      
      // Salvar no banco de dados
      try {
        
        // Verificar se temos os dados necessários
        if (!crmUser?.id) {
          console.error('❌ [DEBUG] crmUser.id não encontrado');
          return;
        }
        
        if (!companyId) {
          console.error('❌ [DEBUG] companyId não encontrado');
          return;
        }
        
        const { error: insertError } = await supabase
          .from('simulator_configurations')
          .insert({
            user_id: crmUser.id,
            company_id: companyId,
            configuration: {
              searchType: config.searchType,
              value: config.value,
              term: config.term,
              installmentType: config.installmentType,
              contemplationMonth: config.contemplationMonth,
              administratorId: config.administratorId,
              creditType: config.creditType,
              adminTaxPercent: config.adminTaxPercent,
              reserveFundPercent: config.reserveFundPercent,
              annualUpdateRate: config.annualUpdateRate,
              isAdminTaxCustomized: config.isAdminTaxCustomized,
              isReserveFundCustomized: config.isReserveFundCustomized,
              isAnnualUpdateCustomized: config.isAnnualUpdateCustomized,
            }
          });
        
        if (insertError) {
          
          // Se erro de conflito, tentar update
          const { error: updateError } = await supabase
            .from('simulator_configurations')
            .update({
                          configuration: {
              searchType: config.searchType,
              value: config.value,
              term: config.term,
              installmentType: config.installmentType,
              contemplationMonth: config.contemplationMonth,
              administratorId: config.administratorId,
              creditType: config.creditType,
              adminTaxPercent: config.adminTaxPercent,
              reserveFundPercent: config.reserveFundPercent,
              annualUpdateRate: config.annualUpdateRate,
              isAdminTaxCustomized: config.isAdminTaxCustomized,
              isReserveFundCustomized: config.isReserveFundCustomized,
              isAnnualUpdateCustomized: config.isAnnualUpdateCustomized,
            },
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', crmUser.id)
            .eq('company_id', companyId);
          
          if (updateError) {
            console.error('❌ [DEBUG] Erro no update:', updateError);
            return;
          }
        }
        
        
        // Aplicar mudanças ao header
        
        // Verificar se as funções estão disponíveis
        
        // Aplicar mudanças
        
        // Atualizar valores no contexto global
        if (setSearchType) {
          setSearchType(config.searchType);
        }
        
        if (setValue) {
          setValue(config.value);
        }
        
        if (setTerm) {
          setTerm(config.term);
        }
        
        if (setInstallmentType) {
          setInstallmentType(config.installmentType);
        }
        
        if (setContemplationMonth) {
          setContemplationMonth(config.contemplationMonth);
        }

        if (typeof window !== 'undefined') {
          (window as any).globalAgioPercent = localAgioPercent;
        }
        
        // Atualizar valores customizados
        
        // onSaveAndApply(config);
      } catch (error) {
        console.error('❌ [DEBUG] Erro ao salvar configuração:', error);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
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

  return (
    <FullScreenModal
      isOpen={open}
      onClose={onClose}
      title="Mais configurações"
      hasChanges={hasChanges}
      actions={
        <>
          <Button variant="outline" onClick={handleReset}>
            Redefinir
          </Button>
          <Button variant="secondary" onClick={handleApply}>
            Aplicar
          </Button>
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
              onValueChange={setSelectedAdministratorId}
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
              onValueChange={setSelectedCreditType}
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
            onValueChange={setLocalInstallmentType}
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
              onValueChange={(value) => setLocalTerm(Number(value))}
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
              onChange={(e) => setLocalContemplationMonth(Number(e.target.value))}
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
              onChange={(e) => setLocalAgioPercent(Number(e.target.value))}
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
              onValueChange={setLocalSearchType}
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
              onChange={(e) => setLocalValue(Number(e.target.value))}
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
              onChange={(e) => setLocalAdminTaxPercent(Number(e.target.value))}
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
              onChange={(e) => setLocalReserveFundPercent(Number(e.target.value))}
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
              onChange={(e) => setLocalAnnualUpdateRate(Number(e.target.value))}
              placeholder="6,00"
              className="w-full bg-[#2A2A2A] border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </FullScreenModal>
  );
};