import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, RefreshCw, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { calcularParcelasProduto } from '@/utils/calculations';
import { formatPercentage } from '@/utils/calculationHelpers';
import { useCompany } from '@/contexts/CompanyContext';
import { regraParcelaEspecial } from '@/lib/regraParcelaEspecial';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

interface SimulationData {
  administrator: string;
  consortiumType: 'property' | 'vehicle';
  installmentType: string;
  value: number;
  term: number;
  updateRate: number;
  searchType: 'contribution' | 'credit';
  adminTaxPercent?: number; // Added for new fields
  reserveFundPercent?: number; // Added for new fields
  isAdminTaxCustomized?: boolean; // Added for new fields
  isReserveFundCustomized?: boolean; // Added for new fields
  annualUpdateRate?: number; // Added for annual update rate synchronization
}

interface Credit {
  id: string;
  name: string;
  creditValue: number;
  installmentValue: number;
  selected: boolean;
}

interface MonthlyDetail {
  month: number;
  creditValue: number;
  installmentValue: number;
  debtBalance: number;
}

interface CreditAccessPanelProps {
  data: SimulationData;
  onCreditoAcessado?: (valor: number) => void;
  onSelectedCreditsChange?: (credits: any[]) => void; // Novo callback para expor as cotas
  firstRowCredit?: number; // Crédito da primeira linha da tabela
  firstRowInstallmentValue?: number; // Valor da parcela da primeira linha da tabela
  shouldRecalculateCredit?: boolean; // Flag para forçar recálculo do crédito
  embutido?: 'com' | 'sem'; // Estado do embutido
  setEmbutido?: (embutido: 'com' | 'sem') => void; // Função para alterar embutido
}

// Adicionar/ajustar o componente ResumoCard
function ResumoCard({ titulo, valor, destaquePositivo, destaqueNegativo }: { titulo: string, valor: string, destaquePositivo?: boolean, destaqueNegativo?: boolean }) {
  // Definir cores baseadas no título para manter consistência
  const getCardColors = (titulo: string) => {
    const tituloLower = titulo.toLowerCase();
    if (tituloLower.includes('crédito') || tituloLower.includes('credit')) {
      return {
        bg: 'from-blue-50 to-blue-100 dark:from-[#1F1F1F] dark:to-[#161616]',
        border: 'border-blue-200 dark:border-[#A86F57]/40',
        label: 'text-blue-700 dark:text-[#A86F57]',
        value: 'text-blue-900 dark:text-white'
      };
    } else if (tituloLower.includes('parcela') || tituloLower.includes('installment')) {
      return {
        bg: 'from-green-50 to-green-100 dark:from-[#1F1F1F] dark:to-[#161616]',
        border: 'border-green-200 dark:border-[#A86F57]/40',
        label: 'text-green-700 dark:text-[#A86F57]',
        value: 'text-green-900 dark:text-white'
      };
    } else if (tituloLower.includes('taxa') || tituloLower.includes('rate')) {
      return {
        bg: 'from-purple-50 to-purple-100 dark:from-[#1F1F1F] dark:to-[#161616]',
        border: 'border-purple-200 dark:border-[#A86F57]/40',
        label: 'text-purple-700 dark:text-[#A86F57]',
        value: 'text-purple-900 dark:text-white'
      };
    } else if (tituloLower.includes('atualização') || tituloLower.includes('update')) {
      return {
        bg: 'from-orange-50 to-orange-100 dark:from-[#1F1F1F] dark:to-[#161616]',
        border: 'border-orange-200 dark:border-[#A86F57]/40',
        label: 'text-orange-700 dark:text-[#A86F57]',
        value: 'text-orange-900 dark:text-white'
      };
    } else if (tituloLower.includes('total')) {
      return {
        bg: 'from-indigo-50 to-indigo-100 dark:from-[#1F1F1F] dark:to-[#161616]',
        border: 'border-indigo-200 dark:border-[#A86F57]/40',
        label: 'text-indigo-700 dark:text-[#A86F57]',
        value: 'text-indigo-900 dark:text-white'
      };
    } else if (tituloLower.includes('acréscimo') || tituloLower.includes('increment')) {
      return {
        bg: 'from-teal-50 to-teal-100 dark:from-[#1F1F1F] dark:to-[#161616]',
        border: 'border-teal-200 dark:border-[#A86F57]/40',
        label: 'text-teal-700 dark:text-[#A86F57]',
        value: 'text-teal-900 dark:text-white'
      };
    } else {
      // Cor padrão
      return {
        bg: 'from-gray-50 to-gray-100 dark:from-[#1F1F1F] dark:to-[#161616]',
        border: 'border-gray-200 dark:border-[#A86F57]/40',
        label: 'text-gray-700 dark:text-[#A86F57]',
        value: 'text-gray-900 dark:text-white'
      };
    }
  };

  const colors = getCardColors(titulo);
  
  // Aplicar destaque se necessário
  const finalValueClass = destaquePositivo ? 'text-green-600 dark:text-green-400' : 
                         destaqueNegativo ? 'text-red-600 dark:text-red-400' : 
                         colors.value;

  return (
    <div className={`space-y-2 p-4 bg-gradient-to-r ${colors.bg} rounded-lg border ${colors.border}`}>
      <Label className={`text-sm ${colors.label} font-medium`}>{titulo}</Label>
      <div className={`text-2xl font-bold ${finalValueClass}`}>{valor}</div>
    </div>
  );
}

