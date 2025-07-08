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
import { gerarPeriodosDiarios, gerarPeriodosSemanais, gerarPeriodoMensal, getUltimoDiaPeriodo, gerarPeriodosSemanaisUltimos90Dias } from '@/lib/utils';
import { useIndicators } from '@/hooks/useIndicators';

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
      todosPeriodos = gerarPeriodosDiarios(formData.month_reference, formData.year_reference);
    } else if (selectedFunnel.verification_type === 'weekly') {
      todosPeriodos = gerarPeriodosSemanais(
        formData.month_reference,
        formData.year_reference,
        selectedFunnel.verification_day ?? 1
      );
    } else if (selectedFunnel.verification_type === 'monthly') {
      todosPeriodos = gerarPeriodoMensal(formData.month_reference, formData.year_reference);
    }

    // 1. PRIMEIRO REGISTRO DO USUÁRIO PARA O FUNIL
    if (periodosUsuario.length === 0) {
      if (selectedFunnel.verification_type === 'weekly') {
        // Gerar períodos semanais dos últimos 90 dias, respeitando o dia de início do funil
        todosPeriodos = gerarPeriodosSemanaisUltimos90Dias(selectedFunnel.verification_day ?? 1);
      } else if (selectedFunnel.verification_type === 'daily') {
        // Diários: últimos 90 dias
        const hoje = new Date();
        const dataLimite = new Date(hoje);
        dataLimite.setDate(dataLimite.getDate() - 89);
        todosPeriodos = gerarPeriodosDiarios(hoje.getMonth() + 1, hoje.getFullYear())
          .filter(opt => {
            const data = new Date(opt.value);
            return data >= dataLimite && data <= hoje;
          });
      } else if (selectedFunnel.verification_type === 'monthly') {
        // Mensal: últimos 3 meses
        const hoje = new Date();
        todosPeriodos = [];
        for (let i = 0; i < 3; i++) {
          const mes = hoje.getMonth() + 1 - i;
          const ano = hoje.getFullYear() - (mes <= 0 ? 1 : 0);
          const mesCorrigido = ((mes - 1 + 12) % 12) + 1;
          todosPeriodos.push(...gerarPeriodoMensal(mesCorrigido, ano));
        }
      }
      // Buscar períodos dos últimos 90 dias (de hoje para trás)
      const hoje = new Date();
      const dataLimite = new Date(hoje);
      dataLimite.setDate(dataLimite.getDate() - 89); // 90 dias incluindo hoje
      periodOptions = todosPeriodos
        .filter(opt => {
          // O último dia do período deve estar entre dataLimite e hoje
          const ultimoDia = new Date(getUltimoDiaPeriodo(opt.value));
          return ultimoDia >= dataLimite && ultimoDia <= hoje;
        })
        .sort((a, b) => new Date(getUltimoDiaPeriodo(b.value)).getTime() - new Date(getUltimoDiaPeriodo(a.value)).getTime())
        .map(opt => {
          // Só pode registrar se hoje >= último dia do período
          const ultimoDia = new Date(getUltimoDiaPeriodo(opt.value));
          const isAllowed = hoje >= ultimoDia;
          return {
            ...opt,
            isAllowed,
            isMissing: true // sempre vermelho pois é o primeiro
          };
        });
    }
    // 2. SEGUNDO REGISTRO OU MAIS
    else {
      // Encontrar o índice do último período registrado pelo usuário
      const idxUltimo = todosPeriodos.findIndex(opt => opt.value === ultimoPeriodoUsuario);
      // Só mostrar períodos entre o último registrado (exclusivo) e o período vigente (último dia <= hoje)
      periodOptions = todosPeriodos
        .filter((opt, idx) => {
          const ultimoDia = new Date(getUltimoDiaPeriodo(opt.value));
          return idx > idxUltimo && ultimoDia <= hoje;
        })
        .map(opt => {
          const isMissing = !periodosUsuario.includes(opt.value);
          return {
            ...opt,
            isMissing,
            isAllowed: true // sempre permitido se está na lista
          };
        });
    }
  }

  // Regra: só destacar faltantes em vermelho a partir do segundo registro
  const destacarFaltantes = periodosUsuario.length > 0;

  useEffect(() => {
    if (indicator) {
      setFormData({
        period_date: indicator.period_date,
        funnel_id: indicator.funnel_id,
        month_reference: indicator.month_reference,
        year_reference: indicator.year_reference,
        stages: indicator.stages || {}
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        period_date: today,
        funnel_id: '',
        month_reference: new Date().getMonth() + 1,
        year_reference: new Date().getFullYear(),
        stages: {}
      });
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
    }
  }, [formData.funnel_id, funnels, indicator]);

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
      const indicatorData = {
        user_id: crmUser.id,
        company_id: companyId,
        funnel_id: formData.funnel_id,
        period_date: formData.period_date,
        month_reference: formData.month_reference,
        year_reference: formData.year_reference
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
            </div>
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
