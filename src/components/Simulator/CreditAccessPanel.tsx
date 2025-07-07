
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, RefreshCw } from 'lucide-react';

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

interface CreditAccessPanelProps {
  data: SimulationData;
}

export const CreditAccessPanel = ({ data }: CreditAccessPanelProps) => {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedCreditForChange, setSelectedCreditForChange] = useState<string | null>(null);

  useEffect(() => {
    if (data.administrator && data.value > 0) {
      calculateCredits();
    }
  }, [data]);

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
    </div>
  );
};
