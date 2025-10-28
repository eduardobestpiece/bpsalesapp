import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Trash2, Loader2 } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Componente para gerenciar tags
export function TagsManager() {
  const { selectedCompanyId } = useCompany();
  const { toast } = useToast();
  const [tags, setTags] = useState<{ id: string; name: string; color: string; description?: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; color: string; description?: string } | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3B82F6');
  const [tagDescription, setTagDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Cores predefinidas para tags
  const predefinedColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];

  // Carregar tags do Supabase
  const loadTags = async () => {
    if (!selectedCompanyId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tags')
        .select('id, name, color, description')
        .eq('company_id', selectedCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar tags', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, [selectedCompanyId]);

  const deleteTag = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTags(prev => prev.filter(tag => tag.id !== id));
      toast({ title: 'Sucesso', description: 'Tag removida com sucesso' });
    } catch (error) {
      console.error('Erro ao remover tag:', error);
      toast({ title: 'Erro', description: 'Erro ao remover tag', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const startCreate = () => {
    setEditing(null);
    setTagName('');
    setTagColor('#3B82F6');
    setTagDescription('');
    setIsOpen(true);
  };

  const startEdit = (tag: { id: string; name: string; color: string; description?: string }) => {
    setEditing(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setTagDescription(tag.description || '');
    setIsOpen(true);
  };

  const saveTag = async () => {
    if (!tagName.trim()) {
      toast({ title: 'Erro', description: 'Nome da tag é obrigatório', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      
      if (editing) {
        // Atualizar tag existente
        const { error } = await supabase
          .from('tags')
          .update({ 
            name: tagName.trim(),
            color: tagColor,
            description: tagDescription.trim() || null
          })
          .eq('id', editing.id);

        if (error) throw error;
        
        setTags(prev => prev.map(tag => 
          tag.id === editing.id ? { 
            ...tag, 
            name: tagName.trim(),
            color: tagColor,
            description: tagDescription.trim() || undefined
          } : tag
        ));
        toast({ title: 'Sucesso', description: 'Tag atualizada com sucesso' });
      } else {
        // Criar nova tag
        const { data, error } = await supabase
          .from('tags')
          .insert({
            company_id: selectedCompanyId,
            name: tagName.trim(),
            color: tagColor,
            description: tagDescription.trim() || null
          })
          .select('id, name, color, description')
          .single();

        if (error) throw error;
        
        setTags(prev => [data, ...prev]);
        toast({ title: 'Sucesso', description: 'Tag criada com sucesso' });
      }
      
      setIsOpen(false);
      setTagName('');
      setTagColor('#3B82F6');
      setTagDescription('');
      setEditing(null);
    } catch (error) {
      console.error('Erro ao salvar tag:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar tag', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tags</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as tags para categorizar leads
          </p>
        </div>
        <Button onClick={startCreate}>
          Adicionar Tag
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Tag' : 'Nova Tag'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Tag</Label>
              <Input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Ex: Hot Lead, Cliente VIP..."
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      tagColor === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setTagColor(color)}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={tagColor}
                onChange={(e) => setTagColor(e.target.value)}
                className="w-20 h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={tagDescription}
                onChange={(e) => setTagDescription(e.target.value)}
                placeholder="Descrição da tag..."
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={saveTag} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium text-muted-foreground border-b">
          <div className="col-span-8">Nome</div>
          <div className="col-span-2">Cor</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        {loading && tags.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Carregando tags...
          </div>
        ) : tags.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma tag cadastrada
          </div>
        ) : (
          tags.map((tag) => (
            <div key={tag.id} className="grid grid-cols-12 gap-4 p-3 text-sm border-b last:border-b-0 hover:bg-muted/50 transition-colors">
              <div 
                className="col-span-8 cursor-pointer flex items-center gap-2"
                onClick={() => startEdit(tag)}
              >
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span>{tag.name}</span>
                {tag.description && (
                  <span className="text-xs text-muted-foreground">
                    - {tag.description}
                  </span>
                )}
              </div>
              <div className="col-span-2 flex items-center">
                <div 
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: tag.color }}
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => deleteTag(tag.id)} disabled={loading}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Componente para gerenciar fases
export function PhasesManager() {
  const { selectedCompanyId } = useCompany();
  const { toast } = useToast();
  const [phases, setPhases] = useState<{ id: string; name: string; color: string; description?: string; order_index: number; is_default: boolean }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; color: string; description?: string; order_index: number; is_default: boolean } | null>(null);
  const [phaseName, setPhaseName] = useState('');
  const [phaseColor, setPhaseColor] = useState('#10B981');
  const [phaseDescription, setPhaseDescription] = useState('');
  const [phaseOrder, setPhaseOrder] = useState(0);
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cores predefinidas para fases
  const predefinedColors = [
    '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];

  // Carregar fases do Supabase
  const loadPhases = async () => {
    if (!selectedCompanyId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('phases')
        .select('id, name, color, description, order_index, is_default')
        .eq('company_id', selectedCompanyId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setPhases(data || []);
    } catch (error) {
      console.error('Erro ao carregar fases:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar fases', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhases();
  }, [selectedCompanyId]);

  const deletePhase = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('phases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPhases(prev => prev.filter(phase => phase.id !== id));
      toast({ title: 'Sucesso', description: 'Fase removida com sucesso' });
    } catch (error) {
      console.error('Erro ao remover fase:', error);
      toast({ title: 'Erro', description: 'Erro ao remover fase', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const startCreate = () => {
    setEditing(null);
    setPhaseName('');
    setPhaseColor('#10B981');
    setPhaseDescription('');
    setPhaseOrder(phases.length);
    setIsDefault(false);
    setIsOpen(true);
  };

  const startEdit = (phase: { id: string; name: string; color: string; description?: string; order_index: number; is_default: boolean }) => {
    setEditing(phase);
    setPhaseName(phase.name);
    setPhaseColor(phase.color);
    setPhaseDescription(phase.description || '');
    setPhaseOrder(phase.order_index);
    setIsDefault(phase.is_default);
    setIsOpen(true);
  };

  const savePhase = async () => {
    if (!phaseName.trim()) {
      toast({ title: 'Erro', description: 'Nome da fase é obrigatório', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      
      // Se está marcando como padrão, desmarcar outras fases padrão
      if (isDefault) {
        await supabase
          .from('phases')
          .update({ is_default: false })
          .eq('company_id', selectedCompanyId);
      }
      
      if (editing) {
        // Atualizar fase existente
        const { error } = await supabase
          .from('phases')
          .update({ 
            name: phaseName.trim(),
            color: phaseColor,
            description: phaseDescription.trim() || null,
            order_index: phaseOrder,
            is_default: isDefault
          })
          .eq('id', editing.id);

        if (error) throw error;
        
        setPhases(prev => prev.map(phase => 
          phase.id === editing.id ? { 
            ...phase, 
            name: phaseName.trim(),
            color: phaseColor,
            description: phaseDescription.trim() || undefined,
            order_index: phaseOrder,
            is_default: isDefault
          } : phase
        ));
        toast({ title: 'Sucesso', description: 'Fase atualizada com sucesso' });
      } else {
        // Criar nova fase
        const { data, error } = await supabase
          .from('phases')
          .insert({
            company_id: selectedCompanyId,
            name: phaseName.trim(),
            color: phaseColor,
            description: phaseDescription.trim() || null,
            order_index: phaseOrder,
            is_default: isDefault
          })
          .select('id, name, color, description, order_index, is_default')
          .single();

        if (error) throw error;
        
        setPhases(prev => [...prev, data].sort((a, b) => a.order_index - b.order_index));
        toast({ title: 'Sucesso', description: 'Fase criada com sucesso' });
      }
      
      setIsOpen(false);
      setPhaseName('');
      setPhaseColor('#10B981');
      setPhaseDescription('');
      setPhaseOrder(0);
      setIsDefault(false);
      setEditing(null);
    } catch (error) {
      console.error('Erro ao salvar fase:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar fase', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Fases</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as fases do funil de vendas
          </p>
        </div>
        <Button onClick={startCreate}>
          Adicionar Fase
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Fase' : 'Nova Fase'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Fase</Label>
              <Input
                value={phaseName}
                onChange={(e) => setPhaseName(e.target.value)}
                placeholder="Ex: Prospecção, Qualificação..."
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      phaseColor === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setPhaseColor(color)}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={phaseColor}
                onChange={(e) => setPhaseColor(e.target.value)}
                className="w-20 h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={phaseDescription}
                onChange={(e) => setPhaseDescription(e.target.value)}
                placeholder="Descrição da fase..."
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input
                type="number"
                value={phaseOrder}
                onChange={(e) => setPhaseOrder(parseInt(e.target.value) || 0)}
                placeholder="0"
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is-default">Fase Padrão</Label>
              <Switch
                id="is-default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={savePhase} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium text-muted-foreground border-b">
          <div className="col-span-6">Nome</div>
          <div className="col-span-2">Cor</div>
          <div className="col-span-2">Ordem</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        {loading && phases.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Carregando fases...
          </div>
        ) : phases.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma fase cadastrada
          </div>
        ) : (
          phases.map((phase) => (
            <div key={phase.id} className="grid grid-cols-12 gap-4 p-3 text-sm border-b last:border-b-0 hover:bg-muted/50 transition-colors">
              <div 
                className="col-span-6 cursor-pointer flex items-center gap-2"
                onClick={() => startEdit(phase)}
              >
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: phase.color }}
                />
                <span>{phase.name}</span>
                {phase.is_default && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Padrão
                  </span>
                )}
                {phase.description && (
                  <span className="text-xs text-muted-foreground">
                    - {phase.description}
                  </span>
                )}
              </div>
              <div className="col-span-2 flex items-center">
                <div 
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: phase.color }}
                />
              </div>
              <div className="col-span-2 flex items-center">
                <span>{phase.order_index}</span>
              </div>
              <div className="col-span-2 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => deletePhase(phase.id)} disabled={loading}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
