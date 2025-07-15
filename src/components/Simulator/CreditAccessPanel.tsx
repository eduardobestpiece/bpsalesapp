
import { useState, useEffect } from 'react';
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
}

// Adicionar/ajustar o componente ResumoCard
function ResumoCard({ titulo, valor, destaquePositivo, destaqueNegativo }: { titulo: string, valor: string, destaquePositivo?: boolean, destaqueNegativo?: boolean }) {
  return (
    <Card className={destaquePositivo ? 'border-green-500' : destaqueNegativo ? 'border-red-500' : ''}>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{titulo}</div>
        <div className={`text-2xl font-bold ${destaquePositivo ? 'text-green-600' : destaqueNegativo ? 'text-red-600' : 'text-primary'}`}>{valor}</div>
      </CardContent>
    </Card>
  );
}

export const CreditAccessPanel = ({ data }: CreditAccessPanelProps) => {
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
        const conf = configs[0].configuration || {};
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
      bidType: data.bidType,
      updateRate: data.updateRate,
      // Filtros do modal de configurações (se existirem)
      ...(data.configFilters || {})
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

  // Atualizar para usar a função de múltiplos créditos
  useEffect(() => {
    if (data.administrator && data.value > 0 && selectedCompanyId) {
      (async () => {
        try {
          console.log('[DEBUG] selectedCompanyId:', selectedCompanyId);
          console.log('[DEBUG] Filtros para fetch de produtos:', {
            administrator_id: data.administrator,
            type: data.consortiumType,
            company_id: selectedCompanyId
          });
          // Primeira tentativa: buscar produtos da empresa atual
          let { data: products, error } = await supabase
            .from('products')
            .select('*, installment_types:product_installment_types(installment_types(*))')
            .eq('is_archived', false)
            .eq('company_id', selectedCompanyId)
            .order('credit_value');

          // Se não encontrou produtos da empresa atual, buscar de qualquer empresa
          if (!products || products.length === 0) {
            console.log('[DEBUG] Nenhum produto encontrado para empresa', selectedCompanyId, '. Buscando de qualquer empresa...');
            const { data: allProducts, error: allError } = await supabase
              .from('products')
              .select('*, installment_types:product_installment_types(installment_types(*))')
              .eq('is_archived', false)
              .order('credit_value');
            
            products = allProducts;
            error = allError;
          }

          if (error) throw error;
          console.log('Produtos retornados:', products);
          if (products && products.length > 0) {
            products.forEach(p => console.log('Produto', p.id, 'installment_types:', p.installment_types));
          }
          setAvailableProducts(products || []);
          console.log('[DEBUG] setAvailableProducts chamado:', products);

          // Remover chamada de sugerirCreditosInteligente e setCredits, manter apenas setAvailableProducts
          // const calculatedCredits = await sugerirCreditosInteligente(products || [], data);
          // setCredits(calculatedCredits);
        } catch (error) {
          console.error('Error calculating credits:', error);
        }
      })();
    }
  }, [data]);

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
    const installmentParams = {
      installment_count: installmentCandidato.installment_count,
      admin_tax_percent: installmentCandidato.admin_tax_percent || 0,
      reserve_fund_percent: installmentCandidato.reserve_fund_percent || 0,
      insurance_percent: installmentCandidato.insurance_percent || 0,
      optional_insurance: !!installmentCandidato.optional_insurance
    };
    if (data.installmentType !== 'full') {
      if (data.searchType === 'contribution') {
        // Cálculo baseado em Parcela (Aporte) com parcela especial
        const parcelaEspecial100k = regraParcelaEspecial({
          credit: 100000,
          installment: installmentParams,
          reduction: reducaoParcela
        });
        const fator = 100000 / parcelaEspecial100k;
        const valorAporte = data.value;
        // Ajuste 1: Mudança de arredondamento de 20.000 para 10.000
        creditoAcessado = Math.ceil((valorAporte * fator) / 10000) * 10000;
        valorParcela = regraParcelaEspecial({
          credit: creditoAcessado,
          installment: installmentParams,
          reduction: reducaoParcela
        });
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
        // Problema 1: Busca por Aporte com Parcela Cheia - calcular parcela baseada no crédito acessado
        const parcelaCheia100k = calcularParcelasProduto({
          credit: 100000,
          installment: installmentParams,
          reduction: null
        }).full;
        const fator = 100000 / parcelaCheia100k;
        const valorAporte = data.value;
        creditoAcessado = Math.ceil((valorAporte * fator) / 10000) * 10000;
        valorParcela = calcularParcelasProduto({
          credit: creditoAcessado,
          installment: installmentParams,
          reduction: null
        }).full;
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
    taxaAdministracao = installmentCandidato.admin_tax_percent || 0;
    taxaAnual = (taxaAdministracao / data.term) * 12;
    if (data.consortiumType === 'property') {
      atualizacaoAnual = 'INCC ' + (data.updateRate ? data.updateRate.toFixed(2) + '%' : '');
    } else if (data.consortiumType === 'vehicle') {
      atualizacaoAnual = 'IPCA ' + (data.updateRate ? data.updateRate.toFixed(2) + '%' : '');
    }
  }

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
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ResumoCard titulo="Crédito Acessado" valor={formatCurrency(creditoAcessado)} />
        <ResumoCard titulo="Valor da Parcela" valor={formatCurrency(valorParcela)} />
        <ResumoCard titulo="Taxa anual" valor={taxaAnual + '%'} />
        <ResumoCard titulo="Atualização anual" valor={atualizacaoAnual} />
      </div>

      {/* Segunda linha de cards de resumo, só aparece se houver pelo menos um produto selecionado */}
      {cotas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <div className="text-muted-foreground text-center py-4">
                Nenhuma cota adicionada. Clique em "Adicionar Produto" para começar.
              </div>
            )}
            {cotas.map((cota, idx) => (
              <div key={idx} className={`flex items-center justify-between p-3 border rounded-lg ${selectedCotas.includes(idx) ? 'bg-blue-50 border-blue-400' : ''}`}>
                <Checkbox checked={selectedCotas.includes(idx)} onCheckedChange={() => toggleCotaSelecionada(idx)} />
                <div className="flex-1 ml-2">
                  <div className="font-medium">{cota.nome}</div>
                  <div className="text-sm text-muted-foreground">
                    Crédito: {formatCurrency(cota.valor)} | Parcela: {formatCurrency(cota.parcela)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Qtd: {cota.quantidade}</Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removerCota(idx)}
                    className="text-red-600 hover:text-red-700"
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
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Selecionar crédito</DialogTitle>
                  </DialogHeader>
                  <div className="flex gap-2 items-end mb-4">
                    <div className="flex-1">
                      <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-[#A05A2C] focus:border-[#A05A2C] transition-all">
                        <option value="">Selecione o crédito</option>
                        {availableProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <Input type="number" min={1} value={addQuantidade} onChange={e => setAddQuantidade(Number(e.target.value))} className="rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-[#A05A2C] focus:border-[#A05A2C] transition-all" placeholder="Qtd" />
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
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Redefinir Cotas Selecionadas</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <select value={redefinirProdutoId} onChange={e => setRedefinirProdutoId(e.target.value)} className="w-full border rounded p-2">
                      <option value="">Selecione o novo produto</option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <Input type="number" min={1} value={redefinirQuantidade} onChange={e => setRedefinirQuantidade(Number(e.target.value))} className="w-full" placeholder="Quantidade" />
                    <div className="flex gap-2">
                      <Button onClick={redefinirSelecionadas} className="flex-1 bg-green-600 hover:bg-green-700 text-white">Trocar</Button>
                      <Button variant="outline" onClick={() => setShowRedefinirModal(false)} className="flex-1">Cancelar</Button>
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
              <Button onClick={salvarMontagem} disabled={saving} className="flex-1 bg-[#A05A2C] text-white hover:bg-[#7a3f1a] border-none">{saving ? 'Salvando...' : 'Salvar'}</Button>
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
