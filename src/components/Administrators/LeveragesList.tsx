
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LeveragesListProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'archived';
  onEdit: (leverage: any) => void;
  canEdit?: boolean;
  canCreate?: boolean;
  canArchive?: boolean;
}

export const LeveragesList: React.FC<LeveragesListProps> = ({
  searchTerm,
  statusFilter,
  onEdit,
  canEdit = true,
  canCreate = true,
  canArchive = true
}) => {
  const { toast } = useToast();
  const [leverages, setLeverages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userRole } = useCrmAuth();
  const isSubMaster = userRole === 'submaster';
  const isMaster = userRole === 'master';
  const canCopy = isMaster || isSubMaster;
  const { selectedCompanyId } = useCompany();

  // Removido: cópia de alavancas

  // Removido: busca de empresas para cópia

  // Removido: função de cópia

  const loadLeverages = async () => {
    try {
      if (!selectedCompanyId) { setLeverages([]); setLoading(false); return; }
      let query = supabase
        .from('leverages')
        .select('*')
        .order('created_at', { ascending: false })
        .eq('company_id', selectedCompanyId);

      if (statusFilter === 'active') {
        query = query.eq('is_archived', false);
      } else if (statusFilter === 'archived') {
        query = query.eq('is_archived', true);
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setLeverages(data || []);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar alavancas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeverages();
  }, [searchTerm, statusFilter, selectedCompanyId]);

  const handleDelete = async (leverage: any) => {
    if (!confirm('Tem certeza que deseja excluir esta alavanca?')) return;
    try {
      const { error } = await supabase
        .from('leverages')
        .delete()
        .eq('id', leverage.id);
      if (error) throw error;
      toast({ title: 'Alavanca excluída com sucesso!' });
      loadLeverages();
    } catch (error) {
      toast({ title: 'Erro ao excluir alavanca', variant: 'destructive' });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'real_estate': return 'Imóvel';
      case 'vehicle': return 'Veículo';
      default: return type;
    }
  };

  const getSubtypeLabel = (subtype: string) => {
    switch (subtype) {
      case 'short_stay': return 'Temporada';
      case 'commercial_residential': return 'Comercial/Residencial';
      default: return subtype;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="text-muted-foreground">Carregando alavancas...</div>
      </div>
    );
  }

  if (leverages.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-2">Nenhuma alavanca encontrada</p>
        <p className="text-sm text-muted-foreground/80">
          {searchTerm ? 'Tente ajustar sua pesquisa' : 'Comece criando uma nova alavanca'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Nome</TableHead>
            <TableHead className="text-left">Tipo</TableHead>
            <TableHead className="text-left">Subtipo</TableHead>
            <TableHead className="text-left">Diária</TableHead>
            <TableHead className="text-left">Aluguel</TableHead>
            <TableHead className="text-left">Ocupação</TableHead>
            <TableHead className="text-left">Administração</TableHead>
            <TableHead className="text-left">Despesas</TableHead>
            <TableHead className="text-left">Status</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leverages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                Nenhuma alavanca encontrada.
              </TableCell>
            </TableRow>
                  ) : (
            leverages.map((leverage) => (
              <TableRow key={leverage.id} className="cursor-pointer" onClick={() => onEdit(leverage)}>
                <TableCell className="font-medium">{leverage.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="brand-radius">
                    {getTypeLabel(leverage.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {leverage.subtype && (
                    <Badge variant="outline" className="brand-radius">
                      {getSubtypeLabel(leverage.subtype)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{leverage.daily_percentage ? `${leverage.daily_percentage}%` : '-'}</TableCell>
                <TableCell>{leverage.rental_percentage ? `${leverage.rental_percentage}%` : '-'}</TableCell>
                <TableCell>{leverage.occupancy_rate ? `${leverage.occupancy_rate}%` : '-'}</TableCell>
                <TableCell>{leverage.management_percentage ? `${leverage.management_percentage}%` : '-'}</TableCell>
                <TableCell>
                  {leverage.total_expenses ? (
                    leverage.hasFixedValue ? 
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(leverage.total_expenses) : 
                      `${leverage.total_expenses}%`
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {leverage.is_archived ? (
                    <Badge variant="destructive" className="brand-radius">Arquivada</Badge>
                  ) : (
                    <Badge className="brand-radius text-white" style={{ backgroundColor: 'var(--brand-primary, #E50F5E)' }}>Ativa</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="brandOutlineSecondaryHover"
                    size="sm"
                    onClick={() => handleDelete(leverage)}
                    className="brand-radius"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
