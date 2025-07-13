
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimulationDataPanel } from './SimulationDataPanel';
import { SimulationResultsPanel } from './SimulationResultsPanel';
import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const NewSimulatorLayout = () => {
  const [modalidade, setModalidade] = useState<'aporte' | 'credito' | 'renda'>('aporte');
  const [valor, setValor] = useState<number | ''>('');
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<string>('');
  const [tiposParcela, setTiposParcela] = useState<any[]>([]);
  const [tipoParcelaSelecionado, setTipoParcelaSelecionado] = useState<string>('full');
  const [showConfigModal, setShowConfigModal] = useState(false);

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
        setParcelas(parcelasData || []);
        const { data: tiposData } = await supabase
          .from('installment_reductions')
          .select('id, name')
          .eq('administrator_id', adminPadrao)
          .eq('is_archived', false)
          .order('name');
        setTiposParcela([{ id: 'full', name: 'Parcela Cheia' }, ...(tiposData || [])]);
      }
    };
    fetchPadrao();
  }, []);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Bloco de campos dinâmicos acima do resultado */}
      <div className="bg-white rounded-2xl shadow p-6 flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="font-medium">Modalidade</label>
          <Select value={modalidade} onValueChange={v => setModalidade(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="aporte">Aporte</SelectItem>
              <SelectItem value="credito">Crédito</SelectItem>
              <SelectItem value="renda">Renda desejada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="font-medium">
            {modalidade === 'aporte' && 'Valor do aporte'}
            {modalidade === 'credito' && 'Valor do crédito'}
            {modalidade === 'renda' && 'Valor da renda desejada'}
          </label>
          <Input
            type="number"
            value={valor}
            onChange={e => setValor(e.target.value ? Number(e.target.value) : '')}
            placeholder="0,00"
          />
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="font-medium">Número de parcelas</label>
          <Select value={parcelaSelecionada} onValueChange={v => setParcelaSelecionada(v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {parcelas.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.installment_count} meses</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="font-medium">Tipo de Parcela</label>
          <Select value={tipoParcelaSelecionado} onValueChange={v => setTipoParcelaSelecionado(v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {tiposParcela.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
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
      {/* Card de resultados permanece igual */}
      <div className="w-full">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <SimulationResultsPanel data={{}} />
          </CardContent>
        </Card>
      </div>
      {/* Modal de configurações (estrutura inicial) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-8 shadow-xl min-w-[320px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Mais configurações</h2>
              <Button variant="ghost" onClick={() => setShowConfigModal(false)}>Fechar</Button>
            </div>
            <div>
              {/* Conteúdo do modal pode ser expandido depois */}
              <p>Configurações avançadas aqui...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
