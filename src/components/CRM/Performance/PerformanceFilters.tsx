
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFunnels } from '@/hooks/useFunnels';
import { useTeams } from '@/hooks/useTeams';
import { useCrmUsers } from '@/hooks/useCrmUsers';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

interface PerformanceFiltersProps {
  onFiltersChange: (filters: {
    funnelId: string;
    teamId?: string;
    userId?: string;
    period: 'day' | 'week' | 'month';
  } | null) => void;
}

export const PerformanceFilters = ({ onFiltersChange }: PerformanceFiltersProps) => {
  const { crmUser, companyId, hasPermission } = useCrmAuth();
  const [selectedFunnel, setSelectedFunnel] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('month');

  const { data: funnels = [] } = useFunnels(companyId);
  const { data: teams = [] } = useTeams();
  const { data: users = [] } = useCrmUsers();

  const canSeeAllTeams = hasPermission('admin');
  const canSeeTeamUsers = hasPermission('leader');
  const isRegularUser = !canSeeAllTeams && !canSeeTeamUsers;
  const isUser = crmUser?.role === 'user';
  const allowedFunnels = isUser ? funnels.filter(f => crmUser.funnels?.includes(f.id)) : funnels;

  // Filter teams based on permissions
  const availableTeams = canSeeAllTeams 
    ? teams 
    : teams.filter(team => 
        canSeeTeamUsers && crmUser?.team_id === team.id
      );

  // Filter users based on permissions
  const availableUsers = () => {
    if (isRegularUser) {
      return users.filter(user => user.id === crmUser?.id);
    }
    if (canSeeTeamUsers && selectedTeam) {
      return users.filter(user => user.team_id === selectedTeam);
    }
    if (canSeeAllTeams) {
      return selectedTeam 
        ? users.filter(user => user.team_id === selectedTeam)
        : users;
    }
    return [];
  };

  const handleApplyFilters = () => {
    if (!selectedFunnel) {
      onFiltersChange(null);
      return;
    }

    onFiltersChange({
      funnelId: selectedFunnel,
      teamId: selectedTeam || undefined,
      userId: selectedUser || undefined,
      period: selectedPeriod
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros de Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="funnel">Funil *</Label>
            <Select value={selectedFunnel} onValueChange={setSelectedFunnel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o funil" />
              </SelectTrigger>
              <SelectContent>
                {allowedFunnels.map(funnel => (
                  <SelectItem key={funnel.id} value={funnel.id}>
                    {funnel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isRegularUser && (
            <div>
              <Label htmlFor="team">Equipe</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as equipes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as equipes</SelectItem>
                  {availableTeams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="user">Usuário</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder={isRegularUser ? "Você" : "Todos os usuários"} />
              </SelectTrigger>
              <SelectContent>
                {!isRegularUser && (
                  <SelectItem value="all">Todos os usuários</SelectItem>
                )}
                {availableUsers().map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="period">Período</Label>
            <Select value={selectedPeriod} onValueChange={(value: 'day' | 'week' | 'month') => setSelectedPeriod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Diário</SelectItem>
                <SelectItem value="week">Semanal</SelectItem>
                <SelectItem value="month">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleApplyFilters}
            disabled={!selectedFunnel}
          >
            Aplicar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
