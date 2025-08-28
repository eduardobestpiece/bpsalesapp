
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
  special_entry_percentage: number;
  special_entry_fixed_value: number;
  special_entry_installments: number;
  functioning: string;
  post_contemplation_adjustment: number;
  agio_purchase_percentage: number;
  is_archived: boolean;
  created_at: string;
  is_default: boolean;
}

interface AdministratorsListProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'archived';
  onEdit: (admin: Administrator) => void;
  canEdit?: boolean;
  canCreate?: boolean;
  canArchive?: boolean;
}

// Função para formatar a entrada especial
const formatSpecialEntry = (admin: Administrator): string => {
  if (!admin.special_entry_type || admin.special_entry_type === 'none') {
    return 'Não';
  }

  let entryText = '';
  
  switch (admin.special_entry_type) {
    case 'percentage':
      if (admin.special_entry_percentage) {
        entryText = `${admin.special_entry_percentage}%`;
      }
      break;
    case 'fixed_value':
      if (admin.special_entry_fixed_value) {
        entryText = `R$ ${admin.special_entry_fixed_value.toLocaleString('pt-BR')}`;
      }
      break;
    default:
      return 'Não';
  }

  // Adicionar informações de parcelas se aplicável
  if (admin.special_entry_installments && admin.special_entry_installments > 1) {
    entryText += ` / ${admin.special_entry_installments}x`;
  }

  // Adicionar tipo de funcionamento se aplicável
  if (admin.functioning) {
    const functioningText = admin.functioning === 'included' ? 'Incluso' : 'Adicional';
    entryText += ` / ${functioningText}`;
  }

  return entryText || 'Sim';
};

export const AdministratorsList: React.FC<AdministratorsListProps> = ({
  searchTerm,
  statusFilter,
  onEdit,
  canEdit = true,
  canCreate = true,
  canArchive = true
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
      if (!selectedCompanyId) { setAdministrators([]); setLoading(false); return; }
      let query = supabase
        .from('administrators')
        .select('*')
        .order('created_at', { ascending: false })
        .eq('company_id', selectedCompanyId);

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
  }, [searchTerm, statusFilter, selectedCompanyId]);

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
            <TableHead className="text-left"></TableHead>
            <TableHead className="text-left">Nome</TableHead>
            <TableHead className="text-left">Status</TableHead>
            <TableHead className="text-left">% Máx. Embutido</TableHead>
            <TableHead className="text-left">Entrada especial</TableHead>
            <TableHead className="text-left">Ajuste de contemplação</TableHead>
            <TableHead className="text-left">Agio de compra</TableHead>
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
                {admin.is_archived ? (
                  <Badge variant="destructive" style={{ borderRadius: 'var(--brand-radius, 8px)' }}>
                    Arquivado
                  </Badge>
                ) : (
                  <Badge
                    className="text-white"
                    style={{ backgroundColor: 'var(--brand-primary, #A86F57)', borderRadius: 'var(--brand-radius, 8px)' }}
                  >
                    Ativo
                  </Badge>
                )}
              </TableCell>
              <TableCell>{admin.max_embedded_percentage ? `${admin.max_embedded_percentage}%` : '-'}</TableCell>
              <TableCell>{formatSpecialEntry(admin)}</TableCell>
              <TableCell>{admin.post_contemplation_adjustment ? `${admin.post_contemplation_adjustment}%` : '-'}</TableCell>
              <TableCell>{admin.agio_purchase_percentage ? `${admin.agio_purchase_percentage}%` : '-'}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  {canEdit && (
                  <Button
                    variant="brandOutlineSecondaryHover"
                    size="sm"
                    onClick={() => onEdit(admin)}
                    disabled={isSubMaster}
                    className="brand-radius"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  )}
                  {canArchive && (
                  <Button
                    variant="brandOutlineSecondaryHover"
                    size="sm"
                    onClick={() => handleArchive(admin.id, admin.is_archived)}
                    disabled={isSubMaster}
                    className="brand-radius"
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                  )}
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
