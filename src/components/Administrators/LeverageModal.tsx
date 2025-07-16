
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';

interface LeverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  leverage?: any;
  onSave: () => void;
}

export const LeverageModal = ({ isOpen, onClose, leverage, onSave }: LeverageModalProps) => {
  const { toast } = useToast();
  const { userRole, companyId } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'real_estate', // real_estate or vehicle
    subtype: '', // short_stay or commercial_residential
    has_fixed_property_value: false,
    fixed_property_value: 0,
    daily_percentage: 0,
    rental_percentage: 0,
    management_percentage: 0,
    real_estate_percentage: 0,
    total_expenses: 0,
    occupancy_rate: 0,
  });

  useEffect(() => {
    if (leverage) {
      setFormData({
        name: leverage.name || '',
        type: leverage.type || 'real_estate',
        subtype: leverage.subtype || '',
        has_fixed_property_value: leverage.has_fixed_property_value || false,
        fixed_property_value: leverage.fixed_property_value || 0,
        daily_percentage: leverage.daily_percentage || 0,
        rental_percentage: leverage.rental_percentage || 0,
        management_percentage: leverage.management_percentage || 0,
        real_estate_percentage: leverage.real_estate_percentage || 0,
        total_expenses: leverage.total_expenses || 0,
        occupancy_rate: leverage.occupancy_rate || 0,
      });
    } else {
      setFormData({
        name: '',
        type: 'real_estate',
        subtype: '',
        has_fixed_property_value: false,
        fixed_property_value: 0,
        daily_percentage: 0,
        rental_percentage: 0,
        management_percentage: 0,
        real_estate_percentage: 0,
        total_expenses: 0,
        occupancy_rate: 0,
      });
    }
  }, [leverage, isOpen]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da alavanca é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.type === 'real_estate' && !formData.subtype) {
      toast({
        title: 'Erro',
        description: 'Subtipo é obrigatório para alavancas imobiliárias.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: formData.name,
        type: formData.type,
        subtype: formData.subtype || null,
        has_fixed_property_value: formData.has_fixed_property_value,
        fixed_property_value: formData.has_fixed_property_value ? formData.fixed_property_value : null,
        daily_percentage: formData.subtype === 'short_stay' ? formData.daily_percentage : null,
        rental_percentage: formData.subtype === 'commercial_residential' ? formData.rental_percentage : null,
        management_percentage: formData.management_percentage || null,
        real_estate_percentage: formData.subtype === 'commercial_residential' ? formData.real_estate_percentage : null,
        total_expenses: formData.total_expenses || null,
        occupancy_rate: formData.subtype === 'short_stay' ? formData.occupancy_rate : null,
        updated_at: new Date().toISOString(),
      };
      if (!leverage) {
        // Definir company_id conforme perfil
        (data as any).company_id = userRole === 'master' ? selectedCompanyId : companyId;
      }
      let error;
      if (leverage) {
        ({ error } = await supabase
          .from('leverages')
          .update(data)
          .eq('id', leverage.id));
      } else {
        ({ error } = await supabase
          .from('leverages')
          .insert([data]));
      }

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: `Alavanca ${leverage ? 'atualizada' : 'criada'} com sucesso.`,
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar alavanca:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar alavanca.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {leverage ? 'Editar Alavanca' : 'Adicionar Alavanca'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Alavanca *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Airbnb Rio de Janeiro"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Alavanca *</Label>
            <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="real_estate">Alavanca Imobiliária</SelectItem>
                <SelectItem value="vehicle">Alavanca Veicular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'real_estate' && (
            <>
              <div className="space-y-2">
                <Label>Subtipo *</Label>
                <Select value={formData.subtype} onValueChange={(value) => handleChange('subtype', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o subtipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short_stay">Short Stay</SelectItem>
                    <SelectItem value="commercial_residential">Comercial ou Residencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.subtype && (
                <div className="space-y-4 p-4 bg-muted/50 dark:bg-[#161616] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_fixed_value"
                      checked={formData.has_fixed_property_value}
                      onCheckedChange={(checked) => handleChange('has_fixed_property_value', checked)}
                    />
                    <Label htmlFor="has_fixed_value">Imóvel tem valor fixo</Label>
                  </div>

                  {formData.has_fixed_property_value && (
                    <div className="space-y-2">
                      <Label htmlFor="property_value">Valor do Imóvel (R$)</Label>
                      <Input
                        id="property_value"
                        type="number"
                        value={formData.fixed_property_value || ''}
                        onChange={(e) => handleChange('fixed_property_value', Number(e.target.value))}
                        placeholder="Ex: 500000"
                      />
                    </div>
                  )}

                  {formData.subtype === 'short_stay' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="daily_percentage">Percentual da Diária (%)</Label>
                        <Input
                          id="daily_percentage"
                          type="number"
                          step="0.01"
                          value={formData.daily_percentage || ''}
                          onChange={(e) => handleChange('daily_percentage', Number(e.target.value))}
                          placeholder="Ex: 0.5"
                        />
                        <p className="text-sm text-muted-foreground">
                          Percentual sobre o valor do imóvel para definir o valor da diária
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="management_percentage">Percentual da Administradora (%)</Label>
                        <Input
                          id="management_percentage"
                          type="number"
                          step="0.01"
                          value={formData.management_percentage || ''}
                          onChange={(e) => handleChange('management_percentage', Number(e.target.value))}
                          placeholder="Ex: 20"
                        />
                        <p className="text-sm text-muted-foreground">
                          Percentual calculado sobre o valor das diárias
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="occupancy_rate">Taxa de Ocupação (%)</Label>
                        <Input
                          id="occupancy_rate"
                          type="number"
                          step="0.01"
                          value={formData.occupancy_rate || ''}
                          onChange={(e) => handleChange('occupancy_rate', Number(e.target.value))}
                          placeholder="Ex: 70"
                        />
                        <p className="text-sm text-muted-foreground">
                          Taxa calculada em 30 dias × percentual
                        </p>
                      </div>
                    </>
                  )}

                  {formData.subtype === 'commercial_residential' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="rental_percentage">Percentual do Aluguel (%)</Label>
                        <Input
                          id="rental_percentage"
                          type="number"
                          step="0.01"
                          value={formData.rental_percentage || ''}
                          onChange={(e) => handleChange('rental_percentage', Number(e.target.value))}
                          placeholder="Ex: 1.5"
                        />
                        <p className="text-sm text-muted-foreground">
                          Percentual sobre o valor do imóvel para definir o aluguel
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="real_estate_percentage">Percentual Imobiliária (%)</Label>
                        <Input
                          id="real_estate_percentage"
                          type="number"
                          step="0.01"
                          value={formData.real_estate_percentage || ''}
                          onChange={(e) => handleChange('real_estate_percentage', Number(e.target.value))}
                          placeholder="Ex: 8"
                        />
                        <p className="text-sm text-muted-foreground">
                          Percentual calculado sobre o valor do aluguel
                        </p>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="total_expenses">
                      {formData.has_fixed_property_value ? 'Valor das Despesas Totais (R$)' : 'Valor das Despesas Totais (%)'}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="total_expenses"
                        type="number"
                        min={formData.has_fixed_property_value ? undefined : 0}
                        max={formData.has_fixed_property_value ? undefined : 100}
                        step="0.01"
                        value={formData.total_expenses || ''}
                        onChange={(e) => handleChange('total_expenses', Number(e.target.value))}
                        placeholder={formData.has_fixed_property_value ? 'Ex: 800' : 'Ex: 10'}
                      />
                      {!formData.has_fixed_property_value && <span className="text-muted-foreground">%</span>}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {formData.type === 'vehicle' && (
            <div className="p-4 bg-muted/50 dark:bg-[#161616] rounded-lg text-center">
              <p className="text-muted-foreground">Em breve</p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : leverage ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
