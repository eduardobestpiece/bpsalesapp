
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  update_type: z.enum(['specific_month', 'after_12_installments']).optional(),
  update_month: z.string().optional(),
  grace_period_days: z.number().min(0).optional(),
  max_embedded_percentage: z.number().min(0).max(100).optional(),
  special_entry_type: z.enum(['none', 'percentage', 'fixed_value']).optional(),
  functioning: z.enum(['included', 'additional']).optional(),
  special_entry_percentage: z.number().min(0).max(100).optional(),
  special_entry_fixed_value: z.number().min(0).optional(),
  special_entry_installments: z.number().min(0).optional(),
  post_contemplation_adjustment: z.number().min(0).max(100).optional(),
  agio_purchase_percentage: z.number().min(0).max(100).optional(),
  is_default: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Modal de criação
export const CreateAdministratorModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}> = ({ open, onOpenChange, onSuccess }) => {
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
      functioning: undefined,
      special_entry_percentage: undefined,
      special_entry_fixed_value: undefined,
      special_entry_installments: undefined,
      post_contemplation_adjustment: undefined,
      agio_purchase_percentage: undefined,
      is_default: false,
    }
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const cleanedData = {
        name: data.name,
        update_type: data.update_type,
        update_month: data.update_type === 'specific_month' ? (MONTHS.indexOf(data.update_month || '') + 1) : null,
        grace_period_days: data.grace_period_days ?? null,
        max_embedded_percentage: data.max_embedded_percentage ?? null,
        special_entry_type: data.special_entry_type ?? null,
        functioning: data.functioning ?? null,
        special_entry_percentage: data.special_entry_percentage ?? null,
        special_entry_fixed_value: data.special_entry_fixed_value ?? null,
        special_entry_installments: data.special_entry_installments ?? null,
        post_contemplation_adjustment: data.post_contemplation_adjustment ?? null,
        agio_purchase_percentage: data.agio_purchase_percentage ?? null,
        // CORRIGIDO: credit_update_type deve ser 'monthly' ou 'annual'
        credit_update_type: data.update_type === 'specific_month' ? 'monthly' : 'annual',
        is_default: data.is_default || false,
        company_id: selectedCompanyId,
      };
        const { error } = await supabase
          .from('administrators')
          .insert(cleanedData);
        if (error) throw error;
        toast.success('Administradora criada com sucesso!');
      onSuccess();
      form.reset();
    } catch (error) {
      toast.error('Erro ao salvar administradora');
    }
  };

  return (
    <FullScreenModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Nova Administradora"
      actions={
        <Button type="submit" form="create-admin-form" variant="brandPrimaryToSecondary">
          Cadastrar
        </Button>
      }
    >
      <Form {...form}>
        <form id="create-admin-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da administradora" {...field} className="brand-radius campo-brand" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Campo ocultado temporariamente
            <FormField
              control={form.control}
              name="update_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Atualização *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="brand-radius select-trigger-brand">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      <SelectItem value="specific_month" className="dropdown-item-brand">Mês específico</SelectItem>
                      <SelectItem value="after_12_installments" className="dropdown-item-brand">Após 12 parcelas</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            */}
            {/* Campo ocultado temporariamente
            {form.watch('update_type') === 'specific_month' && (
              <FormField
                control={form.control}
                name="update_month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês de Atualização</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger className="brand-radius select-trigger-brand">
                          <SelectValue placeholder="Selecione o mês" />
                        </SelectTrigger>
                    </FormControl>
                      <SelectContent>
                        {MONTHS.map((month) => (
                          <SelectItem key={month} value={month} className="dropdown-item-brand">{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            */}
            {/* Campo ocultado temporariamente
            {form.watch('update_type') === 'specific_month' && (
              <FormField
                control={form.control}
                name="grace_period_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carência (em dias)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} value={field.value || ''} className="brand-radius campo-brand" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            */}
              <FormField
                control={form.control}
                name="max_embedded_percentage"
                render={({ field }) => (
                  <FormItem>
                  <FormLabel>Máximo embutido (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} value={field.value || ''} className="brand-radius campo-brand" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="post_contemplation_adjustment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ajuste pós contemplação (mensal) (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} value={field.value || ''} className="brand-radius campo-brand" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="agio_purchase_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compra do ágio (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} value={field.value || ''} className="brand-radius campo-brand" />
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
                      <SelectTrigger className="brand-radius select-trigger-brand">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none" className="dropdown-item-brand">Nenhuma</SelectItem>
                      <SelectItem value="percentage" className="dropdown-item-brand">Percentual</SelectItem>
                      <SelectItem value="fixed_value" className="dropdown-item-brand">Valor Fixo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch('special_entry_type') !== 'none' && (
              <FormField
                control={form.control}
                name="functioning"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funcionamento</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value || 'included'}
                        className="flex flex-row space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value="included" 
                            id="included" 
                            className="border-[#e50f5f] text-[#e50f5f] focus:ring-[#e50f5f] focus:ring-offset-0"
                          />
                          <label htmlFor="included" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Incluso
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value="additional" 
                            id="additional" 
                            className="border-[#e50f5f] text-[#e50f5f] focus:ring-[#e50f5f] focus:ring-offset-0"
                          />
                          <label htmlFor="additional" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Adicional
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
                        className="brand-radius campo-brand"
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
                          className="brand-radius campo-brand"
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
                          className="brand-radius campo-brand"
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
                          className="brand-radius campo-brand"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
        </form>
      </Form>
    </FullScreenModal>
  );
};

