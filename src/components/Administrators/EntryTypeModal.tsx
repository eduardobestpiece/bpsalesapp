
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

const entryTypeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  administrator_id: z.string().min(1, 'Administradora é obrigatória'),
  type: z.enum(['PERCENTUAL', 'VALOR_FIXO'], {
    required_error: 'Tipo é obrigatório',
  }),
  percentage: z.number().min(0).max(100).optional(),
  fixed_value: z.number().min(0).optional(),
  installment_months: z.number().min(1).default(1),
  is_optional: z.boolean().default(false),
});

type EntryTypeFormData = z.infer<typeof entryTypeSchema>;

interface EntryTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryType?: any;
  onSuccess: () => void;
}

export const EntryTypeModal: React.FC<EntryTypeModalProps> = ({
  open,
  onOpenChange,
  entryType,
  onSuccess,
}) => {
  const { toast } = useToast();
  
  const form = useForm<EntryTypeFormData>({
    resolver: zodResolver(entryTypeSchema),
    defaultValues: {
      name: entryType?.name || '',
      administrator_id: entryType?.administrator_id || '',
      type: entryType?.type || 'PERCENTUAL',
      percentage: entryType?.percentage || 0,
      fixed_value: entryType?.fixed_value || 0,
      installment_months: entryType?.installment_months || 1,
      is_optional: entryType?.is_optional || false,
    },
  });

  const { data: administrators } = useQuery({
    queryKey: ['administrators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('administrators')
        .select('id, name')
        .eq('is_archived', false)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const watchType = form.watch('type');

  const onSubmit = async (data: EntryTypeFormData) => {
    try {
      // Clear unnecessary fields based on type
      const cleanData = {
        ...data,
        percentage: data.type === 'PERCENTUAL' ? data.percentage : null,
        fixed_value: data.type === 'VALOR_FIXO' ? data.fixed_value : null,
      };

      if (entryType) {
        const { error } = await supabase
          .from('entry_types')
          .update({
            ...cleanData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', entryType.id);

        if (error) throw error;
        toast({ title: 'Tipo de entrada atualizado com sucesso!' });
      } else {
        const { error } = await supabase
          .from('entry_types')
          .insert([cleanData]);

        if (error) throw error;
        toast({ title: 'Tipo de entrada criado com sucesso!' });
      }

      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar tipo de entrada:', error);
      toast({
        title: 'Erro ao salvar tipo de entrada',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {entryType ? 'Editar Tipo de Entrada' : 'Novo Tipo de Entrada'}
          </DialogTitle>
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
                    <Input placeholder="Ex: Entrada Padrão 20%" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma administradora" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {administrators?.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PERCENTUAL">Percentual</SelectItem>
                      <SelectItem value="VALOR_FIXO">Valor Fixo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchType === 'PERCENTUAL' && (
              <FormField
                control={form.control}
                name="percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percentual (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="20"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchType === 'VALOR_FIXO' && (
              <FormField
                control={form.control}
                name="fixed_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Fixo (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="5000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="installment_months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parcelas para Pagamento</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_optional"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Entrada Opcional</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {entryType ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
