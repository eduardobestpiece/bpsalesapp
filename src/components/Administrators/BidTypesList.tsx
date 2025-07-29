
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Archive, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const { userRole } = useCrmAuth();
  const isSubMaster = userRole === 'submaster';
  const isMaster = userRole === 'master';
  const canCopy = isMaster || isSubMaster;
  const { selectedCompanyId } = useCompany();

  // Modal de cópia
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [originCompanyId, setOriginCompanyId] = useState<string>('');
  const [copyLoading, setCopyLoading] = useState(false);

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

  // Função de cópia de tipos de lances
  const handleCopyBidTypes = async () => {
    if (!originCompanyId || !selectedCompanyId) {
      toast.error('Selecione a empresa de origem e destino.');
      return;
    }
    setCopyLoading(true);
    try {
      // Buscar tipos de lances da empresa de origem
      const { data: bidTypesToCopy, error } = await supabase
        .from('bid_types')
        .select('*')
        .eq('company_id', originCompanyId)
        .eq('is_archived', false);
      if (error) throw error;
      if (!bidTypesToCopy || bidTypesToCopy.length === 0) {
        toast.error('Nenhum tipo de lance encontrado na empresa de origem.');
        setCopyLoading(false);
        return;
      }
      // Remover campos que não devem ser copiados
      const bidTypesInsert = bidTypesToCopy.map((type: any) => {
        const { id, created_at, updated_at, ...rest } = type;
        return { ...rest, company_id: selectedCompanyId };
      });
      // Inserir na empresa de destino
      const { error: insertError } = await supabase
        .from('bid_types')
        .insert(bidTypesInsert);
      if (insertError) throw insertError;
      toast.success('Tipos de lances copiados com sucesso!');
      setCopyModalOpen(false);
      fetchBidTypes();
    } catch (err: any) {
      toast.error('Erro ao copiar tipos de lances: ' + (err.message || ''));
    } finally {
      setCopyLoading(false);
    }
  };

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
      {/* Botão de cópia de tipos de lances */}
      {canCopy && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setCopyModalOpen(true)}>
            Copiar tipos de lances de outra empresa
          </Button>
        </div>
      )}
      {/* Modal de cópia */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Copiar tipos de lances de outra empresa</DialogTitle>
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
            <Button onClick={handleCopyBidTypes} disabled={!originCompanyId || copyLoading}>
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
                    disabled={isSubMaster}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchive(bidType.id, bidType.is_archived)}
                    disabled={isSubMaster}
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(bidType.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={isSubMaster}
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
