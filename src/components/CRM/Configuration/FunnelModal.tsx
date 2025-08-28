
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

import { Plus, X, Link } from 'lucide-react';
import { useFunnels, useCreateFunnel, useUpdateFunnel, insertFunnelStages, updateFunnelStages, deleteFunnelStages } from '@/hooks/useFunnels';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

// Debug function
const debugLog = (message: string, data?: any) => {
  console.log(`[FUNNEL_MODAL_DEBUG] ${message}`, data || '');
};

interface FunnelStage {
  id?: string;
  name: string;
  stage_order: number;
  target_percentage: number;
  target_value: number;
  is_conversion?: boolean;
  conversion_type?: 'MQL' | 'SQL' | 'SAL' | 'Venda';
  conversion_enabled?: boolean;
  conversion_funnel_id?: string;
  conversion_stage_id?: string;
}

interface FunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  funnel?: any;
}

export const FunnelModal = ({ isOpen, onClose, funnel }: FunnelModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    recommendation_stage_id: '',
    recommendation_target: 0
  });
  
  const [stages, setStages] = useState<FunnelStage[]>([
    { name: '', stage_order: 1, target_percentage: 0, target_value: 0, is_conversion: false, conversion_type: undefined }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [canSelectRecommendationStage, setCanSelectRecommendationStage] = useState(false);


  const { companyId, crmUser } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const createFunnelMutation = useCreateFunnel();
  const updateFunnelMutation = useUpdateFunnel();
  const { data: funnels = [] } = useFunnels(selectedCompanyId || companyId);



  useEffect(() => {
    if (funnel && isOpen) {
      if (funnel.stages) {
        funnel.stages.forEach((s: any, idx: number) => {
        });
      }
      setFormData({
        name: funnel.name,
        recommendation_stage_id: funnel.recommendation_stage_id ? String(funnel.recommendation_stage_id).trim() : '',
        recommendation_target: funnel.recommendation_target || 0
      });
      if (funnel.stages && funnel.stages.length > 0) {
        setStages(funnel.stages.sort((a: any, b: any) => a.stage_order - b.stage_order));
      }
      setCanSelectRecommendationStage(true);
    } else if (isOpen) {
      setFormData({
        name: '',
        recommendation_stage_id: '',
        recommendation_target: 0
      });
              setStages([
          { name: '', stage_order: 1, target_percentage: 0, target_value: 0, is_conversion: false, conversion_type: undefined }
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
      if (firstStageWithId && firstStageWithId.id) {
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
      if (firstValid && firstValid.id) {
        setFormData(prev => ({ ...prev, recommendation_stage_id: firstValid.id }));
      }
    }
  }, [funnel, isOpen, stages, formData.recommendation_stage_id]);

  const addStage = () => {
    const newStage: FunnelStage = {
      name: '',
      stage_order: stages.length + 1,
      target_percentage: 0,
      target_value: 0,
      is_conversion: false,
      conversion_type: undefined
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





  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    debugLog('=== INÍCIO HANDLE SUBMIT ===');
    debugLog('FormData:', formData);
    debugLog('Stages:', stages);
    debugLog('Funnel (editando?):', funnel ? 'SIM' : 'NÃO');
    
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



    setIsLoading(true);

    try {
      const funnelData = {
        name: formData.name.trim(),
        company_id: selectedCompanyId || companyId,
        status: 'active' as const,
        verification_type: 'daily' as const, // Campo obrigatório
        // Não enviar recommendation_stage_id na criação, só na edição
        // recommendation_stage_id: formData.recommendation_stage_id ? String(formData.recommendation_stage_id).trim() : null
      };

      if (funnel) {
        // Editar funil existente
        // Validar se recommendation_stage_id é um UUID válido ou um identificador temporário válido
        let recommendationStageId = null;
        if (formData.recommendation_stage_id) {
          if (formData.recommendation_stage_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            // É um UUID válido
            recommendationStageId = formData.recommendation_stage_id;
          } else if (formData.recommendation_stage_id.startsWith('temp-')) {
            // É um identificador temporário, converter para o ID real da etapa
            const tempIndex = parseInt(formData.recommendation_stage_id.replace('temp-', ''));
            const stage = stages[tempIndex];
            if (stage && stage.id) {
              recommendationStageId = stage.id;
            }
          }
        }

        debugLog('Atualizando funil com recommendationStageId:', recommendationStageId);
        debugLog('Recommendation target:', formData.recommendation_target);
        
        await updateFunnelMutation.mutateAsync({ 
          id: funnel.id, 
          ...funnelData, 
          recommendation_stage_id: recommendationStageId,
          recommendation_target: formData.recommendation_target
        });
        
        debugLog('Funil atualizado, agora atualizando etapas...');
        debugLog('Stages para atualizar:', stages);
        
        // Atualizar etapas existentes e inserir novas
        await updateFunnelStages(funnel.id, stages);
        // Remover etapas excluídas
        const oldStageIds = (funnel.stages || []).map((s: any) => s.id);
        const currentStageIds = stages.filter(s => s.id).map(s => s.id);
        const toDelete = oldStageIds.filter((id: string) => !currentStageIds.includes(id));
        if (toDelete.length) await deleteFunnelStages(toDelete);
        toast.success('Funil atualizado com sucesso!');
      } else {
        // Criar novo funil
        debugLog('Criando novo funil...');
        debugLog('FunnelData:', funnelData);
        debugLog('Stages para inserir:', stages);
        
        // Criar novo funil SEM recommendation_stage_id
        const created = await createFunnelMutation.mutateAsync(funnelData);
        debugLog('Funil criado:', created);
        
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
      setFormData({ name: '', recommendation_stage_id: '', recommendation_target: 0 });
      setStages([{ name: '', stage_order: 1, target_percentage: 0, target_value: 0, is_conversion: false, conversion_type: undefined }]);
    } catch (error: any) {
      debugLog('=== ERRO CAPTURADO ===');
      debugLog('Error object:', error);
      debugLog('Error message:', error.message);
      debugLog('Error details:', error.details);
      debugLog('Error hint:', error.hint);
      debugLog('Error code:', error.code);
      
      toast.error(error.message || 'Erro ao salvar funil');
    } finally {
      debugLog('=== FIM HANDLE SUBMIT ===');
      setIsLoading(false);
    }
  };

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={funnel ? 'Editar Funil' : 'Novo Funil'}
      actions={<Button type="submit" form="funnel-form" variant="brandPrimaryToSecondary" className="brand-radius">{isLoading ? 'Salvando...' : (funnel ? 'Atualizar' : 'Criar')}</Button>}
    >
        <form id="funnel-form" onSubmit={handleSubmit} className="space-y-6">
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
                className="campo-brand brand-radius"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Etapas do Funil</h3>
              <Button type="button" onClick={addStage} size="sm" disabled={isLoading} variant="brandOutlineSecondaryHover" className="brand-radius">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Etapa
              </Button>
            </div>
            
                        <div className="space-y-4">
              {stages.map((stage, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4 brand-radius bg-[#2A2A2A]">
                  {/* Primeira linha: Etapa e Checkboxes */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <h4 className="font-medium text-white">Etapa {stage.stage_order}</h4>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`recommendation-checkbox-${index}`}
                            checked={formData.recommendation_stage_id === stage.id || 
                                     formData.recommendation_stage_id === `temp-${index}`}
                            onCheckedChange={(checked) => {
                              debugLog(`Checkbox ${index} alterado para:`, checked);
                              debugLog('Stage ID:', stage.id);
                              debugLog('Stage index:', index);
                              
                              if (checked) {
                                // Para etapas existentes, usar o ID real
                                // Para novas etapas, usar um identificador temporário
                                const stageIdentifier = stage.id || `temp-${index}`;
                                debugLog('Stage identifier definido como:', stageIdentifier);
                                
                                setFormData(prev => ({ 
                                  ...prev, 
                                  recommendation_stage_id: stageIdentifier,
                                  recommendation_target: 0
                                }));
                              } else {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  recommendation_stage_id: '',
                                  recommendation_target: 0
                                }));
                              }
                            }}
                            disabled={isLoading}
                          />
                          <Label htmlFor={`recommendation-checkbox-${index}`} className="text-sm text-gray-400">
                            Etapa de Recomendações
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`conversion-checkbox-${index}`}
                            checked={stage.is_conversion || false}
                            onCheckedChange={(checked) => {
                              const newStages = [...stages];
                              newStages[index] = { ...newStages[index], is_conversion: checked };
                              setStages(newStages);
                            }}
                            disabled={isLoading}
                          />
                          <Label htmlFor={`conversion-checkbox-${index}`} className="text-sm text-gray-400">
                            Conversão
                          </Label>
                        </div>
                      </div>
                    </div>
                    {stages.length > 1 && (
                      <Button
                        type="button"
                        variant="brandOutlineSecondaryHover"
                        size="sm"
                        onClick={() => removeStage(index)}
                        disabled={isLoading}
                        className="brand-radius"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Dropdown de Tipo de Conversão - Só quando conversão estiver marcada */}
                  {stage.is_conversion && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo de Conversão</Label>
                        <Select
                          value={stage.conversion_type || ''}
                          onValueChange={(value) => {
                            const newStages = [...stages];
                            newStages[index] = { 
                              ...newStages[index], 
                              conversion_type: value as 'MQL' | 'SQL' | 'SAL' | 'Venda'
                            };
                            setStages(newStages);
                          }}
                          disabled={isLoading}
                        >
                          <SelectTrigger className="w-full h-10 campo-brand brand-radius select-trigger-brand">
                            <SelectValue placeholder="Selecione o tipo de conversão" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MQL" className="dropdown-item-brand">MQL</SelectItem>
                            <SelectItem value="SQL" className="dropdown-item-brand">SQL</SelectItem>
                            <SelectItem value="SAL" className="dropdown-item-brand">SAL</SelectItem>
                            <SelectItem value="Venda" className="dropdown-item-brand">Venda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Segunda linha: Nome da Etapa, Percentual, Valor e Meta */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Nome da Etapa *</Label>
                      <Input
                        value={stage.name}
                        onChange={(e) => updateStage(index, 'name', e.target.value)}
                        placeholder="Ex: Prospecção"
                        required
                        disabled={isLoading}
                        className="campo-brand brand-radius"
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
                          className="campo-brand brand-radius"
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
                        className="campo-brand brand-radius"
                      />
                    </div>
                    {/* Campo Meta - Só quando etapa de recomendações estiver marcada */}
                    {(() => {
                      const shouldShowMeta = formData.recommendation_stage_id === stage.id || 
                                           formData.recommendation_stage_id === `temp-${index}`;
                      debugLog(`Etapa ${index} - shouldShowMeta:`, shouldShowMeta);
                      debugLog(`formData.recommendation_stage_id:`, formData.recommendation_stage_id);
                      debugLog(`stage.id:`, stage.id);
                      debugLog(`temp-${index}:`, `temp-${index}`);
                      return shouldShowMeta;
                    })() && (
                      <div>
                        <Label>Meta</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.recommendation_target}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            recommendation_target: parseInt(e.target.value) || 0 
                          }))}
                          placeholder="0"
                          disabled={isLoading}
                          className="campo-brand brand-radius"
                        />
                      </div>
                    )}
                  </div>

                  {/* Terceira linha: Conexão */}
                  {index === stages.length - 1 && (
                    <div className="p-3 border border-gray-600 rounded-lg bg-[#1A1A1A]">
                      <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                        {/* Coluna 1: Título + Switch */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Link className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-300">Conexão</span>
                          </div>
                          <Switch
                            checked={stage.conversion_enabled || false}
                            onCheckedChange={(checked) => {
                              const newStages = [...stages];
                              newStages[index] = { ...newStages[index], conversion_enabled: checked };
                              setStages(newStages);
                            }}
                            disabled={isLoading}
                          />
                        </div>

                        {/* Coluna 2: Funil de Conexão (à direita do switch) */}
                        {(stage.conversion_enabled || false) ? (
                          <div>
                            <Label>Funil de Conexão</Label>
                            <Select 
                              value={stage.conversion_funnel_id || ''}
                                                              onValueChange={(value) => {
                                  if (value === 'add_new_funnel') {
                                    toast.info('Funcionalidade de adicionar funil será implementada em breve!');
                                  } else {
                                    const newStages = [...stages];
                                    newStages[index] = { 
                                      ...newStages[index], 
                                      conversion_funnel_id: value,
                                      conversion_stage_id: ''
                                    };
                                    setStages(newStages);
                                  }
                                }}
                              disabled={isLoading}
                            >
                              <SelectTrigger className="w-full h-10 campo-brand brand-radius select-trigger-brand">
                                <SelectValue placeholder="Funil" />
                              </SelectTrigger>
                                                              <SelectContent>
                                  {funnel && (
                                    <>
                                      <SelectItem value="add_new_funnel" className="dropdown-item-brand text-xs text-blue-400">
                                        ➕ Adicionar Funil
                                      </SelectItem>
                                      <SelectItem value="separator" className="dropdown-item-brand text-xs text-gray-400" disabled>
                                        ─────────────
                                      </SelectItem>
                                    </>
                                  )}
                                {funnels?.filter(f => f.id !== funnel?.id).map((funnelItem) => (
                                  <SelectItem key={funnelItem.id} value={funnelItem.id} className="dropdown-item-brand text-xs">
                                    {funnelItem.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div></div>
                        )}

                        {/* Coluna 3: Etapa de Conexão (à direita, com mesmo estilo) */}
                        {(stage.conversion_enabled || false) ? (
                          <div>
                            <Label>Etapa de Conexão</Label>
                            <Select 
                              value={stage.conversion_stage_id || ''}
                                                              onValueChange={(value) => {
                                  const newStages = [...stages];
                                  newStages[index] = { ...newStages[index], conversion_stage_id: value };
                                  setStages(newStages);
                                }}
                                                              disabled={isLoading || !stage.conversion_funnel_id}
                            >
                              <SelectTrigger className="w-full h-10 campo-brand brand-radius select-trigger-brand">
                                <SelectValue placeholder="Etapa" />
                              </SelectTrigger>
                              <SelectContent>
                                {funnels
                                  ?.find(f => f.id === stage.conversion_funnel_id)
                                  ?.stages?.map((connectionStage: any) => (
                                    <SelectItem key={connectionStage.id} value={connectionStage.id} className="dropdown-item-brand text-xs">
                                      {connectionStage.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div></div>
                        )}
                      </div>
                    </div>
                  )}


                </div>
              ))}
            </div>
          </div>
        </form>
    </FullScreenModal>

  );
};
