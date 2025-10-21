
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { useCompany } from '@/contexts/CompanyContext';

const formSchema = z.object({
  type: z.enum(['property', 'car', 'service']),
  administrator_id: z.string().optional(),
  credit_value: z.number().min(1, 'Valor do crédito é obrigatório'),
  // Tornar opcional para não bloquear o submit quando o seletor está oculto
  installment_types: z.array(z.string()).optional().default([]),
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
  const [reducaoParcela, setReducaoParcela] = useState<any>(null);
  // Adicionar estado para mensagem de redução
  const [mensagemReducao, setMensagemReducao] = useState<string | null>(null);
  const { selectedCompanyId } = useCompany();

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
      if (!selectedCompanyId) { setAdministrators([]); return; }
      const { data, error } = await supabase
        .from('administrators')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('is_archived', false)
        .order('name');
      
      if (error) throw error;
      setAdministrators(data || []);
    } catch (error) {
    }
  };

  const fetchInstallmentTypes = async (adminId?: string) => {
    try {
      if (!adminId) { setInstallmentTypes([]); return; }
      const { data, error } = await supabase
        .from('installment_types')
        .select('id, name, administrator_id, installment_count, admin_tax_percent, reserve_fund_percent, insurance_percent, optional_insurance, reduction_percentage')
        .eq('administrator_id', adminId)
        .eq('is_archived', false)
        .order('installment_count');
      
      if (error) throw error;
      setInstallmentTypes(data || []);
    } catch (error) {
      setInstallmentTypes([]);
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
        company_id: selectedCompanyId,
        // NÃO incluir installment_types aqui
      };

      // Verificar duplicidade considerando parcelas E valor do crédito
      let dupQuery = supabase
        .from('products')
        .select('id, credit_value')
        .eq('administrator_id', data.administrator_id)
        .eq('type', data.type);
      if (product?.id) {
        dupQuery = dupQuery.neq('id', product.id);
      }
      const { data: existingProducts, error: dupError } = await dupQuery;
      let isDuplicate = false;
      if (existingProducts && existingProducts.length > 0) {
        // Para cada produto existente, buscar as parcelas associadas
        for (const prod of existingProducts) {
          // Comparar valor do crédito (precisão de centavos)
          if (Number(prod.credit_value) !== Number(data.credit_value)) continue;
          const { data: rels } = await supabase
            .from('product_installment_types')
            .select('installment_type_id')
            .eq('product_id', prod.id);
          const existingInstallments = rels ? rels.map((r: any) => r.installment_type_id).sort() : [];
          const newInstallments = [...data.installment_types].sort();
          if (JSON.stringify(existingInstallments) === JSON.stringify(newInstallments)) {
            isDuplicate = true;
            break;
          }
        }
      }
      if (isDuplicate) {
        toast.error('Já existe um produto com este tipo, administradora e mesmas parcelas.');
        return;
      }

      let productId = product?.id;
      if (product?.id) {
        // Update
        const { error } = await supabase
          .from('products')
          .update({
            name: nomeAuto,
            type: data.type,
            administrator_id: data.administrator_id || null,
            credit_value: data.credit_value,
          })
          .eq('id', product.id);
        if (error) throw error;
        console.log('[Products] Updated', { id: product.id, administrator_id: data.administrator_id, company_id: selectedCompanyId });
      } else {
        // Create
        const { data: created, error } = await supabase
          .from('products')
          .insert(cleanedData)
          .select('id')
          .maybeSingle();
        if (error) throw error;
        productId = created?.id;
        console.log('[Products] Created', { id: productId, administrator_id: data.administrator_id, company_id: selectedCompanyId });
      }

      // Atualizar relação product_installment_types
      if (productId) {
        // Remover antigas
        await supabase
          .from('product_installment_types')
          .delete()
          .eq('product_id', productId);
        // Inserir novas
        if (Array.isArray(data.installment_types) && data.installment_types.length > 0) {
          const relations = data.installment_types.map((installmentTypeId: string) => ({
            product_id: productId,
            installment_type_id: installmentTypeId
          }));
          await supabase
            .from('product_installment_types')
            .insert(relations);
        }
      }
      toast.success(product?.id ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
      onSuccess && onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error('Erro ao salvar produto');
    }
  };

  useEffect(() => {
    if (open) {
      fetchAdministrators();
    }
  }, [open, product, selectedCompanyId]);

  useEffect(() => {
    const adminId = form.watch('administrator_id');
    if (!adminId) {
      setInstallmentTypes([]);
      return;
    }
    fetchInstallmentTypes(adminId);
  }, [form.watch('administrator_id')]);

  useEffect(() => {
    // Sempre que a parcela padrão OU as parcelas selecionadas mudarem, buscar a redução associada
    async function fetchReducao() {
      // Usar parcela padrão, ou de maior prazo se não houver
      let idBusca = parcelaPadraoId;
      const selectedInstallments = installmentTypes.filter(it => form.watch('installment_types').includes(it.id));
      if (!idBusca && selectedInstallments.length > 0) {
        const maior = selectedInstallments.reduce((max, curr) =>
          (curr.installment_count > (max?.installment_count || 0) ? curr : max), selectedInstallments[0]);
        idBusca = maior.id;
      }
      if (!idBusca) {
        setReducaoParcela(null);
        setMensagemReducao(null);
        return;
      }
      // Buscar relação installment_type_reductions
      const { data: rels, error: relError } = await supabase
        .from('installment_type_reductions')
        .select('installment_reduction_id')
        .eq('installment_type_id', idBusca);
      if (relError || !rels || rels.length === 0) {
        setReducaoParcela(null);
        setMensagemReducao('Não há redução cadastrada para a parcela selecionada.');
        return;
      }
      // Buscar dados da redução
      const { data: reducoes, error: redError } = await supabase
        .from('installment_reductions')
        .select('*')
        .eq('id', rels[0].installment_reduction_id)
        .eq('is_archived', false)
        .limit(1);
      if (redError || !reducoes || reducoes.length === 0) {
        setReducaoParcela(null);
        setMensagemReducao('Não há redução cadastrada para a parcela selecionada.');
        return;
      }
      setReducaoParcela(reducoes[0]);
      setMensagemReducao(null);
    }
    fetchReducao();
  }, [parcelaPadraoId, form.watch('installment_types'), installmentTypes]);

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
    // Buscar redução de parcela associada (agora via estado reducaoParcela)
    let percentualReducao = 0;
    let aplicaParcela = false, aplicaTaxaAdm = false, aplicaFundoReserva = false, aplicaSeguro = false;
    if (reducaoParcela) {
      percentualReducao = reducaoParcela.reduction_percent / 100;
      aplicaParcela = reducaoParcela.applications?.includes('installment');
      aplicaTaxaAdm = reducaoParcela.applications?.includes('admin_tax');
      aplicaFundoReserva = reducaoParcela.applications?.includes('reserve_fund');
      aplicaSeguro = reducaoParcela.applications?.includes('insurance');
    }
    // Cálculo Parcela Cheia (mantém igual)
    const valorCheia = (credit + ((credit * taxaAdm / 100) + (credit * fundoReserva / 100) + (credit * seguro / 100))) / nParcelas;
    setParcelaCheia(valorCheia);
    // Cálculo Parcela Especial (lógica detalhada do usuário)
    const principal = aplicaParcela ? credit - (credit * percentualReducao) : credit;
    const taxa = aplicaTaxaAdm ? (credit * taxaAdm / 100) - ((credit * taxaAdm / 100) * percentualReducao) : (credit * taxaAdm / 100);
    const fundo = aplicaFundoReserva ? (credit * fundoReserva / 100) - ((credit * fundoReserva / 100) * percentualReducao) : (credit * fundoReserva / 100);
    // Seguro só entra se não for opcional
    let seguroValor = 0;
    if (!parcelaPadrao.optional_insurance) {
      seguroValor = aplicaSeguro
        ? (credit * seguro / 100) - ((credit * seguro / 100) * percentualReducao)
        : (credit * seguro / 100);
    }
    const valorEspecial = (principal + taxa + fundo + seguroValor) / nParcelas;
    setParcelaEspecial(valorEspecial);
  }, [form.watch('credit_value'), form.watch('installment_types'), installmentTypes, parcelaPadraoId, reducaoParcela]);

  return (
    <FullScreenModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={product ? 'Editar Produto' : 'Novo Produto'}
      actions={<Button type="submit" form="product-form" variant="brandPrimaryToSecondary">{product ? 'Atualizar' : 'Criar'}</Button>}
    >
      <Form {...form}>
        <form id="product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-[#1F1F1F] p-6 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="brand-radius select-trigger-brand">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="property" className="dropdown-item-brand">Imóvel</SelectItem>
                        <SelectItem value="car" className="dropdown-item-brand">Veículo</SelectItem>
                        <SelectItem value="service" className="dropdown-item-brand">Serviço</SelectItem>
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
                        <SelectTrigger className="brand-radius select-trigger-brand">
                          <SelectValue placeholder="Selecione a administradora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {administrators.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id} className="dropdown-item-brand">
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
                      className="brand-radius campo-brand"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Parcelas - OCULTO
            {form.watch('administrator_id') && (
              <FormField
                control={form.control}
                name="installment_types"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcelas *</FormLabel>
                    <div className="flex flex-col gap-2">
                      {installmentTypes.map((it) => (
                        <div key={it.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={field.value.includes(it.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, it.id]);
                              } else {
                                field.onChange(field.value.filter((v: string) => v !== it.id));
                                if (parcelaPadraoId === it.id) setParcelaPadraoId(null);
                              }
                            }}
                            className="data-[state=checked]:bg-[var(--brand-primary)] data-[state=checked]:border-[var(--brand-primary)]"
                          />
                          <input
                            type="radio"
                            name="parcelaPadrao"
                            checked={parcelaPadraoId === it.id}
                            disabled={!field.value.includes(it.id)}
                            onChange={() => setParcelaPadraoId(it.id)}
                            className="appearance-none h-4 w-4 rounded-full border outline-none ring-0 focus:ring-0 focus:outline-none border-[var(--brand-secondary)] checked:border-[var(--brand-primary)] checked:bg-[var(--brand-primary)]"
                          />
                          <span>{it.name || `${it.installment_count} meses`}</span>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            */}

            {/* Campos de Valor da Parcela - OCULTOS
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Valor da parcela cheia</FormLabel>
                <div className="font-bold text-lg">{parcelaCheia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
              <div>
                <FormLabel>Valor da parcela especial</FormLabel>
                <div className="font-bold text-lg">{parcelaEspecial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                {mensagemReducao && (
                  <div className="text-xs text-orange-600 mt-1">{mensagemReducao}</div>
                )}
              </div>
            </div>
            */}

        </form>
      </Form>
    </FullScreenModal>
  );
};
