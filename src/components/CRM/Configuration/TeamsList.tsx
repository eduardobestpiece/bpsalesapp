
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Users, Search } from 'lucide-react';
import { useCrmUsers } from '@/hooks/useCrmData';
import { useTeams, useDeleteTeam } from '@/hooks/useTeams';
import { TeamModal } from './TeamModal';
import { toast } from 'sonner';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

export const TeamsList = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { companyId } = useCrmAuth();
  const { data: users = [], isLoading: usersLoading } = useCrmUsers();
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const deleteTeamMutation = useDeleteTeam();

  const handleEdit = (team: any) => {
    setSelectedTeam(team);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTeam(null);
  };

  const handleArchive = async (teamId: string) => {
    try {
      await deleteTeamMutation.mutateAsync(teamId);
      toast.success('Time arquivado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao arquivar time');
    }
  };

  const getLeaderName = (leaderId: string) => {
    const leader = users.find(user => user.id === leaderId);
    return leader ? `${leader.first_name} ${leader.last_name}` : 'Líder não encontrado';
  };

  const getTeamMembersCount = (teamId: string) => {
    return users.filter(user => user.team_id === teamId).length;
  };

  const filteredTeams = teams.filter(team => {
    const leaderName = getLeaderName(team.leader_id).toLowerCase();
    return team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           leaderName.includes(searchTerm.toLowerCase());
  });

  if (teamsLoading || usersLoading) {
    return <div className="text-center py-4">Carregando times...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Times</CardTitle>
              <CardDescription>
                Gerencie os times da empresa
              </CardDescription>
            </div>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Time
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Pesquisar por nome ou líder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTeams.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhum time encontrado com este termo.' : 'Nenhum time encontrado. Crie o primeiro time para começar.'}
                </p>
              </div>
            ) : (
              filteredTeams.map((team) => (
                <div
                  key={team.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{team.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Líder: {getLeaderName(team.leader_id)}
                      </p>
                    </div>
                    <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                      {team.status === 'active' ? 'Ativo' : 'Arquivado'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {getTeamMembersCount(team.id)} membros
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(team)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {team.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchive(team.id)}
                      >
                        Arquivar
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <TeamModal
        isOpen={showModal}
        onClose={handleCloseModal}
        team={selectedTeam}
      />
    </>
  );
};
