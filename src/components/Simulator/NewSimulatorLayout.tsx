
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimulationDataPanel } from './SimulationDataPanel';
import { SimulationResultsPanel } from './SimulationResultsPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SimulatorConfigModal } from './SimulatorConfigModal';

export const NewSimulatorLayout = () => {
  // Estado principal dos dados da simulação
  const [simulationData, setSimulationData] = useState({
    administrator: '',
    consortiumType: 'property',
    installmentType: 'full',
    value: 0,
    term: 120,
    updateRate: 6,
    searchType: 'contribution',
    bidType: '',
  });

  // Sincronizar campos do topo com simulationData
  const handleFieldChange = (field: string, value: any) => {
    setSimulationData((prev) => ({ ...prev, [field]: value }));
  };

  // Buscar administradora padrão e suas opções de parcelas/tipos
  useEffect(() => {
    const fetchPadrao = async () => {
      const { data: admins } = await supabase
        .from('administrators')
        .select('id')
        .eq('is_archived', false)
        .order('created_at');
      const adminPadrao = admins?.[0]?.id;
      if (adminPadrao) {
        const { data: parcelasData } = await supabase
          .from('installment_types')
          .select('id, installment_count')
          .eq('administrator_id', adminPadrao)
          .eq('is_archived', false)
          .order('installment_count');
        // setParcelas(parcelasData || []); // This line is removed as per the new_code
        const { data: tiposData } = await supabase
          .from('installment_reductions')
          .select('id, name')
          .eq('administrator_id', adminPadrao)
          .eq('is_archived', false)
          .order('name');
        // setTiposParcela([{ id: 'full', name: 'Parcela Cheia' }, ...(tiposData || [])]); // This line is removed as per the new_code
      }
    };
    fetchPadrao();
  }, []);

  const [parcelaSelecionada, setParcelaSelecionada] = useState<string>('');
  const [tiposParcela, setTiposParcela] = useState<any[]>([]);
  const [tipoParcelaSelecionado, setTipoParcelaSelecionado] = useState<string>('full');
  const [showConfigModal, setShowConfigModal] = useState(false);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Bloco de campos dinâmicos acima do resultado */}
      <div className="bg-white rounded-2xl shadow p-6 flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="font-medium">Modalidade</label>
          <Select value={simulationData.searchType} onValueChange={v => handleFieldChange('searchType', v === 'contribution' ? 'contribution' : 'credit')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="contribution">Aporte</SelectItem>
              <SelectItem value="credit">Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="font-medium">
            {simulationData.searchType === 'contribution' && 'Valor do aporte'}
            {simulationData.searchType === 'credit' && 'Valor do crédito'}
          </label>
          <Input
            type="number"
            value={simulationData.value || ''}
            onChange={e => handleFieldChange('value', e.target.value ? Number(e.target.value) : 0)}
            placeholder="0,00"
          />
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="font-medium">Número de parcelas</label>
          <Input
            type="number"
            value={simulationData.term}
            onChange={e => handleFieldChange('term', e.target.value ? Number(e.target.value) : 0)}
            placeholder="Ex: 120"
          />
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="font-medium">Tipo de Parcela</label>
          <Select value={simulationData.installmentType} onValueChange={v => handleFieldChange('installmentType', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Parcela Cheia</SelectItem>
              <SelectItem value="half">Meia Parcela</SelectItem>
              <SelectItem value="reduced">Parcela Reduzida</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={() => setShowConfigModal(true)}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
      {/* Painel de resultados sincronizado com simulationData */}
      <div className="w-full">
        <SimulationResultsPanel data={simulationData} />
      </div>
      {/* Modal de configurações */}
      <SimulatorConfigModal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onApply={() => setShowConfigModal(false)}
        onSaveAndApply={() => setShowConfigModal(false)}
        onReset={() => {}}
      />
    </div>
  );
};
