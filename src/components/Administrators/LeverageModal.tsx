
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LeverageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leverage?: any;
  onSuccess: () => void;
}

export const LeverageModal = ({ open, onOpenChange, leverage, onSuccess }: LeverageModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'real_estate' as 'real_estate' | 'vehicle',
    subtype: 'short_stay' as 'short_stay' | 'commercial_residential' | '',
    has_fixed_property_value: false,
    fixed_property_value: '',
    daily_percentage: '',
    rental_percentage: '',
    management_percentage: '',
    real_estate_percentage: '',
    total_expenses: '',
    occupancy_rate: ''
  });

  useEffect(() => {
    if (leverage) {
      setFormData({
        name: leverage.name || '',
        type: leverage.type || 'real_estate',
        subtype: leverage.subtype || 'short_stay',
        has_fixed_property_value: leverage.has_fixed_property_value || false,
        fixed_property_value: leverage.fixed_property_value?.toString() || '',
        daily_percentage: leverage.daily_percentage?.toString() || '',
        rental_percentage: leverage.rental_percentage?.toString() || '',
        management_percentage: leverage.management_percentage?.toString() || '',
        real_estate_percentage: leverage.real_estate_percentage?.toString() || '',
        total_expenses: leverage.total_expenses?.toString() || '',
        occupancy_rate: leverage.occupancy_rate?.toString() || ''
      });
    } else {
      setFormData({
        name: '',
        type: 'real_estate',
        subtype: 'short_stay',
        has_fixed_property_value: false,
        fixed_property_value: '',
        daily_percentage: '',
        rental_percentage: '',
        management_percentage: '',
        real_estate_percentage: '',
        total_expenses: '',
        occupancy_rate: ''
      });
    }
  }, [leverage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        name: formData.name,
        type: formData.type,
        subtype: formData.type === 'real_estate' ? formData.subtype : null,
        has_fixed_property_value: formData.has_fixed_property_value,
        fixed_property_value: formData.fixed_property_value ? parseFloat(formData.fixed_property_value) : null,
        daily_percentage: formData.daily_percentage ? parseFloat(formData.daily_percentage) : null,
        rental_percentage: formData.rental_percentage ? parseFloat(formData.rental_percentage) : null,
        management_percentage: formData.management_percentage ? parseFloat(formData.management_percentage) : null,
        real_estate_percentage: formData.real_estate_percentage ? parseFloat(formData.real_estate_percentage) : null,
        total_expenses: formData.total_expenses ? parseFloat(formData.total_expenses) : null,
        occupancy_rate: formData.occupancy_rate ? parseFloat(formData.occupancy_rate) : null,
        updated_at: new Date().toISOString()
      };

      let result;
      if (leverage) {
        result = await supabase
          .from('leverages')
          .update(dataToSubmit)
          .eq('id', leverage.id);
      } else {
        result = await supabase
          .from('leverages')
          .insert([dataToSubmit]);
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: 'Sucesso!',
        description: `Alavanca ${leverage ? 'atualizada' : 'criada'} com sucesso.`,
      });

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar alavanca:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar alavanca. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {leverage ? 'Editar Alavanca' : 'Nova Alavanca'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Aluguel por Temporada"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: 'real_estate' | 'vehicle') => 
                setFormData(prev => ({ ...prev, type: value, subtype: value === 'vehicle' ? '' : 'short_stay' }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="real_estate">Imóvel</SelectItem>
                <SelectItem value="vehicle">Veículo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'real_estate' && (
            <div className="space-y-2">
              <Label htmlFor="subtype">Subtipo</Label>
              <Select 
                value={formData.subtype} 
                onValueChange={(value: 'short_stay' | 'commercial_residential') => 
                  setFormData(prev => ({ ...prev, subtype: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o subtipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_stay">Aluguel por Temporada</SelectItem>
                  <SelectItem value="commercial_residential">Comercial/Residencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="has_fixed_property_value"
              checked={formData.has_fixed_property_value}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, has_fixed_property_value: checked }))
              }
            />
            <Label htmlFor="has_fixed_property_value">Valor fixo do imóvel</Label>
          </div>

          {formData.has_fixed_property_value && (
            <div className="space-y-2">
              <Label htmlFor="fixed_property_value">Valor Fixo do Imóvel (R$)</Label>
              <Input
                id="fixed_property_value"
                type="number"
                step="0.01"
                value={formData.fixed_property_value}
                onChange={(e) => setFormData(prev => ({ ...prev, fixed_property_value: e.target.value }))}
                placeholder="Ex: 300000"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="daily_percentage">Percentual Diária (%)</Label>
              <Input
                id="daily_percentage"
                type="number"
                step="0.01"
                value={formData.daily_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, daily_percentage: e.target.value }))}
                placeholder="Ex: 0.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rental_percentage">Percentual Aluguel (%)</Label>
              <Input
                id="rental_percentage"
                type="number"
                step="0.01"
                value={formData.rental_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, rental_percentage: e.target.value }))}
                placeholder="Ex: 1.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="management_percentage">Percentual Administração (%)</Label>
              <Input
                id="management_percentage"
                type="number"
                step="0.01"
                value={formData.management_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, management_percentage: e.target.value }))}
                placeholder="Ex: 10.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="real_estate_percentage">Percentual Imobiliária (%)</Label>
              <Input
                id="real_estate_percentage"
                type="number"
                step="0.01"
                value={formData.real_estate_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, real_estate_percentage: e.target.value }))}
                placeholder="Ex: 8.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_expenses">Despesas Totais (R$)</Label>
              <Input
                id="total_expenses"
                type="number"
                step="0.01"
                value={formData.total_expenses}
                onChange={(e) => setFormData(prev => ({ ...prev, total_expenses: e.target.value }))}
                placeholder="Ex: 800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupancy_rate">Taxa de Ocupação (%)</Label>
              <Input
                id="occupancy_rate"
                type="number"
                step="0.01"
                value={formData.occupancy_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, occupancy_rate: e.target.value }))}
                placeholder="Ex: 80"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (leverage ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
