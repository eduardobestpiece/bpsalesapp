
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFunnels } from '@/hooks/useFunnels';
import { useCreateIndicator, useUpdateIndicator } from '@/hooks/useIndicators';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';
import { FunnelSelector } from './FunnelSelector';
import { PeriodSelector } from './PeriodSelector';
import { MonthYearSelector } from './MonthYearSelector';
import { StageInputs } from './StageInputs';
import { SalesRecommendationsInputs } from './SalesRecommendationsInputs';
import { IndicatorModalProps, IndicatorFormData, PeriodOption } from './types';
import { useIndicators } from '@/hooks/useIndicators';
import { supabase } from '@/integrations/supabase/client';
import { 
  gerarPeriodosDiarios, 
  gerarPeriodosSemanais, 
  gerarPeriodoMensal, 
  getUltimoDiaPeriodo, 
  gerarPeriodosSemanaisUltimos90Dias, 
  gerarPeriodosMensaisCustom, 
  gerarDiasUltimos90AteHoje 
} from '@/lib/utils';

export const IndicatorModal = ({ isOpen, onClose, companyId, indicator }: IndicatorModalProps) => {
  const [formData, setFormData] = useState<IndicatorFormData>({
    period_date: '',
    funnel_id: '',
    month_reference: new Date().getMonth() + 1,
    year_reference: new Date().getFullYear(),
    stages: {}
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

  const { crmUser } = useCrmAuth();
  const effectiveCompanyId = companyId || crmUser?.company_id || '';
  const { data: funnels, isLoading: isFunnelsLoading, error: funnelsError } = useFunnels(effectiveCompanyId, 'active');
  const { mutate: createIndicator } = useCreateIndicator();
  const { mutate: updateIndicator } = useUpdateIndicator();
  const { data: indicators } = useIndicators(effectiveCompanyId);

  // Generate period options
  const periodOptions: PeriodOption[] = [];
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

  // Initialize form data
  useEffect(() => {
    if (indicator) {
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

  // Initialize funnel and stages
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
          setSalesValue(indicator?.sales_value || '0,00');
        } else {
          setSalesValue('0,00');
        }
        if (funnel.recommendations_mode === 'manual') {
          setRecommendationsCount(indicator?.recommendations_count || 0);
        } else {
          setRecommendationsCount(0);
        }
      }
    }
  }, [formData.funnel_id, funnels, indicator]);

  // Extract period dates
  const extractPeriodDates = (periodString: string) => {
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
  };

  // Update month/year options
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

  const parseMonetaryValue = (value: string): number => {
    if (!value) return 0;
    return Number(value.replace(/\./g, '').replace(',', '.'));
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
        user_id: crmUser!.id,
        company_id: companyId,
        funnel_id: formData.funnel_id,
        period_date: formData.period_date,
        period_start: periodStart,
        period_end: periodEnd,
        month_reference: monthReference,
        year_reference: yearReference,
        sales_value: parseFloat(salesValue.replace(',', '.')),
        recommendations_count: recommendationsCount
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
            <FunnelSelector
              value={formData.funnel_id}
              onValueChange={(value: string) => setFormData(prev => ({ ...prev, funnel_id: value }))}
              funnels={funnels}
              isFunnelsLoading={isFunnelsLoading}
              funnelsError={funnelsError}
              disabled={isLoading}
            />
          </div>

          {selectedFunnel && (
            <>
              <PeriodSelector
                value={formData.period_date}
                onValueChange={(value: string) => {
                  setFormData(prev => ({ ...prev, period_date: value }));
                  const dates = extractPeriodDates(value);
                  setPeriodStart(dates.start);
                  setPeriodEnd(dates.end);
                }}
                periodOptions={periodOptions}
                disabled={isLoading}
              />

              <MonthYearSelector
                monthOptions={monthOptions}
                yearOptions={yearOptions}
                monthReference={monthReference}
                yearReference={yearReference}
                onMonthChange={setMonthReference}
                onYearChange={setYearReference}
                disabled={isLoading}
              />

              <StageInputs
                stages={selectedFunnel.stages || []}
                stageValues={formData.stages}
                onStageValueChange={handleStageValueChange}
                disabled={isLoading}
              />

              <SalesRecommendationsInputs
                funnel={selectedFunnel}
                salesValue={salesValue}
                recommendationsCount={recommendationsCount}
                onSalesValueChange={setSalesValue}
                onRecommendationsCountChange={setRecommendationsCount}
                disabled={isLoading}
                isAutoLoading={isAutoLoading}
              />
            </>
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
