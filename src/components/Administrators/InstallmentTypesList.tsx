
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit, Archive, RotateCcw, Search } from 'lucide-react';
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
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InstallmentTypeModal } from './InstallmentTypeModal';
import { Input } from '@/components/ui/input';

interface InstallmentTypesListProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'archived';
  selectedAdministrator: string;
  onEdit: (installmentType: any) => void;
  canEdit?: boolean;
  canCreate?: boolean;
  canArchive?: boolean;
}

export const InstallmentTypesList: React.FC<InstallmentTypesListProps> = ({
  searchTerm,
  statusFilter,
  selectedAdministrator,
  onEdit,
  canEdit = true,
  canCreate = true,
  canArchive = true
}) => {
  const { toast } = useToast();
  const { userRole } = useCrmAuth();
  const isSubMaster = userRole === 'submaster';
  const isMaster = userRole === 'master';
  const { selectedCompanyId } = useCompany();

  // Removidos: cópia e duplicação
  // Modal de criação
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);



  const { data: installmentTypes, isLoading, refetch } = useQuery({
    queryKey: ['installment-types', searchTerm, statusFilter, selectedAdministrator],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      let query = supabase
        .from('installment_types')
        .select(`
          *,
          administrators (
            name
          )
        `)
        .order('name')
        .eq('company_id', selectedCompanyId);

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (statusFilter === 'active') {
        query = query.eq('is_archived', false);
      } else if (statusFilter === 'archived') {
        query = query.eq('is_archived', true);
      }

      if (selectedAdministrator && selectedAdministrator !== 'all') {
        query = query.eq('administrator_id', selectedAdministrator);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  // Removido: busca de empresas para cópia

  const [reductionsMap, setReductionsMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchReductionsMap = async () => {
      const { data, error } = await supabase
        .from('installment_type_reductions')
        .select('installment_type_id');
      if (!error && data) {
        const map: Record<string, boolean> = {};
        data.forEach((rel: any) => {
          map[rel.installment_type_id] = true;
        });
        setReductionsMap(map);
      }
    };
    fetchReductionsMap();
  }, [installmentTypes]);

  // Removido: função de cópia

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

  // Função para buscar reduction_ids ao editar
  const handleEdit = async (installmentType: any) => {
    // Buscar reduction_ids associados
    const { data: rels, error } = await supabase
      .from('installment_type_reductions')
      .select('installment_reduction_id')
      .eq('installment_type_id', installmentType.id);
    let reduction_ids: string[] = [];
    if (!error && rels) {
      reduction_ids = rels.map((r: any) => r.installment_reduction_id);
    }
    setEditData({ ...installmentType, reduction_ids });
    setEditModalOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando tipos de parcela...</div>;
  }

  // Removido: bloco separado do botão de adicionar

  if (!installmentTypes?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="flex justify-center mb-4">
          <Button
            variant="brandPrimaryToSecondary"
            onClick={() => setShowCreateModal(true)}
          >
            + Adicionar Tipo de Parcela
          </Button>
        </div>
        Nenhum tipo de parcela encontrado.
        {showCreateModal && (
          <InstallmentTypeModal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            installmentType={null}
            onSuccess={() => {
              setShowCreateModal(false);
              refetch();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Título e botão agora são controlados pelo SettingsSimulator */}
      {showCreateModal && (
        <InstallmentTypeModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          installmentType={null}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}
      {/* Modal de edição */}
      {editModalOpen && (
        <InstallmentTypeModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          installmentType={editData}
          onSuccess={() => {
            setEditModalOpen(false);
            setEditData(null);
            refetch();
          }}
        />
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Administradora</TableHead>
            <TableHead className="text-left">Nº de parcelas</TableHead>
            <TableHead className="text-left">Taxa de administração (%)</TableHead>
            <TableHead className="text-left">Fundo de reserva (%)</TableHead>
            <TableHead className="text-left">Seguro (%)</TableHead>
            <TableHead className="text-left">Seguro opcional</TableHead>
            <TableHead className="text-left">Parcela reduzida</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installmentTypes.map((installmentType) => (
            <TableRow key={installmentType.id}>
              <TableCell>{installmentType.administrators?.name}</TableCell>
              <TableCell>{installmentType.installment_count}</TableCell>
              <TableCell>{installmentType.admin_tax_percent ?? '-'}</TableCell>
              <TableCell>{installmentType.reserve_fund_percent ?? '-'}</TableCell>
              <TableCell>{installmentType.insurance_percent ?? '-'}</TableCell>
              <TableCell>{installmentType.optional_insurance ? 'Sim' : 'Não'}</TableCell>
              <TableCell>{reductionsMap[installmentType.id] ? 'Sim' : 'Não'}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  {canEdit && (
                    <Button
                      variant="brandOutlineSecondaryHover"
                      size="sm"
                      onClick={() => handleEdit(installmentType)}
                      className="brand-radius"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {canArchive && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="brandOutlineSecondaryHover"
                          size="sm"
                          className="brand-radius"
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
                            {installmentType.is_archived ? 'Reativar' : 'Arquivar'} Parcela
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja {installmentType.is_archived ? 'reativar' : 'arquivar'} a parcela?
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
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
