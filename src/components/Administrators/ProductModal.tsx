
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
  type: z.enum(['property', 'car', 'service']),
  administrator_id: z.string().optional(),
  credit_value: z.number().min(1, 'Valor do crédito é obrigatório'),
  installment_types: z.array(z.string()).min(1, 'Selecione pelo menos uma parcela'),
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
  const [installmentTypes, setInstallmentTypes] = useState<any[]>([]);
  const [parcelaCheia, setParcelaCheia] = useState(0);
  const [parcelaEspecial, setParcelaEspecial] = useState(0);
  // Adicionar estado para parcela padrão
  const [parcelaPadraoId, setParcelaPadraoId] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: product?.type || 'property',
      administrator_id: product?.administrator_id || undefined,
      credit_value: product?.credit_value || 0,
      installment_types: product?.installment_types || [],
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

  const fetchInstallmentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('installment_types')
        .select('id, name, administrator_id, installment_count, admin_tax_percent, reserve_fund_percent, insurance_percent, optional_insurance, reduction_percent')
        .order('name');
      
      if (error) throw error;
      setInstallmentTypes(data || []);
    } catch (error) {
      console.error('Error fetching installment types:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Gerar nome automaticamente
      const tipoLabel = data.type === 'property' ? 'Imóvel' : data.type === 'car' ? 'Veículo' : 'Serviço';
      const nomeAuto = `R$ ${Number(data.credit_value).toLocaleString('pt-BR', {minimumFractionDigits: 2})} (${tipoLabel})`;
      // No onSubmit, garantir que installment_types é array de strings
      const cleanedData = {
        name: nomeAuto,
        type: data.type,
        administrator_id: data.administrator_id || null,
        credit_value: data.credit_value,
        installment_types: Array.isArray(data.installment_types) ? data.installment_types : [data.installment_types],
      };

      // Verificar duplicidade
      const { data: existing, error: dupError } = await supabase
        .from('products')
        .select('id')
        .eq('administrator_id', data.administrator_id)
        .eq('type', data.type)
        .neq('id', product?.id || '')
        .maybeSingle();
      if (existing) {
        toast.error('Já existe um produto com este tipo para esta administradora.');
        return;
      }

      if (product?.id) {
        // Update
        const { error } = await supabase
          .from('products')
          .update(cleanedData)
          .eq('id', product.id);
        if (error) throw error;
        toast.success('Produto atualizado com sucesso!');
      } else {
        // Create
        const { error } = await supabase
          .from('products')
          .insert(cleanedData);
        if (error) throw error;
        toast.success('Produto criado com sucesso!');
      }
      onSuccess();
      form.reset();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao salvar produto');
    }
  };

  useEffect(() => {
    if (open) {
      fetchAdministrators();
      fetchInstallmentTypes();
    }
  }, [open, product]);

  useEffect(() => {
    if (!form.watch('administrator_id')) {
      setInstallmentTypes([]);
      return;
    }
    const fetchInstallments = async () => {
      const { data, error } = await supabase
        .from('installment_types')
        .select('*')
        .eq('administrator_id', form.watch('administrator_id'))
        .eq('is_archived', false)
        .order('installment_count');
      setInstallmentTypes(data || []);
    };
    fetchInstallments();
  }, [form.watch('administrator_id')]);

  useEffect(() => {
    const credit = form.watch('credit_value');
    const selectedInstallments = installmentTypes.filter(it => form.watch('installment_types').includes(it.id));
    if (!credit || selectedInstallments.length === 0) {
      setParcelaCheia(0);
      setParcelaEspecial(0);
      return;
    }
    // Usar a parcela padrão, ou a de maior prazo se não houver
    let parcelaPadrao = selectedInstallments.find(it => it.id === parcelaPadraoId);
    if (!parcelaPadrao) {
      parcelaPadrao = selectedInstallments.reduce((max, curr) =>
        (curr.installment_count > (max?.installment_count || 0) ? curr : max), selectedInstallments[0]);
    }
    const nParcelas = parcelaPadrao.installment_count;
    const taxaAdm = parcelaPadrao.admin_tax_percent || 0;
    const fundoReserva = parcelaPadrao.reserve_fund_percent || 0;
    const seguro = parcelaPadrao.optional_insurance ? 0 : (parcelaPadrao.insurance_percent || 0);
    // Buscar redução de parcela associada
    let percentualReducao = 0;
    let aplicaParcela = false, aplicaTaxaAdm = false, aplicaFundoReserva = false, aplicaSeguro = false;
    if (parcelaPadrao.reduction_percent) {
      percentualReducao = parcelaPadrao.reduction_percent / 100;
      // Flags de aplicação (ajuste conforme estrutura real)
      aplicaParcela = parcelaPadrao.reduces_credit || false;
      aplicaTaxaAdm = parcelaPadrao.reduces_admin_tax || false;
      aplicaFundoReserva = parcelaPadrao.reduces_reserve_fund || false;
      aplicaSeguro = parcelaPadrao.reduces_insurance || false;
    }
    // Cálculo Parcela Cheia (mantém igual)
    const valorCheia = (credit + ((credit * taxaAdm / 100) + (credit * fundoReserva / 100) + (credit * seguro / 100))) / nParcelas;
    setParcelaCheia(valorCheia);
    // Cálculo Parcela Especial (lógica detalhada)
    const principal = aplicaParcela ? credit - (credit * percentualReducao) : credit;
    const taxa = aplicaTaxaAdm ? (credit * taxaAdm / 100) - ((credit * taxaAdm / 100) * percentualReducao) : (credit * taxaAdm / 100);
    const fundo = aplicaFundoReserva ? (credit * fundoReserva / 100) - ((credit * fundoReserva / 100) * percentualReducao) : (credit * fundoReserva / 100);
    const seguroValor = aplicaSeguro ? (credit * seguro / 100) - ((credit * seguro / 100) * percentualReducao) : (credit * seguro / 100);
    const valorEspecial = (principal + taxa + fundo + seguroValor) / nParcelas;
    setParcelaEspecial(valorEspecial);
  }, [form.watch('credit_value'), form.watch('installment_types'), installmentTypes, parcelaPadraoId]);

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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="property">Imóvel</SelectItem>
                        <SelectItem value="car">Veículo</SelectItem>
                        <SelectItem value="service">Serviço</SelectItem>
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
                    <FormLabel>Administradora</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
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

            <FormField
              control={form.control}
              name="installment_types"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parcelas *</FormLabel>
                  <div className="flex flex-col gap-2">
                    {installmentTypes.filter(it => field.value.includes(it.id)).length === 0 && (
                      <Select multiple value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione as parcelas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {installmentTypes.map((it) => (
                            <SelectItem key={it.id} value={it.id}>{it.name || it.installment_count}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {/* Exibir opções selecionadas com radio para padrão */}
                    {installmentTypes.filter(it => field.value.includes(it.id)).map((it) => (
                      <div key={it.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="parcelaPadrao"
                          checked={parcelaPadraoId === it.id}
                          onChange={() => setParcelaPadraoId(it.id)}
                        />
                        <span>{it.name || `${it.installment_count} meses`}</span>
                        <Button size="sm" variant="ghost" onClick={() => field.onChange(field.value.filter((v: string) => v !== it.id))}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Valor da parcela cheia</FormLabel>
                <div className="font-bold text-lg">{parcelaCheia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
              <div>
                <FormLabel>Valor da parcela especial</FormLabel>
                <div className="font-bold text-lg">{parcelaEspecial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
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
