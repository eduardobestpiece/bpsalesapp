import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Loader2, Plus, Users } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// Interfaces
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface DistributionUser {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  number_weight: number;
  percentage_weight: number;
}

interface Form {
  id: string;
  name: string;
}

// Componente para gerenciar distribuição de leads
export function DistributionManager() {
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();
  
  // Estados
  const [forms, setForms] = useState<Form[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [distributionUsers, setDistributionUsers] = useState<DistributionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newUserNumber, setNewUserNumber] = useState<number>(1);
  const [newUserPercentage, setNewUserPercentage] = useState<number>(0);

  // Carregar formulários
  const loadForms = async () => {
    if (!selectedCompanyId) return;
    
    try {
      const { data, error } = await supabase
        .from('lead_forms')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .order('name');

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Erro ao carregar formulários:', error);
      toast.error('Erro ao carregar formulários');
    }
  };

  // Carregar usuários da empresa
  const loadUsers = async () => {
    if (!selectedCompanyId) return;
    
    try {
      const { data, error } = await supabase
        .from('crm_users')
        .select('id, first_name, last_name, email')
        .eq('company_id', selectedCompanyId)
        .order('first_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    }
  };

  // Carregar distribuição do formulário selecionado
  const loadDistribution = async (formId: string) => {
    if (!formId) return;
    
    try {
      // Buscar ou criar configuração de distribuição
      let { data: distribution, error: distError } = await supabase
        .from('lead_form_distributions')
        .select('id')
        .eq('lead_form_id', formId)
        .eq('company_id', selectedCompanyId)
        .single();

      if (distError && distError.code !== 'PGRST116') {
        throw distError;
      }

      // Se não existe, criar
      if (!distribution) {
        const { data: newDistribution, error: createError } = await supabase
          .from('lead_form_distributions')
          .insert({
            lead_form_id: formId,
            company_id: selectedCompanyId,
            is_active: true
          })
          .select('id')
          .single();

        if (createError) throw createError;
        distribution = newDistribution;
      }

      // Carregar usuários da distribuição
      const { data: distUsers, error: usersError } = await supabase
        .from('lead_form_distribution_users')
        .select(`
          id,
          user_id,
          number_weight,
          percentage_weight,
          crm_users!inner (
            first_name,
            last_name,
            email
          )
        `)
        .eq('distribution_id', distribution.id)
        .order('created_at');

      if (usersError) throw usersError;

      // Mapear dados
      const mappedUsers: DistributionUser[] = (distUsers || []).map((du: any) => ({
        id: du.id,
        user_id: du.user_id,
        user_name: `${du.crm_users.first_name} ${du.crm_users.last_name}`.trim(),
        user_email: du.crm_users.email,
        number_weight: du.number_weight,
        percentage_weight: du.percentage_weight
      }));

      setDistributionUsers(mappedUsers);
    } catch (error) {
      console.error('Erro ao carregar distribuição:', error);
      toast.error('Erro ao carregar distribuição');
    }
  };

  // Adicionar usuário à distribuição
  const addUserToDistribution = async () => {
    if (!selectedForm || !selectedUserId) {
      toast.error('Selecione um formulário e um usuário');
      return;
    }

    setLoading(true);
    try {
      // Buscar ID da distribuição
      const { data: distribution, error: distError } = await supabase
        .from('lead_form_distributions')
        .select('id')
        .eq('lead_form_id', selectedForm)
        .eq('company_id', selectedCompanyId)
        .single();

      if (distError) throw distError;

      // Calcular percentual baseado no número
      const totalNumber = distributionUsers.reduce((sum, user) => sum + user.number_weight, 0) + newUserNumber;
      const calculatedPercentage = totalNumber > 0 ? (newUserNumber / totalNumber) * 100 : 0;

      // Inserir usuário na distribuição
      const { error: insertError } = await supabase
        .from('lead_form_distribution_users')
        .insert({
          distribution_id: distribution.id,
          user_id: selectedUserId,
          number_weight: newUserNumber,
          percentage_weight: calculatedPercentage
        });

      if (insertError) throw insertError;

      // Recalcular todos os percentuais
      await recalculatePercentages(distribution.id);

      toast.success('Usuário adicionado à distribuição');
      setIsAddUserOpen(false);
      setSelectedUserId('');
      setNewUserNumber(1);
      setNewUserPercentage(0);
      
      // Recarregar distribuição
      await loadDistribution(selectedForm);
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      toast.error('Erro ao adicionar usuário');
    } finally {
      setLoading(false);
    }
  };

  // Remover usuário da distribuição
  const removeUserFromDistribution = async (userId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('lead_form_distribution_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Buscar ID da distribuição para recalcular
      const { data: distribution, error: distError } = await supabase
        .from('lead_form_distributions')
        .select('id')
        .eq('lead_form_id', selectedForm)
        .eq('company_id', selectedCompanyId)
        .single();

      if (distError) throw distError;

      // Recalcular percentuais
      await recalculatePercentages(distribution.id);

      toast.success('Usuário removido da distribuição');
      
      // Recarregar distribuição
      await loadDistribution(selectedForm);
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      toast.error('Erro ao remover usuário');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar peso numérico
  const updateNumberWeight = async (userId: string, newValue: number) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('lead_form_distribution_users')
        .update({ number_weight: newValue })
        .eq('id', userId);

      if (error) throw error;

      // Buscar ID da distribuição para recalcular
      const { data: distribution, error: distError } = await supabase
        .from('lead_form_distributions')
        .select('id')
        .eq('lead_form_id', selectedForm)
        .eq('company_id', selectedCompanyId)
        .single();

      if (distError) throw distError;

      // Recalcular percentuais
      await recalculatePercentages(distribution.id);

      // Recarregar distribuição
      await loadDistribution(selectedForm);
    } catch (error) {
      console.error('Erro ao atualizar peso:', error);
      toast.error('Erro ao atualizar peso');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar peso percentual
  const updatePercentageWeight = async (userId: string, newValue: number) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('lead_form_distribution_users')
        .update({ percentage_weight: newValue })
        .eq('id', userId);

      if (error) throw error;

      // Buscar ID da distribuição para recalcular
      const { data: distribution, error: distError } = await supabase
        .from('lead_form_distributions')
        .select('id')
        .eq('lead_form_id', selectedForm)
        .eq('company_id', selectedCompanyId)
        .single();

      if (distError) throw distError;

      // Recalcular números baseado no percentual
      await recalculateNumbers(distribution.id);

      // Recarregar distribuição
      await loadDistribution(selectedForm);
    } catch (error) {
      console.error('Erro ao atualizar percentual:', error);
      toast.error('Erro ao atualizar percentual');
    } finally {
      setLoading(false);
    }
  };

  // Recalcular percentuais baseado nos números
  const recalculatePercentages = async (distributionId: string) => {
    const { data: users, error } = await supabase
      .from('lead_form_distribution_users')
      .select('id, number_weight')
      .eq('distribution_id', distributionId);

    if (error) throw error;

    const totalNumber = users?.reduce((sum, user) => sum + user.number_weight, 0) || 0;

    if (totalNumber > 0) {
      for (const user of users || []) {
        const percentage = (user.number_weight / totalNumber) * 100;
        await supabase
          .from('lead_form_distribution_users')
          .update({ percentage_weight: percentage })
          .eq('id', user.id);
      }
    }
  };

  // Recalcular números baseado nos percentuais
  const recalculateNumbers = async (distributionId: string) => {
    const { data: users, error } = await supabase
      .from('lead_form_distribution_users')
      .select('id, percentage_weight')
      .eq('distribution_id', distributionId);

    if (error) throw error;

    const totalPercentage = users?.reduce((sum, user) => sum + user.percentage_weight, 0) || 0;

    if (totalPercentage > 0) {
      for (const user of users || []) {
        const number = Math.round((user.percentage_weight / totalPercentage) * 100);
        await supabase
          .from('lead_form_distribution_users')
          .update({ number_weight: number })
          .eq('id', user.id);
      }
    }
  };

  // Usuários disponíveis para adicionar (não estão na distribuição)
  const availableUsers = users.filter(user => 
    !distributionUsers.some(distUser => distUser.user_id === user.id)
  );

  // Calcular total de percentuais
  const totalPercentage = distributionUsers.reduce((sum, user) => sum + user.percentage_weight, 0);

  useEffect(() => {
    loadForms();
    loadUsers();
  }, [selectedCompanyId]);

  useEffect(() => {
    if (selectedForm) {
      loadDistribution(selectedForm);
    }
  }, [selectedForm]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Distribuição de Leads</h3>
        <p className="text-sm text-muted-foreground">
          Configure como os leads serão distribuídos entre os usuários da empresa
        </p>
      </div>

      {/* Seleção do formulário */}
      <div className="space-y-2">
        <Label htmlFor="form-select">Selecionar Formulário</Label>
        <Select value={selectedForm} onValueChange={setSelectedForm}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Escolha um formulário" />
          </SelectTrigger>
          <SelectContent>
            {forms.map((form) => (
              <SelectItem key={form.id} value={form.id}>
                {form.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedForm && (
        <div className="space-y-4">
          {/* Botão para adicionar usuário */}
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Usuários na Distribuição</h4>
              <p className="text-sm text-muted-foreground">
                Total: {totalPercentage.toFixed(2)}%
              </p>
            </div>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button disabled={availableUsers.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Usuário à Distribuição</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-select">Usuário</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {`${user.first_name} ${user.last_name}`.trim()} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number-weight">Peso Numérico</Label>
                    <Input
                      id="number-weight"
                      type="number"
                      min="1"
                      value={newUserNumber}
                      onChange={(e) => setNewUserNumber(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      O percentual será calculado automaticamente
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addUserToDistribution} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabela de distribuição */}
          {distributionUsers.length > 0 ? (
            <div className="border rounded-lg">
              <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium text-muted-foreground border-b">
                <div className="col-span-4">Usuário</div>
                <div className="col-span-2 text-center">Número</div>
                <div className="col-span-2 text-center">Percentual</div>
                <div className="col-span-4 text-right">Ações</div>
              </div>
              {distributionUsers.map((user) => (
                <div key={user.id} className="grid grid-cols-12 gap-4 p-3 text-sm border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                  <div className="col-span-4 flex items-center">
                    <div className="flex flex-col">
                      <span className="font-medium">{user.user_name}</span>
                      <span className="text-xs text-muted-foreground">{user.user_email}</span>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <Input
                      type="number"
                      min="1"
                      value={user.number_weight}
                      onChange={(e) => updateNumberWeight(user.id, Number(e.target.value))}
                      className="text-center"
                      disabled={loading}
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={user.percentage_weight.toFixed(2)}
                      onChange={(e) => updatePercentageWeight(user.id, Number(e.target.value))}
                      className="text-center"
                      disabled={loading}
                    />
                  </div>
                  <div className="col-span-4 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUserFromDistribution(user.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário adicionado à distribuição</p>
              <p className="text-sm">Clique em "Adicionar Usuário" para começar</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

