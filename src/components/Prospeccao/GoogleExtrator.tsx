import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

interface GoogleResult {
  id: string;
  title: string;
  description: string;
  url: string;
  normalized_url: string;
  page: number;
  created_at: string;
}

interface SearchParams {
  query: string;
  maxResults: number;
  redflags: string[];
}

export function GoogleExtrator() {
  const [searchQuery, setSearchQuery] = useState('');
  const [numResults, setNumResults] = useState(10);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const { companyId } = useCrmAuth();
  const queryClient = useQueryClient();

  // Buscar redflags para filtrar resultados
  const { data: redflags = [] } = useQuery({
    queryKey: ['prospect_redflags', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospect_redflags')
        .select('value, type')
        .eq('company_id', companyId)
        .eq('is_archived', false);
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar resultados da última pesquisa
  const { data: results = [], isLoading: isLoadingResults } = useQuery({
    queryKey: ['prospect_results', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospect_results')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as GoogleResult[];
    },
  });

  // Mutation para realizar pesquisa (via Edge Function)
  const searchMutation = useMutation({
    mutationFn: async (params: SearchParams) => {
      // Criar registro de pesquisa
      const { data: searchRecord, error: searchError } = await supabase
        .from('prospect_searches')
        .insert({
          company_id: companyId,
          query: params.query,
          max_results: params.maxResults,
          results_count: 0,
          pages: 0,
          last_page: 1,
          status: 'in_progress',
        })
        .select()
        .single();
      
      if (searchError) throw searchError;

      // Chamar Edge Function que executa o Apify
      const invokeRes = await supabase.functions.invoke('apify-google-search', {
        body: {
          query: params.query,
          maxResults: params.maxResults,
          resultsPerPage: 100,
          redflags: redflags as any,
        }
      });
      if (invokeRes.error) throw invokeRes.error;
      const items = (invokeRes.data?.results || []) as {
        title: string; description: string; url: string; normalized_url: string; page?: number;
      }[];

      // Salvar resultados no banco
      if (items.length > 0) {
        const { error: resultsError } = await supabase
          .from('prospect_results')
          .insert(
            items.map(result => ({
              company_id: companyId,
              search_id: searchRecord.id,
              title: result.title,
              description: result.description,
              url: result.url,
              normalized_url: result.normalized_url,
              page: result.page ?? 1,
            }))
          );
        
        if (resultsError) throw resultsError;
      }

      // Atualizar registro de pesquisa
      const { error: updateError } = await supabase
        .from('prospect_searches')
        .update({
          results_count: items.length,
          pages: Math.max(1, Math.ceil(items.length / 100)),
          last_page: 1,
          status: 'completed',
        })
        .eq('id', searchRecord.id);
      
      if (updateError) throw updateError;

      return items;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['prospect_results', companyId] });
      queryClient.invalidateQueries({ queryKey: ['prospect_searches', companyId] });
      toast({
        title: "Sucesso",
        description: `${results.length} resultados extraídos com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao realizar a extração. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma consulta de pesquisa.",
        variant: "destructive",
      });
      return;
    }

    searchMutation.mutate({
      query: searchQuery.trim(),
      maxResults: numResults,
      redflags: redflags.map(r => r.value),
    });
  };

  const handleViewDetails = (result: GoogleResult) => {
    // TODO: Implementar modal de detalhes
    console.log('Ver detalhes:', result);
  };

  // Mutation para deletar resultado
  const deleteResultMutation = useMutation({
    mutationFn: async (resultId: string) => {
      const { error } = await supabase
        .from('prospect_results')
        .delete()
        .eq('id', resultId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospect_results', companyId] });
      toast({
        title: "Sucesso",
        description: "Resultado removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover resultado. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (resultId: string) => {
    deleteResultMutation.mutate(resultId);
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Pesquisa */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Pesquisa</CardTitle>
          <CardDescription>
            Configure os parâmetros para extrair dados do Google Search.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-query">Consulta de Pesquisa</Label>
              <Input
                id="search-query"
                placeholder="Ex: site:instagram.com investimento"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="num-results">Número de Resultados</Label>
              <Input
                id="num-results"
                type="number"
                min="1"
                max="100"
                value={numResults}
                onChange={(e) => setNumResults(Number(e.target.value))}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={searchMutation.isPending}>
              {searchMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Pesquisando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Iniciar Pesquisa
                </>
              )}
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avançados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {isLoadingResults ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : results.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resultados da Pesquisa</CardTitle>
                <CardDescription>
                  {results.length} resultado(s) encontrado(s)
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {new Date(result.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {result.title}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {result.description}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {result.url}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(result)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(result.id)}
                          disabled={deleteResultMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Nenhum resultado encontrado
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Configure os parâmetros de pesquisa acima e clique em "Iniciar Pesquisa" para começar a extrair dados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