// Modal de edição
export const EditAdministratorModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  administrator: any;
  onSuccess: () => void;
}> = ({ open, onOpenChange, administrator, onSuccess }) => {
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
      functioning: undefined,
      special_entry_percentage: undefined,
      special_entry_fixed_value: undefined,
      special_entry_installments: undefined,
      post_contemplation_adjustment: undefined,
      agio_purchase_percentage: undefined,
      is_default: false,
    }
  });

  useEffect(() => {
    const loadLatest = async () => {
      if (!open || !administrator?.id) return;
      // Buscar a versão mais recente no banco para evitar dados defasados
      const { data: fresh, error } = await supabase
        .from('administrators')
        .select('*')
        .eq('id', administrator.id)
        .maybeSingle();
      const src = !error && fresh ? fresh : administrator;
      form.reset({
        name: src?.name || '',
        // Se vier apenas credit_update_type, mapear para update_type
        update_type: src?.update_type || (src?.credit_update_type === 'annual' ? 'after_12_installments' : 'specific_month'),
        update_month: src?.update_month ? MONTHS[src.update_month - 1] : undefined,
        grace_period_days: src?.grace_period_days || undefined,
        max_embedded_percentage: src?.max_embedded_percentage || undefined,
        special_entry_type: src?.special_entry_type || 'none',
        functioning: src?.functioning || undefined,
        special_entry_percentage: src?.special_entry_percentage || undefined,
        special_entry_fixed_value: src?.special_entry_fixed_value || undefined,
        special_entry_installments: src?.special_entry_installments || undefined,
        post_contemplation_adjustment: src?.post_contemplation_adjustment || undefined,
        agio_purchase_percentage: src?.agio_purchase_percentage || undefined,
        is_default: src?.is_default || false,
      });
    };
    loadLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [administrator?.id, open]);

  const onSubmit = async (data: FormData) => {
    try {
      const cleanedData = {
        name: data.name,
        update_type: data.update_type,
        update_month: data.update_type === 'specific_month' ? (MONTHS.indexOf(data.update_month || '') + 1) : null,
        grace_period_days: data.grace_period_days ?? null,
        max_embedded_percentage: data.max_embedded_percentage ?? null,
        special_entry_type: data.special_entry_type ?? null,
        functioning: data.functioning ?? null,
        special_entry_percentage: data.special_entry_percentage ?? null,
        special_entry_fixed_value: data.special_entry_fixed_value ?? null,
        special_entry_installments: data.special_entry_installments ?? null,
        post_contemplation_adjustment: data.post_contemplation_adjustment ?? null,
        agio_purchase_percentage: data.agio_purchase_percentage ?? null,
        // manter coerência de exibição na lista: mapear credit_update_type também
        credit_update_type: data.update_type === 'specific_month' ? 'monthly' : 'annual',
        is_default: data.is_default || false,
        company_id: selectedCompanyId,
      };
      
      console.log('[EditAdministrator] Updating with data:', cleanedData);
      
      const { error } = await supabase
        .from('administrators')
        .update(cleanedData)
        .eq('id', administrator.id);
        
      if (error) {
        console.error('[EditAdministrator] Supabase error:', error);
        throw error;
      }
      
      console.log('[EditAdministrator] Update successful');
      toast.success('Administradora atualizada com sucesso!');
      onSuccess();
      form.reset();
    } catch (error) {
      console.error('[EditAdministrator] Error in onSubmit:', error);
      toast.error('Erro ao salvar administradora');
    }
  };

  return (
    <FullScreenModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Editar Administradora"
      actions={<Button type="submit" form="edit-admin-form" variant="brandPrimaryToSecondary">Salvar</Button>}
    >
      <Form {...form}>
        <form id="edit-admin-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da administradora" {...field} className="brand-radius campo-brand" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Campo ocultado temporariamente
            <FormField
              control={form.control}
              name="update_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Atualização *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="brand-radius select-trigger-brand">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="specific_month" className="dropdown-item-brand">Mês específico</SelectItem>
                      <SelectItem value="after_12_installments" className="dropdown-item-brand">Após 12 parcelas</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            */}
            {/* Campo ocultado temporariamente
            {form.watch('update_type') === 'specific_month' && (
              <FormField
                control={form.control}
                name="update_month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês de Atualização</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="brand-radius select-trigger-brand">
                          <SelectValue placeholder="Selecione o mês" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONTHS.map((month) => (
                          <SelectItem key={month} value={month} className="dropdown-item-brand">{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            */}
            {/* Campo ocultado temporariamente
            {form.watch('update_type') === 'specific_month' && (
              <FormField
                control={form.control}
                name="grace_period_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carência (em dias)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} value={field.value || ''} className="brand-radius campo-brand" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            */}
              <FormField
                control={form.control}
                name="max_embedded_percentage"
                render={({ field }) => (
                  <FormItem>
                  <FormLabel>Máximo embutido (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} value={field.value || ''} className="brand-radius campo-brand" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="post_contemplation_adjustment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ajuste pós contemplação (mensal) (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} value={field.value || ''} className="brand-radius campo-brand" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="agio_purchase_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compra do ágio (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} value={field.value || ''} className="brand-radius campo-brand" />
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
                      <SelectTrigger className="brand-radius select-trigger-brand">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none" className="dropdown-item-brand">Nenhuma</SelectItem>
                      <SelectItem value="percentage" className="dropdown-item-brand">Percentual</SelectItem>
                      <SelectItem value="fixed_value" className="dropdown-item-brand">Valor Fixo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch('special_entry_type') !== 'none' && (
              <FormField
                control={form.control}
                name="functioning"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funcionamento</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value || 'included'}
                        className="flex flex-row space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value="included" 
                            id="included" 
                            className="border-[#e50f5f] text-[#e50f5f] focus:ring-[#e50f5f] focus:ring-offset-0"
                          />
                          <label htmlFor="included" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Incluso
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value="additional" 
                            id="additional" 
                            className="border-[#e50f5f] text-[#e50f5f] focus:ring-[#e50f5f] focus:ring-offset-0"
                          />
                          <label htmlFor="additional" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Adicional
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
                          className="brand-radius campo-brand"
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
                          className="brand-radius campo-brand"
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
                          className="brand-radius campo-brand"
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
                          className="brand-radius campo-brand"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </form>
        </Form>
    </FullScreenModal>
  );
};
