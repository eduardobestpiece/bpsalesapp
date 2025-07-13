
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  credit_update_type: z.enum(['monthly', 'annual']), // será substituído
  update_type: z.enum(['specific_month', 'after_12_installments']),
  update_month: z.string().optional(),
  grace_period_days: z.number().min(0).optional(),
  max_embedded_percentage: z.number().min(0).max(100).optional(),
  special_entry_type: z.enum(['none', 'percentage', 'fixed_value']).optional(),
  special_entry_percentage: z.number().min(0).max(100).optional(),
  special_entry_fixed_value: z.number().min(0).optional(),
  special_entry_installments: z.number().min(0).optional(),
  is_default: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AdministratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  administrator?: any;
  onSuccess: () => void;
}

export const AdministratorModal: React.FC<AdministratorModalProps> = ({
  isOpen,
  onClose,
  administrator,
  onSuccess
}) => {
  const { selectedCompanyId } = useCompany();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      update_type: 'specific_month',
      update_month: undefined,
      grace_period_days: undefined,
      max_embedded_percentage: undefined,
      special_entry_type: 'none',
      special_entry_percentage: undefined,
      special_entry_fixed_value: undefined,
      special_entry_installments: undefined,
      is_default: false,
    }
  });

  // Populate form when editing
  useEffect(() => {
    if (administrator && isOpen) {
      form.reset({
        name: administrator.name || '',
        update_type: administrator.update_type || 'specific_month',
        update_month: administrator.update_month ? MONTHS[administrator.update_month - 1] : undefined,
        grace_period_days: administrator.grace_period_days || undefined,
        max_embedded_percentage: administrator.max_embedded_percentage || undefined,
        special_entry_type: administrator.special_entry_type || 'none',
        special_entry_percentage: administrator.special_entry_percentage || undefined,
        special_entry_fixed_value: administrator.special_entry_fixed_value || undefined,
        special_entry_installments: administrator.special_entry_installments || undefined,
        is_default: administrator.is_default || false,
      });
    } else if (!administrator && isOpen) {
      form.reset({
        name: '',
        update_type: 'specific_month',
        update_month: undefined,
        grace_period_days: undefined,
        max_embedded_percentage: undefined,
        special_entry_type: 'none',
        special_entry_percentage: undefined,
        special_entry_fixed_value: undefined,
        special_entry_installments: undefined,
        is_default: false,
      });
    }
  }, [administrator, isOpen, form]);

  // Lógica para garantir apenas uma administradora padrão por empresa
  const handleSetDefault = async () => {
    if (form.getValues('is_default')) {
      // Desmarcar todas as outras como padrão
      await supabase
        .from('administrators')
        .update({ is_default: false })
        .eq('company_id', selectedCompanyId);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await handleSetDefault();
      const cleanedData = {
        name: data.name,
        update_type: data.update_type,
        update_month: data.update_type === 'specific_month' ? (MONTHS.indexOf(data.update_month || '') + 1) : null,
        grace_period_days: data.grace_period_days ?? null,
        max_embedded_percentage: data.max_embedded_percentage ?? null,
        special_entry_type: data.special_entry_type ?? null,
        special_entry_percentage: data.special_entry_percentage ?? null,
        special_entry_fixed_value: data.special_entry_fixed_value ?? null,
        special_entry_installments: data.special_entry_installments ?? null,
        is_default: data.is_default || false,
        company_id: selectedCompanyId,
      };
      if (administrator?.id) {
        // Update
        const { error } = await supabase
          .from('administrators')
          .update(cleanedData)
          .eq('id', administrator.id);
        if (error) throw error;
        toast.success('Administradora atualizada com sucesso!');
      } else {
        // Create
        const { error } = await supabase
          .from('administrators')
          .insert(cleanedData);
        if (error) throw error;
        toast.success('Administradora criada com sucesso!');
      }
      onSuccess();
      form.reset();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao salvar administradora');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {administrator ? 'Editar Administradora' : 'Nova Administradora'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da administradora" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="update_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Atualização *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="specific_month">Mês específico</SelectItem>
                      <SelectItem value="after_12_installments">Após 12 parcelas</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Campo mês só aparece se update_type for specific_month */}
            {form.watch('update_type') === 'specific_month' && (
              <FormField
                control={form.control}
                name="update_month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês de Atualização</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o mês" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONTHS.map((month) => (
                          <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {/* Campo padrão */}
            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Administradora padrão</FormLabel>
                  <FormControl>
                    <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="special_entry_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Entrada Especial</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'none'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      <SelectItem value="percentage">Percentual</SelectItem>
                      <SelectItem value="fixed_value">Valor Fixo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch('special_entry_type') === 'percentage' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="special_entry_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentual da Entrada Especial</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="special_entry_installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcelas da Entrada</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          placeholder="Número de parcelas"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {form.watch('special_entry_type') === 'fixed_value' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="special_entry_fixed_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Fixo da Entrada</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="special_entry_installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcelas da Entrada</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          placeholder="Número de parcelas"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {/* Botão de ação */}
            <Button type="submit">
              {administrator ? 'Salvar' : 'Cadastrar'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
