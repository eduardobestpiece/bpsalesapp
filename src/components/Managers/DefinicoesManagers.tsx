import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Componente para gerenciar motivos de perda
export function LossReasonsManager() {
  const { selectedCompanyId } = useCompany();
  const { toast } = useToast();
  const [reasons, setReasons] = useState<{ id: string; name: string; justificativa_obrigatoria: boolean }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; justificativa_obrigatoria: boolean } | null>(null);
  const [reasonName, setReasonName] = useState('');
  const [justificativaObrigatoria, setJustificativaObrigatoria] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carregar motivos de perda do Supabase
  const loadReasons = async () => {
    if (!selectedCompanyId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('loss_reasons')
        .select('id, name, justificativa_obrigatoria')
        .eq('company_id', selectedCompanyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReasons(data || []);
    } catch (error) {
      console.error('Erro ao carregar motivos de perda:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar motivos de perda', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReasons();
  }, [selectedCompanyId]);

  const deleteReason = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('loss_reasons')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;
      
      setReasons(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Sucesso', description: 'Motivo de perda removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover motivo de perda:', error);
      toast({ title: 'Erro', description: 'Erro ao remover motivo de perda', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const startCreate = () => {
    setEditing(null);
    setReasonName('');
    setJustificativaObrigatoria(false);
    setIsOpen(true);
  };

  useEffect(() => {
    const open = () => startCreate();
    window.addEventListener('open-loss-reason-modal', open as any);
    return () => window.removeEventListener('open-loss-reason-modal', open as any);
  }, []);

  const startEdit = (r: { id: string; name: string; justificativa_obrigatoria: boolean }) => {
    setEditing(r);
    setReasonName(r.name);
    setJustificativaObrigatoria(r.justificativa_obrigatoria);
    setIsOpen(true);
  };

  const saveReason = async () => {
    const name = reasonName.trim();
    if (!name || !selectedCompanyId) return;

    try {
      setLoading(true);
      
      if (editing) {
        // Atualizar motivo existente
        const { error } = await supabase
          .from('loss_reasons')
          .update({ name, justificativa_obrigatoria: justificativaObrigatoria })
          .eq('id', editing.id);

        if (error) throw error;
        
        setReasons(prev => prev.map(r => (r.id === editing.id ? { ...r, name, justificativa_obrigatoria: justificativaObrigatoria } : r)));
        toast({ title: 'Sucesso', description: 'Motivo de perda atualizado com sucesso' });
      } else {
        // Criar novo motivo
        const { data, error } = await supabase
          .from('loss_reasons')
          .insert({ name, company_id: selectedCompanyId, justificativa_obrigatoria: justificativaObrigatoria })
          .select('id, name, justificativa_obrigatoria')
          .single();

        if (error) throw error;
        
        setReasons(prev => [data, ...prev]);
        toast({ title: 'Sucesso', description: 'Motivo de perda criado com sucesso' });
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao salvar motivo de perda:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar motivo de perda', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <span></span>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar motivo' : 'Adicionar motivo'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do motivo</Label>
                <Input value={reasonName} onChange={e => setReasonName(e.target.value)} placeholder="Ex.: Preço alto" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="justificativa-obrigatoria">Justificativa obrigatória?</Label>
                <Switch
                  id="justificativa-obrigatoria"
                  checked={justificativaObrigatoria}
                  onCheckedChange={setJustificativaObrigatoria}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={saveReason} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium text-muted-foreground border-b">
          <div className="col-span-10">Nome</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Carregando motivos de perda...
          </div>
        ) : reasons.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum motivo de perda cadastrado
          </div>
        ) : (
          reasons.map((reason) => (
            <div key={reason.id} className="grid grid-cols-12 gap-4 p-3 text-sm border-b last:border-b-0 hover:bg-muted/50 transition-colors">
              <div 
                className="col-span-10 cursor-pointer flex items-center justify-between"
                onClick={() => startEdit(reason)}
              >
                <span>{reason.name}</span>
                {reason.justificativa_obrigatoria && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    Justificativa obrigatória
                  </span>
                )}
              </div>
              <div className="col-span-2 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => deleteReason(reason.id)} disabled={loading}>
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

// Componente para gerenciar campos de cliente
export function ClientFieldsManager() {
  const { selectedCompanyId } = useCompany();
  const [fields, setFields] = useState<{ id: string; name: string; type: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; type: string } | null>(null);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('texto');

  const deleteField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const startCreate = () => {
    setEditing(null);
    setFieldName('');
    setFieldType('texto');
    setIsOpen(true);
  };

  useEffect(() => {
    const open = () => startCreate();
    window.addEventListener('open-client-field-modal', open as any);
    return () => window.removeEventListener('open-client-field-modal', open as any);
  }, []);

  const startEdit = (f: { id: string; name: string; type: string }) => {
    setEditing(f);
    setFieldName(f.name);
    setFieldType(f.type);
    setIsOpen(true);
  };

  const saveField = () => {
    const name = fieldName.trim();
    if (!name) return;
    if (editing) {
      setFields(prev => prev.map(f => (f.id === editing.id ? { ...f, name, type: fieldType } : f)));
    } else {
      setFields(prev => [{ id: `f_${Date.now()}`, name, type: fieldType }, ...prev]);
    }
    setIsOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <span></span>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar campo' : 'Adicionar campo'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do campo</Label>
                <Input value={fieldName} onChange={e => setFieldName(e.target.value)} placeholder="Ex.: Profissão" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={fieldType} onValueChange={setFieldType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="texto">Texto</SelectItem>
                    <SelectItem value="numero">Número</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="telefone">Telefone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={saveField}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium text-muted-foreground border-b">
          <div className="col-span-6">Nome</div>
          <div className="col-span-3">Tipo</div>
          <div className="col-span-3 text-right">Ações</div>
        </div>
        {fields.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum campo de cliente cadastrado
          </div>
        ) : (
          fields.map((field) => (
            <div key={field.id} className="grid grid-cols-12 gap-4 p-3 text-sm border-b last:border-b-0">
              <div className="col-span-6">{field.name}</div>
              <div className="col-span-3">{field.type}</div>
              <div className="col-span-3 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => startEdit(field)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteField(field.id)}>
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

// Componente para gerenciar campos de empresas
export function CompanyFieldsManager() {
  const { selectedCompanyId } = useCompany();
  const [fields, setFields] = useState<{ id: string; name: string; type: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; type: string } | null>(null);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('texto');

  const deleteField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const startCreate = () => {
    setEditing(null);
    setFieldName('');
    setFieldType('texto');
    setIsOpen(true);
  };

  useEffect(() => {
    const open = () => startCreate();
    window.addEventListener('open-company-field-modal', open as any);
    return () => window.removeEventListener('open-company-field-modal', open as any);
  }, []);

  const startEdit = (f: { id: string; name: string; type: string }) => {
    setEditing(f);
    setFieldName(f.name);
    setFieldType(f.type);
    setIsOpen(true);
  };

  const saveField = () => {
    const name = fieldName.trim();
    if (!name) return;
    if (editing) {
      setFields(prev => prev.map(f => (f.id === editing.id ? { ...f, name, type: fieldType } : f)));
    } else {
      setFields(prev => [{ id: `f_${Date.now()}`, name, type: fieldType }, ...prev]);
    }
    setIsOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <span></span>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar campo' : 'Adicionar campo'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do campo</Label>
                <Input value={fieldName} onChange={e => setFieldName(e.target.value)} placeholder="Ex.: Segmento" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={fieldType} onValueChange={setFieldType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="texto">Texto</SelectItem>
                    <SelectItem value="numero">Número</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="telefone">Telefone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={saveField}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium text-muted-foreground border-b">
          <div className="col-span-6">Nome</div>
          <div className="col-span-3">Tipo</div>
          <div className="col-span-3 text-right">Ações</div>
        </div>
        {fields.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum campo de empresa cadastrado
          </div>
        ) : (
          fields.map((field) => (
            <div key={field.id} className="grid grid-cols-12 gap-4 p-3 text-sm border-b last:border-b-0">
              <div className="col-span-6">{field.name}</div>
              <div className="col-span-3">{field.type}</div>
              <div className="col-span-3 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => startEdit(field)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteField(field.id)}>
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

// Componente para gerenciar campos de venda
export function SaleFieldsManager() {
  const { selectedCompanyId } = useCompany();
  const [fields, setFields] = useState<{ id: string; name: string; type: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; type: string } | null>(null);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('texto');

  const deleteField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const startCreate = () => {
    setEditing(null);
    setFieldName('');
    setFieldType('texto');
    setIsOpen(true);
  };

  useEffect(() => {
    const open = () => startCreate();
    window.addEventListener('open-sale-field-modal', open as any);
    return () => window.removeEventListener('open-sale-field-modal', open as any);
  }, []);

  const startEdit = (f: { id: string; name: string; type: string }) => {
    setEditing(f);
    setFieldName(f.name);
    setFieldType(f.type);
    setIsOpen(true);
  };

  const saveField = () => {
    const name = fieldName.trim();
    if (!name) return;
    if (editing) {
      setFields(prev => prev.map(f => (f.id === editing.id ? { ...f, name, type: fieldType } : f)));
    } else {
      setFields(prev => [{ id: `f_${Date.now()}`, name, type: fieldType }, ...prev]);
    }
    setIsOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <span></span>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar campo' : 'Adicionar campo'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do campo</Label>
                <Input value={fieldName} onChange={e => setFieldName(e.target.value)} placeholder="Ex.: Comissão" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={fieldType} onValueChange={setFieldType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="texto">Texto</SelectItem>
                    <SelectItem value="numero">Número</SelectItem>
                    <SelectItem value="monetario">Monetário</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="porcentagem">Porcentagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={saveField}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium text-muted-foreground border-b">
          <div className="col-span-6">Nome</div>
          <div className="col-span-3">Tipo</div>
          <div className="col-span-3 text-right">Ações</div>
        </div>
        {fields.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum campo de venda cadastrado
          </div>
        ) : (
          fields.map((field) => (
            <div key={field.id} className="grid grid-cols-12 gap-4 p-3 text-sm border-b last:border-b-0">
              <div className="col-span-6">{field.name}</div>
              <div className="col-span-3">{field.type}</div>
              <div className="col-span-3 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => startEdit(field)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteField(field.id)}>
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

// Componente para gerenciar origens
export function OriginsManager() {
  const { selectedCompanyId } = useCompany();
  const { toast } = useToast();
  const [origins, setOrigins] = useState<{ id: string; name: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [originName, setOriginName] = useState('');
  const [loading, setLoading] = useState(false);

  // Carregar origens do Supabase
  const loadOrigins = async () => {
    if (!selectedCompanyId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_origins')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrigins(data || []);
    } catch (error) {
      console.error('Erro ao carregar origens:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar origens', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrigins();
  }, [selectedCompanyId]);

  const deleteOrigin = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('lead_origins')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setOrigins(prev => prev.filter(origin => origin.id !== id));
      toast({ title: 'Sucesso', description: 'Origem removida com sucesso' });
    } catch (error) {
      console.error('Erro ao remover origem:', error);
      toast({ title: 'Erro', description: 'Erro ao remover origem', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const startCreate = () => {
    setEditing(null);
    setOriginName('');
    setIsOpen(true);
  };

  const startEdit = (origin: { id: string; name: string }) => {
    setEditing(origin);
    setOriginName(origin.name);
    setIsOpen(true);
  };

  const saveOrigin = async () => {
    if (!originName.trim()) {
      toast({ title: 'Erro', description: 'Nome da origem é obrigatório', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      
      if (editing) {
        // Atualizar origem existente
        const { error } = await supabase
          .from('lead_origins')
          .update({ name: originName.trim() })
          .eq('id', editing.id);

        if (error) throw error;
        
        setOrigins(prev => prev.map(origin => 
          origin.id === editing.id ? { ...origin, name: originName.trim() } : origin
        ));
        toast({ title: 'Sucesso', description: 'Origem atualizada com sucesso' });
      } else {
        // Criar nova origem
        const { data, error } = await supabase
          .from('lead_origins')
          .insert({
            company_id: selectedCompanyId,
            name: originName.trim()
          })
          .select('id, name')
          .single();

        if (error) throw error;
        
        setOrigins(prev => [data, ...prev]);
        toast({ title: 'Sucesso', description: 'Origem criada com sucesso' });
      }
      
      setIsOpen(false);
      setOriginName('');
      setEditing(null);
    } catch (error) {
      console.error('Erro ao salvar origem:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar origem', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Origens</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as origens dos leads
          </p>
        </div>
        <Button onClick={startCreate}>
          Adicionar Origem
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Origem' : 'Nova Origem'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Origem</Label>
              <Input
                value={originName}
                onChange={(e) => setOriginName(e.target.value)}
                placeholder="Ex: Site, Facebook, Google Ads..."
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={saveOrigin} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium text-muted-foreground border-b">
          <div className="col-span-10">Nome</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        {loading && origins.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Carregando origens...
          </div>
        ) : origins.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma origem cadastrada
          </div>
        ) : (
          origins.map((origin) => (
            <div key={origin.id} className="grid grid-cols-12 gap-4 p-3 text-sm border-b last:border-b-0 hover:bg-muted/50 transition-colors">
              <div 
                className="col-span-10 cursor-pointer flex items-center justify-between"
                onClick={() => startEdit(origin)}
              >
                <span>{origin.name}</span>
              </div>
              <div className="col-span-2 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => deleteOrigin(origin.id)} disabled={loading}>
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