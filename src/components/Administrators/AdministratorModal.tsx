
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

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  credit_update_type: z.enum(['monthly', 'annual']),
  update_month: z.number().min(1).max(12).optional(),
  grace_period_days: z.number().min(0).optional(),
  max_embedded_percentage: z.number().min(0).max(100).optional(),
  special_entry_type: z.enum(['none', 'percentage', 'fixed_value']).optional(),
  special_entry_percentage: z.number().min(0).max(100).optional(),
  special_entry_fixed_value: z.number().min(0).optional(),
  special_entry_installments: z.number().min(0).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AdministratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  administrator?: any;
  onSuccess: () => void;
}

export const AdministratorModal: React.FC<AdministratorModalProps> = ({
  open,
  onOpenChange,
  administrator,
  onSuccess
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      credit_update_type: 'monthly',
      update_month: undefined,
      grace_period_days: undefined,
      max_embedded_percentage: undefined,
      special_entry_type: 'none',
      special_entry_percentage: undefined,
      special_entry_fixed_value: undefined,
      special_entry_installments: undefined,
    }
  });

  // Populate form when editing
  useEffect(() => {
    if (administrator && open) {
      form.reset({
        name: administrator.name || '',
        credit_update_type: administrator.credit_update_type || 'monthly',
        update_month: administrator.update_month || undefined,
        grace_period_days: administrator.grace_period_days || undefined,
        max_embedded_percentage: administrator.max_embedded_percentage || undefined,
        special_entry_type: administrator.special_entry_type || 'none',
        special_entry_percentage: administrator.special_entry_percentage || undefined,
        special_entry_fixed_value: administrator.special_entry_fixed_value || undefined,
        special_entry_installments: administrator.special_entry_installments || undefined,
      });
    } else if (!administrator && open) {
      form.reset({
        name: '',
        credit_update_type: 'monthly',
        update_month: undefined,
        grace_period_days: undefined,
        max_embedded_percentage: undefined,
        special_entry_type: 'none',
        special_entry_percentage: undefined,
        special_entry_fixed_value: undefined,
        special_entry_installments: undefined,
      });
    }
  }, [administrator, open, form]);

  const onSubmit = async (data: FormData) => {
    try {
      // Ensure all required fields are present and properly typed
      const cleanedData = {
        name: data.name,
        credit_update_type: data.credit_update_type,
        update_month: data.update_month ?? null,
        grace_period_days: data.grace_period_days ?? null,
        max_embedded_percentage: data.max_embedded_percentage ?? null,
        special_entry_type: data.special_entry_type ?? null,
        special_entry_percentage: data.special_entry_percentage ?? null,
        special_entry_fixed_value: data.special_entry_fixed_value ?? null,
        special_entry_installments: data.special_entry_installments ?? null,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="credit_update_type"
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
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="update_month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês de Atualização</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="12" 
                        placeholder="1-12"
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grace_period_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carência (dias)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="Dias de carência"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_embedded_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>% Máximo Embutido</FormLabel>
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
            </div>

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

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                {administrator ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
