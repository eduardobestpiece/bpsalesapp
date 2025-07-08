import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Users } from 'lucide-react';
import { useCrmUsers } from '@/hooks/useCrmData';
import { TeamModal } from './TeamModal';

interface TeamsListProps {
  companyId: string;
}

export const TeamsList = ({ companyId }: TeamsListProps) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const { data: users = [], isLoading } = useCrmUsers();

  // Simular dados de times (já que não temos hook para times ainda)
  const teams = [
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'Equipe Vendas',
      leader_id: '550e8400-e29b-41d4-a716-446655440003',
      status: 'active'
    }
  ];

  const handleEdit = (team: any) => {
    setSelectedTeam(team);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTeam(null);
  };

  const getLeaderName = (leaderId: string) => {
    const leader = users.find(user => user.id === leaderId);
    return leader ? `${leader.first_name} ${leader.last_name}` : 'Líder não encontrado';
  };

  const getTeamMembersCount = (teamId: string) => {
    return users.filter(user => user.team_id === teamId).length;
  };

  if (isLoading) {
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
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">
                  Nenhum time encontrado. Crie o primeiro time para começar.
                </p>
              </div>
            ) : (
              teams.map((team) => (
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
        companyId={companyId}
        team={selectedTeam}
      />
    </>
  );
};
