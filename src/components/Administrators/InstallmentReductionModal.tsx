import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
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
  const [selectedAdminId, setSelectedAdminId] = React.useState<string>('');

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
    }
    // eslint-disable-next-line
  }, [open, selectedCompanyId]);

  useEffect(() => {
    if (open && administrators.length > 0) {
      if (reduction && !isCopy) {
        setSelectedAdminId(reduction.administrator_id);
        form.reset({
          name: reduction.name,
          administrator_id: reduction.administrator_id,
          reduction_percent: reduction.reduction_percent,
          applications: reduction.applications,
        });
      } else if (reduction && isCopy) {
        setSelectedAdminId('');
        form.reset({
          name: reduction.name,
          administrator_id: '', // Força seleção de nova administradora
          reduction_percent: reduction.reduction_percent,
          applications: reduction.applications,
        });
      } else {
        setSelectedAdminId('');
        form.reset({
          name: '',
          administrator_id: '',
          reduction_percent: 0,
          applications: [],
        });
      }
    }
    // eslint-disable-next-line
  }, [open, reduction, isCopy, administrators]);

  const fetchAdministrators = async () => {
    if (!selectedCompanyId) { setAdministrators([]); return; }
    const { data, error } = await supabase
      .from('administrators')
      .select('id, name')
      .eq('company_id', selectedCompanyId)
      .eq('is_archived', false)
      .order('name');
    if (!error) setAdministrators(data || []);
  };

  const onSubmit = (data: any) => {
    // Lógica de salvamento movida para handleSaveClick
  };

  const handleSaveClick = async () => {
    // Validar se temos os dados necessários
    const formValues = form.getValues();
    const name = formValues.name;
    const reduction_percent = formValues.reduction_percent;
    const applications = formValues.applications;
    
    if (!selectedAdminId) {
      toast.error('Selecione uma administradora');
      return;
    }
    
    if (!name) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      if (reduction && !isCopy) {
        const { error } = await supabase
          .from('installment_reductions')
          .update({
            name: name,
            administrator_id: selectedAdminId,
            reduction_percent: reduction_percent,
            applications: applications,
          })
          .eq('id', reduction.id);

        if (error) {
          console.error('Update error:', error);
          toast.error('Erro ao atualizar redução de parcela');
          return;
        }

        toast.success('Redução de parcela atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('installment_reductions')
          .insert({
            company_id: selectedCompanyId,
            name: name,
            administrator_id: selectedAdminId,
            reduction_percent: reduction_percent,
            applications: applications,
          });

        if (error) {
          console.error('Insert error:', error);
          toast.error('Erro ao criar redução de parcela');
          return;
        }

        toast.success('Redução de parcela criada com sucesso');
      }

      onSuccess();
      onOpenChange(false); // Fechar o modal após salvar
    } catch (error) {
      console.error('Error in handleSaveClick:', error);
      toast.error('Erro inesperado');
    }
  };

  return (
    <FullScreenModal
      open={open}
      onOpenChange={onOpenChange}
      title={reduction && !isCopy ? 'Editar Redução de Parcela' : isCopy ? 'Copiar Redução de Parcela' : 'Nova Redução de Parcela'}
      actions={<Button 
        type="button" 
        variant="brandPrimaryToSecondary" 
        className="brand-radius" 
        onClick={handleSaveClick}
      >
        Salvar
      </Button>}
    >
      <Form {...form}>
        <form id="reduction-form" onSubmit={form.handleSubmit((data) => {
          onSubmit(data);
        }, (errors) => {
          // Erro de validação tratado silenciosamente
        })} className="space-y-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Nome da redução" 
                        className="campo-brand brand-radius field-secondary-focus no-ring-focus"
                      />
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
                      <Select 
                        onValueChange={(value) => {
                          setSelectedAdminId(value);
                          field.onChange(value);
                        }}
                        value={selectedAdminId || field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger className="select-trigger-brand brand-radius">
                            <SelectValue placeholder="Selecione uma administradora" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {administrators.map((admin) => (
                            <SelectItem key={admin.id} value={admin.id} className="dropdown-item-brand">{admin.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="brandOutlineSecondaryHover" size="sm" className="brand-radius" onClick={() => setShowCreateAdminModal(true)}>
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
                    <FormLabel>Percentual de Redução (%)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        placeholder="0" 
                        className="campo-brand brand-radius field-secondary-focus no-ring-focus"
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                    <FormLabel>Aplicações</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={applicationsOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selecione as aplicações"
                        className="brand-radius"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
    </FullScreenModal>
  );
}; 