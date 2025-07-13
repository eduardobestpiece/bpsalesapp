
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import MultiSelect from '@/components/ui/multiselect';
import { CreateAdministratorModal } from '@/components/Administrators/AdministratorModal';

const installmentTypeSchema = z.object({
  administrator_id: z.string().min(1, 'Administradora é obrigatória'),
  installment_count: z.number().min(1, 'Número de parcelas é obrigatório'),
  admin_tax_percent: z.number().min(0).max(100),
  reserve_fund_percent: z.number().min(0).max(100),
  insurance_percent: z.number().min(0).max(100),
  optional_insurance: z.boolean(),
  reduction_ids: z.array(z.string()), // IDs das reduções selecionadas
  is_default: z.boolean(),
});

type InstallmentTypeFormData = z.infer<typeof installmentTypeSchema>;

interface InstallmentTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installmentType?: any;
  onSuccess: () => void;
}

export const InstallmentTypeModal: React.FC<InstallmentTypeModalProps> = ({
  open,
  onOpenChange,
  installmentType,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();
  const [administrators, setAdministrators] = React.useState<any[]>([]);
  const [reductions, setReductions] = React.useState<any[]>([]);
  const [showCreateAdminModal, setShowCreateAdminModal] = React.useState(false);

  const form = useForm<any>({
    resolver: zodResolver(installmentTypeSchema),
    defaultValues: {
      administrator_id: installmentType?.administrator_id || '',
      installment_count: installmentType?.installment_count || 1,
      admin_tax_percent: installmentType?.admin_tax_percent || 0,
      reserve_fund_percent: installmentType?.reserve_fund_percent || 0,
      insurance_percent: installmentType?.insurance_percent || 0,
      optional_insurance: installmentType?.optional_insurance || false,
      reduction_ids: installmentType?.reduction_ids || [],
      is_default: installmentType?.is_default || false,
    },
  });

  React.useEffect(() => {
    if (open) {
      fetchAdministrators();
      if (form.watch('administrator_id')) fetchReductions(form.watch('administrator_id'));
      // Resetar valores do formulário ao abrir para edição
      if (installmentType) {
        form.reset({
          administrator_id: installmentType.administrator_id || '',
          installment_count: installmentType.installment_count || 1,
          admin_tax_percent: installmentType.admin_tax_percent || 0,
          reserve_fund_percent: installmentType.reserve_fund_percent || 0,
          insurance_percent: installmentType.insurance_percent || 0,
          optional_insurance: installmentType.optional_insurance || false,
          reduction_ids: installmentType.reduction_ids || [],
          is_default: installmentType.is_default || false,
        });
      } else {
        form.reset({
          administrator_id: '',
          installment_count: 1,
          admin_tax_percent: 0,
          reserve_fund_percent: 0,
          insurance_percent: 0,
          optional_insurance: false,
          reduction_ids: [],
          is_default: false,
        });
      }
    }
  }, [open, installmentType]);

  const fetchAdministrators = async () => {
    const { data, error } = await supabase
      .from('administrators')
      .select('id, name')
      .eq('is_archived', false)
      .order('name');
    if (!error) setAdministrators(data || []);
  };

  const fetchReductions = async (administratorId: string) => {
    const { data, error } = await supabase
      .from('installment_reductions')
      .select('id, name')
      .eq('administrator_id', administratorId)
      .eq('is_archived', false);
    if (!error) setReductions(data || []);
  };

  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'administrator_id' && value.administrator_id) {
        fetchReductions(value.administrator_id);
        form.setValue('reduction_ids', []);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: any) => {
    try {
      if (!selectedCompanyId) {
        toast({ title: 'Empresa não selecionada!', variant: 'destructive' });
        return;
      }
      if (!data.administrator_id) {
        toast({ title: 'Administradora é obrigatória!', variant: 'destructive' });
        return;
      }
      if (!data.installment_count || data.installment_count < 1) {
        toast({ title: 'Número de parcelas deve ser maior que zero!', variant: 'destructive' });
        return;
      }
      // Verificar duplicidade para a mesma administradora
      const { data: existing, error: dupError } = await supabase
        .from('installment_types')
        .select('*')
        .eq('administrator_id', data.administrator_id)
        .eq('installment_count', data.installment_count)
        .eq('admin_tax_percent', data.admin_tax_percent)
        .eq('reserve_fund_percent', data.reserve_fund_percent)
        .eq('insurance_percent', data.insurance_percent)
        .eq('optional_insurance', data.optional_insurance)
        .eq('is_archived', false);
      if (!dupError && existing && existing.length > 0 && (!installmentType || existing[0].id !== installmentType.id)) {
        toast({ title: 'Já existe uma parcela com esses dados para esta administradora.', variant: 'destructive' });
        return;
      }
      const cleanData = {
        administrator_id: data.administrator_id,
        installment_count: data.installment_count,
        admin_tax_percent: data.admin_tax_percent,
        reserve_fund_percent: data.reserve_fund_percent,
        insurance_percent: data.insurance_percent,
        optional_insurance: data.optional_insurance,
        is_default: data.is_default,
        company_id: selectedCompanyId,
      };
      let result, installmentTypeId;
      if (installmentType) {
        result = await supabase
          .from('installment_types')
          .update({ ...cleanData, updated_at: new Date().toISOString() })
          .eq('id', installmentType.id)
          .select('id');
        if (result.error) throw result.error;
        installmentTypeId = installmentType.id;
        // Remover relações antigas
        await supabase
          .from('installment_type_reductions')
          .delete()
          .eq('installment_type_id', installmentTypeId);
      } else {
        result = await supabase
          .from('installment_types')
          .insert(cleanData)
          .select('id');
        if (result.error) throw result.error;
        installmentTypeId = result.data[0].id;
      }
      // Inserir novas relações
      if (data.reduction_ids && data.reduction_ids.length > 0) {
        const relations = data.reduction_ids.map((reductionId: string) => ({
          installment_type_id: installmentTypeId,
          installment_reduction_id: reductionId,
        }));
        const relResult = await supabase
          .from('installment_type_reductions')
          .insert(relations);
        if (relResult.error) throw relResult.error;
      }
      toast({ title: installmentType ? 'Parcela atualizada com sucesso!' : 'Parcela cadastrada com sucesso!' });
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar parcela', description: error?.message || JSON.stringify(error), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{installmentType ? 'Editar Parcela' : 'Nova Parcela'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <SelectItem value="add_admin" onClick={() => setShowCreateAdminModal(true)}>
                          + Adicionar administradora
                        </SelectItem>
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
              name="installment_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de parcelas</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 1)} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="admin_tax_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de administração (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={100} step={0.01} {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reserve_fund_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fundo de reserva (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={100} step={0.01} {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="insurance_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seguro (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={100} step={0.01} {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="optional_insurance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seguro opcional</FormLabel>
                  <FormControl>
                    <Select onValueChange={v => field.onChange(v === 'true')} value={field.value ? 'true' : 'false'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reduction_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Redução de parcela</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={reductions.map((r: any) => ({ value: r.id, label: r.name }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione uma ou mais reduções"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parcela padrão</FormLabel>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {installmentType ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
        <CreateAdministratorModal
          open={showCreateAdminModal}
          onOpenChange={setShowCreateAdminModal}
          onSuccess={fetchAdministrators}
        />
      </DialogContent>
    </Dialog>
  );
};
