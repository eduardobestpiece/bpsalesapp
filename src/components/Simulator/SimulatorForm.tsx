
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { SimulatorData } from '@/types/simulator';

interface SimulatorFormProps {
  data: SimulatorData;
  onChange: (data: SimulatorData) => void;
  onCalculate: () => void;
  onOpenDetails: () => void;
}

export const SimulatorForm = ({ data, onChange, onCalculate, onOpenDetails }: SimulatorFormProps) => {
  const handleTypeChange = (type: 'installment' | 'credit' | 'income') => {
    onChange({ ...data, simulationType: type, value: 0 });
  };

  const getFieldLabel = () => {
    switch (data.simulationType) {
      case 'installment': return 'Valor da Parcela (R$)';
      case 'credit': return 'Valor do Crédito (R$)';
      case 'income': return 'Renda Desejada (R$)';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Simulador</h2>
        
        {/* Simulation Type Selection */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          <Button
            variant={data.simulationType === 'installment' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('installment')}
            className={data.simulationType === 'installment' ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            Por Parcela
          </Button>
          <Button
            variant={data.simulationType === 'credit' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('credit')}
            className={data.simulationType === 'credit' ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            Por Crédito
          </Button>
          <Button
            variant={data.simulationType === 'income' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('income')}
            className={data.simulationType === 'income' ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            Por Renda Desejada
          </Button>
        </div>

        {/* Value Input */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="value">{getFieldLabel()}</Label>
          <Input
            id="value"
            type="number"
            value={data.value}
            onChange={(e) => onChange({ ...data, value: Number(e.target.value) })}
            placeholder="Digite o valor"
            className="text-lg"
          />
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
              <SelectItem value="full">Parcela Cheia</SelectItem>
              <SelectItem value="reduced">Parcela Reduzida</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Simulation Time */}
        <div className="space-y-4 mb-4">
          <Label>Tempo de Simulação: {data.simulationTime} meses</Label>
          <Slider
            value={[data.simulationTime]}
            onValueChange={(value) => onChange({ ...data, simulationTime: value[0] })}
            min={120}
            max={480}
            step={12}
            className="w-full"
          />
          <Input
            type="number"
            value={data.simulationTime}
            onChange={(e) => onChange({ ...data, simulationTime: Number(e.target.value) })}
            min={120}
            max={480}
            className="w-20"
          />
        </div>

        {/* Contemplation Period */}
        <div className="space-y-2 mb-6">
          <Label htmlFor="contemplation">Simulador de Prazo (meses)</Label>
          <Input
            id="contemplation"
            type="number"
            value={data.contemplationPeriod}
            onChange={(e) => onChange({ ...data, contemplationPeriod: Number(e.target.value) })}
            placeholder="A cada quantos meses será contemplado"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={onCalculate}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            size="lg"
          >
            Calcular
          </Button>
          <Button 
            variant="outline"
            className="w-full"
            size="lg"
          >
            Gerar Proposta
          </Button>
        </div>

        {/* Details Link */}
        <button
          onClick={onOpenDetails}
          className="text-sm text-muted-foreground hover:text-foreground underline mt-4"
        >
          Detalhar
        </button>
      </div>
    </div>
  );
};
