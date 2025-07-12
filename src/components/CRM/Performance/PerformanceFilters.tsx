
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFunnels } from '@/hooks/useFunnels';
import { useTeams } from '@/hooks/useTeams';
import { useCrmUsers } from '@/hooks/useCrmUsers';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PerformanceFiltersProps {
  onFiltersChange: (filters: {
    funnelId: string;
    teamId?: string;
    userId?: string;
    period: 'day' | 'week' | 'month' | 'custom';
    start?: string;
    end?: string;
    month?: string;
    year?: string;
    compareId?: string;
  } | null) => void;
}

export const PerformanceFilters = ({ onFiltersChange }: PerformanceFiltersProps) => {
  const { crmUser, hasPermission } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const [selectedFunnel, setSelectedFunnel] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [customPeriod, setCustomPeriod] = useState({ start: '', end: '', month: '', year: '' });
  const [compareId, setCompareId] = useState('');

  const { data: funnels = [] } = useFunnels(selectedCompanyId);
  const { data: teams = [] } = useTeams();
  const { data: users = [] } = useCrmUsers();

  const canSeeAllTeams = hasPermission('admin');
  const canSeeTeamUsers = hasPermission('leader');
  const isRegularUser = !canSeeAllTeams && !canSeeTeamUsers;
  const isUser = crmUser?.role === 'user';
  const allowedFunnels = isUser ? funnels.filter(f => crmUser.funnels?.includes(f.id)) : funnels.filter(f => f.company_id === selectedCompanyId);

  // Seleção automática do primeiro funil permitido
  useEffect(() => {
    if (allowedFunnels.length > 0 && !selectedFunnel) {
      setSelectedFunnel(allowedFunnels[0].id);
    }
  }, [allowedFunnels]);

  // Resetar funil selecionado e allowedFunnels ao trocar de empresa
  useEffect(() => {
    setSelectedFunnel('');
  }, [selectedCompanyId]);

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
      compareId: compareId || undefined,
      period: 'custom', // novo tipo para indicar filtro customizado
      ...customPeriod
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

          {/* Substituir select de período por ícone de calendário */}
          <div className="flex flex-col gap-1">
            <Label>Período</Label>
            <Button variant="outline" type="button" onClick={() => setShowPeriodModal(true)} className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Selecionar período</span>
            </Button>
          </div>
        </div>

        {/* Opção de comparação */}
        {((canSeeAllTeams && selectedTeam && selectedTeam !== 'all') || (selectedUser && selectedUser !== 'all')) && (
          <div>
            <Label>Comparar com</Label>
            <Select value={compareId} onValueChange={setCompareId}>
              <SelectTrigger>
                <SelectValue placeholder={selectedTeam ? 'Selecione outro time' : 'Selecione outro usuário'} />
              </SelectTrigger>
              <SelectContent>
                {selectedTeam && selectedTeam !== 'all' && teams.filter(t => t.id !== selectedTeam).map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
                {selectedUser && selectedUser !== 'all' && users.filter(u => u.id !== selectedUser).map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.first_name} {user.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex justify-end">
          <Button 
            onClick={handleApplyFilters}
            disabled={!selectedFunnel}
          >
            Aplicar Filtros
          </Button>
        </div>

        {/* Modal customizado de período */}
        <Dialog open={showPeriodModal} onOpenChange={setShowPeriodModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Selecionar Período</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div className="flex flex-col gap-2">
                <label>Data início</label>
                <input type="date" value={customPeriod.start} onChange={e => setCustomPeriod(p => ({ ...p, start: e.target.value }))} className="border rounded px-2 py-1" />
                <label>Data fim</label>
                <input type="date" value={customPeriod.end} onChange={e => setCustomPeriod(p => ({ ...p, end: e.target.value }))} className="border rounded px-2 py-1" />
                <label>Mês</label>
                <select value={customPeriod.month} onChange={e => setCustomPeriod(p => ({ ...p, month: e.target.value }))} className="border rounded px-2 py-1">
                  <option value="">Todos</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                  ))}
                </select>
                <label>Ano</label>
                <select value={customPeriod.year} onChange={e => setCustomPeriod(p => ({ ...p, year: e.target.value }))} className="border rounded px-2 py-1">
                  <option value="">Todos</option>
                  {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setCustomPeriod({ start: '', end: '', month: '', year: '' })}>
                  Limpar
                </Button>
                <Button type="button" onClick={() => setShowPeriodModal(false)}>
                  Confirmar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
