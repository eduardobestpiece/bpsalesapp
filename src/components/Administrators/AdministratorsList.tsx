
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
  const { toast } = useToast();
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [loading, setLoading] = useState(true);
  const { userRole } = useCrmAuth();
  const isSubMaster = userRole === 'submaster';
  const isMaster = userRole === 'master';
  const canCopy = isMaster || isSubMaster;
  const { selectedCompanyId } = useCompany();

  const [defaultAdminId, setDefaultAdminId] = useState<string | null>(null);

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
      toast({
        title: 'Erro',
        description: 'Erro ao carregar administradoras',
        variant: 'destructive'
      });
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
      toast({
        title: 'Sucesso',
        description: `Administradora ${isArchived ? 'restaurada' : 'arquivada'} com sucesso!`
      });
      fetchAdministrators();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao arquivar administradora',
        variant: 'destructive'
      });
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
      toast({
        title: 'Sucesso',
        description: 'Administradora excluída com sucesso!'
      });
      fetchAdministrators();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir administradora',
        variant: 'destructive'
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Desmarcar todas e marcar só a selecionada
      // Update all administrators to not be default, then set the selected one as default
      const { error: updateError } = await supabase
        .from('administrators')
        .update({ is_default: false })
        .eq('company_id', selectedCompanyId);
      
      if (updateError) throw updateError;
      
      const { error } = await supabase
        .from('administrators')
        .update({ is_default: true })
        .eq('id', id)
        .eq('company_id', selectedCompanyId);
      if (error) throw error;
      setDefaultAdminId(id);
      fetchAdministrators();
      toast({
        title: 'Sucesso',
        description: 'Administradora padrão atualizada!'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao definir administradora padrão',
        variant: 'destructive'
      });
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
