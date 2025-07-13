import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MultiSelect from '@/components/ui/multiselect';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { CreateAdministratorModal } from '@/components/Administrators/AdministratorModal';

const applicationsOptions = [
  { value: 'installment', label: 'Parcela' },
  { value: 'admin_tax', label: 'Taxa de administração' },
  { value: 'reserve_fund', label: 'Fundo de reserva' },
  { value: 'insurance', label: 'Seguro' },
];

const reductionSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  administrator_id: z.string().min(1, 'Administradora é obrigatória'),
  reduction_percent: z.number().min(0).max(100, 'Percentual deve ser entre 0 e 100'),
  applications: z.array(z.string()).min(1, 'Selecione pelo menos uma aplicação'),
});

type ReductionFormData = z.infer<typeof reductionSchema>;

interface InstallmentReductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reduction?: any;
  onSuccess: () => void;
  isCopy?: boolean;
}

export const InstallmentReductionModal: React.FC<InstallmentReductionModalProps> = ({
  open,
  onOpenChange,
  reduction,
  onSuccess,
  isCopy = false,
}) => {
  const { selectedCompanyId } = useCompany();
  const [administrators, setAdministrators] = React.useState<any[]>([]);
  const [showCreateAdminModal, setShowCreateAdminModal] = React.useState(false);

  const form = useForm<ReductionFormData>({
    resolver: zodResolver(reductionSchema),
    defaultValues: {
      name: reduction?.name || '',
      administrator_id: reduction?.administrator_id || '',
      reduction_percent: reduction?.reduction_percent || 0,
      applications: reduction?.applications || [],
    },
  });

  useEffect(() => {
    if (open) {
      fetchAdministrators();
      if (reduction && !isCopy) {
        form.reset({
          name: reduction.name,
          administrator_id: reduction.administrator_id,
          reduction_percent: reduction.reduction_percent,
          applications: reduction.applications,
        });
      } else if (reduction && isCopy) {
        form.reset({
          name: reduction.name,
          administrator_id: '', // Força seleção de nova administradora
          reduction_percent: reduction.reduction_percent,
          applications: reduction.applications,
        });
      } else {
        form.reset({
          name: '',
          administrator_id: '',
          reduction_percent: 0,
          applications: [],
        });
      }
    }
    // eslint-disable-next-line
  }, [open, reduction, isCopy]);

  const fetchAdministrators = async () => {
    const { data, error } = await supabase
      .from('administrators')
      .select('id, name')
      .eq('is_archived', false)
      .order('name');
    if (!error) setAdministrators(data || []);
  };

  const onSubmit = async (data: ReductionFormData) => {
    try {
      if (reduction && !isCopy) {
        const { error } = await supabase
          .from('installment_reductions')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', reduction.id);
        if (error) throw error;
        toast.success('Redução atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('installment_reductions')
          .insert({
            ...data,
            company_id: selectedCompanyId,
          });
        if (error) throw error;
        toast.success('Redução criada com sucesso!');
      }
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error('Erro ao salvar redução');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{reduction && !isCopy ? 'Editar Redução de Parcela' : isCopy ? 'Copiar Redução de Parcela' : 'Nova Redução de Parcela'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Redução Especial 20%" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="administrator_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Administradora</FormLabel>
                  <div className="flex gap-2 items-center">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma administradora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {administrators.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>{admin.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateAdminModal(true)}>
                      +
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reduction_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentual reduzido (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      {...field}
                      onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="applications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aplicação</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={applicationsOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione as aplicações"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit">
                {reduction && !isCopy ? 'Salvar' : isCopy ? 'Copiar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
        <CreateAdministratorModal
          open={showCreateAdminModal}
          onOpenChange={(open) => setShowCreateAdminModal(open)}
          onSuccess={() => {
            setShowCreateAdminModal(false);
            fetchAdministrators();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}; 