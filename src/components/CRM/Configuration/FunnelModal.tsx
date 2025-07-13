import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FunnelStage {
  id?: string;
  name: string;
  stage_order: number;
  target_percentage?: number;
  target_value?: number;
}

interface FunnelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funnel?: any;
  onSuccess: () => void;
}

export const FunnelModal = ({ open, onOpenChange, funnel, onSuccess }: FunnelModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<FunnelStage[]>([
    { name: '', stage_order: 1, target_percentage: undefined, target_value: undefined }
  ]);

  useEffect(() => {
    if (funnel) {
      setFormData({
        name: funnel.name || '',
        description: funnel.description || '',
      });
      setStages(funnel.funnel_stages || [{ name: '', stage_order: 1, target_percentage: undefined, target_value: undefined }]);
    } else {
      setFormData({
        name: '',
        description: '',
      });
      setStages([{ name: '', stage_order: 1, target_percentage: undefined, target_value: undefined }]);
    }
  }, [funnel, open]);

  const handleStageChange = (index: number, field: string, value: any) => {
    const newStages = [...stages];
    newStages[index][field] = value;
    setStages(newStages);
  };

  const addStage = () => {
    const newStage: FunnelStage = {
      name: '',
      stage_order: stages.length + 1,
      target_percentage: undefined,
      target_value: undefined
    };
    setStages([...stages, newStage]);
  };

  const removeStage = (index: number) => {
    const newStages = stages.filter((_, i) => i !== index);
    setStages(newStages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        company_id: 'seu_company_id', // Substitua pelo ID da empresa
      };

      if (funnel) {
        // Atualizar funil existente
        const { error } = await supabase
          .from('funnels')
          .update(payload)
          .eq('id', funnel.id);

        if (error) throw error;

        // Atualizar ou inserir estágios do funil
        for (const stage of stages) {
          if (stage.id) {
            // Atualizar estágio existente
            await supabase
              .from('funnel_stages')
              .update({
                name: stage.name,
                stage_order: stage.stage_order,
                target_percentage: stage.target_percentage,
                target_value: stage.target_value
              })
              .eq('id', stage.id);
          } else {
            // Inserir novo estágio
            await supabase
              .from('funnel_stages')
              .insert({
                funnel_id: funnel.id,
                name: stage.name,
                stage_order: stage.stage_order,
                target_percentage: stage.target_percentage,
                target_value: stage.target_value
              });
          }
        }

        toast.success('Funil atualizado com sucesso!');
      } else {
        // Criar novo funil
        const { data: newFunnel, error } = await supabase
          .from('funnels')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        // Inserir estágios do funil
        for (const stage of stages) {
          await supabase
            .from('funnel_stages')
            .insert({
              funnel_id: newFunnel.id,
              name: stage.name,
              stage_order: stage.stage_order,
              target_percentage: stage.target_percentage,
              target_value: stage.target_value
            });
        }

        toast.success('Funil criado com sucesso!');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error('Erro ao salvar funil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{funnel ? 'Editar' : 'Novo'} Funil</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Funil</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <Label>Estágios do Funil</Label>
            {stages.map((stage, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2">
                <div>
                  <Label htmlFor={`stage-name-${index}`}>Nome do Estágio</Label>
                  <Input
                    id={`stage-name-${index}`}
                    value={stage.name}
                    onChange={(e) => handleStageChange(index, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`stage-order-${index}`}>Ordem</Label>
                  <Input
                    id={`stage-order-${index}`}
                    type="number"
                    value={stage.stage_order}
                    onChange={(e) => handleStageChange(index, 'stage_order', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor={`stage-target-percentage-${index}`}>% Alvo</Label>
                  <Input
                    id={`stage-target-percentage-${index}`}
                    type="number"
                    step="0.01"
                    value={stage.target_percentage || ''}
                    onChange={(e) => handleStageChange(index, 'target_percentage', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor={`stage-target-value-${index}`}>Valor Alvo</Label>
                  <Input
                    id={`stage-target-value-${index}`}
                    type="number"
                    value={stage.target_value || ''}
                    onChange={(e) => handleStageChange(index, 'target_value', parseFloat(e.target.value))}
                  />
                </div>
                <div className="sm:col-span-4 flex justify-end">
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeStage(index)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addStage}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Estágio
            </Button>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
