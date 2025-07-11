
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [tempPeriod, setTempPeriod] = useState(formData.period_date);
  const [tempMonth, setTempMonth] = useState(monthReference);
  const [tempYear, setTempYear] = useState(yearReference);
  const [isDelayed, setIsDelayed] = useState<boolean>(indicator?.is_delayed || false);

  const { crmUser } = useCrmAuth();
  const effectiveCompanyId = companyId || crmUser?.company_id || '';
  const { data: funnels, isLoading: isFunnelsLoading, error: funnelsError } = useFunnels(effectiveCompanyId, 'active');
  const { mutate: createIndicator } = useCreateIndicator();
  const { mutate: updateIndicator } = useUpdateIndicator();
  const { data: indicators } = useIndicators(effectiveCompanyId);

  const isUser = crmUser?.role === 'user';
  const isSubMaster = crmUser?.role === 'submaster';
  const allowedFunnels = isUser ? (funnels || []).filter(f => crmUser.funnels?.includes(f.id)) : (funnels || []);

  // NOVA LÓGICA DE PERÍODOS
  let periodOptions: { label: string; value: string; isMissing?: boolean; isAllowed?: boolean }[] = [];
  const periodosRegistrados: string[] = Array.isArray(indicators) ? (indicators.filter(
    (ind) =>
      selectedFunnel &&
      ind.funnel_id === selectedFunnel.id &&
      ind.month_reference === formData.month_reference &&
      ind.year_reference === formData.year_reference
  ).map((ind) => ind.period_date).filter(Boolean)) : [];
  
  const indicadoresUsuario = Array.isArray(indicators) && selectedFunnel && crmUser ? indicators.filter(
    (ind) => ind.funnel_id === selectedFunnel.id && ind.user_id === crmUser.id
  ) : [];
  
  const periodosUsuario: string[] = indicadoresUsuario ? indicadoresUsuario.map((ind) => ind.period_date).filter(Boolean) : [];
  
  const indicadoresUsuarioValidos = indicadoresUsuario.filter(ind => !!ind.period_end);
  const ultimoRegistroUsuario = indicadoresUsuarioValidos.length > 0
    ? indicadoresUsuarioValidos.sort((a, b) => {
        const aDate = a.period_end ? new Date(a.period_end).getTime() : 0;
        const bDate = b.period_end ? new Date(b.period_end).getTime() : 0;
        return bDate - aDate;
      })[0]
    : null;

  const hoje = new Date();

  if (selectedFunnel && formData.month_reference && formData.year_reference && crmUser) {
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

    // 1. PRIMEIRO REGISTRO DO USUÁRIO PARA O FUNIL
    if (periodosUsuario.length === 0) {
      if (selectedFunnel.verification_type === 'weekly') {
        todosPeriodos = gerarPeriodosSemanaisUltimos90Dias(selectedFunnel.verification_day ?? 1);
      } else if (selectedFunnel.verification_type === 'daily') {
        todosPeriodos = gerarDiasUltimos90AteHoje();
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
      
      const hoje = new Date();
      const dataLimite = new Date(hoje);
      dataLimite.setDate(dataLimite.getDate() - 89);
      periodOptions = todosPeriodos
        .filter(opt => {
          const ultimoDia = new Date(getUltimoDiaPeriodo(opt.value));
          return ultimoDia >= dataLimite && ultimoDia < hoje;
        })
        .sort((a, b) => new Date(getUltimoDiaPeriodo(b.value)).getTime() - new Date(getUltimoDiaPeriodo(a.value)).getTime())
        .map(opt => {
          const ultimoDia = new Date(getUltimoDiaPeriodo(opt.value));
          const isAllowed = hoje > ultimoDia;
          return {
            ...opt,
            isAllowed,
            isMissing: true
          };
        });
    }
    // 2. SEGUNDO REGISTRO OU MAIS
    else {
      if (selectedFunnel.verification_type === 'daily') {
        const primeiroDia = new Date(ultimoRegistroUsuario?.period_end || periodosUsuario[0]);
        const hoje = new Date();
        todosPeriodos = gerarDiasUltimos90AteHoje().filter(opt => {
          const data = new Date(opt.value);
          return data >= primeiroDia && data < hoje;
        });
        periodOptions = todosPeriodos.map(opt => {
          const isMissing = !periodosUsuario.includes(opt.value);
          return {
            ...opt,
            isMissing,
            isAllowed: true
          };
        });
      } else {
        const hoje = new Date();
        const dataLimite = new Date(hoje);
        dataLimite.setDate(dataLimite.getDate() - 89);
        if (selectedFunnel.verification_type === 'weekly') {
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
        
        const periodosRegistradosUsuario = indicadoresUsuario ? indicadoresUsuario.map(ind => {
          if (ind.period_start && ind.period_end) {
            return `${ind.period_start}_${ind.period_end}`;
          }
          return '';
        }).filter(Boolean) : [];
        
        periodOptions = todosPeriodos
          .filter(opt => {
            let primeiroDiaPeriodo = null;
            let identificadorPeriodo = opt.value;
            if (opt.value.includes('_')) {
              primeiroDiaPeriodo = new Date(opt.value.split('_')[0]);
            } else {
              primeiroDiaPeriodo = new Date(opt.value);
            }
            
            const isValid = (!ultimoRegistroUsuario || primeiroDiaPeriodo > new Date(ultimoRegistroUsuario.period_end))
              && primeiroDiaPeriodo < hoje
              && !periodosRegistradosUsuario.includes(identificadorPeriodo);
            
            return isValid;
          })
          .map(opt => ({
            ...opt,
            isMissing: false,
            isAllowed: true
          }));
      }
    }
  }

  const destacarFaltantes = periodosUsuario.length > 0;

  useEffect(() => {
    if (indicator) {
      const stagesValues: Record<string, number> = {};
      if (indicator.values && Array.isArray(indicator.values)) {
        indicator.values.forEach((v: any) => {
          stagesValues[v.stage_id] = v.value;
        });
      }
      setFormData({
        period_date: indicator.period_date || '',
        funnel_id: indicator.funnel_id,
        month_reference: indicator.month_reference,
        year_reference: indicator.year_reference,
        stages: stagesValues
      });
      setSalesValue(indicator.sales_value ? indicator.sales_value.toString() : '0');
      setRecommendationsCount(indicator.recommendations_count || 0);
      setIsDelayed(indicator.is_delayed || false);
      
      if (indicator.period_date) {
        const { start, end } = extractPeriodDates(indicator.period_date);
        setPeriodStart(start);
        setPeriodEnd(end);
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
      setSalesValue('0');
      setRecommendationsCount(0);
      setIsDelayed(false);
      setPeriodStart(today);
      setPeriodEnd(today);
    }
  }, [indicator]);

  useEffect(() => {
    if (formData.funnel_id && funnels) {
      const funnel = funnels.find(f => f.id === formData.funnel_id);
      setSelectedFunnel(funnel);
      
      if (!indicator && funnel?.stages) {
        const newStages: Record<string, number> = {};
        funnel.stages.forEach((stage: any) => {
          newStages[stage.id] = 0;
        });
        setFormData(prev => ({ ...prev, stages: newStages }));
      }
      
      if (funnel) {
        if (funnel.sales_value_mode === 'manual') {
          setSalesValue(indicator?.sales_value ? indicator.sales_value.toString() : '0');
        } else {
          setSalesValue('0');
        }
        if (funnel.recommendations_mode === 'manual') {
          setRecommendationsCount(indicator?.recommendations_count || 0);
        } else {
          setRecommendationsCount(0);
        }
      }
    }
  }, [formData.funnel_id, funnels, indicator]);

  function parseMonetaryValue(value: string) {
    if (!value) return 0;
    return Number(value.replace(/\./g, '').replace(',', '.'));
  }

  function extractPeriodDates(periodString: string) {
    if (periodString.includes('_')) {
      const [start, end] = periodString.split('_');
      return { start, end };
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(periodString)) {
      return { start: periodString, end: periodString };
    }
    const match = periodString.match(/(\d{2}\/\d{2}\/\d{4}).*?(\d{2}\/\d{2}\/\d{4})/);
    if (match) {
      const [_, start, end] = match;
      const [d1, m1, y1] = start.split('/');
      const [d2, m2, y2] = end.split('/');
      const s = `${y1}-${m1}-${d1}`;
      const e = `${y2}-${m2}-${d2}`;
      return { start: s, end: e };
    }
    return { start: '', end: '' };
  }

  useEffect(() => {
    if (periodStart && periodEnd) {
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
    } else {
      setMonthOptions([]);
      setYearOptions([]);
      setMonthReference(null);
      setYearReference(null);
    }
  }, [periodStart, periodEnd]);

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
      const indicatorData = {
        user_id: crmUser?.id || '',
        company_id: companyId,
        funnel_id: formData.funnel_id,
        period_start: periodStart,
        period_end: periodEnd,
        period_date: formData.period_date,
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
            console.error('Erro ao atualizar indicador:', error);
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
            console.error('Erro ao salvar indicador:', error);
            toast.error(error.message || 'Erro ao salvar indicador');
          }
        });
      }
    } catch (error: any) {
      console.error('Erro ao salvar indicador:', error);
      toast.error(error.message || 'Erro ao salvar indicador');
    } finally {
      setIsLoading(false);
    }
  };

  function getPrazoStatus() {
    if (!indicator || !selectedFunnel || !indicator.created_at || !indicator.period_end) return null;
    const deadlineHours = selectedFunnel.indicator_deadline_hours ?? 0;
    const periodEnd = new Date(indicator.period_end);
    const prazo = new Date(periodEnd.getTime() + deadlineHours * 60 * 60 * 1000);
    const createdAt = new Date(indicator.created_at);
    const diffMs = createdAt.getTime() - prazo.getTime();
    if (createdAt <= prazo) {
      return { color: 'green', icon: <CheckCircle className="w-4 h-4 text-green-500" />, msg: 'Preenchido dentro do prazo' };
    } else if (diffMs <= 24 * 60 * 60 * 1000) {
      return { color: 'yellow', icon: <AlertCircle className="w-4 h-4 text-yellow-500" />, msg: 'Preenchido 24 horas após prazo' };
    } else {
      return { color: 'red', icon: <XCircle className="w-4 h-4 text-red-500" />, msg: 'Preenchido fora do prazo' };
    }
  }
  const prazoStatus = getPrazoStatus();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {indicator ? 'Editar Indicador' : 'Registrar Indicador'}
            </DialogTitle>
            {indicator && (
              <div className="flex items-center gap-2">
                {isDelayed ? (
                  prazoStatus && (
                    <>
                      {prazoStatus.icon}
                      <span className={`text-xs ${
                        prazoStatus.color === 'green' ? 'text-green-600' : prazoStatus.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                      }`}>{prazoStatus.msg}</span>
                    </>
                  )
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600">Preenchido dentro do prazo</span>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {funnelsError ? (
                    <div className="px-4 py-2 text-red-500 text-sm">
                      Erro ao carregar funis
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
                      Nenhum funil disponível
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {isOpen && !indicator && (
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
                  disabled={isLoading || !formData.funnel_id}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.length === 0 && (
                      <div className="px-4 py-2 text-muted-foreground text-sm">
                        Nenhum período disponível
                      </div>
                    )}
                    {periodOptions.map(opt => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        disabled={!opt.isAllowed}
                      >
                        <span className={opt.isMissing && destacarFaltantes ? 'text-red-500' : ''}>{opt.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedFunnel && crmUser?.role !== 'submaster' && (
              <>
                <div>
                  <Label htmlFor="sales_value">Valor das Vendas</Label>
                  <Input
                    id="sales_value"
                    type="text"
                    value={salesValue}
                    onChange={e => setSalesValue(e.target.value)}
                    placeholder="0,00"
                    disabled={isSubMaster}
                  />
                </div>
                
                <div>
                  <Label htmlFor="recommendations_count">Número de Recomendações</Label>
                  <Input
                    id="recommendations_count"
                    type="number"
                    min="0"
                    value={recommendationsCount}
                    onChange={e => setRecommendationsCount(Number(e.target.value) || 0)}
                    placeholder="Digite o número de recomendações"
                    disabled={isLoading}
                  />
                </div>

                {['master', 'admin'].includes(crmUser?.role || '') && (
                  <div className="mb-2">
                    <Label htmlFor="is_delayed">Preenchido com atraso?</Label>
                    <Select
                      value={isDelayed ? 'sim' : 'nao'}
                      onValueChange={val => setIsDelayed(val === 'sim')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                            <Label htmlFor={`stage_${stage.id}`}>{stage.name}
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
                              disabled={isLoading}
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.funnel_id || isSubMaster}>
              {isLoading ? 'Salvando...' : (indicator ? 'Atualizar' : 'Registrar Indicador')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
