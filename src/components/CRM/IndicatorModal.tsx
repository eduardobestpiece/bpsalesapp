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
  // Estado para seleção em massa (preparação)
  const [tempSelectedIndicators, setTempSelectedIndicators] = useState<string[]>([]); // IDs dos indicadores selecionados
  const [isDelayed, setIsDelayed] = useState<boolean>(indicator?.is_delayed || false);

  // Adicionar flag para saber se está em modo edição
  const isEditing = !!indicator;

  // Se for edição, inicializar campos imutáveis uma única vez
  const [immutableFields] = useState(() =>
    indicator ? {
      period_date: indicator.period_date,
      period_start: indicator.period_start,
      period_end: indicator.period_end,
      month_reference: indicator.month_reference,
      year_reference: indicator.year_reference,
      funnel_id: indicator.funnel_id
    } : null
  );

  // Garantir que o companyId está correto (fallback para o do usuário logado)
  const { crmUser } = useCrmAuth();
  // Garantir que o companyId nunca é undefined
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
  ).map((ind) => ind.period_date)) : [];
  const indicadoresUsuario = Array.isArray(indicators) && selectedFunnel && crmUser ? indicators.filter(
    (ind) => ind.funnel_id === selectedFunnel.id && ind.user_id === crmUser.id
  ) : [];
  const periodosUsuario: string[] = indicadoresUsuario ? indicadoresUsuario.map((ind) => ind.period_date) : [];
  // Filtrar apenas registros com period_end válido
  const indicadoresUsuarioValidos = indicadoresUsuario.filter(ind => !!ind.period_end);
  const ultimoRegistroUsuario = indicadoresUsuarioValidos.length > 0
    ? indicadoresUsuarioValidos.sort((a, b) => {
        // Proteger contra period_end nulo
        const aDate = a.period_end ? new Date(a.period_end).getTime() : 0;
        const bDate = b.period_end ? new Date(b.period_end).getTime() : 0;
        return bDate - aDate;
      })[0]
    : null;

  const hoje = new Date();

  if (selectedFunnel && formData.month_reference && formData.year_reference && crmUser) {
    // Filtrar indicadores do usuário para o funil selecionado
    // const indicadoresUsuario = (indicators || []).filter(
    //   (ind) => ind.funnel_id === selectedFunnel.id && ind.user_id === crmUser.id
    // );
    // periodosUsuario = indicadoresUsuario.map((ind) => ind.period_date);
    // ultimoPeriodoUsuario = indicadoresUsuario.length > 0
    //   ? indicadoresUsuario.sort((a, b) => b.period_date.localeCompare(a.period_date))[0].period_date
    //   : null;

    // Períodos já registrados por todos usuários (para bloqueio visual)
    // periodosRegistrados = (indicators || [])
    //   .filter((ind) =>
    //     ind.funnel_id === selectedFunnel.id &&
    //     ind.month_reference === formData.month_reference &&
    //     ind.year_reference === formData.year_reference
    //   )
    //   .map((ind) => ind.period_date);

    // Remover filtro por mês/ano do formulário na busca dos períodos disponíveis
    // Gerar todos os períodos possíveis para o funil, sem limitar por formData.month_reference/year_reference
    let todosPeriodos: { label: string; value: string }[] = [];
    if (selectedFunnel.verification_type === 'daily') {
      todosPeriodos = gerarDiasUltimos90AteHoje();
    } else if (selectedFunnel.verification_type === 'weekly') {
      todosPeriodos = gerarPeriodosSemanaisUltimos90Dias(selectedFunnel.verification_day ?? 1);
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

    // 1. PRIMEIRO REGISTRO DO USUÁRIO PARA O FUNIL
    if (periodosUsuario.length === 0) {
      if (selectedFunnel.verification_type === 'weekly') {
        // Gerar períodos semanais dos últimos 90 dias, respeitando o dia de início do funil
        todosPeriodos = gerarPeriodosSemanaisUltimos90Dias(selectedFunnel.verification_day ?? 1);
      } else if (selectedFunnel.verification_type === 'daily') {
        // Diários: últimos 90 dias até ontem
        todosPeriodos = gerarDiasUltimos90AteHoje();
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
        const primeiroDia = new Date(ultimoRegistroUsuario?.period_end || ultimoPeriodoUsuario!);
        const hoje = new Date();
        todosPeriodos = gerarDiasUltimos90AteHoje().filter(opt => {
          const data = new Date(opt.value);
          return data >= primeiroDia && data < hoje;
        });
        periodOptions = todosPeriodos.map(opt => {
          const isMissing = !(Array.isArray(periodosUsuario) ? periodosUsuario : []).includes(opt.value);
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
        // Sempre derive os períodos já registrados e o último registro APENAS de indicadoresUsuario (filtrados por funil e usuário)
        // Isso garante que cada funil/usuário tem sua própria linha do tempo de registros
        const periodosRegistradosUsuario = indicadoresUsuario ? indicadoresUsuario.map(ind => {
          if (ind.period_start && ind.period_end) {
            return `${ind.period_start}_${ind.period_end}`;
          }
          return '';
        }) : [];
        const ultimoRegistroUsuario = indicadoresUsuario && indicadoresUsuario.length > 0
          ? indicadoresUsuario.sort((a, b) => {
              // Proteger contra period_end nulo
              const aDate = a.period_end ? new Date(a.period_end).getTime() : 0;
              const bDate = b.period_end ? new Date(b.period_end).getTime() : 0;
              return bDate - aDate;
            })[0]
          : null;
        console.log('[DEBUG] Todos os períodos possíveis:', todosPeriodos.map(p => p.value));
        console.log('[DEBUG] Último registro do usuário:', ultimoRegistroUsuario);
        console.log('[DEBUG] period_end do último registro:', ultimoRegistroUsuario ? ultimoRegistroUsuario.period_end : null);
        // Na filtragem dos períodos disponíveis (para semanal/mensal):
        periodOptions = todosPeriodos
          .filter(opt => {
            let primeiroDiaPeriodo = null;
            let identificadorPeriodo = opt.value;
            if (opt.value.includes('_')) {
              primeiroDiaPeriodo = new Date(opt.value.split('_')[0]);
            } else {
              primeiroDiaPeriodo = new Date(opt.value);
            }
            // Só mostrar períodos cujo início seja estritamente maior que o period_end do último registro
            const isValid = (!ultimoRegistroUsuario || primeiroDiaPeriodo > new Date(ultimoRegistroUsuario.period_end))
              && primeiroDiaPeriodo < hoje
              && !periodosRegistradosUsuario.includes(identificadorPeriodo);
            if (!isValid) {
              console.log('[DEBUG] Período filtrado:', identificadorPeriodo, 'primeiroDiaPeriodo:', primeiroDiaPeriodo, 'ultimoRegistroUsuario.period_end:', ultimoRegistroUsuario ? ultimoRegistroUsuario.period_end : null);
            }
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

  // Regra: só destacar faltantes em vermelho a partir do segundo registro
  const destacarFaltantes = periodosUsuario.length > 0;

  // useEffect de inicialização do indicador
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
      setIsDelayed(indicator.is_delayed || false);
      // Preencher periodStart e periodEnd corretamente ao editar
      if (indicator.period_date) {
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

  // useEffect para seleção de funil: só inicializa campos se NÃO estiver editando
  useEffect(() => {
    if (formData.funnel_id && funnels && !isEditing) {
      const funnel = funnels.find(f => f.id === formData.funnel_id);
      setSelectedFunnel(funnel);
      // Initialize stages with empty values apenas na criação
      if (funnel?.stages) {
        const newStages: Record<string, number> = {};
        funnel.stages.forEach((stage: any) => {
          newStages[stage.id] = 0;
        });
        setFormData(prev => ({ ...prev, stages: newStages }));
      }
      // Inicializar campos de vendas/recomendações apenas na criação
      if (funnel) {
        if (funnel.sales_value_mode === 'manual') {
          setSalesValue('0,00');
        } else {
          setSalesValue('0,00');
        }
        if (funnel.recommendations_mode === 'manual') {
          setRecommendationsCount(0);
        } else {
          setRecommendationsCount(0);
        }
      }
    } else if (formData.funnel_id && funnels) {
      // Sempre setar o funil selecionado para exibir etapas, mas não mexer em mais nada
      const funnel = funnels.find(f => f.id === formData.funnel_id);
      setSelectedFunnel(funnel);
    }
  }, [formData.funnel_id, funnels]);

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
    if (selectedFunnel && ['master', 'admin'].includes(crmUser?.role || '')) {
      fetchAutoValues();
    }
  }, [selectedFunnel, crmUser, formData.funnel_id, formData.period_date, companyId]);

  // Função para converter string monetária para número
  function parseMonetaryValue(value: string) {
    if (!value) return 0;
    return Number(value.replace(/\./g, '').replace(',', '.'));
  }
  // Função para extrair todos os meses e anos presentes em cada dia do período
  function getAllMonthsAndYears(start: string, end: string) {
    if (!start || !end) return { months: [], years: [] };
    const startDate = new Date(start);
    const endDate = new Date(end);
    let monthsSet = new Set();
    let yearsSet = new Set();
    let d = new Date(startDate);
    while (d <= endDate) {
      monthsSet.add(d.getMonth() + 1);
      yearsSet.add(d.getFullYear());
      d.setDate(d.getDate() + 1);
    }
    return { months: Array.from(monthsSet), years: Array.from(yearsSet) };
  }

  // Função para extrair datas do valor do select de período
  function extractPeriodDates(periodString: string) {
    // Formato 1: 'YYYY-MM-DD_YYYY-MM-DD'
    if (periodString.includes('_')) {
      const [start, end] = periodString.split('_');
      console.log('[Indicador] Extraído (ISO):', start, end);
      return { start, end };
    }
    // Formato 2: 'YYYY-MM-DD' (diário)
    if (/^\d{4}-\d{2}-\d{2}$/.test(periodString)) {
      // Período diário: início e fim são iguais
      console.log('[Indicador] Extraído (diário):', periodString);
      return { start: periodString, end: periodString };
    }
    // Formato 3: 'De dd/mm/yyyy até dd/mm/yyyy'
    const match = periodString.match(/(\d{2}\/\d{2}\/\d{4}).*?(\d{2}\/\d{2}\/\d{4})/);
    if (match) {
      const [_, start, end] = match;
      const [d1, m1, y1] = start.split('/');
      const [d2, m2, y2] = end.split('/');
      const s = `${y1}-${m1}-${d1}`;
      const e = `${y2}-${m2}-${d2}`;
      console.log('[Indicador] Extraído (extenso):', s, e);
      return { start: s, end: e };
    }
    console.warn('[Indicador] Não foi possível extrair datas do período:', periodString);
    return { start: '', end: '' };
  }

  // Atualiza opções de mês/ano ao mudar datas
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
        setMonthReference(endMonth); // Seleciona mês da data fim
      }
      if (startYear === endYear) {
        years = [startYear];
        setYearReference(startYear);
      } else {
        years = [startYear, endYear];
        setYearReference(endYear); // Seleciona ano da data fim
      }
      setMonthOptions(months);
      setYearOptions(years);
    } else if (!isEditing) {
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
      // Garantir que salesValue é string antes de usar .replace
      let salesValueStr = salesValue;
      if (typeof salesValueStr === 'number') salesValueStr = salesValueStr.toString();
      if (typeof salesValueStr !== 'string') salesValueStr = '0,00';
      const indicatorData = {
        user_id: crmUser.id,
        company_id: companyId,
        funnel_id: formData.funnel_id,
        // Garantir que ao editar, o período original é mantido
        period_start: periodStart,
        period_end: periodEnd,
        month_reference: monthReference,
        year_reference: yearReference,
        sales_value: parseMonetaryValue(salesValueStr),
        recommendations_count: recommendationsCount,
        // Remover is_delayed do payload
        // is_delayed: isDelayed
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

  // Submit de edição: só envia campos mutáveis
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const indicatorData = {
        period_start: immutableFields.period_start,
        period_end: immutableFields.period_end,
        month_reference: immutableFields.month_reference,
        year_reference: immutableFields.year_reference,
        funnel_id: immutableFields.funnel_id,
        sales_value: parseMonetaryValue(salesValue),
        recommendations_count: recommendationsCount,
      };
      const stageValues = Object.entries(stages).map(([stageId, value]) => ({ stage_id, value }));
      await updateIndicator({ id: indicator.id, indicator: indicatorData, values: stageValues }, {
        onSuccess: () => { toast.success('Indicador atualizado com sucesso!'); onClose(); },
        onError: (error: any) => { toast.error(error.message || 'Erro ao atualizar indicador'); }
      });
    } catch (err) { toast.error('Erro ao atualizar indicador'); } finally { setIsLoading(false); }
  };

  // Função utilitária para calcular status do prazo
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

  // Remover checagem excessiva no início do componente:
  if (isEditing && !indicator) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erro ao abrir indicador</DialogTitle>
          </DialogHeader>
          <div className="text-red-500">Não foi possível carregar os dados do indicador para edição.</div>
          <div className="flex justify-end mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Indicador' : 'Registrar Indicador'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={isEditing ? handleEditSubmit : handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* No modo edição, não renderiza seleção de período/funil */}
            {!isEditing && (
              <>
                {/* Campo Mês */}
                <div>
                  <label>Mês *</label>
                  {monthOptions.length === 1 && monthReference ? (
                    <div>{new Date(2000, monthReference - 1, 1).toLocaleString('pt-BR', { month: 'long' })}</div>
                  ) : (
                    <select value={monthReference ?? ''} onChange={e => setMonthReference(Number(e.target.value))} required>
                      <option value="">Selecione</option>
                      {monthOptions.map(m => (
                        <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                      ))}
                    </select>
                  )}
                </div>
                {/* Campo Ano */}
                <div>
                  <label>Ano *</label>
                  {yearOptions.length === 1 && yearReference ? (
                    <div>{yearReference}</div>
                  ) : (
                    <select value={yearReference ?? ''} onChange={e => setYearReference(Number(e.target.value))} required>
                      <option value="">Selecione</option>
                      {yearOptions.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  )}
                </div>
                {/* Campo Funil */}
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
                {/* Período */}
                {isOpen && (
                  <div>
                    <Label htmlFor="period_date">Período *</Label>
                    <Select
                      value={formData.period_date}
                      onValueChange={(value) => {
                        setFormData({ ...formData, period_date: value });
                        const { start, end } = extractPeriodDates(value);
                        setPeriodStart(start);
                        setPeriodEnd(end);
                        console.log('[Indicador] Período selecionado:', value, '| Início:', start, '| Fim:', end);
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
                            Nenhum período disponível para registro nos últimos 90 dias.
                          </div>
                        )}
                        {periodOptions.map(opt => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            disabled={opt.preenchido}
                            className={opt.preenchido ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : ''}
                          >
                            <span>{opt.label}</span>
                            {opt.preenchido && <span className="ml-2 text-xs text-gray-400">(preenchido)</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
            {/* Período atual: só exibe no modo edição */}
            {isEditing && (
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Período: {periodStart && periodEnd ? `De ${new Date(periodStart).toLocaleDateString('pt-BR')} até ${new Date(periodEnd).toLocaleDateString('pt-BR')}` : '-'}</span>
              </div>
            )}
            {/* Valor das Vendas, Recomendações e Resultados por Etapa: sempre exibidos */}
            {selectedFunnel && (
              <>
                {/* Campo Valor das Vendas */}
                <div>
                  <Label htmlFor="sales_value">Valor das Vendas</Label>
                  <Input id="sales_value" type="text" value={salesValue} onChange={e => setSalesValue(e.target.value)} placeholder="0,00" inputMode="decimal" disabled={isEditing} />
                </div>
                {/* Campo Número de Recomendações */}
                <div>
                  <Label htmlFor="recommendations_count">Número de Recomendações</Label>
                  <Input id="recommendations_count" type="number" value={recommendationsCount} onChange={e => setRecommendationsCount(Number(e.target.value))} disabled={isEditing} />
                </div>
              </>
            )}
          </div>
          {/* Resultados por Etapa */}
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
                              disabled={isEditing}
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
          {/* Data de preenchimento embaixo, alinhada à esquerda */}
          {indicator && indicator.created_at && (
            <div className="text-xs text-muted-foreground">
              Preenchido em: {new Date(indicator.created_at).toLocaleString('pt-BR')}
            </div>
          )}
          <div className="flex justify-end space-x-2 w-full md:w-auto">
            {!isEditing && (
              <Button type="submit" disabled={isLoading}>Salvar</Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
