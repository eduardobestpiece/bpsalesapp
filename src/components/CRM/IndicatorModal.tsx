
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFunnels } from '@/hooks/useCrmData';
import { toast } from 'sonner';

interface IndicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  indicator?: any;
}

export const IndicatorModal = ({ isOpen, onClose, companyId, indicator }: IndicatorModalProps) => {
  const [formData, setFormData] = useState({
    funnel_id: '',
    period_date: new Date().toISOString().split('T')[0],
    month_reference: new Date().getMonth() + 1,
    year_reference: new Date().getFullYear(),
    stages: {} as Record<string, number>,
  });

  const { data: funnels = [] } = useFunnels();
  const isEditMode = !!indicator;

  const selectedFunnel = funnels.find(f => f.id === formData.funnel_id);

  useEffect(() => {
    if (indicator) {
      setFormData({
        funnel_id: indicator.funnel_id || '',
        period_date: indicator.period_date || new Date().toISOString().split('T')[0],
        month_reference: indicator.month_reference || new Date().getMonth() + 1,
        year_reference: indicator.year_reference || new Date().getFullYear(),
        stages: indicator.stages || {},
      });
    } else {
      const now = new Date();
      setFormData({
        funnel_id: '',
        period_date: now.toISOString().split('T')[0],
        month_reference: now.getMonth() + 1,
        year_reference: now.getFullYear(),
        stages: {},
      });
    }
  }, [indicator]);

  const handleStageValueChange = (stageId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      stages: {
        ...prev.stages,
        [stageId]: parseInt(value) || 0
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.funnel_id || !formData.period_date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      // Simulação da criação/edição de indicador
      toast.success(isEditMode ? 'Indicador atualizado com sucesso!' : 'Indicador registrado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar indicador:', error);
      toast.error(isEditMode ? 'Erro ao atualizar indicador' : 'Erro ao registrar indicador');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Indicador' : 'Registrar Indicador'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="period_date">Período *</Label>
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
            <Select value={formData.funnel_id} onValueChange={(value) => setFormData(prev => ({ ...prev, funnel_id: value }))}>
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

          {isEditMode && (
            <div>
              <Label htmlFor="month_reference">Mês de Referência</Label>
              <Select 
                value={formData.month_reference.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, month_reference: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2024, i, 1).toLocaleDateString('pt-BR', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedFunnel?.stages && selectedFunnel.stages.length > 0 && (
            <div className="space-y-4">
              <Label>Números por Etapa</Label>
              <div className="grid gap-4">
                {selectedFunnel.stages
                  .sort((a, b) => a.stage_order - b.stage_order)
                  .map(stage => (
                    <div key={stage.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-sm">{stage.name}</Label>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          min="0"
                          value={formData.stages[stage.id] || ''}
                          onChange={(e) => handleStageValueChange(stage.id, e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditMode ? 'Atualizar Indicador' : 'Registrar Indicador'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
