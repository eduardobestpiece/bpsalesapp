
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['property', 'car']),
  administrator_id: z.string().min(1, 'Administradora é obrigatória').nullable(),
  credit_value: z.number().min(1, 'Valor do crédito é obrigatório'),
  term_options: z.array(z.number()).min(1, 'Pelo menos uma opção de prazo é obrigatória'),
});

type FormData = z.infer<typeof formSchema>;

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
  onSuccess: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  open,
  onOpenChange,
  product,
  onSuccess
}) => {
  const [administrators, setAdministrators] = useState<any[]>([]);
  const [termInput, setTermInput] = useState('');
  const [termOptions, setTermOptions] = useState<number[]>(product?.term_options || []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || '',
      type: product?.type || 'property',
      administrator_id: product?.administrator_id || null,
      credit_value: product?.credit_value || 0,
      term_options: product?.term_options || [],
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

  const addTermOption = () => {
    const term = parseInt(termInput);
    if (term && term > 0 && !termOptions.includes(term)) {
      const newTerms = [...termOptions, term].sort((a, b) => a - b);
      setTermOptions(newTerms);
      form.setValue('term_options', newTerms);
      setTermInput('');
    }
  };

  const removeTermOption = (term: number) => {
    const newTerms = termOptions.filter(t => t !== term);
    setTermOptions(newTerms);
    form.setValue('term_options', newTerms);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (product?.id) {
        // Update
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', product.id);
        if (error) throw error;
        toast.success('Produto atualizado com sucesso!');
      } else {
        // Create
        const { error } = await supabase
          .from('products')
          .insert([data]);
        if (error) throw error;
        toast.success('Produto criado com sucesso!');
      }
      onSuccess();
      form.reset();
      setTermOptions([]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao salvar produto');
    }
  };

  useEffect(() => {
    if (open) {
      fetchAdministrators();
      setTermOptions(product?.term_options || []);
    }
  }, [open, product]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Editar Produto' : 'Novo Produto'}
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
                    <Input placeholder="Nome do produto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="property">Imóvel</SelectItem>
                        <SelectItem value="car">Veículo</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
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
            </div>

            <FormField
              control={form.control}
              name="credit_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Crédito *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Opções de Prazo (meses) *</FormLabel>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Prazo em meses"
                  value={termInput}
                  onChange={(e) => setTermInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTermOption())}
                />
                <Button type="button" onClick={addTermOption} variant="outline">
                  Adicionar
                </Button>
              </div>
              
              {termOptions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {termOptions.map((term) => (
                    <Badge key={term} variant="secondary" className="flex items-center gap-1">
                      {term} meses
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => removeTermOption(term)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              
              {form.formState.errors.term_options && (
                <p className="text-sm text-red-600">{form.formState.errors.term_options.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                {product ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
