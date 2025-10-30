import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Palette, Check } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Funnel {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  is_default: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  phases?: FunnelPhase[];
}

interface FunnelPhase {
  id: string;
  funnel_id: string;
  name: string;
  description?: string;
  color: string;
  order_index: number;
  is_default: boolean;
  is_final: boolean;
  is_lost: boolean;
  created_at: string;
  updated_at: string;
}

const FunnelsManager: React.FC = () => {
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();
  
  // Estados para modais
  const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [editingFunnel, setEditingFunnel] = useState<Funnel | null>(null);
  const [editingPhase, setEditingPhase] = useState<FunnelPhase | null>(null);
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>('');
  
  // Estados para formulários
  const [funnelForm, setFunnelForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    is_active: true,
    is_default: false
  });
  
  const [phaseForm, setPhaseForm] = useState({
    name: '',
    description: '',
    color: '#10B981',
    is_default: false,
    is_final: false,
    is_lost: false
  });

  // Cores predefinidas
  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  // Query para buscar funis
  const { data: funnels = [], isLoading: funnelsLoading } = useQuery({
    queryKey: ['funnels', selectedCompanyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnels')
        .select(`
          *,
          phases:funnel_phases(*)
        `)
        .eq('company_id', selectedCompanyId)
        .order('order_index');
      
      if (error) throw error;
      return data as Funnel[];
    },
    enabled: !!selectedCompanyId
  });

  // Query para buscar fases de um funil específico
  const { data: phases = [] } = useQuery({
    queryKey: ['funnel-phases', selectedFunnelId],
    queryFn: async () => {
      if (!selectedFunnelId) return [];
      
      const { data, error } = await supabase
        .from('funnel_phases')
        .select('*')
        .eq('funnel_id', selectedFunnelId)
        .order('order_index');
      
      if (error) throw error;
      return data as FunnelPhase[];
    },
    enabled: !!selectedFunnelId
  });

  // Mutation para criar/editar funil
  const funnelMutation = useMutation({
    mutationFn: async (data: Partial<Funnel>) => {
      if (editingFunnel) {
        const { error } = await supabase
          .from('funnels')
          .update(data)
          .eq('id', editingFunnel.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('funnels')
          .insert([{ ...data, company_id: selectedCompanyId }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnels', selectedCompanyId] });
      setIsFunnelModalOpen(false);
      setEditingFunnel(null);
      setFunnelForm({ name: '', description: '', color: '#3B82F6', is_active: true, is_default: false });
      toast.success(editingFunnel ? 'Funil atualizado com sucesso!' : 'Funil criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar funil: ' + error.message);
    }
  });

  // Mutation para criar/editar fase
  const phaseMutation = useMutation({
    mutationFn: async (data: Partial<FunnelPhase>) => {
      if (editingPhase) {
        const { error } = await supabase
          .from('funnel_phases')
          .update(data)
          .eq('id', editingPhase.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('funnel_phases')
          .insert([{ ...data, funnel_id: selectedFunnelId }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-phases', selectedFunnelId] });
      queryClient.invalidateQueries({ queryKey: ['funnels', selectedCompanyId] });
      setIsPhaseModalOpen(false);
      setEditingPhase(null);
      setPhaseForm({ name: '', description: '', color: '#10B981', is_default: false, is_final: false, is_lost: false });
      toast.success(editingPhase ? 'Fase atualizada com sucesso!' : 'Fase criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar fase: ' + error.message);
    }
  });

  // Mutation para deletar funil
  const deleteFunnelMutation = useMutation({
    mutationFn: async (funnelId: string) => {
      const { error } = await supabase
        .from('funnels')
        .delete()
        .eq('id', funnelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnels', selectedCompanyId] });
      toast.success('Funil excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir funil: ' + error.message);
    }
  });

  // Mutation para deletar fase
  const deletePhaseMutation = useMutation({
    mutationFn: async (phaseId: string) => {
      const { error } = await supabase
        .from('funnel_phases')
        .delete()
        .eq('id', phaseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-phases', selectedFunnelId] });
      queryClient.invalidateQueries({ queryKey: ['funnels', selectedCompanyId] });
      toast.success('Fase excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir fase: ' + error.message);
    }
  });

  // Handlers
  const handleCreateFunnel = () => {
    setEditingFunnel(null);
    setFunnelForm({ name: '', description: '', color: '#3B82F6', is_active: true, is_default: false });
    setIsFunnelModalOpen(true);
  };

  const handleEditFunnel = (funnel: Funnel) => {
    setEditingFunnel(funnel);
    setFunnelForm({
      name: funnel.name,
      description: funnel.description || '',
      color: funnel.color,
      is_active: funnel.is_active,
      is_default: funnel.is_default
    });
    setIsFunnelModalOpen(true);
  };

  const handleCreatePhase = (funnelId: string) => {
    setSelectedFunnelId(funnelId);
    setEditingPhase(null);
    setPhaseForm({ name: '', description: '', color: '#10B981', is_default: false, is_final: false, is_lost: false });
    setIsPhaseModalOpen(true);
  };

  const handleEditPhase = (phase: FunnelPhase) => {
    setSelectedFunnelId(phase.funnel_id);
    setEditingPhase(phase);
    setPhaseForm({
      name: phase.name,
      description: phase.description || '',
      color: phase.color,
      is_default: phase.is_default,
      is_final: phase.is_final,
      is_lost: phase.is_lost
    });
    setIsPhaseModalOpen(true);
  };

  const handleSaveFunnel = () => {
    if (!funnelForm.name.trim()) {
      toast.error('Nome do funil é obrigatório');
      return;
    }
    funnelMutation.mutate(funnelForm);
  };

  const handleSavePhase = () => {
    if (!phaseForm.name.trim()) {
      toast.error('Nome da fase é obrigatório');
      return;
    }
    phaseMutation.mutate(phaseForm);
  };

  if (funnelsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando funis...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Funis de Vendas</h2>
        <Button onClick={handleCreateFunnel} className="brand-radius" variant="brandPrimaryToSecondary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Funil
        </Button>
      </div>

      <div className="grid gap-6">
        {funnels.map((funnel) => (
          <Card key={funnel.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: funnel.color }}
                  />
                  <CardTitle className="text-lg">{funnel.name}</CardTitle>
                  {funnel.is_default && (
                    <Badge variant="secondary" className="text-xs">
                      Padrão
                    </Badge>
                  )}
                  {!funnel.is_active && (
                    <Badge variant="outline" className="text-xs">
                      Inativo
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreatePhase(funnel.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Fase
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditFunnel(funnel)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteFunnelMutation.mutate(funnel.id)}
                    disabled={deleteFunnelMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {funnel.description && (
                <p className="text-sm text-muted-foreground mt-2">{funnel.description}</p>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Fases do Funil:</h4>
                <div className="flex flex-wrap gap-2">
                  {funnel.phases?.map((phase, index) => (
                    <div
                      key={phase.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                      style={{ borderColor: phase.color + '40', backgroundColor: phase.color + '10' }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: phase.color }}
                      />
                      <span className="text-sm font-medium">{phase.name}</span>
                      {phase.is_default && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          <Check className="h-3 w-3" />
                        </Badge>
                      )}
                      {phase.is_final && (
                        <Badge variant="default" className="text-xs px-1 py-0">
                          Final
                        </Badge>
                      )}
                      {phase.is_lost && (
                        <Badge variant="destructive" className="text-xs px-1 py-0">
                          Perda
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleEditPhase(phase)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => deletePhaseMutation.mutate(phase.id)}
                          disabled={deletePhaseMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!funnel.phases || funnel.phases.length === 0) && (
                    <div className="text-sm text-muted-foreground italic">
                      Nenhuma fase configurada
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {funnels.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-muted-foreground mb-4">
                Nenhum funil de vendas configurado
              </div>
              <Button onClick={handleCreateFunnel} className="brand-radius" variant="brandPrimaryToSecondary">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Funil
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Funil */}
      <Dialog open={isFunnelModalOpen} onOpenChange={setIsFunnelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFunnel ? 'Editar Funil' : 'Novo Funil'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {editingFunnel ? 'Edite as informações do funil de vendas' : 'Crie um novo funil de vendas para organizar seus leads'}
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="funnel-name">Nome do Funil *</Label>
              <Input
                id="funnel-name"
                value={funnelForm.name}
                onChange={(e) => setFunnelForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Funil de Vendas Principal"
              />
            </div>
            
            <div>
              <Label htmlFor="funnel-description">Descrição</Label>
              <Textarea
                id="funnel-description"
                value={funnelForm.description}
                onChange={(e) => setFunnelForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o propósito deste funil..."
                rows={3}
              />
            </div>
            
            <div>
              <Label>Cor do Funil</Label>
              <div className="flex gap-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      funnelForm.color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFunnelForm(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="funnel-active"
                  checked={funnelForm.is_active}
                  onChange={(e) => setFunnelForm(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <Label htmlFor="funnel-active">Ativo</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="funnel-default"
                  checked={funnelForm.is_default}
                  onChange={(e) => setFunnelForm(prev => ({ ...prev, is_default: e.target.checked }))}
                />
                <Label htmlFor="funnel-default">Padrão</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFunnelModalOpen(false)}
              disabled={funnelMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveFunnel}
              disabled={funnelMutation.isPending}
              className="brand-radius"
              variant="brandPrimaryToSecondary"
            >
              {funnelMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Fase */}
      <Dialog open={isPhaseModalOpen} onOpenChange={setIsPhaseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPhase ? 'Editar Fase' : 'Nova Fase'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {editingPhase ? 'Edite as informações da fase do funil' : 'Crie uma nova fase para o funil de vendas'}
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="phase-name">Nome da Fase *</Label>
              <Input
                id="phase-name"
                value={phaseForm.name}
                onChange={(e) => setPhaseForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Prospecção, Qualificação, Proposta..."
              />
            </div>
            
            <div>
              <Label htmlFor="phase-description">Descrição</Label>
              <Textarea
                id="phase-description"
                value={phaseForm.description}
                onChange={(e) => setPhaseForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva esta fase..."
                rows={3}
              />
            </div>
            
            <div>
              <Label>Cor da Fase</Label>
              <div className="flex gap-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      phaseForm.color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setPhaseForm(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="phase-default"
                  checked={phaseForm.is_default}
                  onChange={(e) => setPhaseForm(prev => ({ ...prev, is_default: e.target.checked }))}
                />
                <Label htmlFor="phase-default">Fase Padrão (inicial)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="phase-final"
                  checked={phaseForm.is_final}
                  onChange={(e) => setPhaseForm(prev => ({ ...prev, is_final: e.target.checked }))}
                />
                <Label htmlFor="phase-final">Fase Final (venda concluída)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="phase-lost"
                  checked={phaseForm.is_lost}
                  onChange={(e) => setPhaseForm(prev => ({ ...prev, is_lost: e.target.checked }))}
                />
                <Label htmlFor="phase-lost">Fase de Perda</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPhaseModalOpen(false)}
              disabled={phaseMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePhase}
              disabled={phaseMutation.isPending}
              className="brand-radius"
              variant="brandPrimaryToSecondary"
            >
              {phaseMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FunnelsManager;
