
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calculator, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SimulatorConfig {
  searchType: 'credit_value' | 'contribution_value';
  administrator: string;
  propertyType: 'property' | 'vehicle';
  termMonths: number;
  contemplationMonth: number;
  installmentType: 'full' | 'half' | 'reduced';
  annualUpdateRate: number;
  creditValue?: number;
  contributionValue?: number;
}

export const SimpleSimulatorForm = () => {
  const [administrators, setAdministrators] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [config, setConfig] = useState<SimulatorConfig>({
    searchType: 'credit_value',
    administrator: '',
    propertyType: 'property',
    termMonths: 240,
    contemplationMonth: 24,
    installmentType: 'full',
    annualUpdateRate: 8,
  });

  const fetchAdministrators = async () => {
    try {
      const { data, error } = await supabase
        .from('administrators')
        .select('id, name')
        .eq('is_archived', false)
        .order('name');
      
      if (error) throw error;
      setAdministrators(data || []);
    } catch (error) {
      console.error('Error fetching administrators:', error);
    }
  };

  const fetchProducts = async (administratorId: string) => {
    if (!administratorId) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('administrator_id', administratorId)
        .eq('is_archived', false)
        .order('credit_value');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchAdministrators();
  }, []);

  useEffect(() => {
    if (config.administrator) {
      fetchProducts(config.administrator);
    }
  }, [config.administrator]);

  const calculateByContribution = (contributionValue: number) => {
    // Encontrar o produto cujo valor de parcela mais se aproxima do valor de aporte
    let bestMatch = products[0];
    let bestDifference = Infinity;
    
    for (const product of products) {
      const estimatedInstallment = product.credit_value / config.termMonths;
      const difference = Math.abs(estimatedInstallment - contributionValue);
      
      if (difference < bestDifference) {
        bestDifference = difference;
        bestMatch = product;
      }
    }

    // Verificar se é necessário unir créditos
    const maxProduct = products[products.length - 1];
    const maxInstallment = maxProduct.credit_value / config.termMonths;
    
    if (contributionValue > maxInstallment) {
      // Calcular valor adicional necessário
      const additionalValue = contributionValue - maxInstallment;
      
      // Encontrar segundo produto
      let secondProduct = products[0];
      for (const product of products) {
        const productInstallment = product.credit_value / config.termMonths;
        if (productInstallment >= additionalValue) {
          secondProduct = product;
          break;
        }
      }
      
      const secondInstallment = secondProduct.credit_value / config.termMonths;
      const percentage = (additionalValue / secondInstallment) * 100;
      
      // Aplicar regras de arredondamento
      let finalSecondProduct = secondProduct;
      if (percentage >= 1 && percentage <= 40) {
        // Arredondar para baixo - usar produto menor se disponível
        const smallerProducts = products.filter(p => p.credit_value < secondProduct.credit_value);
        if (smallerProducts.length > 0) {
          finalSecondProduct = smallerProducts[smallerProducts.length - 1];
        }
      } else if (percentage >= 41 && percentage <= 100) {
        // Arredondar para cima - manter o produto atual
        finalSecondProduct = secondProduct;
      }
      
      return {
        primaryProduct: maxProduct,
        secondaryProduct: finalSecondProduct,
        combinedCredit: maxProduct.credit_value + finalSecondProduct.credit_value,
        combinedInstallment: maxInstallment + (finalSecondProduct.credit_value / config.termMonths)
      };
    }
    
    return {
      primaryProduct: bestMatch,
      estimatedInstallment: bestMatch.credit_value / config.termMonths
    };
  };

  const calculateByCreditValue = (creditValue: number) => {
    // Encontrar o produto cujo valor de crédito mais se aproxima
    let bestMatch = products[0];
    let bestDifference = Infinity;
    
    for (const product of products) {
      const difference = Math.abs(product.credit_value - creditValue);
      
      if (difference < bestDifference) {
        bestDifference = difference;
        bestMatch = product;
      }
    }

    // Verificar se é necessário unir créditos
    const maxProduct = products[products.length - 1];
    
    if (creditValue > maxProduct.credit_value) {
      // Calcular valor adicional necessário
      const additionalCredit = creditValue - maxProduct.credit_value;
      
      // Encontrar segundo produto
      let secondProduct = products[0];
      for (const product of products) {
        if (product.credit_value >= additionalCredit) {
          secondProduct = product;
          break;
        }
      }
      
      const percentage = (additionalCredit / secondProduct.credit_value) * 100;
      
      // Aplicar regras de arredondamento
      let finalSecondProduct = secondProduct;
      if (percentage >= 1 && percentage <= 40) {
        // Arredondar para baixo
        const smallerProducts = products.filter(p => p.credit_value < secondProduct.credit_value);
        if (smallerProducts.length > 0) {
          finalSecondProduct = smallerProducts[smallerProducts.length - 1];
        }
      } else if (percentage >= 41 && percentage <= 100) {
        // Arredondar para cima
        finalSecondProduct = secondProduct;
      }
      
      return {
        primaryProduct: maxProduct,
        secondaryProduct: finalSecondProduct,
        combinedCredit: maxProduct.credit_value + finalSecondProduct.credit_value,
        combinedInstallment: (maxProduct.credit_value + finalSecondProduct.credit_value) / config.termMonths
      };
    }
    
    return {
      primaryProduct: bestMatch,
      estimatedInstallment: bestMatch.credit_value / config.termMonths
    };
  };

  const handleCalculate = () => {
    console.log('Calculando simulação com:', config);
    
    if (config.searchType === 'contribution_value' && config.contributionValue) {
      const result = calculateByContribution(config.contributionValue);
      console.log('Resultado por valor de aporte:', result);
    } else if (config.searchType === 'credit_value' && config.creditValue) {
      const result = calculateByCreditValue(config.creditValue);
      console.log('Resultado por valor de crédito:', result);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const availableTerms = products.length > 0 
    ? [...new Set(products.flatMap(p => p.term_options))].sort((a, b) => a - b)
    : [120, 150, 180, 200, 240];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="bg-gradient-primary p-3 rounded-2xl w-fit mx-auto">
          <Calculator className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Configure Sua Simulação</h2>
          <p className="text-gray-600">Defina os parâmetros para sua simulação de alavancagem patrimonial</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search Type */}
        <div className="space-y-3 md:col-span-2">
          <Label className="text-lg font-semibold text-gray-900">Tipo de Busca *</Label>
          <Select value={config.searchType} onValueChange={(value: 'credit_value' | 'contribution_value') => 
            setConfig(prev => ({ ...prev, searchType: value }))}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="credit_value">Por Valor do Crédito</SelectItem>
              <SelectItem value="contribution_value">Por Valor do Aporte</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Administrator Selection */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold text-gray-900">Administradora *</Label>
          <Select value={config.administrator} onValueChange={(value) => 
            setConfig(prev => ({ ...prev, administrator: value }))}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Selecione a administradora" />
            </SelectTrigger>
            <SelectContent>
              {administrators.map((admin) => (
                <SelectItem key={admin.id} value={admin.id}>
                  {admin.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Property Type */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold text-gray-900">Tipo *</Label>
          <Select value={config.propertyType} onValueChange={(value: 'property' | 'vehicle') => 
            setConfig(prev => ({ ...prev, propertyType: value }))}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="property">Imóvel</SelectItem>
              <SelectItem value="vehicle">Carro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Term */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold text-gray-900">Prazo (meses) *</Label>
          <Select value={config.termMonths.toString()} onValueChange={(value) => 
            setConfig(prev => ({ ...prev, termMonths: parseInt(value) }))}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTerms.map((term) => (
                <SelectItem key={term} value={term.toString()}>
                  {term} meses ({Math.round(term / 12)} anos)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Credit Value or Contribution Value */}
        <div className="space-y-3">
          <Label htmlFor="value" className="text-lg font-semibold text-gray-900">
            {config.searchType === 'credit_value' ? 'Valor do Crédito (R$) *' : 'Valor do Aporte (R$) *'}
          </Label>
          <Input
            id="value"
            type="number"
            value={config.searchType === 'credit_value' ? config.creditValue || '' : config.contributionValue || ''}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (config.searchType === 'credit_value') {
                setConfig(prev => ({ ...prev, creditValue: value }));
              } else {
                setConfig(prev => ({ ...prev, contributionValue: value }));
              }
            }}
            placeholder={config.searchType === 'credit_value' ? "Ex: 300.000" : "Ex: 1.250"}
            className="h-12 text-base"
            min="0"
          />
        </div>

        {/* Contemplation Month */}
        <div className="space-y-3">
          <Label htmlFor="contemplation" className="text-lg font-semibold text-gray-900">
            Mês de Contemplação
          </Label>
          <Input
            id="contemplation"
            type="number"
            value={config.contemplationMonth}
            onChange={(e) => setConfig(prev => ({ ...prev, contemplationMonth: Number(e.target.value) }))}
            placeholder="24"
            className="h-12 text-base"
            min="1"
            max={config.termMonths}
          />
        </div>

        {/* Installment Type */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold text-gray-900">Tipo de Parcela *</Label>
          <Select value={config.installmentType} onValueChange={(value: 'full' | 'half' | 'reduced') => 
            setConfig(prev => ({ ...prev, installmentType: value }))}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Parcela Cheia</SelectItem>
              <SelectItem value="half">Meia Parcela</SelectItem>
              <SelectItem value="reduced">Parcela Reduzida</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Annual Update Rate */}
        <div className="space-y-3">
          <Label htmlFor="updateRate" className="text-lg font-semibold text-gray-900">
            Taxa de Atualização Anual (%)
          </Label>
          <Input
            id="updateRate"
            type="number"
            value={config.annualUpdateRate}
            onChange={(e) => setConfig(prev => ({ ...prev, annualUpdateRate: Number(e.target.value) }))}
            placeholder="8"
            className="h-12 text-base"
            min="0"
            max="20"
            step="0.1"
          />
        </div>
      </div>

      {/* Preview */}
      {config.administrator && (
        <div className="bg-gradient-to-r from-success-50 to-primary-50 p-6 rounded-2xl border border-success-200/50">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <span>Configuração Selecionada</span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-900">Administradora</div>
              <div className="text-gray-600">
                {administrators.find(a => a.id === config.administrator)?.name || 'Não selecionada'}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Tipo</div>
              <div className="text-gray-600">{config.propertyType === 'property' ? 'Imóvel' : 'Carro'}</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Prazo</div>
              <div className="text-gray-600">{config.termMonths} meses</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Busca</div>
              <div className="text-gray-600">
                {config.searchType === 'credit_value' ? 'Por Crédito' : 'Por Aporte'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculate Button */}
      <Button 
        onClick={handleCalculate}
        className="w-full bg-gradient-primary hover:opacity-90 text-white h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        size="lg"
        disabled={!config.administrator || (!config.creditValue && !config.contributionValue)}
      >
        <Calculator className="h-5 w-5 mr-2" />
        Calcular Simulação
      </Button>
    </div>
  );
};
