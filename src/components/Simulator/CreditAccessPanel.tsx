
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface SimulationData {
  administrator: string;
  consortiumType: 'property' | 'vehicle';
  installmentType: string;
  value: number;
  term: number;
  updateRate: number;
  searchType: 'contribution' | 'credit';
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

  useEffect(() => {
    if (data.administrator && data.value > 0) {
      calculateCredits();
    }
  }, [data]);

  useEffect(() => {
    if (showDetails && credits.length > 0) {
      calculateMonthlyDetails();
    }
  }, [showDetails, credits, structureType, viewableInstallments]);

  const calculateCredits = async () => {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('administrator_id', data.administrator)
        .eq('type', data.consortiumType)
        .eq('is_archived', false)
        .order('credit_value');

      if (error) throw error;
      setAvailableProducts(products || []);

      if (products && products.length > 0) {
        const calculatedCredits = calculateBestCreditCombination(products, data);
        setCredits(calculatedCredits);
      }
    } catch (error) {
      console.error('Error calculating credits:', error);
    }
  };

  const calculateBestCreditCombination = (products: any[], simulationData: SimulationData): Credit[] => {
    const targetValue = simulationData.value;
    const isContributionSearch = simulationData.searchType === 'contribution';
    
    // Encontrar o produto mais próximo
    let bestMatch = products[0];
    let bestDifference = Infinity;
    
    for (const product of products) {
      const compareValue = isContributionSearch 
        ? product.credit_value / simulationData.term  // Valor da parcela
        : product.credit_value; // Valor do crédito
      
      const difference = Math.abs(compareValue - targetValue);
      
      if (difference < bestDifference) {
        bestDifference = difference;
        bestMatch = product;
      }
    }

    const maxProduct = products[products.length - 1];
    const maxValue = isContributionSearch 
      ? maxProduct.credit_value / simulationData.term 
      : maxProduct.credit_value;

    // Se o valor desejado é maior que o maior produto disponível
    if (targetValue > maxValue) {
      const additionalValue = targetValue - maxValue;
      
      // Encontrar segundo produto
      let secondProduct = products[0];
      for (const product of products) {
        const productValue = isContributionSearch 
          ? product.credit_value / simulationData.term 
          : product.credit_value;
        
        if (productValue >= additionalValue) {
          secondProduct = product;
          break;
        }
      }
      
      const secondValue = isContributionSearch 
        ? secondProduct.credit_value / simulationData.term 
        : secondProduct.credit_value;
      
      const percentage = (additionalValue / secondValue) * 100;
      
      // Aplicar regras de arredondamento
      let finalSecondProduct = secondProduct;
      if (percentage >= 1 && percentage <= 40) {
        const smallerProducts = products.filter(p => p.credit_value < secondProduct.credit_value);
        if (smallerProducts.length > 0) {
          finalSecondProduct = smallerProducts[smallerProducts.length - 1];
        }
      }
      
      return [
        {
          id: maxProduct.id,
          name: maxProduct.name,
          creditValue: maxProduct.credit_value,
          installmentValue: maxProduct.credit_value / simulationData.term,
          selected: true
        },
        {
          id: finalSecondProduct.id + '_secondary',
          name: finalSecondProduct.name,
          creditValue: finalSecondProduct.credit_value,
          installmentValue: finalSecondProduct.credit_value / simulationData.term,
          selected: true
        }
      ];
    }
    
    return [
      {
        id: bestMatch.id,
        name: bestMatch.name,
        creditValue: bestMatch.credit_value,
        installmentValue: bestMatch.credit_value / simulationData.term,
        selected: true
      }
    ];
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
