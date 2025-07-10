
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFunnels } from '@/hooks/useFunnels';
import { useCreateIndicator, useUpdateIndicator } from '@/hooks/useIndicators';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';
import { FunnelSelector } from './FunnelSelector';
import { IndicatorModalProps, IndicatorFormData } from './types';

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

  const { crmUser } = useCrmAuth();
  const effectiveCompanyId = companyId || crmUser?.company_id || '';
  const { data: funnels, isLoading: isFunnelsLoading, error: funnelsError } = useFunnels(effectiveCompanyId, 'active');
  const { mutate: createIndicator } = useCreateIndicator();
  const { mutate: updateIndicator } = useUpdateIndicator();

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
    }
  }, [formData.funnel_id, funnels, indicator]);

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

    setIsLoading(true);

    try {
      const indicatorData = {
        user_id: crmUser!.id,
        company_id: companyId,
        funnel_id: formData.funnel_id,
        period_date: formData.period_date,
        period_start: formData.period_date,
        period_end: formData.period_date,
        month_reference: formData.month_reference,
        year_reference: formData.year_reference,
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
