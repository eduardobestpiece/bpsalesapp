
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { useCreateFunnel, useUpdateFunnel, insertFunnelStages, updateFunnelStages, deleteFunnelStages } from '@/hooks/useFunnels';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

interface FunnelStage {
  id?: string;
  name: string;
  stage_order: number;
  target_percentage: number;
  target_value: number;
}

interface FunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  funnel?: any;
}

export const FunnelModal = ({ isOpen, onClose, funnel }: FunnelModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    verification_type: 'weekly' as 'daily' | 'weekly' | 'monthly',
    verification_day: 1,
    sales_value_mode: 'manual' as 'manual' | 'sistema',
    recommendations_mode: 'manual' as 'manual' | 'sistema',
    recommendation_stage_id: '',
    indicator_deadline_hours: 0 // Novo campo: padrão 0
  });
  
  const [stages, setStages] = useState<FunnelStage[]>([
    { name: '', stage_order: 1, target_percentage: 0, target_value: 0 }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [canSelectRecommendationStage, setCanSelectRecommendationStage] = useState(false);

  const { companyId, crmUser } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const createFunnelMutation = useCreateFunnel();
  const updateFunnelMutation = useUpdateFunnel();

  useEffect(() => {
    if (funnel && isOpen) {
      if (funnel.stages) {
        funnel.stages.forEach((s: any, idx: number) => {
        });
      }
      setFormData({
        name: funnel.name,
        verification_type: funnel.verification_type,
        verification_day: funnel.verification_day || 1,
        sales_value_mode: funnel.sales_value_mode || 'manual',
        recommendations_mode: funnel.recommendations_mode || 'manual',
        recommendation_stage_id: funnel.recommendation_stage_id ? String(funnel.recommendation_stage_id).trim() : '',
        indicator_deadline_hours: funnel.indicator_deadline_hours ?? 0
      });
      if (funnel.stages && funnel.stages.length > 0) {
        setStages(funnel.stages.sort((a: any, b: any) => a.stage_order - b.stage_order));
      }
      setCanSelectRecommendationStage(true);
    } else if (isOpen) {
      setFormData({
        name: '',
        verification_type: 'weekly',
        verification_day: 1,
        sales_value_mode: 'manual',
        recommendations_mode: 'manual',
        recommendation_stage_id: '',
        indicator_deadline_hours: 0
      });
      setStages([
        { name: '', stage_order: 1, target_percentage: 0, target_value: 0 }
      ]);
      setCanSelectRecommendationStage(false);
    }
  }, [funnel, isOpen]);

  // Ajuste: garantir que recommendation_stage_id sempre seja o id da etapa
  useEffect(() => {
    // Só preenche automaticamente se NÃO estiver editando (ou seja, criando novo funil)
    if (
      !funnel &&
      stages.length > 0 &&
      stages.filter(stage => !!stage.name).length > 0 &&
      !formData.recommendation_stage_id
    ) {
      const firstStageWithId = stages.find(stage => !!stage.id && !!stage.name);
      if (firstStageWithId) {
        setFormData(prev => ({ ...prev, recommendation_stage_id: firstStageWithId.id }));
      }
    }
  }, [stages, formData.recommendation_stage_id, funnel]);

  // Garantir que recommendation_stage_id corresponde a uma etapa válida ao abrir o modal
  useEffect(() => {
    if (
      funnel &&
      isOpen &&
      stages.length > 0 &&
      formData.recommendation_stage_id &&
      !stages.some(stage => stage.id === formData.recommendation_stage_id)
    ) {
      // Se o valor salvo não existe mais, seta para a primeira etapa válida
      const firstValid = stages.find(stage => !!stage.id && !!stage.name);
      if (firstValid) {
        setFormData(prev => ({ ...prev, recommendation_stage_id: firstValid.id }));
      }
    }
  }, [funnel, isOpen, stages, formData.recommendation_stage_id]);

  const addStage = () => {
    const newStage: FunnelStage = {
      name: '',
      stage_order: stages.length + 1,
      target_percentage: 0,
      target_value: 0
    };
    setStages([...stages, newStage]);
  };

  const removeStage = (index: number) => {
    if (stages.length > 1) {
      const newStages = stages.filter((_, i) => i !== index);
      // Reordenar as etapas
      const reorderedStages = newStages.map((stage, i) => ({
        ...stage,
        stage_order: i + 1
      }));
      setStages(reorderedStages);
    }
  };

  const updateStage = (index: number, field: keyof FunnelStage, value: string | number) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };

    // Definir base de cálculo
    const base = index === 0 ? 0 : newStages[index - 1].target_value;

    // Para etapas 2+, calcular valor/percentual com base na etapa anterior
    if (index > 0) {
      if (field === 'target_percentage') {
        const percentage = Number(value);
        const calculatedValue = Math.round((base * percentage) / 100);
        newStages[index].target_value = calculatedValue;
      }
      if (field === 'target_value') {
        const targetValue = Number(value);
        const calculatedPercentage = base > 0 ? (targetValue / base) * 100 : 0;
        newStages[index].target_percentage = Math.round(calculatedPercentage * 100) / 100;
      }
    }
    setStages(newStages);
  };

  const getVerificationDayOptions = () => {
    if (formData.verification_type === 'weekly') {
      return [
        { value: 1, label: 'Segunda-feira' },
        { value: 2, label: 'Terça-feira' },
        { value: 3, label: 'Quarta-feira' },
        { value: 4, label: 'Quinta-feira' },
        { value: 5, label: 'Sexta-feira' },
        { value: 6, label: 'Sábado' },
        { value: 0, label: 'Domingo' },
      ];
    } else {
      return Array.from({ length: 31 }, (_, i) => ({
        value: i + 1,
        label: `Dia ${i + 1}`
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome do funil é obrigatório');
      return;
    }

    if (stages.length === 0) {
      toast.error('Pelo menos uma etapa é obrigatória');
      return;
    }

    const hasEmptyStages = stages.some(stage => !stage.name.trim());
    if (hasEmptyStages) {
      toast.error('Todas as etapas devem ter um nome');
      return;
    }

    if (!companyId) {
      toast.error('Erro: Empresa não identificada');
      return;
    }

    if (formData.indicator_deadline_hours < 0 || !Number.isInteger(formData.indicator_deadline_hours)) {
      toast.error('O prazo do indicador deve ser um número inteiro maior ou igual a 0.');
      return;
    }

    setIsLoading(true);

    try {
      const funnelData = {
        name: formData.name.trim(),
        verification_type: formData.verification_type,
        verification_day: formData.verification_type === 'daily' ? null : formData.verification_day,
        company_id: selectedCompanyId || companyId,
        status: 'active' as const,
        sales_value_mode: formData.sales_value_mode,
        recommendations_mode: formData.recommendations_mode,
        indicator_deadline_hours: formData.indicator_deadline_hours,
        // Não enviar recommendation_stage_id na criação, só na edição
        // recommendation_stage_id: formData.recommendation_stage_id ? String(formData.recommendation_stage_id).trim() : null
      };

      if (funnel) {
        // Editar funil existente
        await updateFunnelMutation.mutateAsync({ id: funnel.id, ...funnelData, recommendation_stage_id: formData.recommendation_stage_id ? String(formData.recommendation_stage_id).trim() : null });
        // Atualizar etapas existentes e inserir novas
        await updateFunnelStages(funnel.id, stages);
        // Remover etapas excluídas
        const oldStageIds = (funnel.stages || []).map((s: any) => s.id);
        const currentStageIds = stages.filter(s => s.id).map(s => s.id);
        const toDelete = oldStageIds.filter((id: string) => !currentStageIds.includes(id));
        if (toDelete.length) await deleteFunnelStages(toDelete);
        toast.success('Funil atualizado com sucesso!');
      } else {
        // Criar novo funil SEM recommendation_stage_id
        const created = await createFunnelMutation.mutateAsync(funnelData);
        await insertFunnelStages(created.id, stages);
        // Buscar novamente as etapas para pegar os IDs gerados
        const { data: etapasCriadas, error: errorEtapas } = await supabase
          .from('funnel_stages')
          .select('id, name')
          .eq('funnel_id', created.id);
        if (errorEtapas) throw errorEtapas;
        // Atualizar o estado para permitir seleção do campo recommendation_stage_id
        setStages(etapasCriadas?.map(stage => ({
          id: stage.id,
          name: stage.name,
          stage_order: 0,
          target_percentage: null,
          target_value: null,
        })) || []);
        setCanSelectRecommendationStage(true);
        toast.success('Funil criado! Agora selecione a etapa ligada às recomendações e salve novamente.');
        // Não fecha o modal, aguarda o usuário selecionar e salvar o campo recommendation_stage_id
        setFormData(prev => ({ ...prev, recommendation_stage_id: '' }));
        setIsLoading(false);
        return;
      }
      onClose();
      
      // Reset form
      setFormData({ name: '', verification_type: 'weekly', verification_day: 1, sales_value_mode: 'manual', recommendations_mode: 'manual', recommendation_stage_id: '', indicator_deadline_hours: 0 });
      setStages([{ name: '', stage_order: 1, target_percentage: 0, target_value: 0 }]);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar funil');
    } finally {
      setIsLoading(false);
    }
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
                placeholder="Ex: Funil de Vendas Online"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="verification_type">Periodicidade *</Label>
              <Select
                value={formData.verification_type}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                  setFormData(prev => ({ 
                    ...prev, 
                    verification_type: value,
                    verification_day: value === 'weekly' ? 1 : 1
                  }))
                }
                disabled={isLoading}
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

            {/* CAMPOS RESTRITOS MASTER/ADMIN */}
            {['master', 'admin'].includes(crmUser?.role) && (
              <>
                <div>
                  <Label htmlFor="sales_value_mode">Valor das Vendas</Label>
                  <Select
                    value={formData.sales_value_mode}
                    onValueChange={(value: 'manual' | 'sistema') => setFormData(prev => ({ ...prev, sales_value_mode: value }))}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="sistema">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="recommendations_mode">Recomendações</Label>
                  <Select
                    value={formData.recommendations_mode}
                    onValueChange={(value: 'manual' | 'sistema') => setFormData(prev => ({ ...prev, recommendations_mode: value }))}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="sistema">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {formData.verification_type !== 'daily' && (
              <div>
                <Label htmlFor="verification_day">
                  {formData.verification_type === 'weekly' ? 'Dia da Semana' : 'Dia do Mês'}
                </Label>
                <Select
                  value={formData.verification_day.toString()}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    verification_day: parseInt(value) 
                  }))}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getVerificationDayOptions().map(option => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="indicator_deadline_hours">Prazo do Indicador (horas)</Label>
              <Input
                id="indicator_deadline_hours"
                type="number"
                min={0}
                step={1}
                value={formData.indicator_deadline_hours}
                onChange={e => setFormData(prev => ({ ...prev, indicator_deadline_hours: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))}
                disabled={isLoading}
                required
              />
              <div className="text-xs text-muted-foreground mt-1">
                0 = até a data fim do período, 24 = 1 dia após, 48 = 2 dias após, etc.
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Etapas do Funil</CardTitle>
                <Button type="button" onClick={addStage} size="sm" disabled={isLoading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Etapa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.recommendation_stage_id || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, recommendation_stage_id: value }))}
                className="space-y-4"
              >
                {stages.map((stage, index) => (
                  <div key={index} className="p-4 border rounded-lg flex items-start gap-4">
                    <RadioGroupItem
                      value={stage.id || ''}
                      id={`recommendation-radio-${index}`}
                      className="mt-2"
                      disabled={isLoading || !stage.id}
                      aria-label={`Selecionar etapa ${stage.name}`}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Etapa {stage.stage_order}</h4>
                        {stages.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeStage(index)}
                            disabled={isLoading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Nome da Etapa *</Label>
                          <Input
                            value={stage.name}
                            onChange={(e) => updateStage(index, 'name', e.target.value)}
                            placeholder="Ex: Prospecção"
                            required
                            disabled={isLoading}
                          />
                        </div>
                        {index > 0 && (
                          <div>
                            <Label>Percentual (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={stage.target_percentage}
                              onChange={(e) => updateStage(index, 'target_percentage', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              disabled={isLoading}
                            />
                          </div>
                        )}
                        <div>
                          <Label>Valor (quantidade)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={stage.target_value}
                            onChange={(e) => updateStage(index, 'target_value', parseInt(e.target.value) || 0)}
                            placeholder="0"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (funnel ? 'Atualizar' : 'Criar')} Funil
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
