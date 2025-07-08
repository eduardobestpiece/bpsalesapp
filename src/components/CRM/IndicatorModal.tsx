
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFunnels } from '@/hooks/useFunnels';
import { toast } from 'sonner';

interface IndicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  indicator?: any;
}

export const IndicatorModal = ({ isOpen, onClose, companyId, indicator }: IndicatorModalProps) => {
  const [formData, setFormData] = useState({
    period_date: '',
    funnel_id: '',
    month_reference: new Date().getMonth() + 1,
    year_reference: new Date().getFullYear(),
  });

  const [stageValues, setStageValues] = useState<Record<string, number>>({});
  const { data: funnels = [] } = useFunnels();

  const selectedFunnel = funnels.find(f => f.id === formData.funnel_id);

  useEffect(() => {
    if (indicator) {
      setFormData({
        period_date: indicator.period_date,
        funnel_id: indicator.funnel_id,
        month_reference: indicator.month_reference,
        year_reference: indicator.year_reference,
      });
      // Aqui você carregaria os valores das etapas do indicador
    } else {
      const today = new Date();
      setFormData({
        period_date: today.toISOString().split('T')[0],
        funnel_id: '',
        month_reference: today.getMonth() + 1,
        year_reference: today.getFullYear(),
      });
      setStageValues({});
    }
  }, [indicator]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.period_date) {
      toast.error('Data do período é obrigatória');
      return;
    }

    if (!formData.funnel_id) {
      toast.error('Funil é obrigatório');
      return;
    }

    // Verificar se todas as etapas têm valores
    const hasEmptyStages = selectedFunnel?.stages?.some(stage => 
      !stageValues[stage.id] || stageValues[stage.id] === 0
    );

    if (hasEmptyStages) {
      toast.error('Todas as etapas devem ter valores');
      return;
    }

    console.log('Dados do indicador:', {
      ...formData,
      stageValues,
      companyId
    });

    toast.success(indicator ? 'Indicador atualizado com sucesso!' : 'Indicador registrado com sucesso!');
    onClose();
    
    // Reset form
    setFormData({
      period_date: new Date().toISOString().split('T')[0],
      funnel_id: '',
      month_reference: new Date().getMonth() + 1,
      year_reference: new Date().getFullYear(),
    });
    setStageValues({});
  };

  const handleStageValueChange = (stageId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setStageValues(prev => ({
      ...prev,
      [stageId]: numValue
    }));
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {indicator ? 'Editar Indicador' : 'Registrar Indicador'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period_date">Data do Período *</Label>
              <Input
                id="period_date"
                type="date"
                value={formData.period_date}
                onChange={(e) => setFormData(prev => ({ ...prev, period_date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="funnel">Funil *</Label>
              <Select
                value={formData.funnel_id}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, funnel_id: value }));
                  setStageValues({});
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funil" />
                </SelectTrigger>
                <SelectContent>
                  {funnels.map(funnel => (
                    <SelectItem key={funnel.id} value={funnel.id}>
                      {funnel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month_reference">Mês de Referência</Label>
              <Select
                value={formData.month_reference.toString()}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  month_reference: parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year_reference">Ano de Referência</Label>
              <Input
                id="year_reference"
                type="number"
                min={2020}
                max={2030}
                value={formData.year_reference}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  year_reference: parseInt(e.target.value) 
                }))}
              />
            </div>
          </div>

          {selectedFunnel && selectedFunnel.stages && (
            <Card>
              <CardHeader>
                <CardTitle>Etapas do Funil - {selectedFunnel.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedFunnel.stages
                    .sort((a, b) => a.stage_order - b.stage_order)
                    .map((stage, index) => (
                    <div key={stage.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Etapa {stage.stage_order}
                          </span>
                          <h4 className="font-medium">{stage.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Meta: {stage.target_percentage}% ({stage.target_value} leads)
                        </p>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          min="0"
                          placeholder="Quantidade"
                          value={stageValues[stage.id] || ''}
                          onChange={(e) => handleStageValueChange(stage.id, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {indicator ? 'Atualizar' : 'Registrar'} Indicador
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
