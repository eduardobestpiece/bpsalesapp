
import React, { useState } from 'react';
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
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const { userRole } = useCrmAuth();
  const isSubMaster = userRole === 'submaster';
  const isMaster = userRole === 'master';
  const canCopy = isMaster || isSubMaster;
  const { selectedCompanyId } = useCompany();

  // Modal de cópia
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [originCompanyId, setOriginCompanyId] = useState<string>('');
  const [copyLoading, setCopyLoading] = useState(false);

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

      if (selectedAdministrator && selectedAdministrator !== 'all') {
        query = query.eq('administrator_id', selectedAdministrator);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  // Buscar empresas para seleção
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: canCopy,
  });

  // Função de cópia de tipos de parcelas
  const handleCopyInstallmentTypes = async () => {
    if (!originCompanyId || !selectedCompanyId) {
      toast({
        title: 'Selecione a empresa de origem e destino.',
        variant: 'destructive',
      });
      return;
    }
    setCopyLoading(true);
    try {
      // Buscar tipos de parcelas da empresa de origem
      const { data: typesToCopy, error } = await supabase
        .from('installment_types')
        .select('*')
        .eq('company_id', originCompanyId)
        .eq('is_archived', false);
      if (error) throw error;
      if (!typesToCopy || typesToCopy.length === 0) {
        toast({
          title: 'Nenhum tipo de parcela encontrado na empresa de origem.',
          variant: 'destructive',
        });
        setCopyLoading(false);
        return;
      }
      // Remover campos que não devem ser copiados
      const typesInsert = typesToCopy.map((type: any) => {
        const { id, created_at, updated_at, ...rest } = type;
        return { ...rest, company_id: selectedCompanyId };
      });
      // Inserir na empresa de destino
      const { error: insertError } = await supabase
        .from('installment_types')
        .insert(typesInsert);
      if (insertError) throw insertError;
      toast({
        title: 'Tipos de parcelas copiados com sucesso!',
      });
      setCopyModalOpen(false);
      refetch();
    } catch (err: any) {
      console.error('Erro ao copiar tipos de parcelas:', err);
      toast({
        title: 'Erro ao copiar tipos de parcelas: ' + (err.message || ''),
        variant: 'destructive',
      });
    } finally {
      setCopyLoading(false);
    }
  };

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
      {/* Botão de cópia de tipos de parcelas */}
      {canCopy && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setCopyModalOpen(true)}>
            Copiar tipos de parcelas de outra empresa
          </Button>
        </div>
      )}
      {/* Modal de cópia */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Copiar tipos de parcelas de outra empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Empresa de origem</label>
              <Select value={originCompanyId} onValueChange={setOriginCompanyId} disabled={companiesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={companiesLoading ? 'Carregando...' : 'Selecione a empresa'} />
                </SelectTrigger>
                <SelectContent>
                  {companies
                    .filter((c: any) => c.id !== selectedCompanyId)
                    .map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCopyInstallmentTypes} disabled={!originCompanyId || copyLoading}>
              {copyLoading ? 'Copiando...' : 'Copiar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
