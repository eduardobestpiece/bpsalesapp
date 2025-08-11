import React, { useState, useEffect } from 'react';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFunnels } from '@/hooks/useFunnels';
import { useCreateIndicator, useUpdateIndicator } from '@/hooks/useIndicators';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';
import { gerarPeriodosDiarios, gerarPeriodosSemanais, gerarPeriodoMensal, getUltimoDiaPeriodo, gerarPeriodosSemanaisUltimos90Dias, gerarPeriodosMensaisCustom, gerarDiasUltimos90AteHoje } from '@/lib/utils';
import { useIndicators } from '@/hooks/useIndicators';
import { supabase } from '@/integrations/supabase/client';
import ReactInputMask from 'react-input-mask';
import { CheckCircle, AlertCircle, XCircle, X } from 'lucide-react';

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
  const [salesValue, setSalesValue] = useState('');
  const [recommendationsCount, setRecommendationsCount] = useState(0);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [monthOptions, setMonthOptions] = useState<number[]>([]);
  const [yearOptions, setYearOptions] = useState<number[]>([]);
  const [monthReference, setMonthReference] = useState<number | null>(null);
  const [yearReference, setYearReference] = useState<number | null>(null);
  const [isDelayed, setIsDelayed] = useState<boolean>(indicator?.is_delayed || false);

  const isEditing = !!indicator;

  const { crmUser } = useCrmAuth();
  const isAdmin = crmUser?.role === 'admin' || crmUser?.role === 'master';
  const isOwner = !isEditing || indicator?.user_id === crmUser?.id;
  const canEdit = !!crmUser && (isOwner || isAdmin);
  const effectiveCompanyId = companyId || crmUser?.company_id || '';
  const { data: funnels, isLoading: isFunnelsLoading, error: funnelsError } = useFunnels(effectiveCompanyId, 'active');
  const { mutate: createIndicator } = useCreateIndicator();
  const { mutate: updateIndicator } = useUpdateIndicator();
  const { data: indicators } = useIndicators(effectiveCompanyId);

  const isUser = crmUser?.role === 'user';
  const isLeader = crmUser?.role === 'leader';
  const allowedFunnels = (isUser || isLeader)
    ? (funnels || []).filter(f => (crmUser.funnels || []).includes(f.id))
    : (funnels || []);

  // Logar o array de indicadores ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      // Removido debug
    }
  }, [isOpen, indicators]);

  // Generate period options based on funnel verification type
  let periodOptions: { label: string; value: string; preenchido?: boolean }[] = [];
  if (selectedFunnel && crmUser) {
    let todosPeriodos: { label: string; value: string }[] = [];
    
    if (selectedFunnel.verification_type === 'daily') {
      todosPeriodos = gerarDiasUltimos90AteHoje();
    } else if (selectedFunnel.verification_type === 'weekly') {
      todosPeriodos = gerarPeriodosSemanaisUltimos90Dias(selectedFunnel.verification_day ?? 1);
    } else if (selectedFunnel.verification_type === 'monthly') {
      const hoje = new Date();
      todosPeriodos = [];
      let mes = hoje.getMonth() + 1;
      let ano = hoje.getFullYear();
      for (let i = 0; i < 3; i++) {
        todosPeriodos.push(...gerarPeriodosMensaisCustom(mes, ano, selectedFunnel.verification_day ?? 1, 1));
        mes--;
        if (mes === 0) {
          mes = 12;
          ano--;
        }
      }
    }
    
    // Check which periods are already filled for the current user and funnel
    
    // Verificar se existem indicadores do usuário mock
    const indicadoresDoUsuarioMock = indicators.filter(ind => ind.user_id === crmUser.id);
    
    // Se não existem indicadores do usuário mock, usar todos os indicadores do funil
    const indicadoresParaVerificar = indicadoresDoUsuarioMock.length > 0 ? indicadoresDoUsuarioMock : indicators.filter(ind => ind.funnel_id === selectedFunnel.id);
    
    const periodosPreenchidos = Array.isArray(indicators) ? indicadoresParaVerificar
      .filter((ind) => {
        
        const condicao1 = ind && ind.funnel_id === selectedFunnel.id;
        const condicao2 = ind.user_id === crmUser.id || indicadoresDoUsuarioMock.length === 0; // Se não há indicadores do usuário mock, aceitar todos
        const condicao3 = (!isEditing || ind.id !== indicator?.id);
        
        return condicao1 && condicao2 && condicao3;
      })
      .map((ind) => {
        
        // Criar uma chave única para identificar o período
        let chaveUnica = null;
        if (ind.period_start && ind.period_end) {
          chaveUnica = `${ind.period_start}_${ind.period_end}`;
        } else if (ind.period_date) {
          // Fallback para indicadores antigos
          chaveUnica = ind.period_date;
        }
        return chaveUnica;
      })
      .filter(Boolean) : [];
    
    periodOptions = todosPeriodos.map(period => {
      const preenchido = periodosPreenchidos.includes(period.value);
      return {
        ...period,
        preenchido
      };
    });
  }

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
        
        // Carregar dados das etapas - pode estar em diferentes estruturas
        let stagesData = {};
        if (indicator.stages && typeof indicator.stages === 'object') {
          stagesData = indicator.stages;
        } else if (indicator.values && Array.isArray(indicator.values)) {
          // Estrutura antiga onde os valores estão em um array
          indicator.values.forEach((value: any) => {
            if (value.stage_id && value.value !== undefined) {
              stagesData[value.stage_id] = value.value;
            }
          });
        }
        
        setFormData({
          period_date: indicator.period_date || '',
          funnel_id: indicator.funnel_id || '',
          month_reference: indicator.month_reference || new Date().getMonth() + 1,
          year_reference: indicator.year_reference || new Date().getFullYear(),
          stages: stagesData
        });
        setSelectedFunnel(funnels?.find(f => f.id === indicator.funnel_id) || null);
        setSalesValue(indicator.sales_value ? `R$ ${parseFloat(indicator.sales_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '');
        setRecommendationsCount(indicator.recommendations_count || 0);
        setPeriodStart(indicator.period_start || '');
        setPeriodEnd(indicator.period_end || '');
        setMonthReference(indicator.month_reference || null);
        setYearReference(indicator.year_reference || null);
        setIsDelayed(indicator.is_delayed || false);
      } else {
        // Reset form data for create mode
        
        setFormData({
          period_date: '',
          funnel_id: '',
          month_reference: new Date().getMonth() + 1,
          year_reference: new Date().getFullYear(),
          stages: {}
        });
        setSelectedFunnel(null);
        setSalesValue('');
        setRecommendationsCount(0);
        setPeriodStart('');
        setPeriodEnd('');
        setMonthReference(null);
        setYearReference(null);
        setIsDelayed(false);
      }
    }
  }, [isOpen, isEditing, indicator, funnels]);

  // Generate month and year options
  useEffect(() => {
    const currentDate = new Date();
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);
    
    setMonthOptions(months);
    setYearOptions(years);
  }, []);

  // canEdit já calcula permissões acima

  function parseMonetaryValue(value: string) {
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  }

  function extractPeriodDates(periodString: string) {
    
    // Primeiro tentar o formato com underscore (formato real)
    if (periodString.includes('_')) {
      const parts = periodString.split('_');
      if (parts.length === 2) {
        return {
          start: parts[0].trim(),
          end: parts[1].trim()
        };
      }
    }
    
    // Fallback para o formato com " - " (formato antigo)
    const parts = periodString.split(' - ');
    if (parts.length === 2) {
      return {
        start: parts[0].trim(),
        end: parts[1].trim()
      };
    }
    
    return { start: '', end: '' };
  }

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
        period_date: periodStart, // Usar apenas a data de início
        period_start: periodStart,
        period_end: periodEnd,
        month_reference: formData.month_reference,
        year_reference: formData.year_reference,
        sales_value: salesValue ? parseMonetaryValue(salesValue) : 0,
        recommendations_count: recommendationsCount,
        is_delayed: isDelayed,
        user_id: crmUser?.id || 'd0390379-4c55-4838-a659-b76e595486a6' // Usar o ID do usuário atual sincronizado
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

        {/* Linha 2: Período */}
        {!isEditing && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Período *</label>
            <Select
              value={formData.period_date}
              onValueChange={(value) => {
                setFormData({ ...formData, period_date: value });
                const { start, end } = extractPeriodDates(value);
                setPeriodStart(start);
                setPeriodEnd(end);
                // Definições de mês/ano
                if (start && end) {
                  try {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    const monthFinal = endDate.getMonth() + 1;
                    const yearFinal = endDate.getFullYear();
                    const monthInicial = startDate.getMonth() + 1;
                    const yearInicial = startDate.getFullYear();
                    setMonthReference(monthFinal);
                    setYearReference(yearFinal);
                    setFormData(prev => ({
                      ...prev,
                      month_reference: monthFinal,
                      year_reference: yearFinal
                    }));
                    if (monthInicial !== monthFinal || yearInicial !== yearFinal) {
                      const mesesUnicos = [...new Set([monthInicial, monthFinal])].sort((a, b) => a - b);
                      setMonthOptions(mesesUnicos);
                      const anosUnicos = [...new Set([yearInicial, yearFinal])].sort((a, b) => a - b);
                      setYearOptions(anosUnicos);
                    } else {
                      const currentDate = new Date();
                      const months = Array.from({ length: 12 }, (_, i) => i + 1);
                      const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);
                      setMonthOptions(months);
                      setYearOptions(years);
                    }
                  } catch (error) {
                    console.error('Erro ao extrair mês/ano do período:', error);
                  }
                }
              }}
              disabled={isLoading || !formData.funnel_id || !canEdit}
            >
              <SelectTrigger className="w-full brand-radius select-trigger-brand">
                <SelectValue placeholder="Selecione o período" />
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

        {/* Linha 3: Mês e Ano */}
        {!isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mês */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Mês *</label>
              {monthOptions.length === 1 && monthReference ? (
                <div className="p-2 border border-gray-600 rounded bg-[#2A2A2A] text-white">
                  {new Date(2000, monthReference - 1, 1).toLocaleString('pt-BR', { month: 'long' })}
                </div>
              ) : (
                <Select 
                  value={monthReference?.toString() || ''} 
                  onValueChange={(value) => setMonthReference(Number(value))}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="w-full brand-radius select-trigger-brand">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(m => (
                      <SelectItem key={m} value={m.toString()} className="dropdown-item-brand">
                        {new Date(2000, m - 1, 1).toLocaleString('pt-BR', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Ano */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Ano *</label>
              {yearOptions.length === 1 && yearReference ? (
                <div className="p-2 border border-gray-600 rounded bg-[#2A2A2A] text-white">
                  {yearReference}
                </div>
              ) : (
                <Select 
                  value={yearReference?.toString() || ''} 
                  onValueChange={(value) => setYearReference(Number(value))}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="w-full brand-radius select-trigger-brand">
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(y => (
                      <SelectItem key={y} value={y.toString()} className="dropdown-item-brand">
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        {/* Período display for editing */}
        {isEditing && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Período</label>
            <div className="p-3 border border-gray-600 rounded bg-[#2A2A2A] text-white">
              {periodStart && periodEnd ? `De ${formatDate(periodStart)} até ${formatDate(periodEnd)}` : '-'}
            </div>
          </div>
        )}

        {/* Linha 4: Valor das Vendas e Número de Recomendações */}
        {(selectedFunnel || isEditing) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Valor das Vendas */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Valor das Vendas</label>
              <Input 
                id="sales_value" 
                type="text" 
                value={salesValue} 
                onChange={e => setSalesValue(e.target.value)} 
                placeholder="0,00" 
                disabled={!canEdit}
                className="w-full brand-radius field-secondary-focus no-ring-focus"
              />
            </div>

            {/* Número de Recomendações */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Número de Recomendações</label>
              <Input 
                id="recommendations_count" 
                type="number" 
                value={recommendationsCount} 
                onChange={e => setRecommendationsCount(Number(e.target.value))} 
                disabled={!canEdit}
                className="w-full brand-radius field-secondary-focus no-ring-focus"
              />
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
                      <div key={stage.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 border brand-radius bg-[#2A2A2A]" style={{ borderColor: 'var(--brand-secondary)' }}>
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

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
}
