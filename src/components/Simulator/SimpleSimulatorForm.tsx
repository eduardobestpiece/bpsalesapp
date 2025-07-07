
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calculator, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const SimpleSimulatorForm = () => {
  const [administrators, setAdministrators] = useState<any[]>([]);
  const [selectedAdministrator, setSelectedAdministrator] = useState('');
  const [contemplationMonth, setContemplationMonth] = useState(24);
  const [installmentType, setInstallmentType] = useState<'full' | 'half' | 'reduced'>('full');
  const [annualUpdateRate, setAnnualUpdateRate] = useState(8);

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

  useEffect(() => {
    fetchAdministrators();
  }, []);

  const handleCalculate = () => {
    console.log('Calculando simulação com:', {
      administrator: selectedAdministrator,
      contemplationMonth,
      installmentType,
      annualUpdateRate
    });
    // Aqui você pode implementar a lógica de cálculo
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
          <p className="text-gray-600">Defina os parâmetros básicos para sua simulação de alavancagem patrimonial</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Administrator Selection */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold text-gray-900">Administradora *</Label>
          <Select value={selectedAdministrator} onValueChange={setSelectedAdministrator}>
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

        {/* Contemplation Month */}
        <div className="space-y-3">
          <Label htmlFor="contemplation" className="text-lg font-semibold text-gray-900">
            Mês de Contemplação
          </Label>
          <Input
            id="contemplation"
            type="number"
            value={contemplationMonth}
            onChange={(e) => setContemplationMonth(Number(e.target.value))}
            placeholder="24"
            className="h-12 text-base"
            min="1"
            max="240"
          />
          <p className="text-sm text-muted-foreground">
            Tempo esperado para contemplação (em meses)
          </p>
        </div>

        {/* Installment Type */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold text-gray-900">Tipo de Parcela *</Label>
          <Select value={installmentType} onValueChange={(value: 'full' | 'half' | 'reduced') => setInstallmentType(value)}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">
                <div className="flex flex-col">
                  <span className="font-medium">Parcela Cheia</span>
                  <span className="text-sm text-muted-foreground">Para quem já foi contemplado</span>
                </div>
              </SelectItem>
              <SelectItem value="half">
                <div className="flex flex-col">
                  <span className="font-medium">Meia Parcela</span>
                  <span className="text-sm text-muted-foreground">Valor intermediário</span>
                </div>
              </SelectItem>
              <SelectItem value="reduced">
                <div className="flex flex-col">
                  <span className="font-medium">Parcela Reduzida</span>
                  <span className="text-sm text-muted-foreground">Para quem ainda não foi contemplado</span>
                </div>
              </SelectItem>
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
            value={annualUpdateRate}
            onChange={(e) => setAnnualUpdateRate(Number(e.target.value))}
            placeholder="8"
            className="h-12 text-base"
            min="0"
            max="20"
            step="0.1"
          />
          <p className="text-sm text-muted-foreground">
            Taxa de correção anual dos valores
          </p>
        </div>
      </div>

      {/* Preview */}
      {selectedAdministrator && (
        <div className="bg-gradient-to-r from-success-50 to-primary-50 p-6 rounded-2xl border border-success-200/50">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <span>Configuração Selecionada</span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-900">Administradora</div>
              <div className="text-gray-600">
                {administrators.find(a => a.id === selectedAdministrator)?.name || 'Não selecionada'}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Contemplação</div>
              <div className="text-gray-600">{contemplationMonth} meses</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Tipo de Parcela</div>
              <div className="text-gray-600">
                {installmentType === 'full' ? 'Cheia' : installmentType === 'half' ? 'Meia' : 'Reduzida'}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Taxa Anual</div>
              <div className="text-gray-600">{annualUpdateRate}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Calculate Button */}
      <Button 
        onClick={handleCalculate}
        className="w-full bg-gradient-primary hover:opacity-90 text-white h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        size="lg"
        disabled={!selectedAdministrator}
      >
        <Calculator className="h-5 w-5 mr-2" />
        Calcular Simulação
      </Button>
    </div>
  );
};
