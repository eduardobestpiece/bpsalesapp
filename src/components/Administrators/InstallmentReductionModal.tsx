
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMasterConfig } from '@/contexts/MasterConfigContext';
import { useQuery } from '@tanstack/react-query';

interface InstallmentReductionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: any;
  userRole: 'master' | 'admin' | 'submaster';
  companyId: string;
}

export const InstallmentReductionModal: React.FC<InstallmentReductionModalProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  userRole,
  companyId,
}) => {
  const { toast } = useToast();
  const [name, setName] = useState(initialData?.name || '');
  const [administratorId, setAdministratorId] = useState(initialData?.administrator_id || '');
  const [reductionPercent, setReductionPercent] = useState(initialData?.reduction_percent || 0);
  const [applications, setApplications] = useState<string[]>(initialData?.applications || []);
  const [isArchived, setIsArchived] = useState(initialData?.is_archived || false);

  const { data: administrators } = useQuery({
    queryKey: ['administrators', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('administrators')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const handleApplicationChange = (application: string, checked: boolean) => {
    if (checked) {
      setApplications([...applications, application]);
    } else {
      setApplications(applications.filter(app => app !== application));
    }
  };

  const handleSave = async () => {
    if (!name || !administratorId || !reductionPercent) {
      toast({
        title: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data = {
        name,
        administrator_id: administratorId,
        reduction_percent: reductionPercent,
        applications,
        is_archived: isArchived,
        company_id: companyId,
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from('installment_reductions')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', initialData.id);
        
        if (error) throw error;
        toast({ title: 'Redução de parcela atualizada com sucesso!' });
      } else {
        const { error } = await supabase
          .from('installment_reductions')
          .insert(data);
        
        if (error) throw error;
        toast({ title: 'Redução de parcela criada com sucesso!' });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving installment reduction:', error);
      toast({
        title: 'Erro ao salvar redução de parcela',
        variant: 'destructive',
      });
    }
  };

  const canEdit = userRole === 'master' || userRole === 'admin' || userRole === 'submaster';

  const applicationOptions = [
    { value: 'installment', label: 'Parcela' },
    { value: 'admin_tax', label: 'Taxa de Administração' },
    { value: 'reserve_fund', label: 'Fundo de Reserva' },
    { value: 'insurance', label: 'Seguro' },
  ];

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setAdministratorId(initialData.administrator_id || '');
      setReductionPercent(initialData.reduction_percent || 0);
      setApplications(initialData.applications || []);
      setIsArchived(initialData.is_archived || false);
    } else {
      setName('');
      setAdministratorId('');
      setReductionPercent(0);
      setApplications([]);
      setIsArchived(false);
    }
  }, [initialData, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Redução de Parcela' : 'Nova Redução de Parcela'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Redução *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              placeholder="Ex: Redução Padrão"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="administrator">Administradora *</Label>
            <Select
              value={administratorId}
              onValueChange={setAdministratorId}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma administradora" />
              </SelectTrigger>
              <SelectContent>
                {administrators?.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reduction">Percentual de Redução (%) *</Label>
            <Input
              id="reduction"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={reductionPercent}
              onChange={(e) => setReductionPercent(parseFloat(e.target.value) || 0)}
              disabled={!canEdit}
              placeholder="Ex: 50.00"
            />
          </div>

          <div className="space-y-3">
            <Label>Aplicações da Redução</Label>
            <div className="grid grid-cols-2 gap-3">
              {applicationOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={applications.includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleApplicationChange(option.value, checked as boolean)
                    }
                    disabled={!canEdit}
                  />
                  <Label htmlFor={option.value} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {userRole === 'master' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="archived"
                checked={isArchived}
                onCheckedChange={setIsArchived}
              />
              <Label htmlFor="archived">Arquivado</Label>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            {canEdit && (
              <Button onClick={handleSave}>
                {initialData ? 'Salvar Alterações' : 'Criar Redução'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
