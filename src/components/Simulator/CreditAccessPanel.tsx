
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

    console.log('🔍 [CÁLCULO CRÉDITO] Iniciando cálculo:', {
      valorAporte,
      administratorId,
      term,
      installmentType,
      searchType: simulationData.searchType
    });

    // Filtrar produtos da administradora selecionada
    const produtosAdministradora = products.filter(produto => 
      produto.administrator_id === administratorId
    );

    console.log('🔍 [CÁLCULO CRÉDITO] Produtos encontrados:', produtosAdministradora.length);

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
          console.log('🔍 [CÁLCULO CRÉDITO] Redução de parcela encontrada:', reducaoParcela);
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
        console.log('🔍 [CÁLCULO CRÉDITO] Installment types encontrados:', installmentTypes.length);
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

  // Função para sugerir créditos dinamicamente baseado na fórmula exata do usuário
  const sugerirCreditosDinamico = async (
    valorAporte: number,
    administratorId: string,
    term: number,
    installmentType: string
  ) => {
    console.log('🔍 [CÁLCULO CRÉDITO DINÂMICO] Iniciando cálculo (fórmula exata):', {
      valorAporte,
      administratorId,
      term,
      installmentType
    });

    // Buscar installment type da administradora
    let installmentTypeData = null;
    try {
      const { data: types } = await supabase
        .from('installment_types')
        .select('*')
        .eq('administrator_id', administratorId)
        .eq('installment_count', term)
        .eq('is_archived', false);
      if (types && types.length > 0) {
        installmentTypeData = types[0];
        console.log('🔍 [CÁLCULO CRÉDITO DINÂMICO] Installment type encontrado:', installmentTypeData);
      } else {
        console.log('❌ [CÁLCULO CRÉDITO DINÂMICO] Nenhum installment_type encontrado para:', {
          administratorId,
          term,
          installmentType
        });
        return null;
      }
    } catch (e) {
      console.log('❌ [CÁLCULO CRÉDITO DINÂMICO] Erro ao buscar installment_types', e);
      return null;
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
        }
      } catch (error) {
        console.error('Erro ao buscar redução de parcela:', error);
      }
    }

    // Parâmetros base
    const prazo = term;
    const taxaAdm = installmentTypeData.admin_tax_percent || 0;
    const fundoReserva = installmentTypeData.reserve_fund_percent || 0;
    const percentualReducao = reducaoParcela ? (reducaoParcela.reduction_percent || 1) : 1;

    // Aplicar reduções conforme especificação
    const aplicaReducaoParcela = reducaoParcela ? reducaoParcela.applications?.includes('parcela') : false;
    const aplicaReducaoTaxaAdm = reducaoParcela ? reducaoParcela.applications?.includes('taxa_administracao') : false;
    const aplicaReducaoFundoReserva = reducaoParcela ? reducaoParcela.applications?.includes('fundo_reserva') : false;

    // Calcular valores conforme especificação
    const parcela = aplicaReducaoParcela ? 10000 * percentualReducao : 10000;
    const taxaAdmCalculada = aplicaReducaoTaxaAdm ? taxaAdm * percentualReducao : taxaAdm;
    const fundoReservaCalculado = aplicaReducaoFundoReserva ? fundoReserva * percentualReducao : fundoReserva;

    console.log('🔍 [CÁLCULO CRÉDITO DINÂMICO] Parâmetros calculados:', {
      prazo,
      taxaAdm,
      fundoReserva,
      percentualReducao,
      aplicaReducaoParcela,
      aplicaReducaoTaxaAdm,
      aplicaReducaoFundoReserva,
      parcela,
      taxaAdmCalculada,
      fundoReservaCalculado
    });

    // Aplicar a fórmula: Crédito = (Valor de aporte / (Parcela + ((10000 * Taxa de administração) + (10000 * Fundo de Reserva))) / Prazo)) * 10000
    const denominador = parcela + ((10000 * taxaAdmCalculada) + (10000 * fundoReservaCalculado));
    const creditoCalculado = (valorAporte / (denominador / prazo)) * 10000;

    // Arredondar para múltiplo de 10 mil
    const creditoFinal = Math.ceil(creditoCalculado / 10000) * 10000;

    console.log('🔍 [CÁLCULO CRÉDITO DINÂMICO] Resultado fórmula:', {
      denominador,
      creditoCalculado,
      creditoFinal
    });

    return {
      credit: creditoFinal,
      installment: installmentTypeData,
      valorParcela: valorAporte
    };
  };

  // Atualizar para usar a função de múltiplos créditos
  useEffect(() => {
    if (data.administrator && data.value > 0 && selectedCompanyId) {
      (async () => {
        try {
          // Usar a nova lógica dinâmica em vez de buscar produtos
          const calculatedCredits = await sugerirCreditosDinamico(
            data.value,
            data.administrator,
            data.term,
            data.installmentType
          );
          setCredits(calculatedCredits);
        } catch (error) {
          console.error('Error calculating credits:', error);
        }
      })();
    }
  }, [data.administrator, data.value, selectedCompanyId, data.term, data.installmentType]);

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
  let percentualUsado = 0;
  let creditoSugerido = 0;
  if (parcelaDesejada > 0 && produtoBase) {
    percentualUsado = tipoParcela === 'full' ? produtoBase.percentualFull : produtoBase.percentualSpecial;
    creditoSugerido = parcelaDesejada / percentualUsado;
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
  let parcelaCheia = 0;
  let parcelaReduzida = 0;
  let taxaAdministracao = 0;
  let taxaAnual = 0;
  let atualizacaoAnual = '-';
  let creditoAcessado = 0;
  let valorParcela = 0;
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

  if (produtoCandidato && installmentCandidato) {
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
        // Usar a nova função de cálculo dinâmico
        const resultado = await sugerirCreditosDinamico(
          data.value,
          data.administrator,
          data.term,
          data.installmentType
        );
        
        if (resultado) {
          creditoAcessado = resultado.credit;
          valorParcela = resultado.valorParcela;
        } else {
          // Fallback para lógica antiga se a nova função falhar
          const parcelaEspecial100k = regraParcelaEspecial({
            credit: 100000,
            installment: installmentParams,
            reduction: reducaoParcela
          });
          
          // Lógica iterativa para encontrar o crédito correto
          const valorAporte = data.value;
          let creditoTeste = 100000; // Começar com 100k
          let parcelaTeste = 0;
          let tentativas = 0;
          const maxTentativas = 50; // Evitar loop infinito
          
          // Primeira tentativa com fator inicial
          const fatorInicial = 100000 / parcelaEspecial100k;
          creditoTeste = Math.ceil((valorAporte * fatorInicial) / 10000) * 10000;
          
          // Iterar até encontrar o crédito correto
          while (tentativas < maxTentativas) {
            parcelaTeste = regraParcelaEspecial({
              credit: creditoTeste,
              installment: installmentParams,
              reduction: reducaoParcela
            });
            
            // Se a parcela está próxima ou acima do valor do aporte (com tolerância de 1%)
            if (parcelaTeste >= valorAporte * 0.99) {
              creditoAcessado = creditoTeste;
              valorParcela = parcelaTeste;
              break;
            }
            
            // Calcular novo crédito baseado na diferença
            const fatorAjuste = valorAporte / parcelaTeste;
            const novoCredito = Math.ceil((creditoTeste * fatorAjuste) / 10000) * 10000;
            
            // Se não houve mudança significativa, parar
            if (Math.abs(novoCredito - creditoTeste) < 10000) {
              creditoAcessado = creditoTeste;
              valorParcela = parcelaTeste;
              break;
            }
            
            creditoTeste = novoCredito;
            tentativas++;
          }
          
          // Se não convergiu, usar o último valor
          if (tentativas >= maxTentativas) {
            creditoAcessado = creditoTeste;
            valorParcela = parcelaTeste;
          }
        }
      } else if (data.searchType === 'credit') {
        // Problema 2: Cálculo baseado em Crédito com parcela especial - arredondar para múltiplos de 10.000
        creditoAcessado = Math.ceil(data.value / 10000) * 10000;
        valorParcela = regraParcelaEspecial({
          credit: creditoAcessado,
          installment: installmentParams,
          reduction: reducaoParcela
        });
      }
      // Para ambos, calcular os percentuais e valores auxiliares
      parcelaReduzida = valorParcela;
      percentualUsado = parcelaReduzida / creditoAcessado;
      parcelaCheia = calcularParcelasProduto({
        credit: creditoAcessado,
        installment: installmentParams,
        reduction: null
      }).full;
    } else {
      // Lógica para parcela cheia
      if (data.searchType === 'contribution') {
        // Usar a nova função de cálculo dinâmico
        const resultado = await sugerirCreditosDinamico(
          data.value,
          data.administrator,
          data.term,
          'full' // Para parcela cheia, usar 'full'
        );
        
        if (resultado) {
          creditoAcessado = resultado.credit;
          valorParcela = resultado.valorParcela;
        } else {
          // Fallback para lógica antiga se a nova função falhar
          const parcelaCheia100k = calcularParcelasProduto({
            credit: 100000,
            installment: installmentParams,
            reduction: null
          }).full;
          
          // Lógica iterativa para parcela cheia
          const valorAporte = data.value;
          let creditoTeste = 100000;
          let parcelaTeste = 0;
          let tentativas = 0;
          const maxTentativas = 50;
          
          // Primeira tentativa com fator inicial
          const fatorInicial = 100000 / parcelaCheia100k;
          creditoTeste = Math.ceil((valorAporte * fatorInicial) / 10000) * 10000;
          
          // Iterar até encontrar o crédito correto
          while (tentativas < maxTentativas) {
            parcelaTeste = calcularParcelasProduto({
              credit: creditoTeste,
              installment: installmentParams,
              reduction: null
            }).full;
            
            // Se a parcela está próxima ou acima do valor do aporte (com tolerância de 1%)
            if (parcelaTeste >= valorAporte * 0.99) {
              creditoAcessado = creditoTeste;
              valorParcela = parcelaTeste;
              break;
            }
            
            // Calcular novo crédito baseado na diferença
            const fatorAjuste = valorAporte / parcelaTeste;
            const novoCredito = Math.ceil((creditoTeste * fatorAjuste) / 10000) * 10000;
            
            // Se não houve mudança significativa, parar
            if (Math.abs(novoCredito - creditoTeste) < 10000) {
              creditoAcessado = creditoTeste;
              valorParcela = parcelaTeste;
              break;
            }
            
            creditoTeste = novoCredito;
            tentativas++;
          }
          
          // Se não convergiu, usar o último valor
          if (tentativas >= maxTentativas) {
            creditoAcessado = creditoTeste;
            valorParcela = parcelaTeste;
          }
        }
      } else if (data.searchType === 'credit') {
        // Problema 3: Busca por Crédito com Parcela Cheia - arredondar crédito para múltiplos de 10.000
        creditoAcessado = Math.ceil(data.value / 10000) * 10000;
        valorParcela = calcularParcelasProduto({
          credit: creditoAcessado,
          installment: installmentParams,
          reduction: null
        }).full;
      }
      
      parcelaCheia = valorParcela;
      parcelaReduzida = regraParcelaEspecial({
        credit: creditoAcessado,
        installment: installmentParams,
        reduction: reducaoParcela
      });
      percentualUsado = parcelaCheia / creditoAcessado;
    }
    taxaAdministracao = customAdminTax;
    // Calcular taxa anual incluindo taxa de administração + fundo de reserva
    const taxaTotal = customAdminTax + customReserveFund;
    taxaAnual = (taxaTotal / data.term) * 12;
    
    // Usar valor customizado se disponível, senão usar o valor padrão
    const customAnnualUpdateRate = data.annualUpdateRate !== undefined ? data.annualUpdateRate : data.updateRate;
    
    if (data.consortiumType === 'property') {
      atualizacaoAnual = 'INCC ' + (customAnnualUpdateRate ? customAnnualUpdateRate.toFixed(2) + '%' : '6.00%');
    } else if (data.consortiumType === 'vehicle') {
      atualizacaoAnual = 'IPCA ' + (customAnnualUpdateRate ? customAnnualUpdateRate.toFixed(2) + '%' : '6.00%');
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
  const adicionarProduto = () => {
    if (!selectedProduct || addQuantidade < 1) return;
    
    const produto = availableProducts.find(p => p.id === selectedProduct);
    if (!produto) return;
    
    // Encontrar installment compatível
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
    
    // Calcular parcela baseada no tipo selecionado
    let parcela = 0;
    if (data.installmentType === 'full') {
      parcela = calcularParcelasProduto({
        credit: produto.credit_value,
        installment,
        reduction: null
      }).full;
    } else {
      parcela = regraParcelaEspecial({
        credit: produto.credit_value,
        installment,
        reduction: reducaoParcela
      });
    }
    
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
  const redefinirSelecionadas = () => {
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
    let parcela = 0;
    if (data.installmentType === 'full') {
      parcela = calcularParcelasProduto({ credit: produto.credit_value, installment, reduction: null }).full;
    } else {
      parcela = regraParcelaEspecial({ credit: produto.credit_value, installment, reduction: reducaoParcela });
    }
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
  const totalParcela = cotas.reduce((sum, c) => sum + c.parcela * c.quantidade, 0);

  // Calcular:
  // - acrescimoAporte = soma dos aportes dos créditos selecionados - valor do aporte do cliente (ou Crédito Acessado)
  // - acrescimoCredito = soma dos créditos selecionados - Crédito Acessado
  // Exibir ambos como positivo, destacando como benefício
  const acrescimoAporte = totalCotas - data.value;
  const acrescimoCredito = totalCotas - creditoAcessado;

  // 7. Renderização
  return (
    <div className="space-y-6">
      {/* Painel de resumo */}
      {/* Cards de resumo acima da montagem de cotas */}
      {/* Primeira linha de cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ResumoCard titulo="Crédito Acessado" valor={formatCurrency(firstRowCredit !== undefined ? firstRowCredit : creditoAcessado)} />
        <ResumoCard titulo="Valor da Parcela" valor={formatCurrency(firstRowInstallmentValue !== undefined ? firstRowInstallmentValue : valorParcela)} />
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
                    <Button onClick={adicionarProduto} className="flex-1 bg-[#A05A2C] text-white hover:bg-[#7a3f1a] border-none">Adicionar</Button>
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
