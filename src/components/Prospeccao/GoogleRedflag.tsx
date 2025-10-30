import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

interface Redflag {
  id: string;
  value: string;
  type: 'term' | 'domain';
  created_at: string;
  is_archived: boolean;
}

export function GoogleRedflag() {
  const [newRedflag, setNewRedflag] = useState('');
  const [redflagType, setRedflagType] = useState<'term' | 'domain'>('term');
  const { toast } = useToast();
  const { companyId } = useCrmAuth();
  const queryClient = useQueryClient();

  // Buscar redflags do banco de dados
  const { data: redflags = [], isLoading } = useQuery({
    queryKey: ['prospect_redflags', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospect_redflags')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Redflag[];
    },
  });

  // Mutation para adicionar redflag
  const addRedflagMutation = useMutation({
    mutationFn: async (data: { value: string; type: 'term' | 'domain' }) => {
      const { data: result, error } = await supabase
        .from('prospect_redflags')
        .insert({
          company_id: companyId,
          value: data.value,
          type: data.type,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospect_redflags', companyId] });
      setNewRedflag('');
      toast({
        title: "Sucesso",
        description: "Redflag adicionada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar redflag. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para arquivar redflag
  const archiveRedflagMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prospect_redflags')
        .update({ is_archived: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospect_redflags', companyId] });
      toast({
        title: "Sucesso",
        description: "Redflag removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover redflag. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleAddRedflag = () => {
    if (!newRedflag.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um termo ou domínio.",
        variant: "destructive",
      });
      return;
    }

    addRedflagMutation.mutate({
      value: newRedflag.trim(),
      type: redflagType,
    });
  };

  const handleDeleteRedflag = (id: string) => {
    archiveRedflagMutation.mutate(id);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'term':
        return 'Termo';
      case 'domain':
        return 'Domínio';
      case 'site':
        return 'Site';
      default:
        return 'Termo';
    }
  };

  const getTypeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'term':
        return 'destructive';
      case 'domain':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário para Adicionar Redflag */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Redflag</CardTitle>
          <CardDescription>
            Adicione termos, domínios ou sites que devem ser excluídos dos resultados de pesquisa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="redflag-term">Termo ou Domínio</Label>
              <Input
                id="redflag-term"
                placeholder="Ex: spam, example.com, site:example.com"
                value={newRedflag}
                onChange={(e) => setNewRedflag(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="redflag-type">Tipo</Label>
              <select
                id="redflag-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={redflagType}
                onChange={(e) => setRedflagType(e.target.value as 'term' | 'domain')}
              >
                <option value="term">Termo</option>
                <option value="domain">Domínio</option>
              </select>
            </div>
          </div>
          
          <Button 
            onClick={handleAddRedflag}
            disabled={addRedflagMutation.isPending}
          >
            {addRedflagMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Adicionando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Redflag
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Redflags */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Redflags Configuradas</CardTitle>
          </div>
          <CardDescription>
            {redflags.length} redflag(s) configurada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : redflags.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Termo/Domínio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redflags.map((redflag) => (
                  <TableRow key={redflag.id}>
                    <TableCell className="font-medium">
                      {redflag.value}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeVariant(redflag.type)}>
                        {getTypeLabel(redflag.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(redflag.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRedflag(redflag.id)}
                        disabled={archiveRedflagMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Nenhuma redflag configurada
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                Adicione termos, domínios ou sites que devem ser excluídos dos resultados de pesquisa.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
