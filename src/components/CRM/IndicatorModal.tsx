
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFunnels } from '@/hooks/useFunnels';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
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
    stages: {} as Record<string, number>
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFunnel, setSelectedFunnel] = useState<any>(null);

  const { crmUser } = useCrmAuth();
  const { data: funnels } = useFunnels(companyId);

  useEffect(() => {
    if (indicator) {
      setFormData({
        period_date: indicator.period_date,
        funnel_id: indicator.funnel_id,
        month_reference: indicator.month_reference,
        year_reference: indicator.year_reference,
        stages: indicator.stages || {}
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        period_date: today,
        funnel_id: '',
        month_reference: new Date().getMonth() + 1,
        year_reference: new Date().getFullYear(),
        stages: {}
      });
    }
  }, [indicator]);

  useEffect(() => {
    if (formData.funnel_id && funnels) {
      const funnel = funnels.find(f => f.id === formData.funnel_id);
      setSelectedFunnel(funnel);
      
      // Initialize stages with empty values if not editing
      if (!indicator && funnel?.stages) {
        const newStages: Record<string, number> = {};
        funnel.stages.forEach((stage: any) => {
          newStages[stage.id] = 0;
        });
        setFormData(prev => ({ ...prev, stages: newStages }));
      }
    }
  }, [formData.funnel_id, funnels, indicator]);

  const handleStageValueChange = (stageId: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      stages: {
        ...prev.stages,
        [stageId]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.period_date || !formData.funnel_id) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!crmUser) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsLoading(true);

    try {
      // Simular salvamento - em um cenário real, seria feito via API
      const indicatorData = {
        ...formData,
        user_id: crmUser.id,
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Saving indicator:', indicatorData);
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(indicator ? 'Indicador atualizado com sucesso!' : 'Indicador registrado com sucesso!');
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar indicador:', error);
      toast.error(error.message || 'Erro ao salvar indicador');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
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
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="funnel_id">Funil *</Label>
              <Select 
                value={formData.funnel_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, funnel_id: value }))}
                disabled={isLoading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funil" />
                </SelectTrigger>
                <SelectContent>
                  {funnels?.map((funnel) => (
                    <SelectItem key={funnel.id} value={funnel.id}>
                      {funnel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month_reference">Mês de Referência</Label>
              <Select 
                value={formData.month_reference.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, month_reference: parseInt(value) }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2024, i).toLocaleString('pt-BR', { month: 'long' })}
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
                value={formData.year_reference}
                onChange={(e) => setFormData(prev => ({ ...prev, year_reference: parseInt(e.target.value) }))}
                min="2020"
                max="2030"
                disabled={isLoading}
              />
            </div>
          </div>

          {selectedFunnel?.stages && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resultados por Etapa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedFunnel.stages
                    .sort((a: any, b: any) => a.stage_order - b.stage_order)
                    .map((stage: any) => (
                      <div key={stage.id}>
                        <Label htmlFor={`stage_${stage.id}`}>
                          {stage.name}
                          {stage.target_value && (
                            <span className="text-sm text-muted-foreground ml-2">
                              (Meta: {stage.target_value})
                            </span>
                          )}
                        </Label>
                        <Input
                          id={`stage_${stage.id}`}
                          type="number"
                          min="0"
                          value={formData.stages[stage.id] || 0}
                          onChange={(e) => handleStageValueChange(stage.id, parseInt(e.target.value) || 0)}
                          placeholder="Digite o resultado"
                          disabled={isLoading}
                        />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.funnel_id}>
              {isLoading ? 'Salvando...' : (indicator ? 'Atualizar' : 'Registrar Indicador')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
