
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
import { Radio } from '@/components/ui/radio-group';

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
  is_default: boolean;
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

  const [defaultAdminId, setDefaultAdminId] = useState<string | null>(null);

  // Função de cópia de administradoras
  const handleCopyAdministrators = async () => {
    if (!originCompanyId || !selectedCompanyId) {
      toast.error('Selecione a empresa de origem e destino.');
      return;
    }
    setCopyLoading(true);
    try {
      // Buscar administradoras da empresa de origem
      const { data: adminsToCopy, error } = await supabase
        .from('administrators')
        .select('*')
        .eq('company_id', originCompanyId)
        .eq('is_archived', false);
      if (error) throw error;
      if (!adminsToCopy || adminsToCopy.length === 0) {
        toast.error('Nenhuma administradora encontrada na empresa de origem.');
        setCopyLoading(false);
        return;
      }
      // Remover campos que não devem ser copiados
      const adminsInsert = adminsToCopy.map((admin: any) => {
        const { id, created_at, updated_at, ...rest } = admin;
        return { ...rest, company_id: selectedCompanyId };
      });
      // Inserir na empresa de destino
      const { error: insertError } = await supabase
        .from('administrators')
        .insert(adminsInsert);
      if (insertError) throw insertError;
      toast.success('Administradoras copiadas com sucesso!');
      setCopyModalOpen(false);
      fetchAdministrators();
    } catch (err: any) {
      console.error('Erro ao copiar administradoras:', err);
      toast.error('Erro ao copiar administradoras: ' + (err.message || ''));
    } finally {
      setCopyLoading(false);
    }
  };

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

  const handleSetDefault = async (id: string) => {
    try {
      // Desmarcar todas e marcar só a selecionada
      const { error } = await supabase.rpc('set_default_administrator', { admin_id: id, company_id: selectedCompanyId });
      if (error) throw error;
      setDefaultAdminId(id);
      fetchAdministrators();
      toast.success('Administradora padrão atualizada!');
    } catch (error) {
      toast.error('Erro ao definir administradora padrão');
    }
  };

  useEffect(() => {
    fetchAdministrators();
  }, [searchTerm, statusFilter]);

  // Buscar qual é a administradora padrão ao carregar
  useEffect(() => {
    if (administrators.length > 0) {
      const padrao = administrators.find(a => a.is_default);
      setDefaultAdminId(padrao?.id || null);
    }
  }, [administrators]);

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Botão de cópia de administradoras */}
      {canCopy && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setCopyModalOpen(true)}>
            Copiar administradoras de outra empresa
          </Button>
        </div>
      )}
      {/* Modal de cópia */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Copiar administradoras de outra empresa</DialogTitle>
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
            <Button onClick={handleCopyAdministrators} disabled={!originCompanyId || copyLoading}>
              {copyLoading ? 'Copiando...' : 'Copiar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Tabela de administradoras */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
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
              <TableCell>
                <input
                  type="radio"
                  checked={defaultAdminId === admin.id}
                  onChange={() => handleSetDefault(admin.id)}
                  name="admin-default"
                  className="accent-blue-600 w-4 h-4"
                />
              </TableCell>
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
                    disabled={isSubMaster}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchive(admin.id, admin.is_archived)}
                    disabled={isSubMaster}
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                  {/* Remover botão de excluir */}
                  {/* <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(admin.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={isSubMaster}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button> */}
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
