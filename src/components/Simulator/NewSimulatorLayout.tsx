
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

export const NewSimulatorLayout = ({ manualTerm }: { manualTerm?: number }) => {
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

  // Buscar administradora padrão e opções de parcelas
  useEffect(() => {
    const fetchInstallmentTypes = async () => {
      let adminId = simulationData.administrator;
      if (!adminId) {
        // Buscar administradora padrão
        const { data: admins } = await supabase
          .from('administrators')
          .select('id')
          .eq('is_default', true)
          .limit(1);
        adminId = admins?.[0]?.id || '';
        if (adminId && !simulationData.administrator) {
          setSimulationData((prev) => ({ ...prev, administrator: adminId }));
        }
      }
      if (adminId) {
        const { data: installments } = await supabase
          .from('installment_types')
          .select('*')
          .eq('administrator_id', adminId)
          .eq('is_archived', false)
          .order('installment_count');
        setInstallmentTypes(installments || []);
      }
    };
    fetchInstallmentTypes();
  }, [simulationData.administrator]);

  const [parcelaSelecionada, setParcelaSelecionada] = useState<string>('');
  const [tiposParcela, setTiposParcela] = useState<any[]>([]);
  const [tipoParcelaSelecionado, setTipoParcelaSelecionado] = useState<string>('full');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [installmentTypes, setInstallmentTypes] = useState<any[]>([]);

  // Adicionar estado para sincronizar parcelas
  const [selectedTerm, setSelectedTerm] = useState<number | undefined>(undefined);

  // Adicionar estados para adminTaxPercent e reserveFundPercent
  const [adminTaxPercent, setAdminTaxPercent] = useState<number | undefined>(undefined);
  const [reserveFundPercent, setReserveFundPercent] = useState<number | undefined>(undefined);

  // Estado para reduções de parcela
  const [reducoesParcela, setReducoesParcela] = useState<any[]>([]);

  // Buscar reduções de parcela da administradora selecionada
  useEffect(() => {
    async function fetchReducoes() {
      // Corrigido: só busca se administrator for válido
      if (!simulationData.administrator || simulationData.administrator === '' || simulationData.administrator === null) {
        setReducoesParcela([]);
        return;
      }
      const { data: reducoes } = await supabase
        .from('installment_reductions')
        .select('id, name')
        .eq('administrator_id', simulationData.administrator)
        .eq('is_archived', false);
      setReducoesParcela(reducoes || []);
    }
    fetchReducoes();
  }, [simulationData.administrator]);

  // Atualizar ao receber do painel de dados
  useEffect(() => {
    if (simulationData.adminTaxPercent !== undefined) setAdminTaxPercent(simulationData.adminTaxPercent);
    if (simulationData.reserveFundPercent !== undefined) setReserveFundPercent(simulationData.reserveFundPercent);
  }, [simulationData.adminTaxPercent, simulationData.reserveFundPercent]);

  // Atualizar selectedTerm ao mudar no simulador
  const handleTermChange = (value: number) => {
    setSelectedTerm(value);
    handleFieldChange('term', value);
  };

  // Se houver valor manual vindo do modal, ele se sobrepõe
  const termValue = manualTerm !== undefined && manualTerm !== null ? manualTerm : simulationData.term;

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
          <Select
            value={termValue.toString()}
            onValueChange={v => handleTermChange(Number(v))}
          >
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {installmentTypes.map((it: any) => (
                <SelectItem key={it.id} value={it.installment_count.toString()}>
                  {it.installment_count}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="font-medium">Tipo de Parcela</label>
          <Select value={simulationData.installmentType} onValueChange={v => handleFieldChange('installmentType', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Parcela Cheia</SelectItem>
              {reducoesParcela.map((red: any) => (
                <SelectItem key={red.id} value={red.id}>{red.name}</SelectItem>
              ))}
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
        setManualTerm={() => {}}
        selectedTerm={selectedTerm}
        setSelectedTerm={setSelectedTerm}
        adminTaxPercent={adminTaxPercent}
        reserveFundPercent={reserveFundPercent}
      />
    </div>
  );
};
