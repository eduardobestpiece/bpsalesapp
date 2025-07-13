import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Archive, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface SourcesListProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'archived';
  companyId: string;
  onEdit: (source: any) => void;
  refreshKey: number;
}

export const SourcesList = ({ searchTerm, statusFilter, companyId, onEdit, refreshKey }: SourcesListProps) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: sources = [], isLoading, refetch } = useQuery({
    queryKey: ['sources', companyId, searchTerm, statusFilter, refreshKey],
    queryFn: async () => {
      let query = supabase
        .from('sources')
        .select('*')
        .eq('company_id', companyId);

      if (statusFilter === 'active') {
        query = query.eq('is_archived', false);
      } else if (statusFilter === 'archived') {
        query = query.eq('is_archived', true);
      }

      const { data, error } = await query
        .ilike('name', `%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId
  });

  const handleArchive = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('sources')
        .update({ is_archived: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Origem ${!currentStatus ? 'arquivada' : 'restaurada'} com sucesso!`);
      refetch();
    } catch (error: any) {
      toast.error('Erro ao alterar status: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando origens...</div>;
  }

  if (sources.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhuma origem encontrada.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sources.map((source) => (
        <div key={source.id} className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{source.name}</h3>
                <Badge variant={source.is_archived ? 'secondary' : 'default'}>
                  {source.is_archived ? 'Arquivada' : 'Ativa'}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(source)}
                disabled={!!actionLoading}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleArchive(source.id, source.is_archived)}
                disabled={actionLoading === source.id}
              >
                {source.is_archived ? (
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
