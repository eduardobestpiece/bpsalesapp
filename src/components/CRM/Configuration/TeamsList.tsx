import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Archive, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface TeamsListProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'archived';
  companyId: string;
  onEdit: (team: any) => void;
  refreshKey: number;
}

export const TeamsList = ({ searchTerm, statusFilter, companyId, onEdit, refreshKey }: TeamsListProps) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: teams = [], isLoading, refetch } = useQuery({
    queryKey: ['teams', companyId, searchTerm, statusFilter, refreshKey],
    queryFn: async () => {
      let query = supabase
        .from('teams')
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
        .from('teams')
        .update({ is_archived: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Time ${!currentStatus ? 'arquivado' : 'restaurado'} com sucesso!`);
      refetch();
    } catch (error: any) {
      toast.error('Erro ao alterar status: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando times...</div>;
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum time encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {teams.map((team) => (
        <div key={team.id} className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{team.name}</h3>
                <Badge variant={team.is_archived ? 'secondary' : 'default'}>
                  {team.is_archived ? 'Arquivado' : 'Ativo'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {team.description}
              </p>
            </div>

            <div className="flex gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(team)}
                disabled={!!actionLoading}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleArchive(team.id, team.is_archived)}
                disabled={actionLoading === team.id}
              >
                {team.is_archived ? (
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
