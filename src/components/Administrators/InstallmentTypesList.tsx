
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InstallmentTypeModal } from './InstallmentTypeModal';
import { Input } from '@/components/ui/input';

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

  // Modal de duplicação
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateData, setDuplicateData] = useState<any>(null);

  // Modal de criação
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      {/* Botão de criação de tipos de parcelas */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Tipos de Parcela</h2>
          <p className="text-gray-600 mt-1">Gerencie os tipos de parcela</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-gradient-primary text-white"
          onClick={() => setShowCreateModal(true)}
        >
          + Adicionar Tipo de Parcela
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mt-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar tipos de parcela..."
            value={searchTerm}
            onChange={e => {/* implementar filtro se necessário */}}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={v => {/* implementar filtro se necessário */}}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="archived">Arquivados</SelectItem>
          </SelectContent>
        </Select>
      </div>
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
      {showDuplicateModal && (
        <InstallmentTypeModal
          open={showDuplicateModal}
          onOpenChange={setShowDuplicateModal}
          installmentType={duplicateData}
          onSuccess={() => {
            setShowDuplicateModal(false);
            setDuplicateData(null);
            refetch();
          }}
        />
      )}
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Administradora</TableHead>
            <TableHead>Nº de parcelas</TableHead>
            <TableHead>Taxa de administração (%)</TableHead>
            <TableHead>Fundo de reserva (%)</TableHead>
            <TableHead>Seguro (%)</TableHead>
            <TableHead>Seguro opcional</TableHead>
            <TableHead>Parcela reduzida</TableHead>
            <TableHead>Ações</TableHead>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDuplicateData({ ...installmentType, administrator_id: '' });
                      setShowDuplicateModal(true);
                    }}
                    disabled={installmentType.is_archived}
                  >
                    Duplicar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
