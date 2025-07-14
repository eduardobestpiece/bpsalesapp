
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { BidTypeSelector } from './BidTypeSelector';
import { DollarSign, Target, TrendingUp, Settings } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';

interface SimulationData {
  administrator: string;
  consortiumType: 'property' | 'vehicle';
  installmentType: string;
  value: number;
  term: number;
  updateRate: number;
  searchType: 'contribution' | 'credit';
  bidType?: string;
  adminTaxPercent?: number;
  reserveFundPercent?: number;
}

interface SimulationDataPanelProps {
  data: SimulationData;
  onChange: (data: SimulationData) => void;
}

export const SimulationDataPanel = ({ data, onChange }: SimulationDataPanelProps) => {
  const { selectedCompanyId } = useCompany();
  const [administrators, setAdministrators] = useState<any[]>([]);
  const [installmentTypes, setInstallmentTypes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [includeInsurance, setIncludeInsurance] = useState(false);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [reductionOptions, setReductionOptions] = useState<any[]>([]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchAdministrators();
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (data.administrator && selectedCompanyId) {
      fetchInstallmentTypes(data.administrator);
      fetchProducts(data.administrator);
    }
  }, [data.administrator, selectedCompanyId]);

  useEffect(() => {
    const fetchReductions = async () => {
      if (!data.term || !data.administrator) {
        setReductionOptions([]);
        return;
      }
      // Buscar o installment_type correspondente
      const { data: installmentTypes } = await supabase
        .from('installment_types')
        .select('id')
        .eq('administrator_id', data.administrator)
        .eq('installment_count', data.term)
        .eq('is_archived', false)
        .limit(1);
      const installmentTypeId = installmentTypes?.[0]?.id;
      if (!installmentTypeId) {
        setReductionOptions([]);
        return;
      }
      // Buscar reduções associadas
      const { data: rels } = await supabase
        .from('installment_type_reductions')
        .select('installment_reduction_id')
        .eq('installment_type_id', installmentTypeId);
      const reductionIds = rels?.map(r => r.installment_reduction_id) || [];
      if (reductionIds.length === 0) {
        setReductionOptions([]);
        return;
      }
      const { data: reductions } = await supabase
        .from('installment_reductions')
        .select('id, name')
        .in('id', reductionIds)
        .eq('is_archived', false);
      setReductionOptions(reductions || []);
    };
    fetchReductions();
  }, [data.term, data.administrator]);

  useEffect(() => {
    const fetchInstallmentTypeDetails = async () => {
      if (!data.term || !data.administrator) return;
      const { data: installmentTypes } = await supabase
        .from('installment_types')
        .select('*')
        .eq('administrator_id', data.administrator)
        .eq('installment_count', data.term)
        .eq('is_archived', false)
        .limit(1);
      const selected = installmentTypes?.[0];
      if (selected) {
        if (onChange) {
          onChange({ ...data, adminTaxPercent: selected.admin_tax_percent, reserveFundPercent: selected.reserve_fund_percent });
        }
      }
    };
    fetchInstallmentTypeDetails();
  }, [data.term, data.administrator]);

  const fetchAdministrators = async () => {
    try {
      const { data: adminData, error } = await supabase
        .from('administrators')
        .select('id, name')
        .eq('is_archived', false)
        .eq('company_id', selectedCompanyId)
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
        .eq('company_id', selectedCompanyId)
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
        .eq('company_id', selectedCompanyId)
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

  const handleInsuranceChange = (checked: boolean | 'indeterminate') => {
    setIncludeInsurance(checked === true);
  };

  const availableTerms = products.length > 0 
    ? [...new Set(products.flatMap(p => p.term_options))].sort((a, b) => a - b)
    : [120, 150, 180, 200, 240];

  return (
    <div className="space-y-6">
      <TooltipProvider>
        <Tabs value={data.searchType} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="contribution" className="p-3">
                  <DollarSign className="w-5 h-5" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Por aporte</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="credit" className="p-3">
                  <Target className="w-5 h-5" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Por crédito desejado</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="income" disabled className="p-3">
                  <TrendingUp className="w-5 h-5" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Por rendimentos desejados</p>
              </TooltipContent>
            </Tooltip>
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
              <Label>Tipo de Contemplação *</Label>
              <BidTypeSelector
                administratorId={data.administrator}
                value={data.bidType || ''}
                onValueChange={(value) => handleChange('bidType', value)}
              />
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
                  {reductionOptions.map((reduction) => (
                    <SelectItem key={reduction.id} value={reduction.id}>{reduction.name}</SelectItem>
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

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-insurance" 
                checked={includeInsurance}
                onCheckedChange={handleInsuranceChange}
              />
              <Label htmlFor="include-insurance">Incluir seguro no cálculo</Label>
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
              <Label>Tipo de Contemplação *</Label>
              <BidTypeSelector
                administratorId={data.administrator}
                value={data.bidType || ''}
                onValueChange={(value) => handleChange('bidType', value)}
              />
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

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-insurance-credit" 
                checked={includeInsurance}
                onCheckedChange={handleInsuranceChange}
              />
              <Label htmlFor="include-insurance-credit">Incluir seguro no cálculo</Label>
            </div>
          </TabsContent>
          
          <TabsContent value="income" className="flex items-center justify-center h-32">
            <div className="text-center text-muted-foreground">
              <p className="text-lg">Em breve</p>
            </div>
          </TabsContent>
        </Tabs>
      </TooltipProvider>

      {/* Bloco de resultados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 bg-gray-50 rounded-xl p-4">
        <div>
          <div className="text-xs text-gray-500">Crédito Total Acessado</div>
          <div className="font-bold text-lg">{data.value ? data.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Parcela Total</div>
          <div className="font-bold text-lg">{/* Aqui pode ser ajustado para o cálculo real da parcela */}-</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Taxa de Administração Anual</div>
          <div className="font-bold text-lg">
            {data.adminTaxPercent && data.term ? ((data.adminTaxPercent / data.term) * 12).toFixed(2) + '%' : '-'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Atualização anual</div>
          <div className="font-bold text-lg">
            {data.consortiumType === 'property' && 'INCC'}
            {data.consortiumType === 'vehicle' && 'IPCA'}
            {data.consortiumType !== 'property' && data.consortiumType !== 'vehicle' && (
              <>
                Atualização anual<br />
                {data.updateRate ? data.updateRate.toFixed(2) + '%' : '-'}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowCalculationModal(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Configurações avançadas de cálculo</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
