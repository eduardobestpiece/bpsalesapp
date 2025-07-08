
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface FunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  funnel?: any;
}

export const FunnelModal = ({ isOpen, onClose, companyId, funnel }: FunnelModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    verification_type: 'weekly' as 'daily' | 'weekly' | 'monthly',
    verification_day: 1,
  });

  const [stages, setStages] = useState([
    { name: 'Contato Inicial', stage_order: 1, target_percentage: 100, target_value: 1000 }
  ]);

  const [baseValue, setBaseValue] = useState(1000);

  useEffect(() => {
    if (funnel) {
      setFormData({
        name: funnel.name,
        verification_type: funnel.verification_type,
        verification_day: funnel.verification_day || 1,
      });
      if (funnel.stages && funnel.stages.length > 0) {
        const sortedStages = funnel.stages.sort((a: any, b: any) => a.stage_order - b.stage_order);
        setStages(sortedStages);
        // Pegar o valor base da primeira etapa
        if (sortedStages[0]?.target_value) {
          setBaseValue(sortedStages[0].target_value);
        }
      }
    } else {
      setFormData({
        name: '',
        verification_type: 'weekly',
        verification_day: 1,
      });
      setStages([
        { name: 'Contato Inicial', stage_order: 1, target_percentage: 100, target_value: 1000 }
      ]);
      setBaseValue(1000);
    }
  }, [funnel]);

  const addStage = () => {
    const newOrder = Math.max(...stages.map(s => s.stage_order)) + 1;
    setStages([...stages, {
      name: '',
      stage_order: newOrder,
      target_percentage: 50,
      target_value: Math.round(baseValue * 0.5)
    }]);
  };

  const removeStage = (index: number) => {
    if (stages.length > 1) {
      setStages(stages.filter((_, i) => i !== index));
    }
  };

  const updateStage = (index: number, field: string, value: any) => {
    const updatedStages = [...stages];
    updatedStages[index] = { ...updatedStages[index], [field]: value };

    // Calcular automaticamente o valor ou percentual
    if (field === 'target_percentage') {
      const percentage = parseFloat(value) || 0;
      const calculatedValue = Math.round((baseValue * percentage) / 100);
      updatedStages[index].target_value = calculatedValue;
    } else if (field === 'target_value') {
      const targetValue = parseFloat(value) || 0;
      const calculatedPercentage = baseValue > 0 ? Math.round((targetValue / baseValue) * 100) : 0;
      updatedStages[index].target_percentage = calculatedPercentage;
    }

    setStages(updatedStages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome do funil é obrigatório');
      return;
    }

    if (stages.some(stage => !stage.name.trim())) {
      toast.error('Todas as etapas devem ter um nome');
      return;
    }

    console.log('Dados do funil:', { formData, stages, baseValue });
    toast.success(funnel ? 'Funil atualizado com sucesso!' : 'Funil criado com sucesso!');
    onClose();
  };

  const handleBaseValueChange = (value: string) => {
    const newBaseValue = parseFloat(value) || 0;
    setBaseValue(newBaseValue);
    
    // Recalcular todos os valores baseados no novo valor base
    const updatedStages = stages.map(stage => ({
      ...stage,
      target_value: Math.round((newBaseValue * stage.target_percentage) / 100)
    }));
    setStages(updatedStages);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {funnel ? 'Editar Funil' : 'Novo Funil'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome do Funil *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Funil Principal"
                required
              />
            </div>

            <div>
              <Label htmlFor="verification_type">Tipo de Verificação *</Label>
              <Select
                value={formData.verification_type}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                  setFormData(prev => ({ ...prev, verification_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.verification_type === 'weekly' || formData.verification_type === 'monthly') && (
              <div>
                <Label htmlFor="verification_day">
                  {formData.verification_type === 'weekly' ? 'Dia da Semana' : 'Dia do Mês'}
                </Label>
                <Input
                  id="verification_day"
                  type="number"
                  min={1}
                  max={formData.verification_type === 'weekly' ? 7 : 31}
                  value={formData.verification_day}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    verification_day: parseInt(e.target.value) 
                  }))}
                />
              </div>
            )}

            <div>
              <Label htmlFor="base_value">Valor Base (primeira etapa)</Label>
              <Input
                id="base_value"
                type="number"
                min="1"
                step="1"
                value={baseValue}
                onChange={(e) => handleBaseValueChange(e.target.value)}
                placeholder="1000"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Etapas do Funil</CardTitle>
                <Button type="button" variant="outline" onClick={addStage}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Etapa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stages.map((stage, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">Etapa {stage.stage_order}</h4>
                      {stages.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStage(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>Nome da Etapa *</Label>
                        <Input
                          value={stage.name}
                          onChange={(e) => updateStage(index, 'name', e.target.value)}
                          placeholder="Ex: Qualificação"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label>Meta (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={stage.target_percentage}
                          onChange={(e) => updateStage(index, 'target_percentage', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label>Meta (Valor)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={stage.target_value}
                          onChange={(e) => updateStage(index, 'target_value', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {funnel ? 'Atualizar' : 'Criar'} Funil
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
