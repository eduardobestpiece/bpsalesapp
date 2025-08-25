import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Archive, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface InstallmentReduction {
  id: string;
  name: string;
  administrator_id: string;
  reduction_percent: number;
  applications: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  administrators?: { name: string };
}

interface Administrator {
  id: string;
  name: string;
}

interface InstallmentReductionsListProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'archived';
  selectedAdministrator: string;
  onEdit: (reduction: InstallmentReduction) => void;
  canEdit?: boolean;
  canCreate?: boolean;
  canArchive?: boolean;
}

export const InstallmentReductionsList: React.FC<InstallmentReductionsListProps> = ({
  searchTerm,
  statusFilter,
  selectedAdministrator,
  onEdit,
  canEdit = true,
  canCreate = true,
  canArchive = true
}) => {
  const { toast } = useToast();
  const [reductions, setReductions] = useState<InstallmentReduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const { userRole } = useCrmAuth();
  const isSubMaster = userRole === 'submaster';
  const isMaster = userRole === 'master';
  const canCopy = isMaster || isSubMaster;
  const { selectedCompanyId } = useCompany();

  useEffect(() => {
    fetchAdministrators();
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) {
      setReductions([]);
      setLoading(false);
      return;
    }
    fetchReductions();
  }, [searchTerm, statusFilter, selectedAdministrator, selectedCompanyId]);

  const fetchAdministrators = async () => {
    const { data, error } = await supabase
      .from('administrators')
      .select('id, name')
      .eq('is_archived', false)
      .order('name');
    if (!error) setAdministrators(data || []);
  };

  const fetchReductions = async () => {
    setLoading(true);
    if (!selectedCompanyId) { setReductions([]); setLoading(false); return; }
    let query = supabase
      .from('installment_reductions')
      .select(`*, administrators:administrator_id (name)`) // join para nome da administradora
      .eq('company_id', selectedCompanyId)
      .order('created_at', { ascending: false });

    if (statusFilter === 'active') query = query.eq('is_archived', false);
    if (statusFilter === 'archived') query = query.eq('is_archived', true);
    if (selectedAdministrator && selectedAdministrator !== 'all') query = query.eq('administrator_id', selectedAdministrator);
    if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);

    const { data, error } = await query;
    if (!error) {
      setReductions(data || []);
    }
    setLoading(false);
  };

  const handleArchive = async (reduction: InstallmentReduction) => {
    try {
      const { error } = await supabase
        .from('installment_reductions')
        .update({ is_archived: !reduction.is_archived, updated_at: new Date().toISOString() })
        .eq('id', reduction.id);
      if (error) throw error;
      toast({
        title: 'Sucesso',
        description: reduction.is_archived ? 'Redução restaurada!' : 'Redução arquivada!'
      });
      fetchReductions();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao arquivar/restaurar redução',
        variant: 'destructive'
      });
    }
  };

  // Número de aplicações: conta o número de aplicações válidas no array applications
  const getApplicationsCount = (reduction: InstallmentReduction) => {
    if (!reduction.applications || !Array.isArray(reduction.applications)) {
      return 0;
    }
    
    // Filtrar apenas aplicações válidas e remover duplicatas
    const validApplications = [
      'installment',      // Parcela
      'admin_tax',        // Taxa de administração
      'reserve_fund'      // Fundo de reserva
    ];
    
    const filteredApplications = reduction.applications.filter(app => 
      validApplications.includes(app)
    );
    
    // Remover duplicatas
    const uniqueApplications = [...new Set(filteredApplications)];
    
    return uniqueApplications.length;
  };

  if (!selectedCompanyId) {
    return <div className="text-center py-8 text-red-500">Selecione uma empresa para visualizar as reduções de parcela.</div>;
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!loading && reductions.length === 0) {
    return <div className="text-center py-8 text-gray-500">Nenhuma redução de parcela encontrada para a empresa/administradora selecionada.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Tabela de reduções */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Nome</TableHead>
            <TableHead className="text-left">Administradora</TableHead>
            <TableHead className="text-left">Percentual reduzido</TableHead>
            <TableHead className="text-left">Nº de aplicações</TableHead>
            <TableHead className="text-left">Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reductions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Nenhuma redução encontrada.
              </TableCell>
            </TableRow>
          ) : (
            reductions.map((reduction) => (
              <TableRow key={reduction.id}>
                <TableCell className="font-medium">{reduction.name}</TableCell>
                <TableCell>{reduction.administrators?.name || 'N/A'}</TableCell>
                <TableCell>{reduction.reduction_percent}%</TableCell>
                <TableCell>{getApplicationsCount(reduction)}</TableCell>
                <TableCell>
                  {reduction.is_archived ? (
                    <Badge variant="destructive" className="brand-radius">Arquivado</Badge>
                  ) : (
                    <Badge className="brand-radius text-white" style={{ backgroundColor: 'var(--brand-primary, #A86F57)' }}>Ativo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {canEdit && (
                      <Button
                        variant="brandOutlineSecondaryHover"
                        size="sm"
                        onClick={() => onEdit(reduction)}
                        className="brand-radius"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {canArchive && (
                      <Button
                        variant="brandOutlineSecondaryHover"
                        size="sm"
                        onClick={() => handleArchive(reduction)}
                        className="brand-radius"
                      >
                        {reduction.is_archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}; 