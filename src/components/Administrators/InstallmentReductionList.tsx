import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Archive, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

interface InstallmentReduction {
  id: string;
  name: string;
  administrator_id: string;
  administrator_name: string;
  reduction_percent: number;
  applications: string[];
  is_archived: boolean;
  created_at: string;
}

interface InstallmentReductionListProps {
  searchTerm: string;
  selectedAdministrator: string;
  statusFilter: 'all' | 'active' | 'archived';
  onEdit: (reduction: InstallmentReduction) => void;
  onCopy: (reduction: InstallmentReduction) => void;
}

export const InstallmentReductionList: React.FC<InstallmentReductionListProps> = ({
  searchTerm,
  selectedAdministrator,
  statusFilter,
  onEdit,
  onCopy
}) => {
  const [reductions, setReductions] = useState<InstallmentReduction[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedCompanyId } = useCompany();

  const fetchReductions = async () => {
    try {
      let query = supabase
        .from('installment_reductions')
        .select('*, administrators:administrator_id(name)')
        .eq('company_id', selectedCompanyId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('is_archived', statusFilter === 'archived');
      }
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      if (selectedAdministrator && selectedAdministrator !== 'all') {
        query = query.eq('administrator_id', selectedAdministrator);
      }
      const { data, error } = await query;
      if (error) throw error;
      setReductions((data || []).map((r: any) => ({
        ...r,
        administrator_name: r.administrators?.name || '-',
        applications: r.applications || []
      })));
    } catch (error) {
      console.error('Erro ao buscar reduções:', error);
      toast.error('Erro ao carregar reduções de parcela');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string, isArchived: boolean) => {
    try {
      const { error } = await supabase
        .from('installment_reductions')
        .update({ is_archived: !isArchived })
        .eq('id', id);
      if (error) throw error;
      toast.success(`Redução ${isArchived ? 'restaurada' : 'arquivada'} com sucesso!`);
      fetchReductions();
    } catch (error) {
      console.error('Erro ao arquivar redução:', error);
      toast.error('Erro ao arquivar redução de parcela');
    }
  };

  useEffect(() => {
    fetchReductions();
  }, [searchTerm, statusFilter, selectedAdministrator, selectedCompanyId]);

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
            <TableHead>Percentual reduzido</TableHead>
            <TableHead>Nº de aplicações</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reductions.map((reduction) => (
            <TableRow key={reduction.id}>
              <TableCell className="font-medium">{reduction.name}</TableCell>
              <TableCell>{reduction.administrator_name}</TableCell>
              <TableCell>{reduction.reduction_percent}%</TableCell>
              <TableCell>{reduction.applications.length}</TableCell>
              <TableCell>
                <Badge variant={reduction.is_archived ? 'destructive' : 'default'}>
                  {reduction.is_archived ? 'Arquivado' : 'Ativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(reduction)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleArchive(reduction.id, reduction.is_archived)}>
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onCopy(reduction)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {reductions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhuma redução de parcela encontrada
        </div>
      )}
    </div>
  );
}; 