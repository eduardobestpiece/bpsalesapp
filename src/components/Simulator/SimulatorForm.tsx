
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { SimulatorData } from '@/types/simulator';
import { ProposalGenerator } from './ProposalGenerator';
import { Calculator, TrendingUp, Target, Clock, Info } from 'lucide-react';

interface SimulatorFormProps {
  data: SimulatorData;
  onChange: (data: SimulatorData) => void;
  onCalculate: () => void;
  onOpenDetails: () => void;
}

export const SimulatorForm = ({ data, onChange, onCalculate, onOpenDetails }: SimulatorFormProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTypeChange = (type: 'installment' | 'credit' | 'income') => {
    onChange({ ...data, simulationType: type, value: 0 });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.value || data.value <= 0) {
      newErrors.value = 'Valor deve ser maior que zero';
    }
    
    if (data.simulationType === 'installment' && data.value < 100) {
      newErrors.value = 'Valor mínimo da parcela: R$ 100';
    }
    
    if (data.simulationType === 'credit' && data.value < 50000) {
      newErrors.value = 'Valor mínimo do crédito: R$ 50.000';
    }
    
    if (data.simulationType === 'income' && data.value < 500) {
      newErrors.value = 'Renda mínima desejada: R$ 500';
    }
    
    if (data.contemplationPeriod < 6 || data.contemplationPeriod > data.simulationTime) {
      newErrors.contemplation = 'Prazo deve ser entre 6 meses e o tempo total';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = () => {
    if (validateForm()) {
      onCalculate();
    }
  };

  const getFieldLabel = () => {
    switch (data.simulationType) {
      case 'installment': return 'Valor da Parcela (R$)';
      case 'credit': return 'Valor do Crédito (R$)';
      case 'income': return 'Renda Desejada (R$)';
    }
  };

  const getFieldPlaceholder = () => {
    switch (data.simulationType) {
      case 'installment': return 'Ex: 1.250';
      case 'credit': return 'Ex: 200.000';
      case 'income': return 'Ex: 3.500';
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="bg-gradient-primary p-3 rounded-2xl w-fit mx-auto">
          <Calculator className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Configure Sua Simulação</h2>
          <p className="text-gray-600">Escolha o tipo de simulação que melhor se adequa aos seus objetivos</p>
        </div>
      </div>
      
      {/* Simulation Type Selection */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold text-gray-900">Tipo de Simulação</Label>
        <div className="grid grid-cols-1 gap-4">
          <Button
            variant={data.simulationType === 'installment' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('installment')}
            className={`h-auto p-6 justify-start text-left transition-all duration-200 ${
              data.simulationType === 'installment' 
                ? 'bg-gradient-primary hover:opacity-90 shadow-lg border-0' 
                : 'hover:bg-primary-50 hover:border-primary-200'
            }`}
          >
            <div className="flex items-center space-x-4 w-full">
              <TrendingUp className="h-6 w-6 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Simular por Parcela</span>
                  <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">
                    Mais comum
                  </Badge>
                </div>
                <p className="text-sm opacity-80 mt-1">Ideal para quem quer controlar o valor mensal</p>
              </div>
            </div>
          </Button>
          
          <Button
            variant={data.simulationType === 'credit' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('credit')}
            className={`h-auto p-6 justify-start text-left transition-all duration-200 ${
              data.simulationType === 'credit' 
                ? 'bg-gradient-primary hover:opacity-90 shadow-lg border-0' 
                : 'hover:bg-primary-50 hover:border-primary-200'
            }`}
          >
            <div className="flex items-center space-x-4 w-full">
              <Target className="h-6 w-6 shrink-0" />
              <div className="flex-1">
                <span className="font-semibold">Simular por Crédito</span>
                <p className="text-sm opacity-80 mt-1">Para quem tem uma meta de crédito específica</p>
              </div>
            </div>
          </Button>
          
          <Button
            variant={data.simulationType === 'income' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('income')}
            className={`h-auto p-6 justify-start text-left transition-all duration-200 ${
              data.simulationType === 'income' 
                ? 'bg-gradient-primary hover:opacity-90 shadow-lg border-0' 
                : 'hover:bg-primary-50 hover:border-primary-200'
            }`}
          >
            <div className="flex items-center space-x-4 w-full">
              <Clock className="h-6 w-6 shrink-0" />
              <div className="flex-1">
                <span className="font-semibold">Simular por Renda Objetivo</span>
                <p className="text-sm opacity-80 mt-1">Defina a renda passiva que deseja alcançar</p>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Value Input */}
      <div className="space-y-3">
        <Label htmlFor="value" className="text-lg font-semibold text-gray-900">
          {getFieldLabel()}
        </Label>
        <div className="relative">
          <Input
            id="value"
            type="number"
            value={data.value || ''}
            onChange={(e) => onChange({ ...data, value: Number(e.target.value) })}
            placeholder={getFieldPlaceholder()}
            className={`text-xl h-14 text-center font-semibold transition-all duration-200 ${
              errors.value 
                ? 'border-destructive focus:border-destructive' 
                : 'focus:border-primary-400 focus:ring-primary-100'
            }`}
          />
        </div>
        {errors.value && (
          <p className="text-sm text-destructive flex items-center space-x-1">
            <Info className="h-4 w-4" />
            <span>{errors.value}</span>
          </p>
        )}
        {data.value > 0 && (
          <div className="bg-primary-50 p-4 rounded-xl">
            <p className="text-primary-700 font-medium text-center">
              {formatCurrency(data.value)}
            </p>
          </div>
        )}
      </div>

      {/* Installment Type */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold text-gray-900">Tipo de Parcela</Label>
        <Select 
          value={data.installmentType} 
          onValueChange={(value: 'reduced' | 'full') => onChange({ ...data, installmentType: value })}
        >
          <SelectTrigger className="h-12 text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full" className="p-4">
              <div className="flex flex-col">
                <span className="font-medium">Parcela Cheia</span>
                <span className="text-sm text-muted-foreground">Para quem já foi contemplado</span>
              </div>
            </SelectItem>
            <SelectItem value="reduced" className="p-4">
              <div className="flex flex-col">
                <span className="font-medium">Parcela Reduzida</span>
                <span className="text-sm text-muted-foreground">Para quem ainda não foi contemplado</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Simulation Time */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold text-gray-900">
          Tempo de Simulação: {data.simulationTime} meses ({Math.round(data.simulationTime / 12)} anos)
        </Label>
        <div className="bg-gray-50 p-6 rounded-xl space-y-4">
          <Slider
            value={[data.simulationTime]}
            onValueChange={(value) => onChange({ ...data, simulationTime: value[0] })}
            min={120}
            max={480}
            step={12}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>10 anos</span>
            <span className="font-medium text-primary-600">{Math.round(data.simulationTime / 12)} anos</span>
            <span>40 anos</span>
          </div>
        </div>
      </div>

      {/* Contemplation Period */}
      <div className="space-y-3">
        <Label htmlFor="contemplation" className="text-lg font-semibold text-gray-900">
          Período de Contemplação (meses)
        </Label>
        <Input
          id="contemplation"
          type="number"
          value={data.contemplationPeriod}
          onChange={(e) => onChange({ ...data, contemplationPeriod: Number(e.target.value) })}
          placeholder="Ex: 24"
          className={`h-12 text-base ${errors.contemplation ? 'border-destructive' : ''}`}
        />
        {errors.contemplation && (
          <p className="text-sm text-destructive flex items-center space-x-1">
            <Info className="h-4 w-4" />
            <span>{errors.contemplation}</span>
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Tempo esperado para contemplação (recomendado: 6-60 meses)
        </p>
      </div>

      {/* Quick Preview */}
      {data.value > 0 && (
        <div className="bg-gradient-to-r from-success-50 to-primary-50 p-6 rounded-2xl border border-success-200/50">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <span>Prévia da Simulação</span>
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {Math.floor(data.simulationTime / data.contemplationPeriod)}
              </div>
              <div className="text-sm text-gray-600">Imóveis Estimados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {formatCurrency(Math.floor(data.simulationTime / data.contemplationPeriod) * 200000)}
              </div>
              <div className="text-sm text-gray-600">Patrimônio Estimado</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        <Button 
          onClick={handleCalculate}
          className="w-full bg-gradient-primary hover:opacity-90 text-white h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
          disabled={!data.value}
        >
          <Calculator className="h-5 w-5 mr-2" />
          Calcular Simulação Completa
        </Button>
        
        <ProposalGenerator data={data} />
      </div>

      {/* Details Link */}
      <button
        onClick={onOpenDetails}
        className="w-full text-sm text-primary-600 hover:text-primary-700 underline underline-offset-4 hover:underline-offset-2 transition-all duration-200 py-2"
      >
        <Info className="h-4 w-4 inline mr-1" />
        Configurações Avançadas e Detalhes
      </button>
    </div>
  );
};
