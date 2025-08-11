
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, User, Search } from 'lucide-react';
import { useCrmUsers } from '@/hooks/useCrmData';
import { UserModal } from './UserModal';
import { useUpdateCrmUser } from '@/hooks/useCrmUsers';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

export const UsersList = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: users = [], isLoading } = useCrmUsers();
  const updateUserMutation = useUpdateCrmUser();
  const { userRole, crmUser } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const isSubMaster = userRole === 'submaster';

  const handleEdit = (user: any) => {
    // Buscar o usuário atualizado da lista pelo ID
    const freshUser = users.find((u) => u.id === user.id) || user;
    setSelectedUser(freshUser);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleDeactivate = async (userId: string) => {
    try {
      await updateUserMutation.mutateAsync({ id: userId, status: 'archived' });
      toast.success('Usuário desativado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao desativar usuário');
    }
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

  // Filtrar usuários por empresa e ocultar master para todos exceto ele mesmo
  const filteredUsers = users.filter(user => {
    // Ocultar master para todos, exceto se o usuário logado for master
    if (user.role === 'master' && user.id !== crmUser?.id) {
      return false;
    }
    // Se master, mostrar apenas usuários da empresa selecionada
    if (userRole === 'master') {
      return user.company_id === selectedCompanyId;
    }
    // Se não for master, mostrar apenas usuários da empresa do usuário logado
    return user.company_id === crmUser?.company_id;
  }).filter(user => {
    // Filtro de busca
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return fullName.includes(searchLower) ||
           user.email?.toLowerCase().includes(searchLower) ||
           user.phone?.toLowerCase().includes(searchLower);
  });

  if (isLoading) {
    return <div className="text-center py-4">Carregando usuários...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Gerencie os usuários da empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <Input
              placeholder="Buscar usuário..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-xs field-secondary-focus no-ring-focus brand-radius"
              disabled={isSubMaster}
            />
            <Button onClick={() => setShowModal(true)} disabled={isSubMaster} variant="brandPrimaryToSecondary" className="brand-radius">
              <Plus className="w-4 h-4 mr-2" /> Novo Usuário
            </Button>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <div>Carregando...</div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between border rounded p-3 brand-radius">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5" style={{ color: 'var(--brand-primary, #A86F57)' }} />
                    <span className="font-medium">{user.first_name} {user.last_name}</span>
                    <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="brandOutlineSecondaryHover"
                      size="sm"
                      onClick={() => handleEdit(user)}
                      disabled={isSubMaster}
                      className="brand-radius"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {(userRole === 'admin' || userRole === 'master') && user.status === 'active' && user.role !== 'master' && user.email !== 'master@master.com' && (
                      <Button
                        variant="brandOutlineSecondaryHover"
                        size="sm"
                        onClick={() => handleDeactivate(user.id)}
                        disabled={isSubMaster}
                        className="brand-radius"
                      >
                        Desativar
                      </Button>
                    )}
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
        user={selectedUser}
      />
    </>
  );
};
