
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Archive, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Administrator {
  id: string;
  name: string;
  credit_update_type: string;
  update_month: number;
  grace_period_days: number;
  max_embedded_percentage: number;
  special_entry_type: string;
  is_archived: boolean;
  created_at: string;
}

interface AdministratorsListProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'archived';
  onEdit: (admin: Administrator) => void;
}

export const AdministratorsList: React.FC<AdministratorsListProps> = ({
  searchTerm,
  statusFilter,
  onEdit
}) => {
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdministrators = async () => {
    try {
      let query = supabase
        .from('administrators')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('is_archived', statusFilter === 'archived');
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAdministrators(data || []);
    } catch (error) {
      console.error('Error fetching administrators:', error);
      toast.error('Erro ao carregar administradoras');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string, isArchived: boolean) => {
    try {
      const { error } = await supabase
        .from('administrators')
        .update({ is_archived: !isArchived })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Administradora ${isArchived ? 'restaurada' : 'arquivada'} com sucesso!`);
      fetchAdministrators();
    } catch (error) {
      console.error('Error archiving administrator:', error);
      toast.error('Erro ao arquivar administradora');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta administradora?')) return;
    
    try {
      const { error } = await supabase
        .from('administrators')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Administradora excluída com sucesso!');
      fetchAdministrators();
    } catch (error) {
      console.error('Error deleting administrator:', error);
      toast.error('Erro ao excluir administradora');
    }
  };

  useEffect(() => {
    fetchAdministrators();
  }, [searchTerm, statusFilter]);

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo de Atualização</TableHead>
            <TableHead>Mês de Atualização</TableHead>
            <TableHead>% Máx. Embutido</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {administrators.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell className="font-medium">{admin.name}</TableCell>
              <TableCell>
                <Badge variant={admin.credit_update_type === 'monthly' ? 'default' : 'secondary'}>
                  {admin.credit_update_type === 'monthly' ? 'Mensal' : 'Anual'}
                </Badge>
              </TableCell>
              <TableCell>{admin.update_month || '-'}</TableCell>
              <TableCell>{admin.max_embedded_percentage ? `${admin.max_embedded_percentage}%` : '-'}</TableCell>
              <TableCell>
                <Badge variant={admin.is_archived ? 'destructive' : 'default'}>
                  {admin.is_archived ? 'Arquivado' : 'Ativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(admin)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchive(admin.id, admin.is_archived)}
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(admin.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {administrators.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhuma administradora encontrada
        </div>
      )}
    </div>
  );
};
