import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

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
  const effectiveCompanyId = companyId || crmUser?.company_id || '';
  const { data: funnels, isLoading: isFunnelsLoading, error: funnelsError } = useFunnels(effectiveCompanyId, 'active');
  const { mutate: createIndicator } = useCreateIndicator();
  const { mutate: updateIndicator } = useUpdateIndicator();
  const { data: indicators } = useIndicators(effectiveCompanyId);

  const isUser = crmUser?.role === 'user';
  const allowedFunnels = isUser ? (funnels || []).filter(f => crmUser.funnels?.includes(f.id)) : (funnels || []);

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
    const periodosPreenchidos = Array.isArray(indicators) ? indicators
      .filter((ind) => 
        ind && 
        ind.funnel_id === selectedFunnel.id && 
        ind.user_id === crmUser.id &&
        (!isEditing || ind.id !== indicator?.id) // Exclude current indicator when editing
      )
      .map((ind) => {
        // Criar uma chave única para identificar o período
        if (ind.period_start && ind.period_end) {
          return `${ind.period_start}_${ind.period_end}`;
        } else if (ind.period_date) {
          // Fallback para indicadores antigos
          return ind.period_date;
        }
        return null;
      })
      .filter(Boolean) : [];
    
    
    console.log('Debug - Períodos preenchidos:', periodosPreenchidos);
    console.log('Debug - Todos os períodos disponíveis:', todosPeriodos);
    
    periodOptions = todosPeriodos.map(opt => ({
      ...opt,
      preenchido: periodosPreenchidos.includes(opt.value)
    }));
    
    console.log('Debug - Períodos com status de preenchimento:', periodOptions);
  }

  useEffect(() => {
    if (indicator) {
      console.log('Debug - Carregando indicador para edição:', {
        period_date: indicator.period_date,
        period_start: indicator.period_start,
        period_end: indicator.period_end
      });
      
      const stagesValues: Record<string, number> = {};
      if (indicator.values && Array.isArray(indicator.values)) {
        indicator.values.forEach((v: any) => {
          stagesValues[v.stage_id] = v.value;
        });
      }
      setFormData({
        period_date: indicator.period_date,
        funnel_id: indicator.funnel_id,
        month_reference: indicator.month_reference,
        year_reference: indicator.year_reference,
        stages: stagesValues
      });
      setSalesValue(indicator.sales_value?.toString() || '0,00');
      setRecommendationsCount(indicator.recommendations_count || 0);
      setIsDelayed(indicator.is_delayed || false);
      if (indicator.period_start && indicator.period_end) {
        setPeriodStart(indicator.period_start);
        setPeriodEnd(indicator.period_end);
        setMonthReference(indicator.month_reference);
        setYearReference(indicator.year_reference);
      } else if (indicator.period_date) {
        // Fallback para indicadores antigos que podem ter apenas period_date
        const { start, end } = extractPeriodDates(indicator.period_date);
        setPeriodStart(start);
        setPeriodEnd(end);
        setMonthReference(indicator.month_reference);
        setYearReference(indicator.year_reference);
      }
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        period_date: today,
        funnel_id: '',
        month_reference: new Date().getMonth() + 1,
        year_reference: new Date().getFullYear(),
        stages: {}
      });
      setSalesValue('0,00');
      setRecommendationsCount(0);
      setIsDelayed(false);
      setPeriodStart(today);
      setPeriodEnd(today);
      setMonthReference(new Date().getMonth() + 1);
      setYearReference(new Date().getFullYear());
    }
  }, [indicator]);

  useEffect(() => {
    if (formData.funnel_id && funnels && !isEditing) {
      const funnel = funnels.find(f => f.id === formData.funnel_id);
      setSelectedFunnel(funnel);
      if (funnel?.stages) {
        const newStages: Record<string, number> = {};
        funnel.stages.forEach((stage: any) => {
          newStages[stage.id] = 0;
        });
        setFormData(prev => ({ ...prev, stages: newStages }));
      }
    } else if (formData.funnel_id && funnels) {
      const funnel = funnels.find(f => f.id === formData.funnel_id);
      setSelectedFunnel(funnel);
    }
  }, [formData.funnel_id, funnels, isEditing]);

  function parseMonetaryValue(value: string) {
    if (!value) return 0;
    return Number(value.replace(/\./g, '').replace(',', '.'));
  }

  function extractPeriodDates(periodString: string) {
    if (!periodString) return { start: '', end: '' };
    if (periodString.includes('_')) {
      const [start, end] = periodString.split('_');
      return { start: start || '', end: end || '' };
    }
    return { start: periodString, end: periodString };
  }

  useEffect(() => {
    if (!isEditing && periodStart && periodEnd) {
      const startDate = new Date(periodStart);
      const endDate = new Date(periodEnd);
      const startMonth = startDate.getMonth() + 1;
      const endMonth = endDate.getMonth() + 1;
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      let months = [];
      let years = [];
      if (startMonth === endMonth) {
        months = [startMonth];
        setMonthReference(startMonth);
      } else {
        months = [startMonth, endMonth];
        setMonthReference(endMonth);
      }
      if (startYear === endYear) {
        years = [startYear];
        setYearReference(startYear);
      } else {
        years = [startYear, endYear];
        setYearReference(endYear);
      }
      setMonthOptions(months);
      setYearOptions(years);
    } else if (!isEditing) {
      setMonthOptions([]);
      setYearOptions([]);
      setMonthReference(null);
      setYearReference(null);
    }
  }, [periodStart, periodEnd, isEditing]);

  const canEdit = !isEditing || (isEditing && (
    crmUser?.role === 'admin' || crmUser?.role === 'master' || crmUser?.role === 'submaster' || (indicator && crmUser?.id === indicator.user_id)
  ));

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
    if (!formData.funnel_id) {
      toast.error('Selecione um funil.');
      return;
    }
    if (!periodStart || !periodEnd) {
      toast.error('Selecione o período (data início e fim).');
      return;
    }
    if (monthReference === null) {
      toast.error('Selecione o mês do período.');
      return;
    }
    if (yearReference === null) {
      toast.error('Selecione o ano do período.');
      return;
    }
    
    setIsLoading(true);

    try {
      // Extrair a data de início do período para usar como period_date
      const periodStartDate = periodStart || formData.period_date;
      
      // Debug: verificar os valores antes do envio
      console.log('Debug - Valores sendo enviados:', {
        periodStartDate,
        periodStart,
        periodEnd,
        formData_period_date: formData.period_date
      });
      
      const indicatorData = {
        user_id: crmUser?.id || '',
        company_id: companyId,
        funnel_id: formData.funnel_id,
        period_date: periodStartDate, // Usar apenas a data de início
        period_start: periodStart,
        period_end: periodEnd,
        month_reference: monthReference,
        year_reference: yearReference,
        sales_value: parseMonetaryValue(salesValue),
        recommendations_count: recommendationsCount,
        is_delayed: isDelayed
      };

      const stageValues = Object.entries(formData.stages).map(([stageId, value]) => ({
        stage_id: stageId,
        value: value
      }));

      if (indicator) {
        updateIndicator({
          id: indicator.id,
          indicator: indicatorData,
          values: stageValues
        }, {
          onSuccess: () => {
            toast.success('Indicador atualizado com sucesso!');
            onClose();
          },
          onError: (error: any) => {
            toast.error(error.message || 'Erro ao atualizar indicador');
          }
        });
      } else {
        createIndicator({
          indicator: indicatorData,
          values: stageValues
        }, {
          onSuccess: () => {
            toast.success('Indicador registrado com sucesso!');
            onClose();
          },
          onError: (error: any) => {
            toast.error(error.message || 'Erro ao salvar indicador');
          }
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar indicador');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Indicador' : 'Registrar Indicador'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edite as informações do indicador selecionado.' : 'Preencha as informações para registrar um novo indicador.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isEditing && (
              <>
                <div>
                  <Label>Mês *</Label>
                  {monthOptions.length === 1 && monthReference ? (
                    <div className="p-2 border rounded">{new Date(2000, monthReference - 1, 1).toLocaleString('pt-BR', { month: 'long' })}</div>
                  ) : (
                    <Select 
                      value={monthReference?.toString() || ''} 
                      onValueChange={(value) => setMonthReference(Number(value))}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map(m => (
                          <SelectItem key={m} value={m.toString()}>
                            {new Date(2000, m - 1, 1).toLocaleString('pt-BR', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label>Ano *</Label>
                  {yearOptions.length === 1 && yearReference ? (
                    <div className="p-2 border rounded">{yearReference}</div>
                  ) : (
                    <Select 
                      value={yearReference?.toString() || ''} 
                      onValueChange={(value) => setYearReference(Number(value))}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label htmlFor="funnel_id">Funil *</Label>
                  <Select 
                    value={formData.funnel_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, funnel_id: value }))}
                    disabled={isLoading || !canEdit}
                  >
                    <SelectTrigger>
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
                          <SelectItem key={funnel.id} value={funnel.id}>
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
                <div>
                  <Label htmlFor="period_date">Período *</Label>
                  <Select
                    value={formData.period_date}
                    onValueChange={(value) => {
                      setFormData({ ...formData, period_date: value });
                      const { start, end } = extractPeriodDates(value);
                      setPeriodStart(start);
                      setPeriodEnd(end);
                    }}
                    disabled={isLoading || !formData.funnel_id || !canEdit}
                  >
                    <SelectTrigger>
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
                            className={opt.preenchido ? 'text-gray-400 cursor-not-allowed' : ''}
                          >
                            <span>{opt.label}</span>
                            {opt.preenchido && <span className="ml-2 text-xs text-gray-400">(já preenchido)</span>}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {isEditing && (
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Período: {periodStart && periodEnd ? `De ${formatDate(periodStart)} até ${formatDate(periodEnd)}` : '-'}
                </span>
              </div>
            )}
            {selectedFunnel && (
              <>
                <div>
                  <Label htmlFor="sales_value">Valor das Vendas</Label>
                  <Input 
                    id="sales_value" 
                    type="text" 
                    value={salesValue} 
                    onChange={e => setSalesValue(e.target.value)} 
                    placeholder="0,00" 
                    disabled={!canEdit} 
                  />
                </div>
                <div>
                  <Label htmlFor="recommendations_count">Número de Recomendações</Label>
                  <Input 
                    id="recommendations_count" 
                    type="number" 
                    value={recommendationsCount} 
                    onChange={e => setRecommendationsCount(Number(e.target.value))} 
                    disabled={!canEdit} 
                  />
                </div>
              </>
            )}
          </div>
          
          {selectedFunnel?.stages && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resultados por Etapa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {selectedFunnel.stages
                    .sort((a: any, b: any) => a.stage_order - b.stage_order)
                    .map((stage: any) => {
                      const valor = formData.stages[stage.id] || 0;
                      const meta = stage.target_value || 0;
                      const percentual = meta > 0 ? Math.round((valor / meta) * 100) : 0;
                      const atingiu = valor >= meta && meta > 0;
                      return (
                        <div key={stage.id} className="flex flex-col md:flex-row md:items-center gap-2 p-2 border rounded-lg">
                          <div className="flex-1">
                            <Label htmlFor={`stage_${stage.id}`}>
                              {stage.name}
                              {stage.target_value && (
                                <span className="text-sm text-muted-foreground ml-2">(Meta: {stage.target_value})</span>
                              )}
                            </Label>
                            <Input
                              id={`stage_${stage.id}`}
                              type="number"
                              min="0"
                              value={valor}
                              onChange={(e) => handleStageValueChange(stage.id, parseInt(e.target.value) || 0)}
                              placeholder="Digite o resultado"
                              disabled={!canEdit}
                            />
                          </div>
                          <div className="flex flex-col items-start md:items-end min-w-[180px]">
                            <span className="text-xs">{percentual}% da meta</span>
                            {atingiu ? (
                              <span className="text-green-600 text-xs font-semibold">Meta atingida. Parabéns!</span>
                            ) : (
                              <span className="text-red-600 text-xs font-semibold">Meta não atingida, consulte seu líder</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex justify-end space-x-2">
            {canEdit && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.substring(0, 10).split('-');
  return `${day}/${month}/${year}`;
}
