import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, User } from 'lucide-react';
import { useCrmUsers } from '@/hooks/useCrmData';
import { UserModal } from './UserModal';

interface UsersListProps {
  companyId: string;
}

export const UsersList = ({ companyId }: UsersListProps) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { data: users = [], isLoading } = useCrmUsers();

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      master: 'Master',
      admin: 'Administrador',
      leader: 'Líder',
      user: 'Usuário'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'master':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'leader':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Carregando usuários...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>
                Gerencie os usuários da empresa
              </CardDescription>
            </div>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum usuário encontrado.
              </p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">
                          {user.first_name} {user.last_name}
                        </h3>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status === 'active' ? 'Ativo' : 'Arquivado'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
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

      <UserModal
        isOpen={showModal}
        onClose={handleCloseModal}
        companyId={companyId}
        user={selectedUser}
      />
    </>
  );
};
