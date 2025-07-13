import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Archive, RotateCcw, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { UserModal } from './UserModal';

interface UsersListProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'archived';
  companyId: string;
  onEdit: (user: any) => void;
  refreshKey: number;
}

export const UsersList = ({ searchTerm, statusFilter, companyId, onEdit, refreshKey }: UsersListProps) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['crm_users', companyId, searchTerm, statusFilter, refreshKey],
    queryFn: async () => {
      let query = supabase
        .from('crm_users')
        .select('*')
        .eq('company_id', companyId);

      if (statusFilter === 'active') {
        query = query.eq('status', 'active');
      } else if (statusFilter === 'archived') {
        query = query.eq('status', 'archived');
      }

      const { data, error } = await query
        .ilike('first_name', `%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId
  });

  const handleArchive = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'archived' : 'active';
      const { error } = await supabase
        .from('crm_users')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Usuário ${newStatus === 'active' ? 'reativado' : 'arquivado'} com sucesso!`);
      refetch();
    } catch (error: any) {
      toast.error('Erro ao alterar status: ' + error.message);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando usuários...</div>;
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum usuário encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div key={user.id} className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{user.first_name} {user.last_name}</h3>
                <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                  {user.status === 'active' ? 'Ativo' : 'Arquivado'}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Email:</span> {user.email}
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedUser(user);
                  setShowModal(true);
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleArchive(user.id, user.status)}
              >
                {user.status === 'active' ? (
                  <Archive className="w-4 h-4" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
      
      <UserModal
        open={showModal}
        onOpenChange={setShowModal}
        user={selectedUser}
        onSuccess={() => {
          setShowModal(false);
          setSelectedUser(null);
          refetch();
        }}
      />
    </div>
  );
};
