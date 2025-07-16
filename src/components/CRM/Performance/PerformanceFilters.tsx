import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useFunnels } from '@/hooks/useFunnels';
import { useTeams } from '@/hooks/useTeams';
import { useCrmUsers } from '@/hooks/useCrmUsers';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MultiSelect } from '@/components/ui/multiselect';

interface PerformanceFiltersProps {
  onFiltersChange: (filters: {
    funnelId: string | string[];
    teamId?: string | string[];
    userId?: string | string[];
    period: 'day' | 'week' | 'month' | 'custom';
    start?: string;
    end?: string;
    month?: string | string[];
    year?: string | string[];
    compareId?: string;
  } | null) => void;
  funnelOnly?: boolean;
}

export const PerformanceFilters = ({ onFiltersChange, funnelOnly }: PerformanceFiltersProps) => {
  const { crmUser } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const [selectedFunnels, setSelectedFunnels] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [customPeriod, setCustomPeriod] = useState({ 
    start: '', 
    end: '', 
    months: [] as string[], 
    years: [] as string[] 
  });
  const [selectedPeriodLabel, setSelectedPeriodLabel] = useState('');

  const { data: funnels = [] } = useFunnels(selectedCompanyId);
  const { data: teams = [] } = useTeams();
  const { data: users = [] } = useCrmUsers();

  // Seleção automática do primeiro funil permitido
  useEffect(() => {
    if (funnels.length > 0 && selectedFunnels.length === 0) {
      setSelectedFunnels([funnels[0].id]);
    }
  }, [funnels, selectedFunnels.length]);

  // Resetar funil selecionado ao trocar de empresa
  useEffect(() => {
    setSelectedFunnels([]);
  }, [selectedCompanyId]);

  // Aplicar filtro automaticamente ao selecionar o primeiro funil
  useEffect(() => {
    if (funnels.length > 0 && selectedFunnels.length > 0) {
      handleApplyFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funnels]);

  // Função para saber se é admin/master/submaster
  const isAdmin = crmUser?.role === 'admin' || crmUser?.role === 'master' || crmUser?.role === 'submaster';
  const isLeader = crmUser?.role === 'leader';
  const isUser = crmUser?.role === 'user';

  // Equipes que o líder gerencia
  const leaderTeams = isLeader ? teams.filter(team => team.leader_id === crmUser?.id) : [];

  // Seleção automática da equipe para líder
  useEffect(() => {
    if (isLeader && leaderTeams.length === 1 && selectedTeams.length === 0) {
      setSelectedTeams([leaderTeams[0].id]);
    }
  }, [isLeader, leaderTeams, selectedTeams.length]);

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

  // Filtro de usuários para líderes: incluir o próprio líder além dos membros das equipes
  const getUserOptions = () => {
    if (isAdmin) {
      // Admin/master/submaster: todos os usuários da empresa
      return users.filter(user => user.company_id === selectedCompanyId);
    }
    if (isLeader) {
      // Líder: membros das equipes que lidera + ele mesmo
      const teamsLed = leaderTeams;
      const teamMemberIds = teamsLed.flatMap(t => users.filter(u => u.team_id === t.id).map(u => u.id));
      const uniqueUserIds = Array.from(new Set([...teamMemberIds, crmUser?.id]));
      return users.filter(u => uniqueUserIds.includes(u.id));
    }
    // Usuário comum: só ele mesmo
    return users.filter(u => u.id === crmUser?.id);
  };

  // Função para formatar o período selecionado
  const formatSelectedPeriod = () => {
    const parts = [];
    
    if (customPeriod.start && customPeriod.end) {
      const startDate = new Date(customPeriod.start);
      const endDate = new Date(customPeriod.end);
      parts.push(`${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`);
    }
    
    if (customPeriod.months.length > 0) {
      const monthNames = customPeriod.months.map(m => {
        const monthIndex = parseInt(m) - 1;
        return new Date(2000, monthIndex, 1).toLocaleString('pt-BR', { month: 'long' });
      });
      parts.push(`Mês: ${monthNames.join(', ')}`);
    }
    
    if (customPeriod.years.length > 0) {
      parts.push(`Ano: ${customPeriod.years.join(', ')}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'Período não selecionado';
  };

  // Atualizar o label do período quando o customPeriod mudar
  useEffect(() => {
    setSelectedPeriodLabel(formatSelectedPeriod());
  }, [customPeriod]);

  // Função para aplicar os filtros
  const handleApplyFilters = () => {
    if (selectedFunnels.length === 0) {
      onFiltersChange(null);
      return;
    }
    
    onFiltersChange({
      funnelId: selectedFunnels.length === 1 ? selectedFunnels[0] : selectedFunnels,
      teamId: selectedTeams.length > 0 ? selectedTeams : undefined,
      userId: selectedUsers.length > 0 ? selectedUsers : undefined,
      period: 'custom',
      start: customPeriod.start || undefined,
      end: customPeriod.end || undefined,
      month: customPeriod.months.length > 0 ? customPeriod.months : undefined,
      year: customPeriod.years.length > 0 ? customPeriod.years : undefined
    });
  };

  // Função para confirmar o período selecionado
  const handleConfirmPeriod = () => {
    setShowPeriodModal(false);
    handleApplyFilters();
  };

  // Função para limpar o período
  const handleClearPeriod = () => {
    setCustomPeriod({ 
      start: '', 
      end: '', 
      months: [], 
      years: [] 
    });
  };

  // Converter funnels para o formato esperado pelo MultiSelect
  const funnelOptions = funnels.map(funnel => ({
    value: funnel.id,
    label: funnel.name
  }));

  // Converter teams para o formato esperado pelo MultiSelect
  const teamOptions = availableTeams().map(team => ({
    value: team.id,
    label: team.name
  }));

  // Converter users para o formato esperado pelo MultiSelect
  const userOptions = getUserOptions().map(user => ({
    value: user.id,
    label: `${user.first_name} ${user.last_name}`
  }));

  // Opções de meses para o MultiSelect
  const monthOptions = [...Array(12)].map((_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' })
  }));

  // Opções de anos para o MultiSelect
  const yearOptions = Array.from({length: 5}, (_, i) => {
    const year = new Date().getFullYear() - i;
    return {
      value: year.toString(),
      label: year.toString()
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros de Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="funnel">Funil *</Label>
            <MultiSelect
              options={[
                { value: 'all', label: 'Todos' },
                ...funnelOptions
              ]}
              value={selectedFunnels}
              onChange={setSelectedFunnels}
              placeholder="Selecione o(s) funil(is)"
            />
          </div>

          {/* Filtro de Equipe: só para admin, master, submaster e líder */}
          {!funnelOnly && (isAdmin || isLeader) && (
            <div>
              <Label htmlFor="team">Equipe</Label>
              <MultiSelect
                options={[
                  { value: 'all', label: 'Todas' },
                  ...teamOptions
                ]}
                value={selectedTeams}
                onChange={setSelectedTeams}
                placeholder="Selecione a(s) equipe(s)"
              />
            </div>
          )}

          {/* Filtro de Usuário: só para admin, master, submaster e líder */}
          {!funnelOnly && (isAdmin || isLeader) && (
            <div>
              <Label htmlFor="user">Usuário</Label>
              <MultiSelect
                options={[
                  { value: 'all', label: 'Todos' },
                  ...userOptions
                ]}
                value={selectedUsers}
                onChange={setSelectedUsers}
                placeholder="Selecione o(s) usuário(s)"
              />
            </div>
          )}

          {/* Botão de período com exibição do período selecionado */}
          <div className="flex flex-col gap-1">
            <Label>Período</Label>
            <div className="flex items-center gap-2">
              <Button 
                id="period" 
                name="period" 
                variant="outline" 
                type="button" 
                onClick={() => setShowPeriodModal(true)} 
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Selecionar período</span>
              </Button>
            </div>
            {selectedPeriodLabel && (
              <div className="text-xs text-muted-foreground mt-1 break-words">
                {selectedPeriodLabel}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleApplyFilters}
            disabled={selectedFunnels.length === 0}
          >
            Aplicar Filtros
          </Button>
        </div>

        {/* Modal customizado de período com multiseleção */}
        <Dialog open={showPeriodModal} onOpenChange={setShowPeriodModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Selecionar Período</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="startDate">Data início</Label>
                  <Input 
                    type="date" 
                    id="startDate" 
                    name="startDate" 
                    value={customPeriod.start} 
                    onChange={e => setCustomPeriod(p => ({ ...p, start: e.target.value }))} 
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate">Data fim</Label>
                  <Input 
                    type="date" 
                    id="endDate" 
                    name="endDate" 
                    value={customPeriod.end} 
                    onChange={e => setCustomPeriod(p => ({ ...p, end: e.target.value }))} 
                  />
                </div>
                
                <div>
                  <Label htmlFor="monthSelect">Mês</Label>
                  <MultiSelect
                    options={monthOptions}
                    value={customPeriod.months}
                    onChange={(values) => setCustomPeriod(p => ({ ...p, months: values }))}
                    placeholder="Selecione o(s) mês(es)"
                  />
                </div>
                
                <div>
                  <Label htmlFor="yearSelect">Ano</Label>
                  <MultiSelect
                    options={yearOptions}
                    value={customPeriod.years}
                    onChange={(values) => setCustomPeriod(p => ({ ...p, years: values }))}
                    placeholder="Selecione o(s) ano(s)"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={handleClearPeriod}>
                  Limpar
                </Button>
                <Button type="button" onClick={handleConfirmPeriod}>
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