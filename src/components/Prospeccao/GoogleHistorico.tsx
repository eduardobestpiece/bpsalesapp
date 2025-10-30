import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, Play, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

interface SearchHistory {
  id: string;
  query: string;
  results_count: number;
  pages: number;
  last_page: number;
  created_at: string;
  status: 'completed' | 'partial' | 'failed' | 'in_progress';
}

export function GoogleHistorico() {
  const { toast } = useToast();
  const { companyId } = useCrmAuth();
  const queryClient = useQueryClient();

  // Buscar histórico de pesquisas do banco de dados
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['prospect_searches', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospect_searches')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SearchHistory[];
    },
  });

  const handleContinueSearch = (searchItem: SearchHistory) => {
    // TODO: Implementar redirecionamento para o extrator com configurações pré-preenchidas
    toast({
      title: "Continuar Pesquisa",
      description: `Redirecionando para continuar a pesquisa: "${searchItem.query}"`,
    });
  };

  const handleViewDetails = (searchItem: SearchHistory) => {
    // TODO: Implementar modal de detalhes
    console.log('Ver detalhes:', searchItem);
  };

  // Mutation para deletar histórico
  const deleteHistoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prospect_searches')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospect_searches', companyId] });
      toast({
        title: "Sucesso",
        description: "Histórico removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover histórico. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteHistory = (id: string) => {
    deleteHistoryMutation.mutate(id);
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'partial':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'in_progress':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'partial':
        return 'Parcial';
      case 'failed':
        return 'Falhou';
      case 'in_progress':
        return 'Em Progresso';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle>Histórico de Pesquisas</CardTitle>
          </div>
          <CardDescription>
            Visualize e gerencie o histórico de suas pesquisas no Google.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : history.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Pesquisa</TableHead>
                  <TableHead>Resultados</TableHead>
                  <TableHead>Páginas</TableHead>
                  <TableHead>Última Página</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {new Date(item.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {item.query}
                    </TableCell>
                    <TableCell>
                      {item.results_count}
                    </TableCell>
                    <TableCell>
                      {item.pages}
                    </TableCell>
                    <TableCell>
                      {item.last_page}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(item.status)}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleContinueSearch(item)}
                          title="Continuar da última página"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(item)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteHistory(item.id)}
                          title="Remover do histórico"
                          disabled={deleteHistoryMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Nenhum histórico encontrado
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                Realize algumas pesquisas no extrator para ver o histórico aqui.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
