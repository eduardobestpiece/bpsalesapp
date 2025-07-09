import { useState, useEffect } from 'react';
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
import { gerarPeriodosDiarios, gerarPeriodosSemanais, gerarPeriodoMensal, getUltimoDiaPeriodo, gerarPeriodosSemanaisUltimos90Dias, gerarPeriodosMensaisCustom, gerarDiasUltimos90AteOntem } from '@/lib/utils';
import { useIndicators } from '@/hooks/useIndicators';
import { supabase } from '@/integrations/supabase/client';
import ReactInputMask from 'react-input-mask';

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
  const [salesValue, setSalesValue] = useState('0,00');
  const [recommendationsCount, setRecommendationsCount] = useState(0);
  const [isAutoLoading, setIsAutoLoading] = useState(false);

  // Garantir que o companyId está correto (fallback para o do usuário logado)
  const { crmUser } = useCrmAuth();
  // Garantir que o companyId nunca é undefined
  const effectiveCompanyId = companyId || crmUser?.company_id || '';
  const { data: funnels, isLoading: isFunnelsLoading, error: funnelsError } = useFunnels(effectiveCompanyId, 'active');
  const { mutate: createIndicator } = useCreateIndicator();
  const { mutate: updateIndicator } = useUpdateIndicator();
  const { data: indicators } = useIndicators(effectiveCompanyId);

  // NOVA LÓGICA DE PERÍODOS
  let periodOptions: { label: string; value: string; isMissing?: boolean; isAllowed?: boolean }[] = [];
  let periodosRegistrados: string[] = [];
  let periodosUsuario: string[] = [];
  let ultimoPeriodoUsuario: string | null = null;
  const hoje = new Date();

  if (selectedFunnel && formData.month_reference && formData.year_reference && crmUser) {
    // Filtrar indicadores do usuário para o funil selecionado
    const indicadoresUsuario = (indicators || []).filter(
      (ind) => ind.funnel_id === selectedFunnel.id && ind.user_id === crmUser.id
    );
    periodosUsuario = indicadoresUsuario.map((ind) => ind.period_date);
    ultimoPeriodoUsuario = indicadoresUsuario.length > 0
      ? indicadoresUsuario.sort((a, b) => b.period_date.localeCompare(a.period_date))[0].period_date
      : null;

    // Períodos já registrados por todos usuários (para bloqueio visual)
    periodosRegistrados = (indicators || [])
      .filter((ind) =>
        ind.funnel_id === selectedFunnel.id &&
        ind.month_reference === formData.month_reference &&
        ind.year_reference === formData.year_reference
      )
      .map((ind) => ind.period_date);

    // Gerar todos os períodos possíveis para o mês/ano/funil
    let todosPeriodos: { label: string; value: string }[] = [];
    if (selectedFunnel.verification_type === 'daily') {
      todosPeriodos = gerarDiasUltimos90AteOntem();
    } else if (selectedFunnel.verification_type === 'weekly') {
      todosPeriodos = gerarPeriodosSemanais(
        formData.month_reference,
        formData.year_reference,
        selectedFunnel.verification_day ?? 1
      );
    } else if (selectedFunnel.verification_type === 'monthly') {
      todosPeriodos = gerarPeriodosMensaisCustom(formData.month_reference, formData.year_reference, selectedFunnel.verification_day ?? 1, 1);
    }

    // 1. PRIMEIRO REGISTRO DO USUÁRIO PARA O FUNIL
    if (periodosUsuario.length === 0) {
      if (selectedFunnel.verification_type === 'weekly') {
        // Gerar períodos semanais dos últimos 90 dias, respeitando o dia de início do funil
        todosPeriodos = gerarPeriodosSemanaisUltimos90Dias(selectedFunnel.verification_day ?? 1);
      } else if (selectedFunnel.verification_type === 'daily') {
        // Diários: últimos 90 dias até ontem
        todosPeriodos = gerarDiasUltimos90AteOntem();
      } else if (selectedFunnel.verification_type === 'monthly') {
        // Mensal: últimos 3 períodos, respeitando o dia de início do funil
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
      // Filtrar períodos cujo último dia já passou e está dentro dos últimos 90 dias
      const hoje = new Date();
      const dataLimite = new Date(hoje);
      dataLimite.setDate(dataLimite.getDate() - 89); // 90 dias incluindo hoje
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
            isMissing: true // sempre vermelho pois é o primeiro
          };
        });
    }
    // 2. SEGUNDO REGISTRO OU MAIS
    else {
      if (selectedFunnel.verification_type === 'daily') {
        // Só pode registrar entre o primeiro registro e ontem
        const primeiroDia = new Date(ultimoPeriodoUsuario!);
        const hoje = new Date();
        todosPeriodos = gerarDiasUltimos90AteOntem().filter(opt => {
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
        // Para semanal/mensal: comparar period_date salvo (data final) com o último dia do período
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
        // Só mostrar períodos cujo último dia seja maior que o último registrado e menor que hoje
        periodOptions = todosPeriodos
          .filter(opt => {
            const ultimoDia = new Date(getUltimoDiaPeriodo(opt.value));
            const ultimoRegistrado = new Date(ultimoPeriodoUsuario!);
            return ultimoDia > ultimoRegistrado && ultimoDia < hoje;
          })
          .map(opt => {
            const isMissing = !periodosUsuario.includes(getUltimoDiaPeriodo(opt.value));
            return {
              ...opt,
              isMissing,
              isAllowed: true
            };
          });
      }
    }
  }

  // Regra: só destacar faltantes em vermelho a partir do segundo registro
  const destacarFaltantes = periodosUsuario.length > 0;

  useEffect(() => {
    if (indicator) {
      // Preencher stages a partir de indicator.values
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
      setSalesValue(indicator.sales_value || '0,00');
      setRecommendationsCount(indicator.recommendations_count || 0);
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
      // Inicializar campos de vendas/recomendações
      if (funnel) {
        if (funnel.sales_value_mode === 'manual') {
          setSalesValue(indicator?.sales_value || '0,00');
        } else {
          // Aqui você pode buscar/calcular o valor das vendas do sistema
          setSalesValue('0,00'); // Substitua por lógica real
        }
        if (funnel.recommendations_mode === 'manual') {
          setRecommendationsCount(indicator?.recommendations_count || 0);
        } else {
          // Aqui você pode buscar/calcular o número de recomendações do sistema
          setRecommendationsCount(0); // Substitua por lógica real
        }
      }
    }
  }, [formData.funnel_id, funnels, indicator]);

  useEffect(() => {
    async function fetchAutoValues() {
      if (!selectedFunnel || !crmUser || !formData.funnel_id || !formData.period_date) return;
      setIsAutoLoading(true);
      // Determinar período (data inicial e final)
      let periodStart = formData.period_date;
      let periodEnd = formData.period_date;
      if (formData.period_date.includes('_')) {
        const [start, end] = formData.period_date.split('_');
        periodStart = start;
        periodEnd = end;
      }
      // Buscar valor das vendas
      if (selectedFunnel.sales_value_mode === 'sistema') {
        const { data, error } = await supabase
          .from('sales')
          .select('sale_value')
          .eq('responsible_id', crmUser.id)
          .eq('funnel_id', formData.funnel_id)
          .gte('sale_date', periodStart)
          .lte('sale_date', periodEnd)
          .eq('status', 'active');
        if (!error && data) {
          const total = data.reduce((sum, s) => sum + (s.sale_value || 0), 0);
          setSalesValue(total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ','));
        } else {
          setSalesValue('0,00');
        }
      }
      // Buscar número de recomendações
      if (selectedFunnel.recommendations_mode === 'sistema') {
        // Buscar id da source "Recomendação"
        const { data: sources } = await supabase
          .from('sources')
          .select('id')
          .eq('company_id', companyId)
          .eq('name', 'Recomendação')
          .eq('status', 'active')
          .limit(1)
          .single();
        const recommendationSourceId = sources?.id;
        if (recommendationSourceId) {
          const { data, error } = await supabase
            .from('leads')
            .select('id')
            .eq('responsible_id', crmUser.id)
            .eq('funnel_id', formData.funnel_id)
            .eq('source_id', recommendationSourceId)
            .gte('created_at', periodStart)
            .lte('created_at', periodEnd)
            .eq('status', 'active');
          if (!error && data) {
            setRecommendationsCount(data.length);
          } else {
            setRecommendationsCount(0);
          }
        } else {
          setRecommendationsCount(0);
        }
      }
      setIsAutoLoading(false);
    }
    if (selectedFunnel && ['master', 'admin'].includes(crmUser?.role)) {
      fetchAutoValues();
    }
  }, [selectedFunnel, crmUser, formData.funnel_id, formData.period_date, companyId]);

  // Máscara monetária: converte string com vírgula para número
  function parseMonetaryValue(value: string) {
    return Number(value.replace(/\./g, '').replace(',', '.')) || 0;
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
      // Corrigir period_date: se for intervalo, pega só o último dia
      const periodDateValue = formData.period_date.includes('_')
        ? formData.period_date.split('_')[1]
        : formData.period_date;

      // Remover sales_value e recommendations_count do objeto enviado
      const indicatorData = {
        user_id: crmUser.id,
        company_id: companyId,
        funnel_id: formData.funnel_id,
        period_date: periodDateValue,
        month_reference: formData.month_reference,
        year_reference: formData.year_reference,
        sales_value: parseMonetaryValue(salesValue),
        recommendations_count: recommendationsCount
      };

      const stageValues = Object.entries(formData.stages).map(([stageId, value]) => ({
        stage_id: stageId,
        value: value
      }));

      if (indicator) {
        // Update existing indicator
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
        // Create new indicator
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const indicatorData = {
        sales_value: parseMonetaryValue(salesValue),
        recommendations_count: recommendationsCount
      };
      const { error } = await supabase
        .from('indicators')
        .update(indicatorData)
        .eq('id', indicator.id);
      if (error) throw error;
      onClose();
    } catch (err) {
      // tratamento de erro
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
            {/* Mês */}
            <div>
              <Label htmlFor="month_reference">Mês *</Label>
              <Select
                value={String(formData.month_reference)}
                onValueChange={(value) => setFormData(prev => ({ ...prev, month_reference: Number(value) }))}
                disabled={isLoading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(12)].map((_, i) => {
                    const date = new Date(2000, i, 1);
                    const monthName = date.toLocaleString('pt-BR', { month: 'long' });
                    return (
                      <SelectItem key={i+1} value={String(i+1)}>
                        {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {/* Ano */}
            <div>
              <Label htmlFor="year_reference">Ano *</Label>
              <Input
                id="year_reference"
                type="number"
                value={formData.year_reference}
                onChange={(e) => setFormData(prev => ({ ...prev, year_reference: Number(e.target.value) }))}
                required
                disabled={isLoading}
                min={2000}
                max={2100}
              />
            </div>
            {/* Funil */}
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
                      Erro ao carregar funis: {funnelsError.message || 'Erro desconhecido'}
                    </div>
                  ) : isFunnelsLoading ? (
                    <div className="px-4 py-2 text-muted-foreground text-sm">
                      Carregando funis...
                    </div>
                  ) : funnels && funnels.length > 0 ? (
                    funnels.map((funnel) => (
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
            {/* Período */}
            {isOpen && !indicator && (
              <div>
                <Label htmlFor="period_date">Período *</Label>
                <Select
                  value={formData.period_date}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, period_date: value }))}
                  disabled={isLoading || !formData.funnel_id}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.length === 0 && (
                      <div className="px-4 py-2 text-muted-foreground text-sm">
                        {periodosUsuario.length === 0
                          ? 'Nenhum período disponível para registro neste mês/ano. Só é possível registrar períodos cujo último dia já passou e estejam dentro dos últimos 90 dias.'
                          : 'Nenhum período disponível entre o último registrado e o período atual. Não há períodos pendentes para registro neste mês/ano.'}
                      </div>
                    )}
                    {periodOptions.map(opt => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        disabled={(!opt.isAllowed) || (periodosRegistrados.includes(opt.value) && (!indicator || indicator.period_date !== opt.value))}
                      >
                        <span className={opt.isMissing && destacarFaltantes ? 'text-red-500' : ''}>{opt.label}</span>
                        {periodosRegistrados.includes(opt.value) && (!indicator || indicator.period_date !== opt.value) && (
                          <span className="ml-2 text-xs text-muted-foreground">(já registrado)</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Exibir data/hora de criação no modo edição */}
                {indicator && indicator.created_at && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Preenchido em: {new Date(indicator.created_at).toLocaleString('pt-BR')}
                  </div>
                )}
              </div>
            )}
            {/* CAMPOS RESTRITOS MASTER/ADMIN */}
            {selectedFunnel && ['master', 'admin'].includes(crmUser?.role) && (
              <>
                <div>
                  <Label htmlFor="sales_value">Valor das Vendas</Label>
                  {selectedFunnel.sales_value_mode === 'manual' ? (
                    <ReactInputMask
                      mask="999.999.999,99"
                      maskChar={null}
                      value={salesValue}
                      onChange={e => setSalesValue(e.target.value)}
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                  ) : (
                    <Input
                      id="sales_value"
                      type="number"
                      value={isAutoLoading ? '...' : salesValue}
                      disabled
                      placeholder="Calculado automaticamente"
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="recommendations_count">Número de Recomendações</Label>
                  {selectedFunnel.recommendations_mode === 'manual' ? (
                    <Input
                      id="recommendations_count"
                      type="number"
                      min="0"
                      value={recommendationsCount}
                      onChange={e => setRecommendationsCount(Number(e.target.value) || 0)}
                      placeholder="Digite o número de recomendações"
                      disabled={isLoading}
                    />
                  ) : (
                    <Input
                      id="recommendations_count"
                      type="number"
                      value={isAutoLoading ? '...' : recommendationsCount}
                      disabled
                      placeholder="Calculado automaticamente"
                    />
                  )}
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
