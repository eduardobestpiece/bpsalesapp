
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
import { FullScreenModal } from '@/components/ui/FullScreenModal';

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
  const [funnelTouched, setFunnelTouched] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [customPeriod, setCustomPeriod] = useState({ start: '', end: '', month: '', year: '' });
  const hasPeriodSelection = !!(customPeriod.start || customPeriod.end || customPeriod.month || customPeriod.year);

  const { data: funnels = [] } = useFunnels(selectedCompanyId);
  const { data: teams = [] } = useTeams();
  const { data: users = [] } = useCrmUsers();

  // Funis permitidos para o usuário atual
  const allowedFunnels = (() => {
    if (!crmUser) return funnels;
    const isUser = crmUser.role === 'user';
    const isLeader = crmUser.role === 'leader';
    if ((isUser || isLeader) && Array.isArray(crmUser.funnels) && crmUser.funnels.length > 0) {
      return funnels.filter(f => crmUser.funnels!.includes(f.id));
    }
    return funnels;
  })();

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

  // 1. Selecionar automaticamente o primeiro funil disponível ao abrir a página e aplicar o filtro
  useEffect(() => {
    if (allowedFunnels.length > 0 && !selectedFunnel) {
      setSelectedFunnel(allowedFunnels[0].id);
      // Aplicar filtro automaticamente ao selecionar o primeiro funil
      onFiltersChange({
        funnelId: allowedFunnels[0].id,
        teamId: undefined,
        userId: undefined,
        period: 'custom',
        ...customPeriod
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedFunnels]);

  // Função para saber se é admin/master/submaster
  const isAdmin = crmUser?.role === 'admin' || crmUser?.role === 'master' || crmUser?.role === 'submaster';
  const isLeader = crmUser?.role === 'leader';
  const isUser = crmUser?.role === 'user';

  // Equipes que o líder gerencia
  const leaderTeams = isLeader ? teams.filter(team => team.leader_id === crmUser?.id) : [];

  // Seleção automática da equipe para líder
  useEffect(() => {
    if (isLeader && leaderTeams.length === 1 && selectedTeam !== leaderTeams[0].id) {
      setSelectedTeam(leaderTeams[0].id);
    }
  }, [isLeader, leaderTeams, selectedTeam]);

  // Resetar usuário selecionado quando o time mudar
  useEffect(() => {
    setSelectedUser('');
  }, [selectedTeam]);

  // Usuários disponíveis para o filtro
  const availableUsers = () => {
    if (isAdmin) {
      return users.filter(user => user.company_id === selectedCompanyId);
    }
    if (isLeader) {
      // Usuários das equipes que lidera
      const teamIds = leaderTeams.map(t => t.id);
      return users.filter(user => teamIds.includes(user.team_id || ''));
    }
    return [];
  };

  // Equipes disponíveis para o filtro
  const availableTeams = () => {
    if (isAdmin) {
      return teams;
    }
    if (isLeader) {
      return leaderTeams;
    }
    return [];
  };

  // Filtro de usuários baseado no time selecionado e permissões do usuário
  const getUserOptions = () => {
    let filteredUsers = [];
    
    if (isAdmin) {
      // Admin/master/submaster: todos os usuários da empresa
      filteredUsers = users.filter(user => user.company_id === selectedCompanyId);
    } else if (isLeader) {
      // Líder: usuários das equipes que lidera + ele mesmo
      const teamsLed = leaderTeams;
      const teamMemberIds = teamsLed.flatMap(t => users.filter(u => u.team_id === t.id).map(u => u.id));
      const uniqueUserIds = Array.from(new Set([...teamMemberIds, crmUser?.id]));
      filteredUsers = users.filter(u => uniqueUserIds.includes(u.id));
    } else {
      // Usuário comum: só ele mesmo
      filteredUsers = users.filter(u => u.id === crmUser?.id);
    }
    
    // Filtrar por time selecionado (se houver)
    if (selectedTeam && selectedTeam !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.team_id === selectedTeam);
    }
    
    // Filtrar usuários que não têm nome (primeiro nome ou sobrenome vazios)
    return filteredUsers.filter(user => 
      user.first_name && user.first_name.trim() !== '' && 
      user.last_name && user.last_name.trim() !== ''
    );
  };

  // Atualizar handleApplyFilters para tratar 'all' como seleção vazia
  const handleApplyFilters = () => {
    if (!selectedFunnel) {
      onFiltersChange(null);
      return;
    }
    onFiltersChange({
      funnelId: selectedFunnel,
      teamId: selectedTeam && selectedTeam !== 'all' ? selectedTeam : undefined,
      userId: selectedUser || undefined,
      period: 'custom',
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
            <Select value={selectedFunnel} onValueChange={(val) => { setSelectedFunnel(val); setFunnelTouched(true); }}>
              <SelectTrigger className="brand-radius select-trigger-brand field-secondary-focus no-ring-focus" style={{ borderColor: funnelTouched ? 'var(--brand-secondary)' : undefined }}>
                <SelectValue placeholder="Selecione o funil" />
              </SelectTrigger>
              <SelectContent>
                {allowedFunnels.map(funnel => (
                  <SelectItem key={funnel.id} value={funnel.id} className="dropdown-item-brand">
                    {funnel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Equipe: só para admin, master, submaster e líder */}
          { (isAdmin || isLeader) && (
            <div>
              <Label htmlFor="team">Equipe</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="brand-radius select-trigger-brand field-secondary-focus no-ring-focus" style={{ borderColor: selectedTeam ? 'var(--brand-secondary)' : undefined }}>
                  <SelectValue placeholder="Selecione a equipe" />
                </SelectTrigger>
                <SelectContent>
                  {/* Opção "Todas as equipes" só aparece se o usuário tem acesso a mais de uma equipe */}
                  {availableTeams().length > 1 && (
                    <SelectItem value="all" className="dropdown-item-brand">
                      Todas as equipes
                    </SelectItem>
                  )}
                  {availableTeams().map(team => (
                    <SelectItem key={team.id} value={team.id} className="dropdown-item-brand">
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filtro de Usuário: só para admin, master, submaster e líder */}
          { (isAdmin || isLeader) && (
            <div>
              <Label htmlFor="user">Usuário</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="brand-radius select-trigger-brand field-secondary-focus no-ring-focus" style={{ borderColor: selectedUser ? 'var(--brand-secondary)' : undefined }}>
                  <SelectValue placeholder="Selecione o usuário" />
                </SelectTrigger>
                <SelectContent>
                  {/* Opção "Todos os usuários" baseada no contexto */}
                  {getUserOptions().length > 1 && (
                    <SelectItem value="all" className="dropdown-item-brand">
                      <div className="flex items-center justify-between w-full">
                        <span>Todos os usuários</span>
                        <span className="text-muted-foreground text-xs ml-2">
                          ({selectedTeam && selectedTeam !== 'all' ? 'do time selecionado' : 'do funil'})
                        </span>
                      </div>
                    </SelectItem>
                  )}
                  {getUserOptions().map(user => (
                    <SelectItem key={user.id} value={user.id} className="dropdown-item-brand">
                      <div className="flex items-center justify-between w-full">
                        <span>{user.first_name} {user.last_name}</span>
                        <span className="text-muted-foreground text-xs ml-2">
                          ({user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User'})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Substituir select de período por ícone de calendário */}
          <div className="flex flex-col gap-1 mt-1">
            <Label>Período</Label>
            <Button
              id="period"
              name="period"
              variant="outline"
              type="button"
              onClick={() => setShowPeriodModal(true)}
              className="w-full h-10 text-sm flex items-center gap-2 brand-radius field-secondary-focus no-ring-focus hover:bg-[var(--brand-secondary)] active:bg-[var(--brand-secondary)] focus:bg-[var(--brand-secondary)]"
              style={{ borderColor: (hasPeriodSelection || showPeriodModal) ? 'var(--brand-secondary)' : undefined, backgroundColor: showPeriodModal ? 'var(--brand-secondary)' : undefined }}
            >
              <Calendar className="w-4 h-4" />
              <span>Selecionar período</span>
            </Button>
          </div>
        </div>

        {/* Opção de comparação */}

        <div className="flex justify-end">
          <Button 
            onClick={handleApplyFilters}
            disabled={!selectedFunnel || selectedFunnel === ''}
            className="brand-radius"
            variant="brandPrimaryToSecondary"
          >
            Aplicar Filtros
          </Button>
        </div>

        {/* Modal customizado de período */}
        <FullScreenModal
          isOpen={showPeriodModal}
          onClose={() => setShowPeriodModal(false)}
          title="Selecionar Período"
          actions={
            <>
              <Button type="button" variant="outline" className="brand-radius" onClick={() => setCustomPeriod({ start: '', end: '', month: '', year: '' })}>
                Limpar
              </Button>
              <Button type="button" className="brand-radius" variant="brandPrimaryToSecondary" onClick={() => setShowPeriodModal(false)}>
                Confirmar
              </Button>
            </>
          }
        >
          <form className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="startDate">Data início</label>
              <input type="date" id="startDate" name="startDate" value={customPeriod.start} onChange={e => setCustomPeriod(p => ({ ...p, start: e.target.value }))} className="border border-input bg-background text-foreground rounded px-2 py-1 brand-radius field-secondary-focus no-ring-focus" />
              <label htmlFor="endDate">Data fim</label>
              <input type="date" id="endDate" name="endDate" value={customPeriod.end} onChange={e => setCustomPeriod(p => ({ ...p, end: e.target.value }))} className="border border-input bg-background text-foreground rounded px-2 py-1 brand-radius field-secondary-focus no-ring-focus" />
              <label htmlFor="monthSelect">Mês</label>
              <select id="monthSelect" name="monthSelect" value={customPeriod.month} onChange={e => setCustomPeriod(p => ({ ...p, month: e.target.value }))} className="border border-input bg-background text-foreground rounded px-2 py-1 brand-radius field-secondary-focus no-ring-focus">
                <option value="">Todos</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                ))}
              </select>
              <label htmlFor="yearSelect">Ano</label>
              <select id="yearSelect" name="yearSelect" value={customPeriod.year} onChange={e => setCustomPeriod(p => ({ ...p, year: e.target.value }))} className="border border-input bg-background text-foreground rounded px-2 py-1 brand-radius field-secondary-focus no-ring-focus">
                <option value="">Todos</option>
                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </form>
        </FullScreenModal>
      </CardContent>
    </Card>
  );
};
