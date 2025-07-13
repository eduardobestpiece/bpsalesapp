
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Archive, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

interface InstallmentReductionsListProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'archived';
  administratorFilter?: string;
  onEdit: (installmentReduction: any) => void;
}

export const InstallmentReductionsList = ({ 
  searchTerm, 
  statusFilter, 
  administratorFilter,
  onEdit 
}: InstallmentReductionsListProps) => {
  const { selectedCompanyId } = useCompany();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: installmentReductions = [], isLoading, refetch } = useQuery({
    queryKey: ['installment_reductions', selectedCompanyId, searchTerm, statusFilter, administratorFilter],
    queryFn: async () => {
      let query = supabase
        .from('installment_reductions')
        .select(`
          *,
          administrators (
            name
          )
        `)
        .eq('company_id', selectedCompanyId);

      if (statusFilter === 'active') {
        query = query.eq('is_archived', false);
      } else if (statusFilter === 'archived') {
        query = query.eq('is_archived', true);
      }

      if (administratorFilter) {
        query = query.eq('administrator_id', administratorFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      return data.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    },
    enabled: !!selectedCompanyId
  });

  const handleArchive = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('installment_reductions')
        .update({ is_archived: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Redução ${!currentStatus ? 'arquivada' : 'restaurada'} com sucesso!`);
      refetch();
    } catch (error: any) {
      toast.error('Erro ao alterar status: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getApplicationsText = (applications: string[]) => {
    const labels: { [key: string]: string } = {
      installment: 'Parcela',
      admin_tax: 'Taxa Admin',
      reserve_fund: 'Fundo Reserva',
      insurance: 'Seguro'
    };
    return applications.map(app => labels[app] || app).join(', ');
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando reduções...</div>;
  }

  if (installmentReductions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhuma redução encontrada.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {installmentReductions.map((reduction) => (
        <div key={reduction.id} className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{reduction.name}</h3>
                <Badge variant={reduction.is_archived ? 'secondary' : 'default'}>
                  {reduction.is_archived ? 'Arquivada' : 'Ativa'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Redução:</span> {reduction.reduction_percent}%
                </div>
                <div>
                  <span className="font-medium">Administradora:</span>{' '}
                  {reduction.administrators?.name || 'Todas'}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium">Aplicações:</span>{' '}
                  {getApplicationsText(reduction.applications)}
                </div>
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(reduction)}
                disabled={!!actionLoading}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleArchive(reduction.id, reduction.is_archived)}
                disabled={actionLoading === reduction.id}
              >
                {reduction.is_archived ? (
                  <RotateCcw className="w-4 h-4" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
