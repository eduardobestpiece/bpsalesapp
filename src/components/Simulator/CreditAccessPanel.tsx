
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
import { Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { calcularParcelasProduto } from '@/utils/calculations';
import { useCompany } from '@/contexts/CompanyContext';

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

export const CreditAccessPanel = ({ data }: CreditAccessPanelProps) => {
  const { selectedCompanyId } = useCompany();
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

  // Função inteligente para sugerir créditos baseado na busca
  const sugerirCreditosInteligente = async (products: any[], simulationData: SimulationData): Promise<Credit[]> => {
    console.log('[DEBUG] Iniciando sugestão inteligente de créditos', { products, simulationData });
    const targetValue = simulationData.value;
    const isParcelaCheia = simulationData.installmentType === 'full';
    const isSearchByCredit = simulationData.searchType === 'credit';
    
    // Preparar produtos com suas informações de parcela
    const produtosComParcelas = [];
    for (const product of products) {
      let installment = null;
      if (Array.isArray(product.installment_types)) {
        for (const it of product.installment_types) {
          const real = it.installment_types || it;
          if (real.installment_count === simulationData.term) {
            installment = real;
            break;
          }
        }
      }
      if (!installment) continue;
      
      let reduction = null;
      if (!isParcelaCheia && installment.id) {
        reduction = await buscarReducao(installment.id, simulationData.administrator);
      }
      
      const parcelas = calcularParcelasProduto({
        credit: product.credit_value,
        installment,
        reduction: !isParcelaCheia ? reduction : null
      });
      
      produtosComParcelas.push({
        product,
        installment,
        parcelaFull: parcelas.full,
        parcelaSpecial: parcelas.special,
        parcelaUsada: isParcelaCheia ? parcelas.full : parcelas.special
      });
    }
    
    // 1. BUSCA POR CRÉDITO - Tentar valor exato primeiro
    if (isSearchByCredit) {
      // Buscar produto com valor exato ou próximo
      const produtoExato = produtosComParcelas.find(p => Math.abs(p.product.credit_value - targetValue) <= 1000);
      if (produtoExato) {
        console.log('[DEBUG] Produto exato encontrado:', produtoExato.product.name);
        return [{
          id: produtoExato.product.id + '-exato',
          name: produtoExato.product.name,
          creditValue: produtoExato.product.credit_value,
          installmentValue: produtoExato.parcelaUsada,
          selected: true
        }];
      }
      
      // Se não encontrou exato, usar algoritmo de combinação
      return encontrarMelhorCombinacaoCredito(produtosComParcelas, targetValue);
    }
    
    // 2. BUSCA POR APORTE - Usar algoritmo de combinação por parcela
    return encontrarMelhorCombinacaoAporte(produtosComParcelas, targetValue);
  };

  // Algoritmo para encontrar melhor combinação por valor de crédito
  const encontrarMelhorCombinacaoCredito = (produtos: any[], targetValue: number): Credit[] => {
    console.log('[DEBUG] Buscando combinação por crédito, target:', targetValue);
    const sortedProducts = [...produtos].sort((a, b) => b.product.credit_value - a.product.credit_value);
    
    // Usar algoritmo guloso: pegar o maior produto que cabe, repetir até atingir o valor
    const credits: Credit[] = [];
    let remaining = targetValue;
    let tentativas = 0;
    const maxTentativas = 10; // Evitar loop infinito
    
    while (remaining > 0 && tentativas < maxTentativas) {
      tentativas++;
      let adicionouProduto = false;
      
      for (const item of sortedProducts) {
        const creditValue = item.product.credit_value;
        
        // Se o produto cabe exatamente ou é menor que o restante
        if (creditValue <= remaining + 50000) { // Margem de 50k para flexibilidade
          credits.push({
            id: item.product.id + '-' + credits.length,
            name: item.product.name,
            creditValue: creditValue,
            installmentValue: item.parcelaUsada,
            selected: true
          });
          remaining -= creditValue;
          adicionouProduto = true;
          console.log('[DEBUG] Adicionado produto:', item.product.name, 'Restante:', remaining);
          break;
        }
      }
      
      // Se não conseguiu adicionar nenhum produto, sair do loop
      if (!adicionouProduto) break;
    }
    
    console.log('[DEBUG] Combinação final por crédito:', credits);
    return credits;
  };

  // Algoritmo para encontrar melhor combinação por valor de aporte (parcela)
  const encontrarMelhorCombinacaoAporte = (produtos: any[], targetValue: number): Credit[] => {
    console.log('[DEBUG] Buscando combinação por aporte, target:', targetValue);
    
    let melhorCombinacao: Credit[] = [];
    let melhorDiferenca = Infinity;
    const maxCombinacoes = 8; // Limite para performance
    
    // Testar combinações de 1 até maxCombinacoes produtos
    for (let numProdutos = 1; numProdutos <= Math.min(maxCombinacoes, produtos.length); numProdutos++) {
      const combinacoes = gerarCombinacoes(produtos, numProdutos);
      
      for (const combo of combinacoes) {
        const somaParcelas = combo.reduce((sum, item) => sum + item.parcelaUsada, 0);
        const diferenca = Math.abs(somaParcelas - targetValue);
        
        // Priorizar combinações que atendem ou superam ligeiramente o valor
        const superaValor = somaParcelas >= targetValue;
        const diferencaAceitavel = diferenca <= targetValue * 0.3; // Até 30% de diferença
        
        if (diferencaAceitavel && (superaValor || diferenca < melhorDiferenca)) {
          melhorDiferenca = diferenca;
          melhorCombinacao = combo.map((item, i) => ({
            id: item.product.id + '-' + i,
            name: item.product.name,
            creditValue: item.product.credit_value,
            installmentValue: item.parcelaUsada,
            selected: true
          }));
          
          // Se encontrou uma combinação exata ou muito próxima, parar
          if (diferenca <= 100) break;
        }
      }
      
      // Se encontrou uma boa combinação, não precisa testar com mais produtos
      if (melhorDiferenca <= targetValue * 0.1) break;
    }
    
    console.log('[DEBUG] Melhor combinação por aporte:', melhorCombinacao);
    return melhorCombinacao;
  };

  // Função auxiliar para gerar combinações
  const gerarCombinacoes = (produtos: any[], tamanho: number): any[][] => {
    if (tamanho === 1) return produtos.map(p => [p]);
    
    const combinacoes: any[][] = [];
    
    // Permitir repetição de produtos
    function gerarComRepeticao(atual: any[], restante: number) {
      if (restante === 0) {
        combinacoes.push([...atual]);
        return;
      }
      
      for (const produto of produtos) {
        atual.push(produto);
        gerarComRepeticao(atual, restante - 1);
        atual.pop();
      }
    }
    
    gerarComRepeticao([], tamanho);
    return combinacoes.slice(0, 100); // Limitar para performance
  };

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

          // Usar a nova função inteligente para todos os casos
          const calculatedCredits = await sugerirCreditosInteligente(products || [], data);
          setCredits(calculatedCredits);
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

  const selectedCredits = credits.filter(c => c.selected);
  const totalCredit = selectedCredits.reduce((sum, c) => sum + c.creditValue, 0);
  const totalInstallment = selectedCredits.reduce((sum, c) => sum + c.installmentValue, 0);

  // Ajustar cálculo de taxas anual e atualização anual
  let taxaTotalPercent = 0;
  if (credits.length > 0) {
    // Considerar o primeiro crédito como referência (todos devem ser iguais)
    const first = credits[0];
    const product = availableProducts.find(p => p.id === first.id.split('-')[0]);
    if (product) {
      const installment = product.installment_types?.find((it: any) => it.installment_count === data.term) || null;
      if (installment) {
        taxaTotalPercent = (installment.admin_tax_percent || 0) + (installment.reserve_fund_percent || 0);
      }
    }
  }
  const taxasAnual = taxaTotalPercent && data.term ? ((taxaTotalPercent / data.term) * 12) : null;
  let textoAtualizacao = '-';
  let valorAtualizacao = '-';
  if (credits.length > 0) {
    if (data.consortiumType === 'property') {
      textoAtualizacao = 'INCC';
      valorAtualizacao = '6%';
    } else if (data.consortiumType === 'vehicle') {
      textoAtualizacao = 'IPCA';
      valorAtualizacao = '6%';
    } else if (data.updateRate) {
      textoAtualizacao = 'Atualização anual';
      valorAtualizacao = data.updateRate.toFixed(2) + '%';
    }
  }

  if (!data.administrator || data.value <= 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <p>Preencha os dados da simulação para ver os resultados</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Crédito Total Acessado</div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalCredit)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Parcela Total</div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalInstallment)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Taxas anual</div>
            <div className="text-2xl font-bold text-primary">{taxasAnual !== null ? taxasAnual.toFixed(2) + '%' : '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Atualização anual</div>
            <div className="text-2xl font-bold text-primary">{valorAtualizacao}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Índice</div>
            <div className="text-2xl font-bold text-primary">{textoAtualizacao}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Créditos */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Lista de Créditos</h3>
        
        {credits.map((credit) => (
          <Card key={credit.id} className={`transition-all ${credit.selected ? 'ring-2 ring-primary' : 'opacity-60'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium">{credit.name}</h4>
                    {credit.selected && <Badge variant="secondary">Selecionado</Badge>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Valor do Crédito:</span>
                      <div className="font-medium">{formatCurrency(credit.creditValue)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valor da Parcela:</span>
                      <div className="font-medium">{formatCurrency(credit.installmentValue)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedCreditForChange(credit.id)}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Troca
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Trocar Opção de Crédito</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Select onValueChange={(value) => changeCreditOption(credit.id, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma nova opção" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProducts.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - {formatCurrency(product.credit_value)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCreditSelection(credit.id)}
                    disabled={credit.selected && selectedCredits.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Desmarcar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botão Detalhar */}
      <div className="flex justify-center">
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              {showDetails ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Ocultar detalhes
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Detalhar
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Controles do detalhamento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label>Estrutura</Label>
                <Select value={structureType} onValueChange={(value: 'normal' | 'administrator') => setStructureType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="administrator">Administradora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Parcelas para visualizar</Label>
                <Select value={viewableInstallments.toString()} onValueChange={(value) => setViewableInstallments(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: Math.floor(data.term / 12) }, (_, i) => (i + 1) * 12).map(months => (
                      <SelectItem key={months} value={months.toString()}>
                        {months} meses
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Colunas visíveis</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="col-month" 
                      checked={visibleColumns.month}
                      onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, month: !!checked }))}
                    />
                    <Label htmlFor="col-month" className="text-sm">Número do mês</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="col-credit" 
                      checked={visibleColumns.creditValue}
                      onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, creditValue: !!checked }))}
                    />
                    <Label htmlFor="col-credit" className="text-sm">Valor do crédito</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="col-installment" 
                      checked={visibleColumns.installmentValue}
                      onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, installmentValue: !!checked }))}
                    />
                    <Label htmlFor="col-installment" className="text-sm">Valor da parcela</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="col-debt" 
                      checked={visibleColumns.debtBalance}
                      onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, debtBalance: !!checked }))}
                    />
                    <Label htmlFor="col-debt" className="text-sm">Saldo devedor</Label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tabela de detalhamento */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    {visibleColumns.month && <th className="border border-gray-200 p-3 text-left">Mês</th>}
                    {visibleColumns.creditValue && <th className="border border-gray-200 p-3 text-left">Valor do Crédito</th>}
                    {visibleColumns.installmentValue && <th className="border border-gray-200 p-3 text-left">Valor da Parcela</th>}
                    {visibleColumns.debtBalance && <th className="border border-gray-200 p-3 text-left">Saldo Devedor</th>}
                  </tr>
                </thead>
                <tbody>
                  {monthlyDetails.map((detail) => (
                    <tr key={detail.month} className="hover:bg-gray-50">
                      {visibleColumns.month && <td className="border border-gray-200 p-3">{detail.month}</td>}
                      {visibleColumns.creditValue && <td className="border border-gray-200 p-3">{formatCurrency(detail.creditValue)}</td>}
                      {visibleColumns.installmentValue && <td className="border border-gray-200 p-3">{formatCurrency(detail.installmentValue)}</td>}
                      {visibleColumns.debtBalance && <td className="border border-gray-200 p-3">{formatCurrency(detail.debtBalance)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};
