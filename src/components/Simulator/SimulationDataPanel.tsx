
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface SimulationData {
  administrator: string;
  consortiumType: 'property' | 'vehicle';
  installmentType: string;
  value: number;
  term: number;
  updateRate: number;
  searchType: 'contribution' | 'credit';
}

interface SimulationDataPanelProps {
  data: SimulationData;
  onChange: (data: SimulationData) => void;
}

export const SimulationDataPanel = ({ data, onChange }: SimulationDataPanelProps) => {
  const [administrators, setAdministrators] = useState<any[]>([]);
  const [installmentTypes, setInstallmentTypes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchAdministrators();
  }, []);

  useEffect(() => {
    if (data.administrator) {
      fetchInstallmentTypes(data.administrator);
      fetchProducts(data.administrator);
    }
  }, [data.administrator]);

  const fetchAdministrators = async () => {
    try {
      const { data: adminData, error } = await supabase
        .from('administrators')
        .select('id, name')
        .eq('is_archived', false)
        .order('name');
      
      if (error) throw error;
      setAdministrators(adminData || []);
    } catch (error) {
      console.error('Error fetching administrators:', error);
    }
  };

  const fetchInstallmentTypes = async (administratorId: string) => {
    try {
      const { data: installmentData, error } = await supabase
        .from('installment_types')
        .select('*')
        .eq('administrator_id', administratorId)
        .eq('is_archived', false)
        .order('name');
      
      if (error) throw error;
      setInstallmentTypes(installmentData || []);
    } catch (error) {
      console.error('Error fetching installment types:', error);
    }
  };

  const fetchProducts = async (administratorId: string) => {
    try {
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .eq('administrator_id', administratorId)
        .eq('is_archived', false)
        .order('credit_value');
      
      if (error) throw error;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleChange = (field: keyof SimulationData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleTabChange = (tabValue: string) => {
    if (tabValue === 'contribution') {
      handleChange('searchType', 'contribution');
    } else if (tabValue === 'credit') {
      handleChange('searchType', 'credit');
    }
  };

  const availableTerms = products.length > 0 
    ? [...new Set(products.flatMap(p => p.term_options))].sort((a, b) => a - b)
    : [120, 150, 180, 200, 240];

  return (
    <Tabs value={data.searchType} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="contribution">Por aporte</TabsTrigger>
        <TabsTrigger value="credit">Por crédito desejado</TabsTrigger>
        <TabsTrigger value="income" disabled>Por rendimentos desejados</TabsTrigger>
      </TabsList>
      
      <TabsContent value="contribution" className="space-y-4">
        <div className="space-y-3">
          <Label>Administradora *</Label>
          <Select value={data.administrator} onValueChange={(value) => handleChange('administrator', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a administradora" />
            </SelectTrigger>
            <SelectContent>
              {administrators.map((admin) => (
                <SelectItem key={admin.id} value={admin.id}>
                  {admin.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Tipo de consórcio *</Label>
          <Select value={data.consortiumType} onValueChange={(value: 'property' | 'vehicle') => handleChange('consortiumType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="property">Imóvel</SelectItem>
              <SelectItem value="vehicle">Veículo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Tipo de parcela *</Label>
          <Select value={data.installmentType} onValueChange={(value) => handleChange('installmentType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Parcela Cheia</SelectItem>
              {installmentTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Valor do aporte (R$) *</Label>
          <Input
            type="number"
            value={data.value || ''}
            onChange={(e) => handleChange('value', Number(e.target.value))}
            placeholder="Ex: 1.250"
          />
        </div>

        <div className="space-y-3">
          <Label>Prazo *</Label>
          <Select value={data.term.toString()} onValueChange={(value) => handleChange('term', parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTerms.map((term) => (
                <SelectItem key={term} value={term.toString()}>
                  {term} meses ({Math.round(term / 12)} anos)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Taxa de atualização (%)</Label>
          <Input
            type="number"
            value={data.updateRate}
            onChange={(e) => handleChange('updateRate', Number(e.target.value))}
            placeholder="8"
            step="0.1"
          />
        </div>
      </TabsContent>
      
      <TabsContent value="credit" className="space-y-4">
        <div className="space-y-3">
          <Label>Administradora *</Label>
          <Select value={data.administrator} onValueChange={(value) => handleChange('administrator', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a administradora" />
            </SelectTrigger>
            <SelectContent>
              {administrators.map((admin) => (
                <SelectItem key={admin.id} value={admin.id}>
                  {admin.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Tipo de consórcio *</Label>
          <Select value={data.consortiumType} onValueChange={(value: 'property' | 'vehicle') => handleChange('consortiumType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="property">Imóvel</SelectItem>
              <SelectItem value="vehicle">Veículo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Tipo de parcela *</Label>
          <Select value={data.installmentType} onValueChange={(value) => handleChange('installmentType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Parcela Cheia</SelectItem>
              {installmentTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Valor do crédito desejado (R$) *</Label>
          <Input
            type="number"
            value={data.value || ''}
            onChange={(e) => handleChange('value', Number(e.target.value))}
            placeholder="Ex: 300.000"
          />
        </div>

        <div className="space-y-3">
          <Label>Prazo *</Label>
          <Select value={data.term.toString()} onValueChange={(value) => handleChange('term', parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTerms.map((term) => (
                <SelectItem key={term} value={term.toString()}>
                  {term} meses ({Math.round(term / 12)} anos)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Taxa de atualização (%)</Label>
          <Input
            type="number"
            value={data.updateRate}
            onChange={(e) => handleChange('updateRate', Number(e.target.value))}
            placeholder="8"
            step="0.1"
          />
        </div>
      </TabsContent>
      
      <TabsContent value="income" className="flex items-center justify-center h-32">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Em breve</p>
        </div>
      </TabsContent>
    </Tabs>
  );
};
