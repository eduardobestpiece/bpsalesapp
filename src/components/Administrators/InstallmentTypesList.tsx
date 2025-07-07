
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

interface InstallmentTypesListProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'archived';
  selectedAdministrator: string;
  onEdit: (installmentType: any) => void;
}

export const InstallmentTypesList: React.FC<InstallmentTypesListProps> = ({
  searchTerm,
  statusFilter,
  selectedAdministrator,
  onEdit,
}) => {
  const { toast } = useToast();

  const { data: installmentTypes, isLoading, refetch } = useQuery({
    queryKey: ['installment-types', searchTerm, statusFilter, selectedAdministrator],
    queryFn: async () => {
      let query = supabase
        .from('installment_types')
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

  const handleArchiveToggle = async (installmentType: any) => {
    try {
      const { error } = await supabase
        .from('installment_types')
        .update({ 
          is_archived: !installmentType.is_archived,
          updated_at: new Date().toISOString()
        })
        .eq('id', installmentType.id);

      if (error) throw error;

      toast({
        title: installmentType.is_archived ? 'Tipo de parcela reativado!' : 'Tipo de parcela arquivado!',
      });

      refetch();
    } catch (error) {
      console.error('Erro ao arquivar/reativar tipo de parcela:', error);
      toast({
        title: 'Erro ao atualizar tipo de parcela',
        variant: 'destructive',
      });
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'MEIA' ? 'Meia Parcela' : 'Parcela Reduzida';
  };

  const getReducedComponents = (installmentType: any) => {
    const components = [];
    if (installmentType.reduces_credit) components.push('Crédito');
    if (installmentType.reduces_admin_tax) components.push('Taxa Admin');
    if (installmentType.reduces_insurance) components.push('Seguro');
    if (installmentType.reduces_reserve_fund) components.push('Fundo Reserva');
    return components.join(', ') || 'Nenhum';
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando tipos de parcela...</div>;
  }

  if (!installmentTypes?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum tipo de parcela encontrado.
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
            <TableHead>Redução (%)</TableHead>
            <TableHead>Componentes Reduzidos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installmentTypes.map((installmentType) => (
            <TableRow key={installmentType.id}>
              <TableCell className="font-medium">{installmentType.name}</TableCell>
              <TableCell>{installmentType.administrators?.name}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {getTypeLabel(installmentType.type)}
                </Badge>
              </TableCell>
              <TableCell>{installmentType.reduction_percentage}%</TableCell>
              <TableCell className="text-sm">
                {getReducedComponents(installmentType)}
              </TableCell>
              <TableCell>
                <Badge variant={installmentType.is_archived ? 'secondary' : 'default'}>
                  {installmentType.is_archived ? 'Arquivado' : 'Ativo'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(installmentType)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={installmentType.is_archived ? 'text-green-600' : 'text-red-600'}
                      >
                        {installmentType.is_archived ? (
                          <RotateCcw className="w-4 h-4" />
                        ) : (
                          <Archive className="w-4 h-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {installmentType.is_archived ? 'Reativar' : 'Arquivar'} Tipo de Parcela
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja {installmentType.is_archived ? 'reativar' : 'arquivar'} o tipo de parcela "{installmentType.name}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleArchiveToggle(installmentType)}
                        >
                          {installmentType.is_archived ? 'Reativar' : 'Arquivar'}
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
