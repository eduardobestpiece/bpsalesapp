
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
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const effectiveCompanyId = selectedCompanyId || companyId;
  const { data: users = [] } = useCrmUsers();
  const filteredUsers = users.filter(u => u.company_id === effectiveCompanyId);
  const availableMembers = filteredUsers.filter(u => u.id !== formData.leader_id && u.first_name && u.last_name);
  const createTeamMutation = useCreateTeam();
  const updateTeamMutation = useUpdateTeam();

  const allUsers = users;

  const [members, setMembers] = useState<string[]>([]);

  useEffect(() => {
    console.log('[TEAM/MODAL] open:', { isOpen, teamId: team?.id, effectiveCompanyId });
  }, [isOpen]);

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        leader_id: team.leader_id,
      });
      (async () => {
        console.log('[TEAM/MODAL] load members start', { effectiveCompanyId, teamId: team.id });
        const { data: allUsersDb, error } = await supabase
          .from('crm_users')
          .select('id, team_id, email, role')
          .eq('company_id', effectiveCompanyId);
        console.log('[TEAM/MODAL] load members result', { count: allUsersDb?.length, error, sample: (allUsersDb||[]).slice(0,5) });
        const memberIds = (allUsersDb || []).filter(u => u.team_id === team.id).map(u => u.id);
        console.log('[TEAM/MODAL] current memberIds', memberIds);
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
      console.log('[TEAM/MODAL] submit start', { teamId: team?.id, formData, selectedMembers: members, effectiveCompanyId });
      let teamId = team?.id;
      if (team) {
        const payload = {
          id: team.id,
          name: formData.name.trim(),
          leader_id: formData.leader_id,
          company_id: effectiveCompanyId,
          status: 'active'
        } as any;
        console.log('[TEAM/MODAL] updateTeam payload', payload);
        const { data: updTeamData, error: updTeamErr, status: updTeamStatus } = await supabase
          .from('teams')
          .update({
            name: payload.name,
            leader_id: payload.leader_id,
            company_id: payload.company_id,
            status: payload.status,
          })
          .eq('id', team.id);
        console.log('[TEAM/MODAL] updateTeam direct result', { status: updTeamStatus, error: updTeamErr, data: updTeamData });
        if (updTeamErr) throw updTeamErr;
        teamId = team.id;
      } else {
        const payload = {
          name: formData.name.trim(),
          leader_id: formData.leader_id,
          company_id: effectiveCompanyId,
          status: 'active'
        } as any;
        console.log('[TEAM/MODAL] createTeam payload', payload);
        const result = await createTeamMutation.mutateAsync(payload);
        console.log('[TEAM/MODAL] createTeam result', result);
        teamId = result?.id;
      }

      let refreshedMemberIds: string[] = [];
      if (teamId) {
        console.log('[TEAM/MODAL] update members start', { teamId, effectiveCompanyId });
        const { data: allUsersDb, error: allUsersErr } = await supabase
          .from('crm_users')
          .select('id, team_id, email')
          .eq('company_id', effectiveCompanyId);
        console.log('[TEAM/MODAL] load all users for company', { count: allUsersDb?.length, error: allUsersErr, sample: (allUsersDb||[]).slice(0,5) });

        const allUserIds = (allUsersDb || []).map(u => u.id);
        const selectedUserIds = members;
        console.log('[TEAM/MODAL] selectedUserIds', selectedUserIds);

        if (selectedUserIds.length > 0) {
          const { data: updSelData, error: updSelErr } = await supabase
            .from('crm_users')
            .update({ team_id: teamId })
            .in('id', selectedUserIds)
            .select('id, team_id');
          console.log('[TEAM/MODAL] set team_id for selected', { count: updSelData?.length, error: updSelErr, data: updSelData });
          if (updSelErr) throw updSelErr;
        }

        const toRemove = allUserIds.filter(uid => !selectedUserIds.includes(uid) && allUsersDb?.find(u => u.id === uid)?.team_id === teamId);
        console.log('[TEAM/MODAL] toRemove', toRemove);
        if (toRemove.length > 0) {
          const { data: updRemData, error: updRemErr } = await supabase
            .from('crm_users')
            .update({ team_id: null })
            .in('id', toRemove)
            .select('id, team_id');
          console.log('[TEAM/MODAL] unset team_id for removed', { count: updRemData?.length, error: updRemErr, data: updRemData });
          if (updRemErr) throw updRemErr;
        }

        const { data: refreshedUsers, error: refreshErr } = await supabase
          .from('crm_users')
          .select('id, team_id, email')
          .eq('company_id', effectiveCompanyId);
        refreshedMemberIds = (refreshedUsers || []).filter(u => u.team_id === teamId).map(u => u.id);
        console.log('[TEAM/MODAL] refreshed members', { count: refreshedMemberIds.length, error: refreshErr, refreshedMemberIds, sample: (refreshedUsers||[]).slice(0,5) });
        setMembers(refreshedMemberIds);
      }

      // Invalida caches para refletir na lista
      queryClient.invalidateQueries({ queryKey: ['crm-users', effectiveCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['teams', selectedCompanyId] });

      toast.success(`${team ? 'Time atualizado' : 'Time criado'} com sucesso! (${refreshedMemberIds.length} membro(s))`);
      onClose();
      setFormData({ name: '', leader_id: '' });
      setMembers([]);
    } catch (error: any) {
      console.log('[TEAM/MODAL] submit error', error);
      toast.error(error.message || 'Erro ao salvar time');
    } finally {
      setIsLoading(false);
      console.log('[TEAM/MODAL] submit end');
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
              onChange={(vals) => { console.log('[TEAM/MODAL] members change', vals); setMembers(vals); }}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4"></div>
        </form>
    </FullScreenModal>
  );
};
