import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Loader2, Plus, Edit, UserPlus } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import PublicForm from '@/pages/PublicForm';

// Componente para gerenciar formulários de leads
export function LeadFormsManager() {
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();
  const [forms, setForms] = useState<{ id: string; name: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [formName, setFormName] = useState('');
  const [loading, setLoading] = useState(false);
  const [openAddLeadModal, setOpenAddLeadModal] = useState(false);
  const [baseFormId, setBaseFormId] = useState<string | null>(null);

  // Carregar formulários de leads do Supabase
  const loadForms = async () => {
    if (!selectedCompanyId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_forms')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Erro ao carregar formulários de leads:', error);
      toast.error('Erro ao carregar formulários de leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, [selectedCompanyId]);

  // Carregar formulário base da empresa
  useEffect(() => {
    const loadBaseForm = async () => {
      if (!selectedCompanyId) return;
      try {
        const { data } = await supabase
          .from('lead_forms')
          .select('id')
          .eq('company_id', selectedCompanyId)
          .eq('is_base_form', true)
          .eq('status', 'active')
          .maybeSingle();
        setBaseFormId(data?.id || null);
      } catch (error) {
        console.error('Erro ao carregar formulário base:', error);
      }
    };
    loadBaseForm();
  }, [selectedCompanyId]);

  const deleteForm = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('lead_forms')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;
      
      setForms(prev => prev.filter(f => f.id !== id));
      toast.success('Formulário removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover formulário:', error);
      toast.error('Erro ao remover formulário');
    } finally {
      setLoading(false);
    }
  };

  const startCreate = () => {
    setEditing(null);
    setFormName('');
    setIsOpen(true);
  };

  useEffect(() => {
    const open = () => startCreate();
    window.addEventListener('open-lead-form-modal', open as any);
    return () => window.removeEventListener('open-lead-form-modal', open as any);
  }, []);

  const startEdit = (f: { id: string; name: string }) => {
    setEditing(f);
    setFormName(f.name);
    setIsOpen(true);
  };

  const saveForm = async () => {
    const name = formName.trim();
    if (!name || !selectedCompanyId) return;

    try {
      setLoading(true);
      
      if (editing) {
        // Atualizar formulário existente
        const { error } = await supabase
          .from('lead_forms')
          .update({ name })
          .eq('id', editing.id);

        if (error) throw error;
        
        setForms(prev => prev.map(f => (f.id === editing.id ? { ...f, name } : f)));
        toast.success('Formulário atualizado com sucesso');
      } else {
        // Criar novo formulário
        const { data, error } = await supabase
          .from('lead_forms')
          .insert({ name, company_id: selectedCompanyId })
          .select('id, name')
          .single();

        if (error) throw error;
        
        setForms(prev => [data, ...prev]);
        toast.success('Formulário criado com sucesso');
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao salvar formulário:', error);
      toast.error('Erro ao salvar formulário');
    } finally {
      setLoading(false);
    }
  };

  const openFormConfig = (form: { id: string; name: string }) => {
    // Disparar evento para abrir configurações do formulário
    window.dispatchEvent(new CustomEvent('open-form-config', { detail: { formId: form.id, formName: form.name } }));
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com botões */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Formulários de Leads</h3>
          <p className="text-sm text-muted-foreground">Gerencie os formulários de captura de leads</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setOpenAddLeadModal(true)}
            disabled={!baseFormId}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Lead
          </Button>
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Criar formulário
          </Button>
        </div>
      </div>

      {/* Modal de criação/edição */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <span></span>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar formulário' : 'Criar formulário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do formulário</Label>
              <Input 
                value={formName} 
                onChange={e => setFormName(e.target.value)} 
                placeholder="Ex.: Formulário Principal" 
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={saveForm} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Adicionar Lead */}
      <Dialog open={openAddLeadModal} onOpenChange={setOpenAddLeadModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Lead</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!baseFormId ? (
              <div className="text-center py-8 space-y-4">
                <div className="text-sm text-muted-foreground">Nenhum formulário base definido para esta empresa.</div>
                <Button variant="outline" onClick={() => setOpenAddLeadModal(false)}>
                  Fechar
                </Button>
              </div>
            ) : (
              <PublicForm 
                overrideFormId={baseFormId} 
                embedded 
                onSubmitted={async () => {
                  setOpenAddLeadModal(false);
                  await queryClient.invalidateQueries({ queryKey: ['leads-new', selectedCompanyId] });
                }} 
              />
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenAddLeadModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabela de formulários */}
      <div className="border rounded-lg">
        <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium text-muted-foreground border-b">
          <div className="col-span-10">Nome</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Carregando formulários...
          </div>
        ) : forms.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum formulário de leads cadastrado
          </div>
        ) : (
          forms.map((form) => (
            <div key={form.id} className="grid grid-cols-12 gap-4 p-3 text-sm border-b last:border-b-0 hover:bg-muted/50 transition-colors">
              <div 
                className="col-span-10 cursor-pointer flex items-center justify-between"
                onClick={() => openFormConfig(form)}
              >
                <span className="font-medium">{form.name}</span>
                <span className="text-xs text-muted-foreground">Clique para configurar</span>
              </div>
              <div className="col-span-2 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => deleteForm(form.id)} disabled={loading}>
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
