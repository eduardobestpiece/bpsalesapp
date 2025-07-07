
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  administrator_id: z.string().min(1, 'Administradora é obrigatória'),
  percentage: z.number().min(0).max(100).optional(),
  allows_embedded: z.boolean().default(false),
  is_loyalty: z.boolean().default(false),
  loyalty_months: z.number().min(0).optional(),
  is_default: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface BidTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bidType?: any;
  onSuccess: () => void;
}

export const BidTypeModal: React.FC<BidTypeModalProps> = ({
  open,
  onOpenChange,
  bidType,
  onSuccess
}) => {
  const [administrators, setAdministrators] = useState<any[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: bidType?.name || '',
      administrator_id: bidType?.administrator_id || '',
      percentage: bidType?.percentage || undefined,
      allows_embedded: bidType?.allows_embedded || false,
      is_loyalty: bidType?.is_loyalty || false,
      loyalty_months: bidType?.loyalty_months || undefined,
      is_default: bidType?.is_default || false,
    }
  });

  const fetchAdministrators = async () => {
    try {
      const { data, error } = await supabase
        .from('administrators')
        .select('id, name')
        .eq('is_archived', false)
        .order('name');
      
      if (error) throw error;
      setAdministrators(data || []);
    } catch (error) {
      console.error('Error fetching administrators:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (bidType?.id) {
        // Update
        const { error } = await supabase
          .from('bid_types')
          .update(data)
          .eq('id', bidType.id);
        if (error) throw error;
        toast.success('Tipo de lance atualizado com sucesso!');
      } else {
        // Create
        const { error } = await supabase
          .from('bid_types')
          .insert([data]);
        if (error) throw error;
        toast.success('Tipo de lance criado com sucesso!');
      }
      onSuccess();
      form.reset();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao salvar tipo de lance');
    }
  };

  useEffect(() => {
    if (open) {
      fetchAdministrators();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {bidType ? 'Editar Tipo de Lance' : 'Novo Tipo de Lance'}
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
                    <Input placeholder="Nome do tipo de lance" {...field} />
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
                  <FormLabel>Administradora *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a administradora" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {administrators.map((admin) => (
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
              name="percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentual</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="allows_embedded"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Permite Lance Embutido
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_loyalty"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Lance de Fidelidade
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('is_loyalty') && (
                <FormField
                  control={form.control}
                  name="loyalty_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meses de Contribuição para Fidelidade</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          placeholder="Número de meses"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="is_default"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Lance Padrão
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                {bidType ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
