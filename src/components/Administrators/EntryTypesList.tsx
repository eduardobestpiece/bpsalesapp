
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit, Archive, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EntryTypesListProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'archived';
  selectedAdministrator: string;
  onEdit: (entryType: any) => void;
}

export const EntryTypesList: React.FC<EntryTypesListProps> = ({
  searchTerm,
  statusFilter,
  selectedAdministrator,
  onEdit,
}) => {
  const { toast } = useToast();

  const { data: entryTypes, isLoading, refetch } = useQuery({
    queryKey: ['entry-types', searchTerm, statusFilter, selectedAdministrator],
    queryFn: async () => {
      let query = supabase
        .from('entry_types')
        .select(`
          *,
          administrators (
            name
          )
        `)
        .order('name');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (statusFilter === 'active') {
        query = query.eq('is_archived', false);
      } else if (statusFilter === 'archived') {
        query = query.eq('is_archived', true);
      }

      if (selectedAdministrator !== 'all') {
        query = query.eq('administrator_id', selectedAdministrator);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  const handleArchiveToggle = async (entryType: any) => {
    try {
      const { error } = await supabase
        .from('entry_types')
        .update({ 
          is_archived: !entryType.is_archived,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryType.id);

      if (error) throw error;

      toast({
        title: entryType.is_archived ? 'Tipo de entrada reativado!' : 'Tipo de entrada arquivado!',
      });

      refetch();
    } catch (error) {
      console.error('Erro ao arquivar/reativar tipo de entrada:', error);
      toast({
        title: 'Erro ao atualizar tipo de entrada',
        variant: 'destructive',
      });
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'PERCENTUAL' ? 'Percentual' : 'Valor Fixo';
  };

  const formatValue = (entryType: any) => {
    if (entryType.type === 'PERCENTUAL') {
      return `${entryType.percentage}%`;
    } else {
      return `R$ ${entryType.fixed_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando tipos de entrada...</div>;
  }

  if (!entryTypes?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum tipo de entrada encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Administradora</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Parcelas</TableHead>
            <TableHead>Opcional</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entryTypes.map((entryType) => (
            <TableRow key={entryType.id}>
              <TableCell className="font-medium">{entryType.name}</TableCell>
              <TableCell>{entryType.administrators?.name}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {getTypeLabel(entryType.type)}
                </Badge>
              </TableCell>
              <TableCell>{formatValue(entryType)}</TableCell>
              <TableCell>{entryType.installment_months}x</TableCell>
              <TableCell>
                <Badge variant={entryType.is_optional ? 'secondary' : 'default'}>
                  {entryType.is_optional ? 'Sim' : 'Não'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={entryType.is_archived ? 'secondary' : 'default'}>
                  {entryType.is_archived ? 'Arquivado' : 'Ativo'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(entryType)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={entryType.is_archived ? 'text-green-600' : 'text-red-600'}
                      >
                        {entryType.is_archived ? (
                          <RotateCcw className="w-4 h-4" />
                        ) : (
                          <Archive className="w-4 h-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {entryType.is_archived ? 'Reativar' : 'Arquivar'} Tipo de Entrada
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja {entryType.is_archived ? 'reativar' : 'arquivar'} o tipo de entrada "{entryType.name}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleArchiveToggle(entryType)}
                        >
                          {entryType.is_archived ? 'Reativar' : 'Arquivar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
