import React, { useState, useEffect } from 'react';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useFunnels } from '@/hooks/useFunnels';
import { useCreateIndicator, useUpdateIndicator } from '@/hooks/useIndicators';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';
import { useIndicators } from '@/hooks/useIndicators';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, AlertCircle, XCircle, X, ArrowRight, Settings } from 'lucide-react';

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
    stages: {} as Record<string, number>
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFunnel, setSelectedFunnel] = useState<any>(null);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [periodOptions, setPeriodOptions] = useState<{ label: string; value: string; preenchido?: boolean }[]>([]);

  const isEditing = !!indicator;

  const { crmUser } = useCrmAuth();
  const isAdmin = crmUser?.role === 'admin' || crmUser?.role === 'master';
  const isOwner = !isEditing || indicator?.user_id === crmUser?.id;
  const canEdit = !!crmUser && (isOwner || isAdmin);
  const effectiveCompanyId = companyId || crmUser?.company_id || '';
  const { data: funnels, isLoading: isFunnelsLoading, error: funnelsError } = useFunnels(effectiveCompanyId);
  const { mutate: createIndicator } = useCreateIndicator();
  const { mutate: updateIndicator } = useUpdateIndicator();
  const { data: indicators } = useIndicators(effectiveCompanyId);

  const isUser = crmUser?.role === 'user';
  const isLeader = crmUser?.role === 'leader';
  const allowedFunnels = (isUser || isLeader)
    ? (funnels || []).filter(f => (crmUser.funnels || []).includes(f.id))
    : (funnels || []);

  // Gerar opções de período diário (últimos 30 dias)
  useEffect(() => {
    if (selectedFunnel && crmUser) {
      const today = new Date();
      const periodOptions = [];
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const label = date.toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        periodOptions.push({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          value: dateStr,
          preenchido: false
        });
      }
      
      // Verificar quais períodos já estão preenchidos
      const indicadoresDoUsuario = indicators.filter(ind => ind.user_id === crmUser.id);
      const periodosPreenchidos = indicadoresDoUsuario
        .filter(ind => ind.funnel_id === selectedFunnel.id && (!isEditing || ind.id !== indicator?.id))
        .map(ind => ind.period_date);
      
      periodOptions.forEach(option => {
        option.preenchido = periodosPreenchidos.includes(option.value);
      });
      
      setPeriodOptions(periodOptions);
    }
  }, [selectedFunnel, crmUser, indicators, isEditing, indicator]);

  // Update selectedFunnel when funnel_id changes
  useEffect(() => {
    if (formData.funnel_id && funnels) {
      const funnel = funnels.find(f => f.id === formData.funnel_id);
      setSelectedFunnel(funnel || null);
    } else {
      setSelectedFunnel(null);
    }
  }, [formData.funnel_id, funnels]);

  // Reset form data when modal opens/closes or when switching between create/edit modes
  useEffect(() => {
    if (isOpen) {
      if (isEditing && indicator) {
        // Carregar dados das etapas
        let stagesData = {};
        if (indicator.stages && typeof indicator.stages === 'object') {
          stagesData = indicator.stages;
        } else if (indicator.values && Array.isArray(indicator.values)) {
          indicator.values.forEach((value: any) => {
            if (value.stage_id && value.value !== undefined) {
              stagesData[value.stage_id] = value.value;
            }
          });
        }
        
        setFormData({
          period_date: indicator.period_date || '',
          funnel_id: indicator.funnel_id || '',
          stages: stagesData
        });
        setSelectedFunnel(funnels?.find(f => f.id === indicator.funnel_id) || null);
      } else {
        // Reset form data for create mode
        setFormData({
          period_date: '',
          funnel_id: '',
          stages: {}
        });
        setSelectedFunnel(null);
      }
    }
  }, [isOpen, isEditing, indicator, funnels]);

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
    
    if (!canEdit) {
      toast.error('Você não tem permissão para editar este registro.');
      return;
    }
    
    if (!formData.funnel_id || !formData.period_date) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsLoading(true);

    try {
      const indicatorData = {
        company_id: effectiveCompanyId,
        funnel_id: formData.funnel_id,
        period_date: formData.period_date,
        period_start: formData.period_date,
        period_end: formData.period_date,
        month_reference: new Date(formData.period_date).getMonth() + 1,
        year_reference: new Date(formData.period_date).getFullYear(),
        is_daily: true,
        user_id: crmUser?.id || 'd0390379-4c55-4838-a659-b76e595486a6'
      } as any;

      if (isEditing) {
        (updateIndicator as any)({ id: indicator.id, indicator: indicatorData, values: [] });
        toast.success('Indicador atualizado com sucesso!');
      } else {
        // Extrair os valores das etapas para o array values
        const valuesArray = Object.entries(formData.stages || {}).map(([stage_id, value]) => ({
          stage_id,
          value: Number(value)
        }));
        
        const createData = { indicator: indicatorData, values: valuesArray } as any;
        
        (createIndicator as any)(createData);
        toast.success('Indicador criado com sucesso!');
      }

      onClose();
    } catch (error) {
      toast.error('Erro ao salvar indicador. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Indicador' : 'Registrar Indicador'}
      actions={
        <>
          <Button variant="outline" className="brand-radius" onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Linha 1: Funil */}
        {!isEditing && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Funil *</label>
            <Select 
              value={formData.funnel_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, funnel_id: value }))}
              disabled={isLoading || !canEdit}
            >
              <SelectTrigger className="w-full brand-radius select-trigger-brand">
                <SelectValue placeholder="Selecione um funil" />
              </SelectTrigger>
              <SelectContent>
                {funnelsError ? (
                  <div className="px-4 py-2 text-red-500 text-sm">
                    Erro ao carregar funis: {funnelsError.message || 'Erro desconhecido'}
                  </div>
                ) : isFunnelsLoading ? (
                  <div className="px-4 py-2 text-muted-foreground text-sm">
                    Carregando funis...
                  </div>
                ) : allowedFunnels.length > 0 ? (
                  allowedFunnels.map((funnel) => (
                    <SelectItem key={funnel.id} value={funnel.id} className="dropdown-item-brand">
                      {funnel.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-4 py-2 text-muted-foreground text-sm">
                    Nenhum funil disponível para seleção.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Linha 2: Data (Período Diário) */}
        {!isEditing && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Data *</label>
            <Select
              value={formData.period_date}
              onValueChange={(value) => setFormData({ ...formData, period_date: value })}
              disabled={isLoading || !formData.funnel_id || !canEdit}
            >
              <SelectTrigger className="w-full brand-radius select-trigger-brand">
                <SelectValue placeholder="Selecione a data" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.length === 0 ? (
                  <div className="px-4 py-2 text-muted-foreground text-sm">
                    Selecione um funil primeiro
                  </div>
                ) : (
                  periodOptions.map(opt => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.preenchido}
                      className={opt.preenchido ? 'text-gray-400 cursor-not-allowed' : 'dropdown-item-brand'}
                    >
                      <span>{opt.label}</span>
                      {opt.preenchido && <span className="ml-2 text-xs text-gray-400">(já preenchido)</span>}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Período display for editing */}
        {isEditing && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Data</label>
            <div className="p-3 border border-gray-600 rounded bg-[#2A2A2A] text-white">
              {formData.period_date ? new Date(formData.period_date).toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : '-'}
            </div>
          </div>
        )}

        {/* Seção de Etapas */}
        {(selectedFunnel?.stages || isEditing) && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Resultados por Etapa</h3>
            <div className="space-y-4">
              {(selectedFunnel?.stages || []).length > 0 ? (
                selectedFunnel.stages
                  .sort((a: any, b: any) => a.stage_order - b.stage_order)
                  .map((stage: any) => {
                    const valor = formData.stages[stage.id] || 0;
                    const meta = stage.target_value || 0;
                    const percentual = meta > 0 ? Math.round((valor / meta) * 100) : 0;
                    const atingiu = valor >= meta && meta > 0;
                    
                    return (
                      <div key={stage.id} className="space-y-4">
                        {/* Etapa Principal */}
                        <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 border brand-radius bg-[#2A2A2A]" style={{ borderColor: 'var(--brand-secondary)' }}>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-white mb-2">
                              {stage.name}
                              {stage.target_value && (
                                <span className="text-sm text-gray-400 ml-2">(Meta: {stage.target_value})</span>
                              )}
                            </label>
                            <Input
                              id={`stage_${stage.id}`}
                              type="number"
                              min="0"
                              value={valor}
                              onChange={(e) => handleStageValueChange(stage.id, parseInt(e.target.value) || 0)}
                              placeholder="Digite o resultado"
                              disabled={!canEdit}
                              className="w-full brand-radius field-secondary-focus no-ring-focus"
                            />
                          </div>
                          <div className="flex flex-col items-start md:items-end min-w-[180px]">
                            <span className="text-xs text-gray-300">{percentual}% da meta</span>
                            {atingiu ? (
                              <span className="text-green-400 text-xs font-semibold">Meta atingida. Parabéns!</span>
                            ) : (
                              <span className="text-red-400 text-xs font-semibold">Meta não atingida, consulte seu líder</span>
                            )}
                          </div>
                        </div>

                        {/* Configuração de Conversão */}
                        <div className="ml-6 p-4 border border-gray-600 rounded-lg bg-[#1A1A1A]">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Settings className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-300">Configuração de Conversão</span>
                            </div>
                            <Switch
                              checked={stage.conversion_enabled || false}
                              onCheckedChange={(checked) => {
                                // Aqui você implementaria a lógica para salvar a configuração de conversão
                                console.log(`Conversão ${checked ? 'habilitada' : 'desabilitada'} para etapa ${stage.name}`);
                              }}
                              disabled={!canEdit}
                            />
                          </div>
                          
                          {(stage.conversion_enabled || false) && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Funil de Conversão */}
                                <div className="space-y-1">
                                  <label className="block text-xs font-medium text-gray-400">Funil de Conversão</label>
                                  <Select 
                                    value={stage.conversion_funnel_id || ''}
                                    onValueChange={(value) => {
                                      console.log(`Funil de conversão selecionado: ${value} para etapa ${stage.name}`);
                                    }}
                                    disabled={!canEdit}
                                  >
                                    <SelectTrigger className="w-full h-8 text-xs brand-radius select-trigger-brand">
                                      <SelectValue placeholder="Selecione o funil" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {funnels?.filter(f => f.id !== selectedFunnel?.id).map((funnel) => (
                                        <SelectItem key={funnel.id} value={funnel.id} className="dropdown-item-brand text-xs">
                                          {funnel.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Etapa de Conversão */}
                                <div className="space-y-1">
                                  <label className="block text-xs font-medium text-gray-400">Etapa de Conversão</label>
                                  <Select 
                                    value={stage.conversion_stage_id || ''}
                                    onValueChange={(value) => {
                                      console.log(`Etapa de conversão selecionada: ${value} para etapa ${stage.name}`);
                                    }}
                                    disabled={!canEdit || !stage.conversion_funnel_id}
                                  >
                                    <SelectTrigger className="w-full h-8 text-xs brand-radius select-trigger-brand">
                                      <SelectValue placeholder="Selecione a etapa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {funnels
                                        ?.find(f => f.id === stage.conversion_funnel_id)
                                        ?.stages?.map((conversionStage: any) => (
                                          <SelectItem key={conversionStage.id} value={conversionStage.id} className="dropdown-item-brand text-xs">
                                            {conversionStage.name}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              {/* Indicador Visual de Conversão */}
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span>{stage.name}</span>
                                <ArrowRight className="w-3 h-3" />
                                <span className="text-blue-400">
                                  {funnels?.find(f => f.id === stage.conversion_funnel_id)?.name || 'Funil selecionado'}
                                </span>
                                <ArrowRight className="w-3 h-3" />
                                <span className="text-green-400">
                                  {funnels
                                    ?.find(f => f.id === stage.conversion_funnel_id)
                                    ?.stages?.find((s: any) => s.id === stage.conversion_stage_id)?.name || 'Etapa selecionada'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              ) : isEditing ? (
                <div className="p-4 border border-gray-600 rounded-lg bg-[#2A2A2A] text-gray-400 text-center">
                  Nenhuma etapa configurada para este funil
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Botão Salvar */}
        {canEdit && (
          <div className="flex justify-end pt-6">
            <Button type="submit" disabled={isLoading} variant="brandPrimaryToSecondary" className="brand-radius">
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </form>
    </FullScreenModal>
  );
};
