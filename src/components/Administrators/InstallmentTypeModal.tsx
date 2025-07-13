
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

const installmentTypeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  administrator_id: z.string().min(1, 'Administradora é obrigatória'),
  type: z.enum(['MEIA', 'REDUZIDA'], {
    required_error: 'Tipo é obrigatório',
  }),
  reduction_percentage: z.number().min(0).max(100).optional(),
  reduces_credit: z.boolean().default(false),
  reduces_admin_tax: z.boolean().default(false),
  reduces_insurance: z.boolean().default(false),
  reduces_reserve_fund: z.boolean().default(false),
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
  
  const form = useForm<InstallmentTypeFormData>({
    resolver: zodResolver(installmentTypeSchema),
    defaultValues: {
      name: installmentType?.name || '',
      administrator_id: installmentType?.administrator_id || '',
      type: installmentType?.type || 'MEIA',
      reduction_percentage: installmentType?.reduction_percentage || 50,
      reduces_credit: installmentType?.reduces_credit || false,
      reduces_admin_tax: installmentType?.reduces_admin_tax || false,
      reduces_insurance: installmentType?.reduces_insurance || false,
      reduces_reserve_fund: installmentType?.reduces_reserve_fund || false,
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

  const onSubmit = async (data: InstallmentTypeFormData) => {
    try {
      const cleanData = {
        name: data.name,
        administrator_id: data.administrator_id,
        type: data.type,
        reduction_percentage: data.reduction_percentage,
        reduces_credit: data.reduces_credit,
        reduces_admin_tax: data.reduces_admin_tax,
        reduces_insurance: data.reduces_insurance,
        reduces_reserve_fund: data.reduces_reserve_fund,
      };

      if (installmentType) {
        const { error } = await supabase
          .from('installment_types')
          .update({
            ...cleanData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', installmentType.id);

        if (error) throw error;
        toast({ title: 'Tipo de parcela atualizado com sucesso!' });
      } else {
        const { error } = await supabase
          .from('installment_types')
          .insert({ ...cleanData, company_id: selectedCompanyId });

        if (error) throw error;
        toast({ title: 'Tipo de parcela criado com sucesso!' });
      }

      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar tipo de parcela:', error);
      toast({
        title: 'Erro ao salvar tipo de parcela',
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
            {installmentType ? 'Editar Tipo de Parcela' : 'Novo Tipo de Parcela'}
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
                    <Input placeholder="Ex: Meia Parcela Padrão" {...field} />
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
                      <SelectItem value="MEIA">Meia Parcela</SelectItem>
                      <SelectItem value="REDUZIDA">Parcela Reduzida</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reduction_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentual de Redução (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="50"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Componentes afetados pela redução:</FormLabel>
              
              <FormField
                control={form.control}
                name="reduces_credit"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Reduz Crédito</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reduces_admin_tax"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Reduz Taxa de Administração</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reduces_insurance"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Reduz Seguro</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reduces_reserve_fund"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Reduz Fundo de Reserva</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {installmentType ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
