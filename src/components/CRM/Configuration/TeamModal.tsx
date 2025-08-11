
import { useState, useEffect } from 'react';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
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
  const effectiveCompanyId = selectedCompanyId || companyId;
  const { data: users = [] } = useCrmUsers();
  const filteredUsers = users.filter(u => u.company_id === effectiveCompanyId);
  const availableMembers = filteredUsers.filter(u => u.id !== formData.leader_id && u.first_name && u.last_name);
  const createTeamMutation = useCreateTeam();
  const updateTeamMutation = useUpdateTeam();

  const allUsers = users;

  const [members, setMembers] = useState<string[]>([]);

  useEffect(() => {
    console.debug('[TEAM/MODAL] open:', { isOpen, teamId: team?.id, effectiveCompanyId });
  }, [isOpen]);

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        leader_id: team.leader_id,
      });
      (async () => {
        console.debug('[TEAM/MODAL] load members start', { effectiveCompanyId, teamId: team.id });
        const { data: allUsersDb, error } = await supabase
          .from('crm_users')
          .select('id, team_id, email, role')
          .eq('company_id', effectiveCompanyId);
        console.debug('[TEAM/MODAL] load members result', { count: allUsersDb?.length, error });
        const memberIds = (allUsersDb || []).filter(u => u.team_id === team.id).map(u => u.id);
        console.debug('[TEAM/MODAL] current memberIds', memberIds);
        setMembers(memberIds);
      })();
    } else {
      setFormData({ name: '', leader_id: '' });
      setMembers([]);
    }
  }, [team, effectiveCompanyId]);

  const allAvailableMembers = [
    ...availableMembers,
    ...users.filter(u => members.includes(u.id) && !availableMembers.some(a => a.id === u.id))
  ];

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
    if (!effectiveCompanyId) {
      toast.error('Erro: Empresa não identificada');
      return;
    }

    setIsLoading(true);

    try {
      console.debug('[TEAM/MODAL] submit start', { teamId: team?.id, formData, selectedMembers: members, effectiveCompanyId });
      let teamId = team?.id;
      if (team) {
        const payload = {
          id: team.id,
          name: formData.name.trim(),
          leader_id: formData.leader_id,
          company_id: effectiveCompanyId,
          status: 'active'
        } as any;
        console.debug('[TEAM/MODAL] updateTeam payload', payload);
        const result = await updateTeamMutation.mutateAsync(payload);
        console.debug('[TEAM/MODAL] updateTeam result', result);
        teamId = team.id;
      } else {
        const payload = {
          name: formData.name.trim(),
          leader_id: formData.leader_id,
          company_id: effectiveCompanyId,
          status: 'active'
        } as any;
        console.debug('[TEAM/MODAL] createTeam payload', payload);
        const result = await createTeamMutation.mutateAsync(payload);
        console.debug('[TEAM/MODAL] createTeam result', result);
        teamId = result?.id;
      }

      if (teamId) {
        console.debug('[TEAM/MODAL] update members start', { teamId, effectiveCompanyId });
        const { data: allUsersDb, error: allUsersErr } = await supabase
          .from('crm_users')
          .select('id, team_id, email')
          .eq('company_id', effectiveCompanyId);
        console.debug('[TEAM/MODAL] load all users for company', { count: allUsersDb?.length, error: allUsersErr });

        const allUserIds = (allUsersDb || []).map(u => u.id);
        const selectedUserIds = members;
        console.debug('[TEAM/MODAL] selectedUserIds', selectedUserIds);

        if (selectedUserIds.length > 0) {
          const { data: updSelData, error: updSelErr } = await supabase
            .from('crm_users')
            .update({ team_id: teamId })
            .in('id', selectedUserIds)
            .select('id, team_id');
          console.debug('[TEAM/MODAL] set team_id for selected', { count: updSelData?.length, error: updSelErr });
        }

        const toRemove = allUserIds.filter(uid => !selectedUserIds.includes(uid) && allUsersDb?.find(u => u.id === uid)?.team_id === teamId);
        console.debug('[TEAM/MODAL] toRemove', toRemove);
        if (toRemove.length > 0) {
          const { data: updRemData, error: updRemErr } = await supabase
            .from('crm_users')
            .update({ team_id: null })
            .in('id', toRemove)
            .select('id, team_id');
          console.debug('[TEAM/MODAL] unset team_id for removed', { count: updRemData?.length, error: updRemErr });
        }

        const { data: refreshedUsers, error: refreshErr } = await supabase
          .from('crm_users')
          .select('id, team_id, email')
          .eq('company_id', effectiveCompanyId);
        const refreshedMemberIds = (refreshedUsers || []).filter(u => u.team_id === teamId).map(u => u.id);
        console.debug('[TEAM/MODAL] refreshed members', { count: refreshedMemberIds.length, error: refreshErr, refreshedMemberIds });
        setMembers(refreshedMemberIds);
      }

      toast.success(team ? 'Time atualizado com sucesso!' : 'Time criado com sucesso!');
      onClose();
      setFormData({ name: '', leader_id: '' });
      setMembers([]);
    } catch (error: any) {
      console.error('[TEAM/MODAL] submit error', error);
      toast.error(error.message || 'Erro ao salvar time');
    } finally {
      setIsLoading(false);
      console.debug('[TEAM/MODAL] submit end');
    }
  };

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={team ? 'Editar Time' : 'Novo Time'}
      actions={<Button type="submit" form="team-form" variant="brandPrimaryToSecondary" className="brand-radius">{isLoading ? 'Salvando...' : (team ? 'Atualizar' : 'Criar')}</Button>}
    >
        <form id="team-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Time *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Equipe Vendas"
              required
              disabled={isLoading}
              className="campo-brand brand-radius"
            />
          </div>

          <div>
            <Label htmlFor="leader">Líder do Time *</Label>
            <Select
              value={formData.leader_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, leader_id: value }))}
              disabled={isLoading}
            >
              <SelectTrigger className="select-trigger-brand brand-radius">
                <SelectValue placeholder="Selecione o líder" />
              </SelectTrigger>
              <SelectContent>
                {filteredUsers.map(user => (
                  <SelectItem key={user.id} value={user.id} className="dropdown-item-brand">
                    {user.first_name} {user.last_name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="members">Usuários do Time</Label>
            <MultiSelect
              key={team?.id + '-' + members.join(',')}
              options={allAvailableMembers.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name} (${u.role})` }))}
              value={members}
              onChange={(vals) => { console.debug('[TEAM/MODAL] members change', vals); setMembers(vals); }}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4"></div>
        </form>
    </FullScreenModal>
  );
};
