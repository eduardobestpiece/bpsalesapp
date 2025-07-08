
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Archive, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BidType {
  id: string;
  name: string;
  administrator_id: string;
  percentage: number;
  allows_embedded: boolean;
  is_loyalty: boolean;
  loyalty_months: number;
  is_default: boolean;
  is_archived: boolean;
  administrators?: {
    name: string;
  };
}

interface BidTypesListProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'archived';
  selectedAdministrator: string;
  onEdit: (bidType: BidType) => void;
}

export const BidTypesList: React.FC<BidTypesListProps> = ({
  searchTerm,
  statusFilter,
  selectedAdministrator,
  onEdit
}) => {
  const [bidTypes, setBidTypes] = useState<BidType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBidTypes = async () => {
    try {
      let query = supabase
        .from('bid_types')
        .select(`
          *,
          administrators (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('is_archived', statusFilter === 'archived');
      }

      if (selectedAdministrator && selectedAdministrator !== 'all') {
        query = query.eq('administrator_id', selectedAdministrator);
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBidTypes(data || []);
    } catch (error) {
      console.error('Error fetching bid types:', error);
      toast.error('Erro ao carregar tipos de lance');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string, isArchived: boolean) => {
    try {
      const { error } = await supabase
        .from('bid_types')
        .update({ is_archived: !isArchived })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Tipo de lance ${isArchived ? 'restaurado' : 'arquivado'} com sucesso!`);
      fetchBidTypes();
    } catch (error) {
      console.error('Error archiving bid type:', error);
      toast.error('Erro ao arquivar tipo de lance');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de lance?')) return;
    
    try {
      const { error } = await supabase
        .from('bid_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Tipo de lance excluído com sucesso!');
      fetchBidTypes();
    } catch (error) {
      console.error('Error deleting bid type:', error);
      toast.error('Erro ao excluir tipo de lance');
    }
  };

  useEffect(() => {
    fetchBidTypes();
  }, [searchTerm, statusFilter, selectedAdministrator]);

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Administradora</TableHead>
            <TableHead>Percentual</TableHead>
            <TableHead>Configurações</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bidTypes.map((bidType) => (
            <TableRow key={bidType.id}>
              <TableCell className="font-medium">{bidType.name}</TableCell>
              <TableCell>{bidType.administrators?.name}</TableCell>
              <TableCell>{bidType.percentage ? `${bidType.percentage}%` : '-'}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {bidType.allows_embedded && (
                    <Badge variant="secondary" className="text-xs">Embutido</Badge>
                  )}
                  {bidType.is_loyalty && (
                    <Badge variant="secondary" className="text-xs">Fidelidade</Badge>
                  )}
                  {bidType.is_default && (
                    <Badge variant="default" className="text-xs">Padrão</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={bidType.is_archived ? 'destructive' : 'default'}>
                  {bidType.is_archived ? 'Arquivado' : 'Ativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(bidType)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchive(bidType.id, bidType.is_archived)}
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(bidType.id)}
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

      {bidTypes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum tipo de lance encontrado
        </div>
      )}
    </div>
  );
};
