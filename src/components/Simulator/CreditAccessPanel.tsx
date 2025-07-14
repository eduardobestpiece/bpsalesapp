
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

  // Função para sugerir múltiplos créditos para atingir o valor desejado
  const sugerirMultiplosCreditos = async (products: any[], simulationData: SimulationData): Promise<Credit[]> => {
    console.log('[DEBUG] Iniciando sugestão de múltiplos créditos', { products, simulationData });
    const targetValue = simulationData.value;
    const isParcelaCheia = simulationData.installmentType === 'full';
    // Ordenar produtos do maior para o menor valor
    const sortedProducts = [...products].sort((a, b) => b.credit_value - a.credit_value);
    let remaining = targetValue;
    const credits: Credit[] = [];
    for (const product of sortedProducts) {
      // Log detalhado do conteúdo de installment_types
      console.log('[DEBUG] installment_types do produto:', product.id, product.installment_types);
      // Buscar installment correspondente ao prazo
      let installment = null;
      if (Array.isArray(product.installment_types)) {
        // Caso venha como array de objetos aninhados (ex: {installment_types: {...}})
        for (const it of product.installment_types) {
          const real = it.installment_types || it; // pega o objeto interno se existir
          if (real.installment_count === simulationData.term) {
            installment = real;
            break;
          }
        }
      }
      console.log('[DEBUG] Produto analisado:', product, 'Installment encontrado:', installment);
      if (!installment) continue;
      let reduction = null;
      if (!isParcelaCheia && installment.id) {
        reduction = await buscarReducao(installment.id, simulationData.administrator);
        console.log('[DEBUG] Redução encontrada:', reduction);
      }
      const parcelas = calcularParcelasProduto({
        credit: product.credit_value,
        installment,
        reduction: !isParcelaCheia ? reduction : null
      });
      console.log('[DEBUG] Parcelas calculadas:', parcelas);
      while (remaining >= product.credit_value - 1) { // margem para arredondamento
        credits.push({
          id: product.id + '-' + credits.length,
          name: product.name,
          creditValue: product.credit_value,
          installmentValue: isParcelaCheia ? parcelas.full : parcelas.special,
          selected: true
        });
        remaining -= product.credit_value;
      }
    }
    // Se sobrou algum valor, tentar encaixar o menor produto
    if (credits.length === 0 && sortedProducts.length > 0) {
      // Se nenhum produto coube, sugerir o menor produto disponível
      const menor = sortedProducts[sortedProducts.length - 1];
      let installment = null;
      if (Array.isArray(menor.installment_types)) {
        for (const it of menor.installment_types) {
          const real = it.installment_types || it;
          if (real.installment_count === simulationData.term) {
            installment = real;
            break;
          }
        }
      }
      if (installment) {
        let reduction = null;
        if (!isParcelaCheia && installment.id) {
          reduction = await buscarReducao(installment.id, simulationData.administrator);
          console.log('[DEBUG] Redução encontrada (menor):', reduction);
        }
        const parcelas = calcularParcelasProduto({
          credit: menor.credit_value,
          installment,
          reduction: !isParcelaCheia ? reduction : null
        });
        console.log('[DEBUG] Parcelas calculadas (menor):', parcelas);
        credits.push({
          id: menor.id + '-menor',
          name: menor.name,
          creditValue: menor.credit_value,
          installmentValue: isParcelaCheia ? parcelas.full : parcelas.special,
          selected: true
        });
      }
    }
    if (credits.length === 0) {
      console.warn('[SIMULADOR] Nenhum produto compatível com o valor informado.');
    }
    console.log('[DEBUG] Créditos sugeridos:', credits);
    return credits;
  };

  // NOVA LÓGICA: Sugerir combinação de créditos cuja soma das parcelas fique mais próxima do valor de aporte digitado
  const sortedProducts = [...availableProducts].sort((a, b) => b.credit_value - a.credit_value);
  if (data.searchType === 'contribution' || data.searchType === 'credit') {
    // Montar lista de produtos com valor de parcela reduzida
    const produtosComParcelas = sortedProducts.map(product => {
      let installment = null;
      if (Array.isArray(product.installment_types)) {
        for (const it of product.installment_types) {
          const real = it.installment_types || it;
          if (real.installment_count === data.term) {
            installment = real;
            break;
          }
        }
      }
      if (!installment) return null;
      let reduction = null;
      if (!isParcelaCheia && installment.id) {
        // Aqui não precisa await, pois é só para cálculo rápido
      }
      const parcelas = calcularParcelasProduto({
        credit: product.credit_value,
        installment,
        reduction: null // Redução já está aplicada no cálculo do produto
      });
      return {
        product,
        installment,
        parcela: isParcelaCheia ? parcelas.full : parcelas.special
      };
    }).filter(Boolean);

    // Algoritmo guloso: adicionar produtos até chegar o mais próximo possível do valor de aporte
    let melhorDiferenca = Infinity;
    let melhorCombinacao = [];
    // Testar todas as combinações possíveis (até 2 produtos, pois normalmente são poucos)
    for (let i = 0; i < produtosComParcelas.length; i++) {
      const p1 = produtosComParcelas[i];
      // Testa só p1
      let soma = p1.parcela;
      let diff = Math.abs(data.value - soma);
      if (diff < melhorDiferenca) {
        melhorDiferenca = diff;
        melhorCombinacao = [p1];
      }
      // Testa p1 + p2
      for (let j = i + 1; j < produtosComParcelas.length; j++) {
        const p2 = produtosComParcelas[j];
        soma = p1.parcela + p2.parcela;
        diff = Math.abs(data.value - soma);
        if (diff < melhorDiferenca) {
          melhorDiferenca = diff;
          melhorCombinacao = [p1, p2];
        }
      }
    }
    // Montar créditos sugeridos
    const credits: Credit[] = melhorCombinacao.map((item, idx) => ({
      id: item.product.id + '-' + idx,
      name: item.product.name,
      creditValue: item.product.credit_value,
      installmentValue: item.parcela,
      selected: true
    }));
    console.log('[DEBUG] Créditos sugeridos (inteligente):', credits);
    return credits;
  }

  // Atualizar para usar a função de múltiplos créditos
  useEffect(() => {
    if (data.administrator && data.value > 0) {
      (async () => {
        try {
          const { data: products, error } = await supabase
            .from('products')
            .select('*, installment_types:product_installment_types(installment_types(*))')
            .eq('administrator_id', data.administrator)
            .eq('type', data.consortiumType)
            .eq('is_archived', false)
            .order('credit_value');

          if (error) throw error;
          console.log('Produtos retornados:', products);
          if (products && products.length > 0) {
            products.forEach(p => console.log('Produto', p.id, 'installment_types:', p.installment_types));
          }
          setAvailableProducts(products || []);

          if (products && products.length > 0) {
            const calculatedCredits = await sugerirMultiplosCreditos(products, data);
            setCredits(calculatedCredits);
          }
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
