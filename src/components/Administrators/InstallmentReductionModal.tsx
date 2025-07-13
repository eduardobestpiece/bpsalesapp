
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';

interface InstallmentReductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installmentReduction?: any;
  onSuccess: () => void;
}

export const InstallmentReductionModal = ({ 
  open, 
  onOpenChange, 
  installmentReduction, 
  onSuccess 
}: InstallmentReductionModalProps) => {
  const { selectedCompanyId } = useCompany();
  const [formData, setFormData] = useState({
    name: '',
    administrator_id: '',
    reduction_percent: '',
    applications: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const { data: administrators = [] } = useQuery({
    queryKey: ['administrators', selectedCompanyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('administrators')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .eq('is_archived', false)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompanyId
  });

  useEffect(() => {
    if (installmentReduction) {
      setFormData({
        name: installmentReduction.name || '',
        administrator_id: installmentReduction.administrator_id || '',
        reduction_percent: installmentReduction.reduction_percent?.toString() || '',
        applications: installmentReduction.applications || [],
      });
    } else {
      setFormData({
        name: '',
        administrator_id: '',
        reduction_percent: '',
        applications: [],
      });
    }
  }, [installmentReduction, open]);

  const handleApplicationChange = (application: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      applications: checked
        ? [...prev.applications, application]
        : prev.applications.filter(app => app !== application)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      toast.error('Empresa não selecionada');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        administrator_id: formData.administrator_id || null,
        company_id: selectedCompanyId,
        reduction_percent: parseFloat(formData.reduction_percent),
        applications: formData.applications,
      };

      if (installmentReduction) {
        const { error } = await supabase
          .from('installment_reductions')
          .update(payload)
          .eq('id', installmentReduction.id);
        if (error) throw error;
        toast.success('Redução atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('installment_reductions')
          .insert([payload]);
        if (error) throw error;
        toast.success('Redução criada com sucesso!');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error('Erro ao salvar redução: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applicationOptions = [
    { value: 'installment', label: 'Parcela' },
    { value: 'admin_tax', label: 'Taxa de Administração' },
    { value: 'reserve_fund', label: 'Fundo de Reserva' },
    { value: 'insurance', label: 'Seguro' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {installmentReduction ? 'Editar' : 'Nova'} Redução de Parcela
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome da Redução *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="reduction_percent">Percentual de Redução (%) *</Label>
              <Input
                id="reduction_percent"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.reduction_percent}
                onChange={(e) => setFormData({ ...formData, reduction_percent: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="administrator_id">Administradora</Label>
            <Select 
              value={formData.administrator_id} 
              onValueChange={(value) => setFormData({ ...formData, administrator_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma administradora (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as administradoras</SelectItem>
                {administrators.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Aplicações da Redução *</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {applicationOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={formData.applications.includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleApplicationChange(option.value, checked as boolean)
                    }
                  />
                  <Label htmlFor={option.value} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
