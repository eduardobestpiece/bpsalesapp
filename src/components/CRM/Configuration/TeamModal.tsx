
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multiselect';
import { useCreateTeam, useUpdateTeam } from '@/hooks/useTeams';
import { useCrmUsers } from '@/hooks/useCrmUsers';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team?: any;
}

export const TeamModal = ({ isOpen, onClose, team }: TeamModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    leader_id: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const { companyId } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const { data: users = [] } = useCrmUsers();
  // Filtrar usuários pela empresa selecionada
  const filteredUsers = users.filter(u => u.company_id === (selectedCompanyId || companyId));
  // Se um líder for escolhido, removê-lo da lista de membros
  const availableMembers = filteredUsers.filter(u => u.id !== formData.leader_id && u.first_name && u.last_name);
  const createTeamMutation = useCreateTeam();
  const updateTeamMutation = useUpdateTeam();

  // Todos os usuários da empresa
  const allUsers = users;

  // Estado para membros do time (apenas na edição)
  const [members, setMembers] = useState<string[]>([]);

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        leader_id: team.leader_id,
      });
      // Buscar todos os usuários da empresa e filtrar os que pertencem ao time
      (async () => {
        const { data: allUsersDb } = await supabase
          .from('crm_users')
          .select('id, team_id')
          .eq('company_id', companyId);
        // Corrigir: garantir que todos os usuários com team_id igual ao do time estejam marcados
        const memberIds = (allUsersDb || []).filter(u => u.team_id === team.id).map(u => u.id);
        console.log('[TeamModal] Membros carregados do banco:', memberIds);
        setMembers(memberIds);
      })();
    } else {
      setFormData({
        name: '',
        leader_id: '',
      });
      setMembers([]);
    }
  }, [team, companyId]);

  // Corrigir: garantir que todos os membros estejam nas opções do MultiSelect
  const allAvailableMembers = [
    ...availableMembers,
    ...users.filter(u => members.includes(u.id) && !availableMembers.some(a => a.id === u.id))
  ];
  console.log('[TeamModal] users recebidos:', users.map(u => ({id: u.id, nome: u.first_name + ' ' + u.last_name, team_id: u.team_id})));
  console.log('[TeamModal] allAvailableMembers:', allAvailableMembers.map(u => u.id));
  console.log('[TeamModal] members selecionados:', members);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome do time é obrigatório');
      return;
    }

    if (!formData.leader_id) {
      toast.error('Líder do time é obrigatório');
      return;
    }

    if (!companyId) {
      toast.error('Erro: Empresa não identificada');
      return;
    }

    setIsLoading(true);

    try {
      let teamId = team?.id;
      if (team) {
        // Editar time existente (NÃO enviar user_ids)
        await updateTeamMutation.mutateAsync({
          id: team.id,
          name: formData.name.trim(),
          leader_id: formData.leader_id,
          company_id: selectedCompanyId || companyId,
          status: 'active'
        });
        teamId = team.id;
      } else {
        // Criar novo time (NÃO enviar user_ids)
        const result = await createTeamMutation.mutateAsync({
          name: formData.name.trim(),
          leader_id: formData.leader_id,
          company_id: selectedCompanyId || companyId,
          status: 'active'
        });
        teamId = result?.id;
      }

      // Atualizar membros do time: setar team_id nos usuários selecionados, remover dos não selecionados
      if (teamId) {
        // Buscar todos usuários da empresa
        const { data: allUsersDb } = await supabase
          .from('crm_users')
          .select('id, team_id')
          .eq('company_id', companyId);
        const allUserIds = (allUsersDb || []).map(u => u.id);
        // Usuários que devem estar no time
        const selectedUserIds = members;
        // Atualizar: setar team_id = teamId nos selecionados
        if (selectedUserIds.length > 0) {
          await supabase
            .from('crm_users')
            .update({ team_id: teamId })
            .in('id', selectedUserIds);
        }
        // Remover: setar team_id = null nos que não estão mais no time
        const toRemove = allUserIds.filter(uid => !selectedUserIds.includes(uid) && allUsersDb.find(u => u.id === uid)?.team_id === teamId);
        if (toRemove.length > 0) {
          await supabase
            .from('crm_users')
            .update({ team_id: null })
            .in('id', toRemove);
        }
      }

      toast.success(team ? 'Time atualizado com sucesso!' : 'Time criado com sucesso!');
      onClose();
      setFormData({ name: '', leader_id: '' });
      setMembers([]);
    } catch (error: any) {
      console.error('Erro ao salvar time:', error);
      toast.error(error.message || 'Erro ao salvar time');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {team ? 'Editar Time' : 'Novo Time'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Time *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Equipe Vendas"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="leader">Líder do Time *</Label>
            <Select
              value={formData.leader_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, leader_id: value }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o líder" />
              </SelectTrigger>
              <SelectContent>
                {filteredUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campo de membros do time (sempre visível na edição e criação) */}
          <div>
            <Label htmlFor="members">Usuários do Time</Label>
            <MultiSelect
              key={team?.id + '-' + members.join(',')}
              options={allAvailableMembers.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name} (${u.role})` }))}
              value={members}
              onChange={setMembers}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (team ? 'Atualizar' : 'Criar Time')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