export const CreditAccessPanel = ({ data, onCreditoAcessado, onSelectedCreditsChange, firstRowCredit, firstRowInstallmentValue, shouldRecalculateCredit, embutido, setEmbutido }: CreditAccessPanelProps) => {
  const { selectedCompanyId } = useCompany();
  const { crmUser, companyId } = useCrmAuth();
  const [credits, setCredits] = useState<Credit[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedCreditForChange, setSelectedCreditForChange] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [structureType, setStructureType] = useState<'normal' | 'administrator'>('normal');
  const [viewableInstallments, setViewableInstallments] = useState(12);
  const [monthlyDetails, setMonthlyDetails] = useState<MonthlyDetail[]>([]);
  const [visibleColumns, setVisibleColumns] = useState({
    month: true,
    creditValue: true,
    installmentValue: true,
    debtBalance: true,
  });

  // 1. Adicionar estado para valor da parcela digitada e lista de cotas manuais
  const [parcelaDesejada, setParcelaDesejada] = useState<number>(0);
  const [cotas, setCotas] = useState<{produtoId: string, nome: string, valor: number, parcela: number, quantidade: number}[]>([]);
  const [tipoParcela, setTipoParcela] = useState<'full' | 'special'>('full');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedCotas, setSelectedCotas] = useState<number[]>([]);
  const [showRedefinirModal, setShowRedefinirModal] = useState(false);
  const [redefinirProdutoId, setRedefinirProdutoId] = useState('');
  const [redefinirQuantidade, setRedefinirQuantidade] = useState(1);
  const [addQuantidade, setAddQuantidade] = useState(1);

  // Estados para os valores calculados
  const [creditoAcessado, setCreditoAcessado] = useState(0);
  const [valorParcela, setValorParcela] = useState(0);
  const [parcelaReduzida, setParcelaReduzida] = useState(0);
  const [percentualUsado, setPercentualUsado] = useState(0);
  const [parcelaCheia, setParcelaCheia] = useState(0);
  const [taxaAdministracao, setTaxaAdministracao] = useState(0);
  const [taxaAnual, setTaxaAnual] = useState(0);
  const [atualizacaoAnual, setAtualizacaoAnual] = useState('-');

  // Carregar montagem salva ao abrir
  useEffect(() => {
    async function loadSaved() {
      if (!crmUser?.id || !companyId) return;
      const { data: configs } = await supabase
        .from('simulator_configurations')
        .select('*')
        .eq('user_id', crmUser.id)
        .eq('company_id', companyId)
        .limit(1);
      if (configs && configs.length > 0) {
        const conf = configs[0].configuration as any || {};
        setCotas(conf.cotas || []);
        setTipoParcela(conf.tipoParcela || 'full');
        setParcelaDesejada(conf.parcelaDesejada || 0);
        // Adicione outros filtros se necessário
      }
    }
    loadSaved();
    // eslint-disable-next-line
  }, [crmUser?.id, companyId]);

  // Carregar produtos da administradora selecionada
  useEffect(() => {
    async function loadProducts() {
      if (!data.administrator) return;
      
      try {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('administrator_id', data.administrator)
          .eq('is_archived', false)
          .order('name');
        
        if (products) {
          setAvailableProducts(products);
  
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      }
    }
    
    loadProducts();
  }, [data.administrator]);

  // Função para salvar montagem
  const salvarMontagem = async () => {
    if (!crmUser?.id || !companyId) return;
    setSaving(true);
    const conf = {
      cotas,
      tipoParcela,
      parcelaDesejada,
      // Filtros principais (garantir que todos estejam presentes)
      searchType: data.searchType,
      value: data.value,
      term: data.term,
      installmentType: data.installmentType,
      consortiumType: data.consortiumType,
      bidType: (data as any).bidType,
      updateRate: data.updateRate,
      // Filtros do modal de configurações (se existirem)
      ...((data as any).configFilters || {})
    };
    // Verifica se já existe
    const { data: configs } = await supabase
      .from('simulator_configurations')
      .select('id')
      .eq('user_id', crmUser.id)
      .eq('company_id', companyId)
      .limit(1);
    if (configs && configs.length > 0) {
      // Update
      await supabase
        .from('simulator_configurations')
        .update({ configuration: conf, updated_at: new Date().toISOString() })
        .eq('id', configs[0].id);
    } else {
      // Insert
      await supabase
        .from('simulator_configurations')
        .insert({
          user_id: crmUser.id,
          company_id: companyId,
          configuration: conf,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }
    setSaving(false);
  };

  // Função para redefinir montagem
  const redefinirMontagem = async () => {
    setCotas([]);
    setTipoParcela('full');
    setParcelaDesejada(0);
    // Apagar do Supabase
    if (crmUser?.id && companyId) {
      await supabase
        .from('simulator_configurations')
        .delete()
        .eq('user_id', crmUser.id)
        .eq('company_id', companyId);
    }
  };

  // Função para buscar redução associada ao produto/parcelas
  const buscarReducao = async (installmentTypeId: string, administratorId: string) => {
    // Buscar relação installment_type_reductions
    const { data: rels } = await supabase
      .from('installment_type_reductions')
      .select('installment_reduction_id')
      .eq('installment_type_id', installmentTypeId);
    if (!rels || rels.length === 0) return null;
    // Buscar dados da redução
    const { data: reducoes } = await supabase
      .from('installment_reductions')
      .select('*')
      .eq('id', rels[0].installment_reduction_id)
      .eq('is_archived', false)
      .limit(1);
    if (!reducoes || reducoes.length === 0) return null;
    return reducoes[0];
  };

  // Remover funções de sugestão automática de créditos e debugs

  // Função para sugerir créditos inteligentemente baseado no valor de aporte
  const sugerirCreditosInteligente = async (products: any[], simulationData: any) => {
    if (!products || products.length === 0 || !simulationData.value || simulationData.searchType !== 'contribution') {
      return [];
    }

    const valorAporte = simulationData.value;
    const administratorId = simulationData.administrator;
    const term = simulationData.term;
    const installmentType = simulationData.installmentType;

    // Debug removido para limpar console

    // Filtrar produtos da administradora selecionada
    const produtosAdministradora = products.filter(produto => 
      produto.administrator_id === administratorId
    );

    // Debug removido para limpar console

    // Buscar redução de parcela se necessário
    let reducaoParcela = null;
    if (installmentType !== 'full') {
      try {
        const { data: reducoes } = await supabase
          .from('installment_reductions')
          .select('*')
          .eq('is_archived', false)
          .eq('id', installmentType);
        
        if (reducoes && reducoes.length > 0) {
          reducaoParcela = reducoes[0];
          // Debug removido para limpar console
        }
      } catch (error) {
        console.error('Erro ao buscar redução de parcela:', error);
      }
    }

    // Buscar installment types da administradora para gerar créditos dinamicamente
    let installmentTypes = [];
    try {
      const { data: types } = await supabase
        .from('installment_types')
        .select('*')
        .eq('administrator_id', administratorId)
        .eq('installment_count', term)
        .eq('is_archived', false);
      
      if (types && types.length > 0) {
        installmentTypes = types;
        // Debug removido para limpar console
      }
    } catch (error) {
      console.error('Erro ao buscar installment types:', error);
    }

    // Calcular créditos sugeridos para cada produto
    const creditosSugeridos = [];

    // Se há produtos suficientes, usar a lógica original
    if (produtosAdministradora.length >= 3) {
      console.log('🔍 [CÁLCULO CRÉDITO] Usando lógica original - produtos suficientes');
      
      for (const produto of produtosAdministradora) {
        // Buscar installment type compatível
        let installmentCandidato = null;
        if (Array.isArray(produto.installment_types)) {
          for (const it of produto.installment_types) {
            const real = it.installment_types || it;
            if (real.installment_count === term) {
              installmentCandidato = real;
              break;
            }
          }
        }

        if (!installmentCandidato) continue;

        // Calcular parcela para 100k como referência
        const installmentParams = {
          installment_count: installmentCandidato.installment_count,
          admin_tax_percent: installmentCandidato.admin_tax_percent || 0,
          reserve_fund_percent: installmentCandidato.reserve_fund_percent || 0,
          insurance_percent: installmentCandidato.insurance_percent || 0,
          optional_insurance: !!installmentCandidato.optional_insurance
        };

        console.log('🔍 [CÁLCULO CRÉDITO] Parâmetros da parcela:', installmentParams);

        let parcelaReferencia = 0;
        if (installmentType === 'full') {
          parcelaReferencia = calcularParcelasProduto({
            credit: 100000,
            installment: installmentParams,
            reduction: null
          }).full;
        } else {
          parcelaReferencia = regraParcelaEspecial({
            credit: 100000,
            installment: installmentParams,
            reduction: reducaoParcela
          });
        }

        console.log('🔍 [CÁLCULO CRÉDITO] Parcela de referência (100k):', parcelaReferencia);

        // Calcular fator e crédito sugerido
        const fator = 100000 / parcelaReferencia;
        const creditoSugerido = Math.ceil((valorAporte * fator) / 10000) * 10000;

        console.log('🔍 [CÁLCULO CRÉDITO] Fator calculado:', fator);
        console.log('🔍 [CÁLCULO CRÉDITO] Crédito sugerido:', creditoSugerido);

        // Calcular parcela real para o crédito sugerido
        let parcelaReal = 0;
        if (installmentType === 'full') {
          parcelaReal = calcularParcelasProduto({
            credit: creditoSugerido,
            installment: installmentParams,
            reduction: null
          }).full;
        } else {
          parcelaReal = regraParcelaEspecial({
            credit: creditoSugerido,
            installment: installmentParams,
            reduction: reducaoParcela
          });
        }

        console.log('🔍 [CÁLCULO CRÉDITO] Parcela real calculada:', parcelaReal);
        console.log('🔍 [CÁLCULO CRÉDITO] Diferença do valor desejado:', Math.abs(parcelaReal - valorAporte));

        creditosSugeridos.push({
          id: produto.id,
          name: produto.name,
          creditValue: creditoSugerido,
          installmentValue: parcelaReal,
          selected: false,
          productId: produto.id,
          administratorId: produto.administrator_id,
          type: produto.type
        });
      }
    } else {
      console.log('🔍 [CÁLCULO CRÉDITO] Usando lógica dinâmica - poucos produtos');
      
      // Lógica para gerar créditos dinamicamente quando há poucos produtos
      if (installmentTypes.length > 0) {
        const installmentCandidato = installmentTypes[0]; // Usar o primeiro installment type disponível
        
        const installmentParams = {
          installment_count: installmentCandidato.installment_count,
          admin_tax_percent: installmentCandidato.admin_tax_percent || 0,
          reserve_fund_percent: installmentCandidato.reserve_fund_percent || 0,
          insurance_percent: installmentCandidato.insurance_percent || 0,
          optional_insurance: !!installmentCandidato.optional_insurance
        };

        console.log('🔍 [CÁLCULO CRÉDITO] Parâmetros da parcela (dinâmico):', installmentParams);

        // Calcular parcela para 100k como referência
        let parcelaReferencia = 0;
        if (installmentType === 'full') {
          parcelaReferencia = calcularParcelasProduto({
            credit: 100000,
            installment: installmentParams,
            reduction: null
          }).full;
        } else {
          parcelaReferencia = regraParcelaEspecial({
            credit: 100000,
            installment: installmentParams,
            reduction: reducaoParcela
          });
        }

        console.log('🔍 [CÁLCULO CRÉDITO] Parcela de referência (100k) - dinâmico:', parcelaReferencia);

        // Calcular fator e crédito sugerido
        const fator = 100000 / parcelaReferencia;
        const creditoSugerido = Math.ceil((valorAporte * fator) / 10000) * 10000;

        console.log('🔍 [CÁLCULO CRÉDITO] Fator calculado (dinâmico):', fator);
        console.log('🔍 [CÁLCULO CRÉDITO] Crédito sugerido (dinâmico):', creditoSugerido);

        // Calcular parcela real para o crédito sugerido
        let parcelaReal = 0;
        if (installmentType === 'full') {
          parcelaReal = calcularParcelasProduto({
            credit: creditoSugerido,
            installment: installmentParams,
            reduction: null
          }).full;
        } else {
          parcelaReal = regraParcelaEspecial({
            credit: creditoSugerido,
            installment: installmentParams,
            reduction: reducaoParcela
          });
        }

        console.log('🔍 [CÁLCULO CRÉDITO] Parcela real calculada (dinâmico):', parcelaReal);
        console.log('🔍 [CÁLCULO CRÉDITO] Diferença do valor desejado (dinâmico):', Math.abs(parcelaReal - valorAporte));

        // Gerar múltiplas opções de crédito baseadas no valor sugerido
        const opcoesCredito = [
          creditoSugerido,
          creditoSugerido + 10000,
          creditoSugerido - 10000,
          creditoSugerido + 20000,
          creditoSugerido - 20000
        ].filter(valor => valor > 0);

        console.log('🔍 [CÁLCULO CRÉDITO] Opções de crédito geradas:', opcoesCredito);

        for (let i = 0; i < opcoesCredito.length; i++) {
          const credito = opcoesCredito[i];
          
          // Calcular parcela para este crédito
          let parcela = 0;
          if (installmentType === 'full') {
            parcela = calcularParcelasProduto({
              credit: credito,
              installment: installmentParams,
              reduction: null
            }).full;
          } else {
            parcela = regraParcelaEspecial({
              credit: credito,
              installment: installmentParams,
              reduction: reducaoParcela
            });
          }

          console.log(`🔍 [CÁLCULO CRÉDITO] Opção ${i + 1}: Crédito ${credito} -> Parcela ${parcela}`);

          creditosSugeridos.push({
            id: `generated-${i}`,
            name: `R$ ${(credito / 1000).toFixed(0)}.000,00 (${simulationData.consortiumType === 'property' ? 'Imóvel' : 'Veículo'})`,
            creditValue: credito,
            installmentValue: parcela,
            selected: false,
            productId: null, // Produto gerado dinamicamente
            administratorId: administratorId,
            type: simulationData.consortiumType
          });
        }
      }
    }

    // Ordenar por diferença do valor de aporte desejado
    creditosSugeridos.sort((a, b) => {
      const diffA = Math.abs(a.installmentValue - valorAporte);
      const diffB = Math.abs(b.installmentValue - valorAporte);
      return diffA - diffB;
    });

    // Selecionar o primeiro (mais próximo)
    if (creditosSugeridos.length > 0) {
      creditosSugeridos[0].selected = true;
      console.log('🔍 [CÁLCULO CRÉDITO] Melhor opção selecionada:', {
        creditoAcessado: creditosSugeridos[0].creditValue,
        valorParcela: creditosSugeridos[0].installmentValue,
        diferenca: Math.abs(creditosSugeridos[0].installmentValue - valorAporte)
      });
    }

    console.log('🔍 [CÁLCULO CRÉDITO] Total de créditos sugeridos:', creditosSugeridos.length);
    return creditosSugeridos;
  };

  // Função para calcular crédito usando a fórmula correta
  const calcularCreditoPorFormula = (valorAporte: number, installmentParams: any, reducaoParcela: any, installmentType: string) => {
    console.log('🔍 [CÁLCULO CRÉDITO FÓRMULA] Iniciando cálculo:', { valorAporte, installmentParams, reducaoParcela, installmentType });
    
    const baseCalculo = 10000;
    const prazo = installmentParams.installment_count;
    
    // Calcular parcela base (10000) com redução se aplicável
    let parcelaBase = baseCalculo;
    if (installmentType !== 'full' && reducaoParcela && reducaoParcela.applications && reducaoParcela.applications.includes('installment')) {
      parcelaBase = baseCalculo * (reducaoParcela.reduction_percent / 100);
    }
    
    // Calcular taxa de administração com redução se aplicável
    let taxaAdm = installmentParams.admin_tax_percent || 0;
    if (installmentType !== 'full' && reducaoParcela && reducaoParcela.applications && reducaoParcela.applications.includes('admin_tax')) {
      taxaAdm = taxaAdm * (reducaoParcela.reduction_percent / 100);
    }
    
    // Calcular fundo de reserva com redução se aplicável
    let fundoReserva = installmentParams.reserve_fund_percent || 0;
    if (installmentType !== 'full' && reducaoParcela && reducaoParcela.applications && reducaoParcela.applications.includes('reserve_fund')) {
      fundoReserva = fundoReserva * (reducaoParcela.reduction_percent / 100);
    }
    
    // Aplicar a nova fórmula: Crédito = (Aporte / ((Parcela + TaxaAdm + FundoReserva) / Prazo)) * 10000
    const valorTaxaAdm = baseCalculo * (taxaAdm / 100);
    const valorFundoReserva = baseCalculo * (fundoReserva / 100);
    const valorTotalTaxas = valorTaxaAdm + valorFundoReserva;
    
    const parcelaComTaxas = parcelaBase + valorTotalTaxas;
    const parcelaComTaxasPorMes = parcelaComTaxas / prazo;
    
    const creditoCalculado = (valorAporte / parcelaComTaxasPorMes) * 10000;
    
    // Arredondar para múltiplo de 10000
    const creditoFinal = Math.ceil(creditoCalculado / 10000) * 10000;
    
    console.log('🔍 [CÁLCULO CRÉDITO FÓRMULA] Parâmetros calculados:', {
      parcelaBase,
      taxaAdm,
      fundoReserva,
      prazo
    });
    
    console.log('🔍 [CÁLCULO CRÉDITO FÓRMULA] Valores intermediários:', {
      valorTaxaAdm,
      valorFundoReserva,
      valorTotalTaxas,
      parcelaComTaxas,
      parcelaComTaxasPorMes
    });
    
    console.log('🔍 [CÁLCULO CRÉDITO FÓRMULA] Parcela com taxas:', parcelaComTaxas);
    console.log('🔍 [CÁLCULO CRÉDITO FÓRMULA] Crédito calculado:', creditoCalculado);
    console.log('🔍 [CÁLCULO CRÉDITO FÓRMULA] Crédito final arredondado:', creditoFinal);
    
    return creditoFinal;
  };

  const calcularParcelaPorFormula = (creditoAcessado: number, installmentParams: any, reducaoParcela: any, installmentType: string) => {
    console.log('🔍 [CÁLCULO PARCELA FÓRMULA] Iniciando cálculo:', { creditoAcessado, installmentParams, reducaoParcela, installmentType });
    
    const prazo = installmentParams.installment_count;
    
    // Calcular parcela base com redução se aplicável
    let parcelaBase = creditoAcessado;
    if (installmentType !== 'full' && reducaoParcela && reducaoParcela.applications && reducaoParcela.applications.includes('installment')) {
      parcelaBase = creditoAcessado * (reducaoParcela.reduction_percent / 100);
    }
    
    // Calcular taxa de administração com redução se aplicável
    let taxaAdm = installmentParams.admin_tax_percent || 0;
    if (installmentType !== 'full' && reducaoParcela && reducaoParcela.applications && reducaoParcela.applications.includes('admin_tax')) {
      taxaAdm = taxaAdm * (reducaoParcela.reduction_percent / 100);
    }
    
    // Calcular fundo de reserva com redução se aplicável
    let fundoReserva = installmentParams.reserve_fund_percent || 0;
    if (installmentType !== 'full' && reducaoParcela && reducaoParcela.applications && reducaoParcela.applications.includes('reserve_fund')) {
      fundoReserva = fundoReserva * (reducaoParcela.reduction_percent / 100);
    }
    
    // Aplicar a nova fórmula: Parcela = (ParcelaBase + TaxaAdm + FundoReserva) / Prazo
    const valorTaxaAdm = creditoAcessado * (taxaAdm / 100);
    const valorFundoReserva = creditoAcessado * (fundoReserva / 100);
    const valorTotalTaxas = valorTaxaAdm + valorFundoReserva;
    
    const parcelaFinal = (parcelaBase + valorTotalTaxas) / prazo;
    
    console.log('🔍 [CÁLCULO PARCELA FÓRMULA] Parâmetros calculados:', {
      parcelaBase,
      taxaAdm,
      fundoReserva,
      prazo
    });
    
    console.log('🔍 [CÁLCULO PARCELA FÓRMULA] Valores intermediários:', {
      valorTaxaAdm,
      valorFundoReserva,
      valorTotalTaxas,
      parcelaFinal
    });
    
    console.log('🔍 [CÁLCULO PARCELA FÓRMULA] Parcela final:', parcelaFinal);
    
    return parcelaFinal;
  };

  // Função para sugerir créditos dinamicamente baseado no valor de aporte
  const sugerirCreditosDinamico = async (valorAporte: number, administratorId: string, term: number, installmentType: string) => {
    console.log('🔍 [CÁLCULO CRÉDITO DINÂMICO] Iniciando cálculo:', {
      valorAporte,
      administratorId,
      term,
      installmentType
    });

    // Buscar installment types da administradora
    let installmentTypes = [];
    try {
      const { data: types } = await supabase
        .from('installment_types')
        .select('*')
        .eq('administrator_id', administratorId)
        .eq('installment_count', term)
        .eq('is_archived', false);
      
      if (types && types.length > 0) {
        installmentTypes = types;
        console.log('🔍 [CÁLCULO CRÉDITO DINÂMICO] Installment types encontrados:', installmentTypes.length);
      }
    } catch (error) {
      console.error('Erro ao buscar installment types:', error);
    }

    if (installmentTypes.length === 0) {
      console.log('🔍 [CÁLCULO CRÉDITO DINÂMICO] Nenhum installment type encontrado');
      return [];
    }

    // Buscar redução de parcela se necessário
    let reducaoParcela = null;
    if (installmentType !== 'full') {
      try {
        const { data: reducoes } = await supabase
          .from('installment_reductions')
          .select('*')
          .eq('is_archived', false)
          .eq('id', installmentType);
        
        if (reducoes && reducoes.length > 0) {
          reducaoParcela = reducoes[0];
          console.log('🔍 [CÁLCULO CRÉDITO DINÂMICO] Redução de parcela encontrada:', reducaoParcela);
        }
      } catch (error) {
        console.error('Erro ao buscar redução de parcela:', error);
      }
    }

    const creditosSugeridos = [];
    const installmentCandidato = installmentTypes[0]; // Usar o primeiro installment type disponível

    const installmentParams = {
      installment_count: installmentCandidato.installment_count,
      admin_tax_percent: installmentCandidato.admin_tax_percent || 0,
      reserve_fund_percent: installmentCandidato.reserve_fund_percent || 0,
      insurance_percent: installmentCandidato.insurance_percent || 0,
      optional_insurance: !!installmentCandidato.optional_insurance
    };

    console.log('🔍 [CÁLCULO CRÉDITO DINÂMICO] Parâmetros da parcela:', installmentParams);

    // Calcular crédito usando a fórmula correta
    const creditoCalculado = calcularCreditoPorFormula(valorAporte, installmentParams, reducaoParcela, installmentType);
    
    console.log('🔍 [CÁLCULO CRÉDITO DINÂMICO] Crédito calculado pela fórmula:', creditoCalculado);

    // Calcular parcela real para o crédito calculado
    let parcelaReal = 0;
    if (installmentType === 'full') {
      parcelaReal = calcularParcelasProduto({
        credit: creditoCalculado,
        installment: installmentParams,
        reduction: null
      }).full;
    } else {
      parcelaReal = regraParcelaEspecial({
        credit: creditoCalculado,
        installment: installmentParams,
        reduction: reducaoParcela
      });
    }

    console.log('🔍 [CÁLCULO CRÉDITO DINÂMICO] Parcela real calculada:', parcelaReal);

    // Adicionar o crédito calculado como opção
    creditosSugeridos.push({
      id: `generated-${creditoCalculado}`,
      name: `R$ ${(creditoCalculado / 1000).toFixed(0)}.000,00 (Imóvel)`,
      creditValue: creditoCalculado,
      installmentValue: parcelaReal,
      selected: true,
      productId: null,
      administratorId: administratorId,
      type: 'property',
      diferenca: Math.abs(parcelaReal - valorAporte)
    });

    // Gerar algumas opções adicionais próximas ao valor calculado
    const opcoesAdicionais = [
      creditoCalculado + 10000,
      creditoCalculado - 10000,
      creditoCalculado + 20000,
      creditoCalculado - 20000
    ].filter(valor => valor > 0);

    for (let i = 0; i < opcoesAdicionais.length; i++) {
      const credito = opcoesAdicionais[i];
      
      // Calcular parcela para este crédito
      let parcela = 0;
      if (installmentType === 'full') {
        parcela = calcularParcelasProduto({
          credit: credito,
          installment: installmentParams,
          reduction: null
        }).full;
      } else {
        parcela = regraParcelaEspecial({
          credit: credito,
          installment: installmentParams,
          reduction: reducaoParcela
        });
      }

      console.log(`🔍 [CÁLCULO CRÉDITO DINÂMICO] Opção adicional ${i + 1}: Crédito ${credito} -> Parcela ${parcela}`);

      creditosSugeridos.push({
        id: `generated-${credito}`,
        name: `R$ ${(credito / 1000).toFixed(0)}.000,00 (Imóvel)`,
        creditValue: credito,
        installmentValue: parcela,
        selected: false,
        productId: null,
        administratorId: administratorId,
        type: 'property',
        diferenca: Math.abs(parcela - valorAporte)
      });
    }

    console.log('🔍 [CÁLCULO CRÉDITO DINÂMICO] Total de créditos sugeridos:', creditosSugeridos.length);
    return creditosSugeridos;
  };

  // Atualizar para usar a função de múltiplos créditos
  useEffect(() => {
    if (data.administrator && data.value > 0 && selectedCompanyId) {
      (async () => {
        try {
          // Para modalidade "Aporte", usar a fórmula direta em vez da busca dinâmica
          if (data.searchType === 'contribution') {
            // Buscar installment types da administradora
            const { data: types } = await supabase
              .from('installment_types')
              .select('*')
              .eq('administrator_id', data.administrator)
              .eq('installment_count', data.term)
              .eq('is_archived', false);
            
            if (types && types.length > 0) {
              const installmentCandidato = types[0];
              const installmentParams = {
                installment_count: installmentCandidato.installment_count,
                admin_tax_percent: installmentCandidato.admin_tax_percent || 0,
                reserve_fund_percent: installmentCandidato.reserve_fund_percent || 0,
                insurance_percent: installmentCandidato.insurance_percent || 0,
                optional_insurance: !!installmentCandidato.optional_insurance
              };

              // Buscar redução de parcela se necessário
              let reducaoParcela = null;
              if (data.installmentType !== 'full') {
                const { data: reducoes } = await supabase
                  .from('installment_reductions')
                  .select('*')
                  .eq('is_archived', false)
                  .eq('id', data.installmentType);
                
                if (reducoes && reducoes.length > 0) {
                  reducaoParcela = reducoes[0];
                }
              }

              // Calcular crédito usando a fórmula direta
              const creditoCalculado = calcularCreditoPorFormula(data.value, installmentParams, reducaoParcela, data.installmentType);
              
              // Calcular parcela real usando a nova fórmula
              const parcelaReal = calcularParcelaPorFormula(creditoCalculado, installmentParams, reducaoParcela, data.installmentType);

              // Criar crédito único com o valor calculado pela fórmula
              const calculatedCredits = [{
                id: `formula-${creditoCalculado}`,
                name: `R$ ${(creditoCalculado / 1000).toFixed(0)}.000,00 (Imóvel)`,
                creditValue: creditoCalculado,
                installmentValue: parcelaReal,
                selected: true,
                productId: null,
                administratorId: data.administrator,
                type: 'property'
              }];
              
              setCredits(calculatedCredits);
            }
          } else {
            // Para modalidade "Crédito", usar a busca dinâmica
            const calculatedCredits = await sugerirCreditosDinamico(
              data.value,
              data.administrator,
              data.term,
              data.installmentType
            );
            setCredits(calculatedCredits);
          }
        } catch (error) {
          console.error('Error calculating credits:', error);
        }
      })();
    }
  }, [data.administrator, data.value, selectedCompanyId, data.term, data.installmentType, data.searchType]);

  useEffect(() => {
    if (showDetails && credits.length > 0) {
      calculateMonthlyDetails();
    }
  }, [showDetails, credits, structureType, viewableInstallments]);

  const calculateMonthlyDetails = () => {
    const selectedCredits = credits.filter(c => c.selected);
    if (selectedCredits.length === 0) return;

    const totalCredit = selectedCredits.reduce((sum, c) => sum + c.creditValue, 0);
    let currentCreditValue = totalCredit;
    let currentInstallmentValue = totalCredit / data.term;
    
    const details: MonthlyDetail[] = [];
    const currentMonth = new Date().getMonth() + 1; // Current month (1-12)
    
    for (let month = 1; month <= viewableInstallments; month++) {
      // Apply adjustments based on structure type
      if (structureType === 'administrator') {
        // Mock administrator update logic - in real implementation, 
        // this would use administrator's update_month and other settings
        const isUpdateMonth = (currentMonth + month - 1) % 12 === 8; // August as example
        if (isUpdateMonth) {
          currentCreditValue *= (1 + data.updateRate / 100);
          currentInstallmentValue = currentCreditValue / (data.term - month + 1);
        }
      } else {
        // Normal structure - update every 12 months
        if (month % 12 === 0 && month > 0) {
          currentCreditValue *= (1 + data.updateRate / 100);
          currentInstallmentValue = currentCreditValue / (data.term - month + 1);
        }
      }
      
      const debtBalance = currentCreditValue - (currentInstallmentValue * month);
      
      details.push({
        month,
        creditValue: currentCreditValue,
        installmentValue: currentInstallmentValue,
        debtBalance: Math.max(0, debtBalance),
      });
    }
    
    setMonthlyDetails(details);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const toggleCreditSelection = (creditId: string) => {
    const selectedCount = credits.filter(c => c.selected).length;
    const credit = credits.find(c => c.id === creditId);
    
    // Não permitir desmarcar se é o último selecionado
    if (credit?.selected && selectedCount <= 1) {
      return;
    }
    
    setCredits(prev => prev.map(c => 
      c.id === creditId ? { ...c, selected: !c.selected } : c
    ));
  };

  const changeCreditOption = (creditId: string, newProductId: string) => {
    const newProduct = availableProducts.find(p => p.id === newProductId);
    if (!newProduct) return;

    setCredits(prev => prev.map(c => 
      c.id === creditId ? {
        ...c,
        name: newProduct.name,
        creditValue: newProduct.credit_value,
        installmentValue: newProduct.credit_value / data.term
      } : c
    ));
    setSelectedCreditForChange(null);
  };

  // 3. Calcular percentuais de cada produto
  const percentuais = availableProducts.map(produto => {
    let installment = null;
    if (Array.isArray(produto.installment_types)) {
      for (const it of produto.installment_types) {
        const real = it.installment_types || it;
        if (real.installment_count === data.term) {
          installment = real;
          break;
        }
      }
    }
    if (!installment) return null;
    let reduction = null;
    if (tipoParcela === 'special' && installment.id) {
      // Não precisa await pois só para exibir percentual
      // (usar valor já carregado ou 0 se não houver)
    }
    const parcelas = calcularParcelasProduto({
      credit: produto.credit_value,
      installment,
      reduction: tipoParcela === 'special' ? reduction : null
    });
    return {
      produtoId: produto.id,
      nome: produto.name,
      valor: produto.credit_value,
      percentualFull: parcelas.full / produto.credit_value,
      percentualSpecial: parcelas.special / produto.credit_value,
      parcelaFull: parcelas.full,
      parcelaSpecial: parcelas.special
    };
  }).filter(Boolean);

  // 4. Calcular crédito sugerido com base no percentual do produto selecionado (usar o menor produto como referência)
  const produtoBase = percentuais.length > 0 ? percentuais[0] : null;
  let percentualUsadoLocal = 0;
  let creditoSugerido = 0;
  if (parcelaDesejada > 0 && produtoBase) {
    percentualUsadoLocal = tipoParcela === 'full' ? produtoBase.percentualFull : produtoBase.percentualSpecial;
    creditoSugerido = parcelaDesejada / percentualUsadoLocal;
    // Arredondar para múltiplo de 20 mil acima
    creditoSugerido = Math.ceil(creditoSugerido / 20000) * 20000;
  }
  // Calcular parcela correspondente ao crédito sugerido
  let parcelaCorrespondente = 0;
  if (produtoBase && creditoSugerido > 0) {
    parcelaCorrespondente = tipoParcela === 'full'
      ? produtoBase.percentualFull * creditoSugerido
      : produtoBase.percentualSpecial * creditoSugerido;
  }

  // 1. Buscar produto e installment compatíveis com administradora, tipo de consórcio e prazo
  const produtoCandidato = availableProducts.find(produto => {
    // Filtros: administradora, tipo de consórcio
    if (produto.administrator_id !== data.administrator) return false;
    if (produto.type !== data.consortiumType) return false;
    return true;
  });
  let installmentCandidato = null;
  if (produtoCandidato && Array.isArray(produtoCandidato.installment_types)) {
    for (const it of produtoCandidato.installment_types) {
      const real = it.installment_types || it;
      if (real.installment_count === data.term) {
        installmentCandidato = real;
        break;
      }
    }
  }

  // 2. Calcular percentual e valores

  const [reducaoParcela, setReducaoParcela] = useState<any>(null);

  useEffect(() => {
    async function fetchReducao() {
      if (produtoCandidato && installmentCandidato && data.installmentType !== 'full') {
        // Buscar redução diretamente pelo ID selecionado
        const { data: reducoes } = await supabase
          .from('installment_reductions')
          .select('*')
          .eq('id', data.installmentType)
          .eq('is_archived', false)
          .limit(1);
        if (reducoes && reducoes.length > 0) {
          setReducaoParcela(reducoes[0]);
          return;
        }
      }
      setReducaoParcela(null);
    }
    fetchReducao();
  }, [produtoCandidato, installmentCandidato, data.installmentType]);

  // Para modalidade "Aporte", buscar installment types diretamente
  if (data.searchType === 'contribution') {
    // Função assíncrona para calcular valores para modalidade "Aporte"
    const calcularValoresAporte = async () => {
      try {
        // Buscar installment types da administradora
        const { data: types } = await supabase
          .from('installment_types')
          .select('*')
          .eq('administrator_id', data.administrator)
          .eq('installment_count', data.term)
          .eq('is_archived', false);
        
        if (types && types.length > 0) {
          const installmentCandidato = types[0];
          
          // Usar valores customizados se disponíveis, senão usar os valores da parcela
          const customAdminTax = (data as any).adminTaxPercent !== undefined ? (data as any).adminTaxPercent : installmentCandidato.admin_tax_percent || 0;
          const customReserveFund = (data as any).reserveFundPercent !== undefined ? (data as any).reserveFundPercent : installmentCandidato.reserve_fund_percent || 0;
          
          const installmentParams = {
            installment_count: installmentCandidato.installment_count,
            admin_tax_percent: customAdminTax,
            reserve_fund_percent: customReserveFund,
            insurance_percent: installmentCandidato.insurance_percent || 0,
            optional_insurance: !!installmentCandidato.optional_insurance
          };

          // Buscar redução de parcela se necessário
          let reducaoParcela = null;
          if (data.installmentType !== 'full') {
            const { data: reducoes } = await supabase
              .from('installment_reductions')
              .select('*')
              .eq('is_archived', false)
              .eq('id', data.installmentType);
            
            if (reducoes && reducoes.length > 0) {
              reducaoParcela = reducoes[0];
            }
          }

          if (data.installmentType !== 'full') {
            // Cálculo baseado em Parcela (Aporte) com parcela especial - usando a nova fórmula
            const valorAporte = data.value;
            
            // Calcular crédito usando a nova fórmula
            const novoCreditoAcessado = calcularCreditoPorFormula(valorAporte, installmentParams, reducaoParcela, data.installmentType);
            setCreditoAcessado(novoCreditoAcessado);
            
            // Calcular parcela real usando a nova fórmula
            const novoValorParcela = calcularParcelaPorFormula(novoCreditoAcessado, installmentParams, reducaoParcela, data.installmentType);
            setValorParcela(novoValorParcela);
            
            console.log('🔍 [CÁLCULO APORTE ESPECIAL] Nova fórmula aplicada:', {
              valorAporte,
              novoCreditoAcessado,
              novoValorParcela
            });
            setParcelaReduzida(novoValorParcela);
            setPercentualUsado(novoValorParcela / novoCreditoAcessado);
            const novaParcelaCheia = calcularParcelasProduto({
              credit: novoCreditoAcessado,
              installment: installmentParams,
              reduction: null
            }).full;
            setParcelaCheia(novaParcelaCheia);
          } else {
            // Cálculo baseado em Parcela (Aporte) com parcela cheia - usando a nova fórmula
            const valorAporte = data.value;
            
            // Calcular crédito usando a nova fórmula
            const novoCreditoAcessado = calcularCreditoPorFormula(valorAporte, installmentParams, null, 'full');
            setCreditoAcessado(novoCreditoAcessado);
            
            // Calcular parcela real usando a nova fórmula
            const novoValorParcela = calcularParcelaPorFormula(novoCreditoAcessado, installmentParams, reducaoParcela, data.installmentType);
            setValorParcela(novoValorParcela);
            
            console.log('🔍 [CÁLCULO APORTE CHEIA] Nova fórmula aplicada:', {
              valorAporte,
              novoCreditoAcessado,
              novoValorParcela
            });
            setParcelaCheia(novoValorParcela);
            const novaParcelaReduzida = regraParcelaEspecial({
              credit: novoCreditoAcessado,
              installment: installmentParams,
              reduction: reducaoParcela
            });
            setParcelaReduzida(novaParcelaReduzida);
            setPercentualUsado(novoValorParcela / novoCreditoAcessado);
          }

          // Calcular percentuais e valores auxiliares
          // Remover as linhas que referenciam variáveis fora do escopo
          // setParcelaReduzida(novoValorParcela);
          // setPercentualUsado(novoValorParcela / novoCreditoAcessado);
          // const novaParcelaCheiaCalculada = calcularParcelasProduto({
          //   credit: novoCreditoAcessado,
          //   installment: installmentParams,
          //   reduction: null
          // }).full;
          // setParcelaCheia(novaParcelaCheiaCalculada);
          
          setTaxaAdministracao(customAdminTax);
          // Calcular taxa anual incluindo taxa de administração + fundo de reserva
          const taxaTotal = customAdminTax + customReserveFund;
          const taxaAnualCalculada = (taxaTotal / data.term) * 12;
          setTaxaAnual(taxaAnualCalculada);
          
          console.log('🔍 [CÁLCULO TAXA ANUAL] Valores:', {
            customAdminTax,
            customReserveFund,
            taxaTotal,
            prazo: data.term,
            taxaAnualCalculada
          });
          
          // Usar valor customizado se disponível, senão usar o valor padrão
          const customAnnualUpdateRate = data.annualUpdateRate !== undefined ? data.annualUpdateRate : data.updateRate;
          
          console.log('🔍 [CÁLCULO ATUALIZAÇÃO ANUAL] Valores:', {
            dataAnnualUpdateRate: data.annualUpdateRate,
            dataUpdateRate: data.updateRate,
            customAnnualUpdateRate
          });
          
          if (data.consortiumType === 'property') {
            setAtualizacaoAnual('INCC ' + (customAnnualUpdateRate ? customAnnualUpdateRate.toFixed(2) + '%' : '6.00%'));
          } else if (data.consortiumType === 'vehicle') {
            setAtualizacaoAnual('IPCA ' + (customAnnualUpdateRate ? customAnnualUpdateRate.toFixed(2) + '%' : '6.00%'));
          }
        }
      } catch (error) {
        console.error('Erro ao calcular valores para modalidade "Aporte":', error);
      }
    };

    // Executar a função assíncrona
    calcularValoresAporte();
  } else if (produtoCandidato && installmentCandidato) {
    // Para modalidade "Crédito", usar a lógica existente
    // Usar valores customizados se disponíveis, senão usar os valores da parcela
    const customAdminTax = (data as any).adminTaxPercent !== undefined ? (data as any).adminTaxPercent : installmentCandidato.admin_tax_percent || 0;
    const customReserveFund = (data as any).reserveFundPercent !== undefined ? (data as any).reserveFundPercent : installmentCandidato.reserve_fund_percent || 0;
    
    const installmentParams = {
      installment_count: installmentCandidato.installment_count,
      admin_tax_percent: customAdminTax,
      reserve_fund_percent: customReserveFund,
      insurance_percent: installmentCandidato.insurance_percent || 0,
      optional_insurance: !!installmentCandidato.optional_insurance
    };
    
    if (data.installmentType !== 'full') {
      if (data.searchType === 'contribution') {
        // Cálculo baseado em Parcela (Aporte) com parcela especial - usando a nova fórmula
        const valorAporte = data.value;
        
        // Calcular crédito usando a nova fórmula
        const novoCreditoAcessado = calcularCreditoPorFormula(valorAporte, installmentParams, reducaoParcela, data.installmentType);
        setCreditoAcessado(novoCreditoAcessado);
        
        // Calcular parcela real usando a nova fórmula
        const novoValorParcela = calcularParcelaPorFormula(novoCreditoAcessado, installmentParams, reducaoParcela, data.installmentType);
        setValorParcela(novoValorParcela);
        
        console.log('🔍 [CÁLCULO APORTE ESPECIAL] Nova fórmula aplicada:', {
          valorAporte,
          novoCreditoAcessado,
          novoValorParcela
        });
        setParcelaReduzida(novoValorParcela);
        setPercentualUsado(novoValorParcela / novoCreditoAcessado);
        const novaParcelaCheia = calcularParcelasProduto({
          credit: novoCreditoAcessado,
          installment: installmentParams,
          reduction: null
        }).full;
        setParcelaCheia(novaParcelaCheia);
      } else if (data.searchType !== 'contribution') {
        // Problema 2: Cálculo baseado em Crédito com parcela especial - arredondar para múltiplos de 10.000
        const novoCreditoAcessado = Math.ceil(data.value / 10000) * 10000;
        setCreditoAcessado(novoCreditoAcessado);
        const novoValorParcela = regraParcelaEspecial({
          credit: novoCreditoAcessado,
          installment: installmentParams,
          reduction: reducaoParcela
        });
        setValorParcela(novoValorParcela);
        setParcelaReduzida(novoValorParcela);
        setPercentualUsado(novoValorParcela / novoCreditoAcessado);
        const novaParcelaCheia = calcularParcelasProduto({
          credit: novoCreditoAcessado,
          installment: installmentParams,
          reduction: null
        }).full;
        setParcelaCheia(novaParcelaCheia);
      }
    } else {
      // Lógica para parcela cheia
      if (data.searchType === 'contribution') {
        // Cálculo baseado em Parcela (Aporte) com parcela cheia - usando a fórmula correta
        const valorAporte = data.value;
        
        // Calcular crédito usando a nova fórmula
        const novoCreditoAcessado = calcularCreditoPorFormula(valorAporte, installmentParams, null, 'full');
        setCreditoAcessado(novoCreditoAcessado);
        
        // Calcular parcela real usando a nova fórmula
        const novoValorParcela = calcularParcelaPorFormula(novoCreditoAcessado, installmentParams, reducaoParcela, data.installmentType);
        setValorParcela(novoValorParcela);
        
        console.log('🔍 [CÁLCULO APORTE CHEIA] Nova fórmula aplicada:', {
          valorAporte,
          novoCreditoAcessado,
          novoValorParcela
        });
        setParcelaCheia(novoValorParcela);
        const novaParcelaReduzida = regraParcelaEspecial({
          credit: novoCreditoAcessado,
          installment: installmentParams,
          reduction: reducaoParcela
        });
        setParcelaReduzida(novaParcelaReduzida);
        setPercentualUsado(novoValorParcela / novoCreditoAcessado);
      } else if (data.searchType !== 'contribution') {
        // Problema 3: Busca por Crédito com Parcela Cheia - arredondar crédito para múltiplos de 10.000
        const novoCreditoAcessado = Math.ceil(data.value / 10000) * 10000;
        setCreditoAcessado(novoCreditoAcessado);
        const novoValorParcela = calcularParcelasProduto({
          credit: novoCreditoAcessado,
          installment: installmentParams,
          reduction: null
        }).full;
        setValorParcela(novoValorParcela);
        setParcelaCheia(novoValorParcela);
        const novaParcelaReduzida = regraParcelaEspecial({
          credit: novoCreditoAcessado,
          installment: installmentParams,
          reduction: reducaoParcela
        });
        setParcelaReduzida(novaParcelaReduzida);
        setPercentualUsado(novoValorParcela / novoCreditoAcessado);
      }
    }
    setTaxaAdministracao(customAdminTax);
    // Calcular taxa anual incluindo taxa de administração + fundo de reserva
    const taxaTotal = customAdminTax + customReserveFund;
    const taxaAnualCalculada = (taxaTotal / data.term) * 12;
    setTaxaAnual(taxaAnualCalculada);
    
    console.log('🔍 [CÁLCULO TAXA ANUAL - CRÉDITO] Valores:', {
      customAdminTax,
      customReserveFund,
      taxaTotal,
      prazo: data.term,
      taxaAnualCalculada
    });
    
    // Usar valor customizado se disponível, senão usar o valor padrão
    const customAnnualUpdateRate = data.annualUpdateRate !== undefined ? data.annualUpdateRate : data.updateRate;
    
    console.log('🔍 [CÁLCULO ATUALIZAÇÃO ANUAL - CRÉDITO] Valores:', {
      dataAnnualUpdateRate: data.annualUpdateRate,
      dataUpdateRate: data.updateRate,
      customAnnualUpdateRate
    });
    
    if (data.consortiumType === 'property') {
      setAtualizacaoAnual('INCC ' + (customAnnualUpdateRate ? customAnnualUpdateRate.toFixed(2) + '%' : '6.00%'));
    } else if (data.consortiumType === 'vehicle') {
      setAtualizacaoAnual('IPCA ' + (customAnnualUpdateRate ? customAnnualUpdateRate.toFixed(2) + '%' : '6.00%'));
    }
  }

  // Atualizar o valor de crédito acessado no parent sempre que mudar
  useEffect(() => {
    if (onCreditoAcessado && creditoAcessado > 0) {
      onCreditoAcessado(creditoAcessado);
    }
  }, [creditoAcessado, onCreditoAcessado]);

  // Função para recalcular crédito baseado no valor da parcela desejada
  const recalcularCreditoParaParcela = useCallback((valorParcelaDesejada: number) => {
    
    if (!produtoCandidato || !installmentCandidato) {
      return 0;
    }
    
    // Usar valores customizados se disponíveis
    const customAdminTax = (data as any).adminTaxPercent !== undefined ? (data as any).adminTaxPercent : installmentCandidato.admin_tax_percent || 0;
    const customReserveFund = (data as any).reserveFundPercent !== undefined ? (data as any).reserveFundPercent : installmentCandidato.reserve_fund_percent || 0;
    
    const installmentParams = {
      installment_count: installmentCandidato.installment_count,
      admin_tax_percent: customAdminTax,
      reserve_fund_percent: customReserveFund,
      insurance_percent: installmentCandidato.insurance_percent || 0,
      optional_insurance: !!installmentCandidato.optional_insurance
    };
    
    let novoCredito = 0;
    let tentativas = 0;
    const maxTentativas = 50;
    
    // Simplificar a lógica para debug
    if (data.installmentType === 'full') {
      // Para parcela cheia - usar lógica simplificada
      const parcelaCheia100k = calcularParcelasProduto({
        credit: 100000,
        installment: installmentParams,
        reduction: null
      }).full;
      
      const fator = 100000 / parcelaCheia100k;
      novoCredito = Math.ceil((valorParcelaDesejada * fator) / 10000) * 10000;
      
    } else {
      // Para parcela especial - usar lógica simplificada
      const parcelaEspecial100k = regraParcelaEspecial({
        credit: 100000,
        installment: installmentParams,
        reduction: reducaoParcela
      });
      
      const fator = 100000 / parcelaEspecial100k;
      novoCredito = Math.ceil((valorParcelaDesejada * fator) / 10000) * 10000;
      
    }
    return novoCredito;
  }, [produtoCandidato, installmentCandidato, data.adminTaxPercent, data.reserveFundPercent, data.installmentType, data.term, reducaoParcela]);

  // Recálculo automático quando as taxas são alteradas
  useEffect(() => {
    
    if (shouldRecalculateCredit && data.searchType === 'contribution' && data.value > 0) {
      
      const valorParcelaDesejada = data.value;
      const novoCredito = recalcularCreditoParaParcela(valorParcelaDesejada);
      
      if (novoCredito > 0) {
        // Atualizar o crédito acessado no parent
        if (onCreditoAcessado) {
          onCreditoAcessado(novoCredito);
        }
      } else {
        // Falha no recálculo: novoCredito <= 0
      }
    } else {
      // Condições não atendidas para recálculo
    }
  }, [shouldRecalculateCredit, data.searchType, data.value, recalcularCreditoParaParcela, onCreditoAcessado]);

  // Teste direto da função de recálculo para debug
  useEffect(() => {
    if (shouldRecalculateCredit && produtoCandidato && installmentCandidato) {
      
      // Testar com valores específicos
      const testValue = 5000; // Valor do aporte
      const testAdminTax = (data as any).adminTaxPercent || 27;
      const testReserveFund = (data as any).reserveFundPercent || 1;
      
      // Calcular parcela com 100k para teste
      const testInstallmentParams = {
        installment_count: installmentCandidato.installment_count,
        admin_tax_percent: testAdminTax,
        reserve_fund_percent: testReserveFund,
        insurance_percent: installmentCandidato.insurance_percent || 0,
        optional_insurance: !!installmentCandidato.optional_insurance
      };
      
      const testParcela100k = data.installmentType === 'full' 
        ? calcularParcelasProduto({ credit: 100000, installment: testInstallmentParams, reduction: null }).full
        : regraParcelaEspecial({ credit: 100000, installment: testInstallmentParams, reduction: reducaoParcela });
      
      // Calcular fator
      const testFator = 100000 / testParcela100k;
      const testCredito = Math.ceil((testValue * testFator) / 10000) * 10000;
      
    }
  }, [shouldRecalculateCredit, produtoCandidato, installmentCandidato, data]);

  // Notificar mudanças nas cotas para o componente pai
  useEffect(() => {
    if (onSelectedCreditsChange) {
      const selectedCredits = cotas.map(cota => ({
        id: cota.produtoId,
        name: cota.nome,
        value: cota.valor,
        installmentValue: cota.parcela,
        quantity: cota.quantidade
      }));
      onSelectedCreditsChange(selectedCredits);
    }
  }, [cotas, onSelectedCreditsChange]);

  // 5. Funções para adicionar/remover cotas
  const adicionarProduto = async () => {
    if (!selectedProduct || addQuantidade < 1) return;
    
    const produto = availableProducts.find(p => p.id === selectedProduct);
    if (!produto) return;
    
    // Calcular parcela baseada no tipo selecionado
    let parcela = 0;
    
    // Buscar installment_type correto
    let installment = null;
    if (Array.isArray(produto.installment_types)) {
      for (const it of produto.installment_types) {
        const real = it.installment_types || it;
        if (real.installment_count === data.term) {
          installment = real;
          break;
        }
      }
    }
    
    // Se não encontrou installment_type, usar valores padrão
    if (!installment) {
      installment = {
        installment_count: data.term,
        admin_tax_percent: produto.admin_tax_percent || 27,
        reserve_fund_percent: produto.reserve_fund_percent || 1,
        insurance_percent: produto.insurance_percent || 0,
        optional_insurance: false
      };
    }
    
    // Buscar redução de parcela se necessário
    let reducaoParaCalculo = null;
    if (data.installmentType !== 'full') {
      try {
        const { data: reducoes } = await supabase
          .from('installment_reductions')
          .select('*')
          .eq('id', data.installmentType)
          .eq('is_archived', false)
          .limit(1);
        if (reducoes && reducoes.length > 0) {
          reducaoParaCalculo = reducoes[0];
        }
      } catch (error) {
        console.error('Erro ao buscar redução:', error);
      }
    }
    
    // Calcular parcela baseada no tipo selecionado
    if (data.installmentType === 'full') {
      parcela = calcularParcelasProduto({ credit: produto.credit_value, installment, reduction: null }).full;
    } else {
      parcela = calcularParcelasProduto({ credit: produto.credit_value, installment, reduction: reducaoParaCalculo }).special;
    }
    
    console.log('🔍 [ADICIONAR PRODUTO]', {
      produto: produto.name,
      credit_value: produto.credit_value,
      parcela,
      quantidade: addQuantidade,
      installmentType: data.installmentType,
      temReducao: !!reducaoParaCalculo
    });
    
    setCotas(prev => [
      ...prev,
      ...Array.from({ length: addQuantidade }).map(() => ({
        produtoId: produto.id,
        nome: produto.name,
        valor: produto.credit_value,
        parcela,
        quantidade: 1
      }))
    ]);
    
    setSelectedProduct('');
    setShowAddProduct(false);
    setAddQuantidade(1);
  };
  
  const removerCota = (index: number) => {
    setCotas(prev => prev.filter((_, i) => i !== index));
  };

  // Seleção em massa
  const toggleCotaSelecionada = (idx: number) => {
    setSelectedCotas(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };
  const selecionarTodas = () => {
    if (selectedCotas.length === cotas.length) setSelectedCotas([]);
    else setSelectedCotas(cotas.map((_, i) => i));
  };
  const excluirSelecionadas = () => {
    setCotas(prev => prev.filter((_, i) => !selectedCotas.includes(i)));
    setSelectedCotas([]);
  };
  const abrirRedefinir = () => {
    setShowRedefinirModal(true);
    setRedefinirProdutoId('');
    setRedefinirQuantidade(1);
  };
  const redefinirSelecionadas = async () => {
    if (!redefinirProdutoId || redefinirQuantidade < 1) return;
    const produto = availableProducts.find(p => p.id === redefinirProdutoId);
    if (!produto) return;
    let installment = null;
    if (Array.isArray(produto.installment_types)) {
      for (const it of produto.installment_types) {
        const real = it.installment_types || it;
        if (real.installment_count === data.term) {
          installment = real;
          break;
        }
      }
    }
    if (!installment) return;
    
    // Buscar redução de parcela se necessário
    let reducaoParaCalculo = null;
    if (data.installmentType !== 'full') {
      try {
        const { data: reducoes } = await supabase
          .from('installment_reductions')
          .select('*')
          .eq('id', data.installmentType)
          .eq('is_archived', false)
          .limit(1);
        if (reducoes && reducoes.length > 0) {
          reducaoParaCalculo = reducoes[0];
        }
      } catch (error) {
        console.error('Erro ao buscar redução:', error);
      }
    }
    
    let parcela = 0;
    if (data.installmentType === 'full') {
      parcela = calcularParcelasProduto({ credit: produto.credit_value, installment, reduction: null }).full;
    } else {
      parcela = calcularParcelasProduto({ credit: produto.credit_value, installment, reduction: reducaoParaCalculo }).special;
    }
    
    console.log('🔍 [REDEFINIR SELEÇÕES]', {
      produto: produto.name,
      credit_value: produto.credit_value,
      parcela,
      quantidade: redefinirQuantidade,
      installmentType: data.installmentType,
      temReducao: !!reducaoParaCalculo
    });
    
    setCotas(prev => {
      const novas = prev.filter((_, i) => !selectedCotas.includes(i));
      return [
        ...novas,
        ...Array.from({ length: redefinirQuantidade }).map(() => ({
          produtoId: produto.id,
          nome: produto.name,
          valor: produto.credit_value,
          parcela,
          quantidade: 1
        }))
      ];
    });
    setSelectedCotas([]);
    setShowRedefinirModal(false);
  };

  // 6. Calcular total das cotas
  const totalCotas = cotas.reduce((sum, c) => sum + c.valor * c.quantidade, 0);
  
  console.log('🔍 [COTAS INDIVIDUAIS] Detalhes das cotas:', cotas.map(c => ({
    valor: c.valor,
    quantidade: c.quantidade,
    parcela: c.parcela,
    total: c.valor * c.quantidade,
    parcelaTotal: c.parcela * c.quantidade
  })));
  
  console.log('🔍 [COTAS INDIVIDUAIS] Soma das parcelas individuais:', cotas.reduce((sum, c) => sum + c.parcela * c.quantidade, 0));
  console.log('🔍 [COTAS INDIVIDUAIS] Total do crédito:', totalCotas);
  
  // Calcular total da parcela baseado no total do crédito, não na soma das parcelas individuais
  const [totalParcela, setTotalParcela] = useState(0);
  
  // useEffect para calcular o total da parcela quando as cotas ou redução mudarem
  useEffect(() => {
    const calcularTotalParcela = async () => {
      if (totalCotas > 0) {
        // Buscar installment_type correto para o total baseado na administradora selecionada
        let installment = null;
        
        // Buscar diretamente da tabela installment_types da administradora selecionada
        console.log('🔍 [TOTAL DA PARCELA] Debug data.administrator:', {
          administrator: data.administrator,
          term: data.term,
          totalCotas
        });
        
        if (data.administrator) {
          try {
            const { data: installmentTypes } = await supabase
              .from('installment_types')
              .select('*')
              .eq('administrator_id', data.administrator)
              .eq('installment_count', data.term)
              .eq('is_archived', false)
              .limit(1);
            
            if (installmentTypes && installmentTypes.length > 0) {
              installment = installmentTypes[0];
              console.log('🔍 [TOTAL DA PARCELA] Installment encontrado da administradora:', {
                administrator: data.administrator,
                installment_count: installment.installment_count,
                admin_tax_percent: installment.admin_tax_percent,
                reserve_fund_percent: installment.reserve_fund_percent
              });
            } else {
              console.log('🔍 [TOTAL DA PARCELA] Nenhum installment encontrado para:', {
                administrator: data.administrator,
                term: data.term
              });
            }
          } catch (error) {
            console.error('Erro ao buscar installment_types da administradora:', error);
          }
        } else {
          console.log('🔍 [TOTAL DA PARCELA] data.administrator está vazio!');
        }
        
        // Se não encontrou installment_type, buscar dos produtos como fallback
        if (!installment && data.administrator) {
          try {
            const { data: products } = await supabase
              .from('products')
              .select('*')
              .eq('administrator_id', data.administrator)
              .eq('is_archived', false)
              .order('name')
              .limit(1);
            
            if (products && products.length > 0) {
              const primeiroProduto = products[0];
              // Verificar se o produto tem installment_types (pode ser undefined)
              if (primeiroProduto && (primeiroProduto as any).installment_types && Array.isArray((primeiroProduto as any).installment_types)) {
                for (const it of (primeiroProduto as any).installment_types) {
                  const real = it.installment_types || it;
                  if (real.installment_count === data.term) {
                    installment = real;
                    console.log('🔍 [TOTAL DA PARCELA] Installment encontrado dos produtos:', {
                      administrator: data.administrator,
                      installment_count: installment.installment_count,
                      admin_tax_percent: installment.admin_tax_percent,
                      reserve_fund_percent: installment.reserve_fund_percent
                    });
                    break;
                  }
                }
              }
            }
          } catch (error) {
            console.error('Erro ao buscar produtos da administradora:', error);
          }
        }
        
        // Se ainda não encontrou installment_type, usar valores padrão
        if (!installment) {
          installment = {
            installment_count: data.term,
            admin_tax_percent: 27,
            reserve_fund_percent: 1,
            insurance_percent: 0,
            optional_insurance: false
          };
          console.log('🔍 [TOTAL DA PARCELA] Usando valores padrão para installment');
        }
        
        // Buscar redução de parcela se necessário
        let reducaoParaCalculo = null;
        if (data.installmentType !== 'full') {
          try {
            const { data: reducoes } = await supabase
              .from('installment_reductions')
              .select('*')
              .eq('id', data.installmentType)
              .eq('is_archived', false)
              .limit(1);
            if (reducoes && reducoes.length > 0) {
              reducaoParaCalculo = reducoes[0];
            }
          } catch (error) {
            console.error('Erro ao buscar redução:', error);
          }
        }
        
        // Calcular parcela baseada no tipo selecionado para o total
        console.log('🔍 [TOTAL DA PARCELA] Iniciando cálculo:', {
          totalCotas,
          installmentType: data.installmentType,
          installment,
          reducaoParaCalculo
        });
        
        // Debug detalhado do installment
        console.log('🔍 [TOTAL DA PARCELA] Debug do installment:', {
          installment_count: installment?.installment_count,
          admin_tax_percent: installment?.admin_tax_percent,
          reserve_fund_percent: installment?.reserve_fund_percent,
          insurance_percent: installment?.insurance_percent,
          optional_insurance: installment?.optional_insurance
        });
        
        let novoTotalParcela = 0;
        if (data.installmentType === 'full') {
          novoTotalParcela = calcularParcelasProduto({ credit: totalCotas, installment, reduction: null }).full;
          console.log('🔍 [TOTAL DA PARCELA] Parcela cheia calculada:', novoTotalParcela);
        } else {
          novoTotalParcela = calcularParcelasProduto({ credit: totalCotas, installment, reduction: reducaoParaCalculo }).special;
          console.log('🔍 [TOTAL DA PARCELA] Parcela especial calculada:', novoTotalParcela);
        }
        
        setTotalParcela(novoTotalParcela);
        
        console.log('🔍 [TOTAL DA PARCELA] Resultado final:', {
          totalCotas,
          totalParcela: novoTotalParcela,
          installmentType: data.installmentType,
          temReducao: !!reducaoParaCalculo
        });
      } else {
        setTotalParcela(0);
      }
    };
    
    calcularTotalParcela();
  }, [totalCotas, data.installmentType, availableProducts, data.term]);

  // Calcular:
  // - acrescimoAporte = Total da Parcela - Valor da Parcela (diferença entre parcelas)
  // - acrescimoCredito = soma dos créditos selecionados - Crédito Acessado
  // Exibir ambos como positivo, destacando como benefício
  const acrescimoAporte = totalParcela - valorParcela;
  const acrescimoCredito = totalCotas - creditoAcessado;

  // 7. Renderização
  return (
    <div className="space-y-6">
      {/* Painel de resumo */}
      {/* Cards de resumo acima da montagem de cotas */}
      {/* Primeira linha de cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ResumoCard 
          titulo="Crédito Acessado" 
          valor={formatCurrency(
            data.searchType === 'contribution' 
              ? creditoAcessado 
              : (firstRowCredit !== undefined ? firstRowCredit : creditoAcessado)
          )} 
        />
        <ResumoCard 
          titulo="Valor da Parcela" 
          valor={formatCurrency(
            data.searchType === 'contribution' 
              ? valorParcela 
              : (firstRowInstallmentValue !== undefined ? firstRowInstallmentValue : valorParcela)
          )} 
        />
        <ResumoCard titulo="Taxa anual" valor={formatPercentage(taxaAnual)} />
        <ResumoCard titulo="Atualização anual" valor={atualizacaoAnual} />
      </div>

      {/* Segunda linha de cards de resumo, só aparece se houver pelo menos um produto selecionado */}
      {cotas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <ResumoCard titulo="Total do Crédito" valor={formatCurrency(totalCotas)} destaquePositivo={totalCotas >= creditoAcessado} destaqueNegativo={totalCotas < creditoAcessado} />
          <ResumoCard titulo="Total da Parcela" valor={formatCurrency(totalParcela)} destaquePositivo={totalCotas >= creditoAcessado} destaqueNegativo={totalCotas < creditoAcessado} />
          <ResumoCard titulo="Acréscimo no Aporte" valor={formatCurrency(acrescimoAporte)} destaquePositivo={totalCotas >= creditoAcessado} destaqueNegativo={totalCotas < creditoAcessado} />
          <ResumoCard titulo="Acréscimo no Crédito" valor={formatCurrency(acrescimoCredito)} destaquePositivo={totalCotas >= creditoAcessado} destaqueNegativo={totalCotas < creditoAcessado} />
        </div>
      )}
      {/* Seção de Montagem de Cotas */}
      <Card>
        <CardHeader>
          <CardTitle>Montagem de Cotas</CardTitle>
        </CardHeader>
        <CardContent>
      <div className="space-y-4">
            {/* Barra de seleção em massa */}
            {selectedCotas.length > 0 && (
              <div className="flex gap-2 mb-2 items-center">
                <span className="text-sm font-medium">{selectedCotas.length} selecionada(s)</span>
                <Button size="sm" variant="destructive" onClick={excluirSelecionadas}>Excluir</Button>
                <Button size="sm" variant="outline" onClick={abrirRedefinir}>Redefinir</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedCotas([])}>Cancelar</Button>
                  </div>
            )}
            {/* Lista de cotas adicionadas */}
            {cotas.length === 0 && (
              <div className="text-muted-foreground dark:text-gray-300 text-center py-4">
                Nenhuma cota adicionada. Clique em "Adicionar Produto" para começar.
                    </div>
            )}
            {cotas.map((cota, idx) => (
              <div key={idx} className={`flex items-center justify-between p-3 border border-border dark:border-[#A86F57]/20 rounded-lg bg-card dark:bg-[#1F1F1F] ${selectedCotas.includes(idx) ? 'bg-accent/20 dark:bg-[#A86F57]/10 border-accent dark:border-[#A86F57]' : ''}`}>
                <Checkbox checked={selectedCotas.includes(idx)} onCheckedChange={() => toggleCotaSelecionada(idx)} className="dark:border-[#A86F57]/30" />
                <div className="flex-1 ml-2">
                  <div className="font-medium text-foreground dark:text-white">{cota.nome}</div>
                  <div className="text-sm text-muted-foreground dark:text-gray-300">
                    Crédito: {formatCurrency(cota.valor)} | Parcela: {formatCurrency(cota.parcela)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-muted dark:bg-[#161616] text-foreground dark:text-white">Qtd: {cota.quantidade}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removerCota(idx)}
                    className="text-red-600 hover:text-red-700 border-border dark:border-[#A86F57]/30 hover:bg-muted dark:hover:bg-[#161616]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {/* Botão principal de adicionar produto */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddProduct(true)}
                className="flex-1 bg-black text-white hover:bg-neutral-800 border-none"
              >
                {/* Apenas um símbolo de +, maior */}
                <span className="text-2xl font-bold mr-2">+</span>
                Selecionar Crédito
            </Button>
              </div>
            {/* Modal para adicionar produto */}
            {showAddProduct && (
              <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
                <DialogContent className="bg-background dark:bg-[#1E1E1E] border-border dark:border-[#A86F57]/20">
                  <DialogHeader>
                    <DialogTitle className="text-foreground dark:text-white">Selecionar crédito</DialogTitle>
                  </DialogHeader>
                  <div className="flex gap-2 items-end mb-4">
                    <div className="flex-1">
                      <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="w-full rounded-lg border border-border dark:border-[#A86F57]/30 p-2 bg-background dark:bg-[#131313] text-foreground dark:text-white focus:ring-2 focus:ring-[#A86F57] focus:border-[#A86F57] transition-all">
                        <option value="">Selecione o crédito</option>
                        {availableProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <Input type="number" min={1} value={addQuantidade} onChange={e => setAddQuantidade(Number(e.target.value))} className="rounded-lg border-border dark:border-[#A86F57]/30 bg-background dark:bg-[#131313] text-foreground dark:text-white focus:ring-2 focus:ring-[#A86F57] focus:border-[#A86F57] transition-all" placeholder="Qtd" />
              </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowAddProduct(false)} className="flex-1">Cancelar</Button>
                    <Button onClick={adicionarProduto} className="flex-1 bg-[#AA705A] text-white hover:bg-[#AA705A]/80 border-none">Adicionar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {/* Modal para redefinir cotas selecionadas */}
            {showRedefinirModal && (
              <Dialog open={showRedefinirModal} onOpenChange={setShowRedefinirModal}>
                <DialogContent className="bg-background dark:bg-[#1E1E1E] border-border dark:border-[#A86F57]/20">
                  <DialogHeader>
                    <DialogTitle className="text-foreground dark:text-white">Redefinir Cotas Selecionadas</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <select value={redefinirProdutoId} onChange={e => setRedefinirProdutoId(e.target.value)} className="w-full border border-border dark:border-[#A86F57]/30 rounded p-2 bg-background dark:bg-[#131313] text-foreground dark:text-white">
                      <option value="">Selecione o novo produto</option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <Input type="number" min={1} value={redefinirQuantidade} onChange={e => setRedefinirQuantidade(Number(e.target.value))} className="w-full bg-background dark:bg-[#131313] border-border dark:border-[#A86F57]/30 text-foreground dark:text-white" placeholder="Quantidade" />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowRedefinirModal(false)} className="flex-1 border-border dark:border-[#A86F57]/30 text-foreground dark:text-white hover:bg-muted dark:hover:bg-[#161616]">Cancelar</Button>
                      <Button onClick={redefinirSelecionadas} className="flex-1 bg-[#A86F57] text-white hover:bg-[#A86F57]/80 border-none">Trocar</Button>
                  </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            {/* Botões de ação embaixo da montagem de cotas */}
            <div className="flex flex-col md:flex-row gap-2 mt-6">
              {/* Botão Gerar proposta só aparece se houver cotas e não estiver salvando */}
              {cotas.length > 0 && !saving && (
                <Button onClick={() => setShowComingSoon(true)} className="flex-1 bg-green-600 hover:bg-green-700 text-white">Gerar proposta</Button>
              )}
              <Button onClick={redefinirMontagem} variant="outline" className="flex-1">Redefinir</Button>
              <Button onClick={salvarMontagem} disabled={saving} className="flex-1 bg-[#AA715A] text-white hover:bg-[#AA715A]/80 border-none">{saving ? 'Salvando...' : 'Salvar'}</Button>
            </div>
      </div>
        </CardContent>
      </Card>
      {/* Modal "Em breve" */}
      <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Em breve</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-lg">Funcionalidade de geração de proposta estará disponível em breve!</div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
