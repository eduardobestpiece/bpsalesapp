
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Simulador de Alavancagem</h2>
        
        {/* Simulation Type Selection */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          <Button
            variant={data.simulationType === 'installment' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('installment')}
            className={data.simulationType === 'installment' ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            Simular por Parcela
            <Badge variant="secondary" className="ml-2">Mais comum</Badge>
          </Button>
          <Button
            variant={data.simulationType === 'credit' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('credit')}
            className={data.simulationType === 'credit' ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            Simular por Crédito
          </Button>
          <Button
            variant={data.simulationType === 'income' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('income')}
            className={data.simulationType === 'income' ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            Simular por Renda Objetivo
          </Button>
        </div>

        {/* Value Input */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="value">{getFieldLabel()}</Label>
          <Input
            id="value"
            type="number"
            value={data.value || ''}
            onChange={(e) => onChange({ ...data, value: Number(e.target.value) })}
            placeholder={getFieldPlaceholder()}
            className={`text-lg ${errors.value ? 'border-red-500' : ''}`}
          />
          {errors.value && (
            <p className="text-sm text-red-500">{errors.value}</p>
          )}
          {data.value > 0 && (
            <p className="text-sm text-muted-foreground">
              Valor formatado: {formatCurrency(data.value)}
            </p>
          )}
        </div>

        {/* Installment Type */}
        <div className="space-y-2 mb-4">
          <Label>Tipo de Parcela</Label>
          <Select 
            value={data.installmentType} 
            onValueChange={(value: 'reduced' | 'full') => onChange({ ...data, installmentType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">
                Parcela Cheia
                <span className="text-muted-foreground ml-2">(Contemplado)</span>
              </SelectItem>
              <SelectItem value="reduced">
                Parcela Reduzida
                <span className="text-muted-foreground ml-2">(Não contemplado)</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Simulation Time */}
        <div className="space-y-4 mb-4">
          <Label>Tempo de Simulação: {data.simulationTime} meses ({Math.round(data.simulationTime / 12)} anos)</Label>
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
            <span>40 anos</span>
          </div>
        </div>

        {/* Contemplation Period */}
        <div className="space-y-2 mb-6">
          <Label htmlFor="contemplation">Período de Contemplação (meses)</Label>
          <Input
            id="contemplation"
            type="number"
            value={data.contemplationPeriod}
            onChange={(e) => onChange({ ...data, contemplationPeriod: Number(e.target.value) })}
            placeholder="Ex: 24"
            className={errors.contemplation ? 'border-red-500' : ''}
          />
          {errors.contemplation && (
            <p className="text-sm text-red-500">{errors.contemplation}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Frequência esperada de contemplação (6-60 meses)
          </p>
        </div>

        {/* Quick Calculation Preview */}
        {data.value > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <h4 className="font-medium mb-2">Prévia Rápida:</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Imóveis em {data.simulationTime} meses:</span>
                <span className="font-medium">{Math.floor(data.simulationTime / data.contemplationPeriod)}</span>
              </div>
              <div className="flex justify-between">
                <span>Patrimônio estimado:</span>
                <span className="font-medium">R$ {(Math.floor(data.simulationTime / data.contemplationPeriod) * 50000).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleCalculate}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            size="lg"
            disabled={!data.value}
          >
            Calcular Simulação Completa
          </Button>
          
          <ProposalGenerator data={data} />
        </div>

        {/* Details Link */}
        <button
          onClick={onOpenDetails}
          className="text-sm text-muted-foreground hover:text-foreground underline mt-4 block w-full text-center"
        >
          Configurações Avançadas e Detalhes
        </button>
      </div>
    </div>
  );
};
