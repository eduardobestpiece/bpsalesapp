
import { useState } from 'react';
import { CrmHeader } from '@/components/Layout/CrmHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Building, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  status: 'active' | 'archived';
  created_at: string;
}

const CrmMasterConfig = () => {
  const { userRole } = useCrmAuth();
  const queryClient = useQueryClient();
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch companies
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      console.log('Fetching companies...');
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching companies:', error);
        throw error;
      }

      console.log('Companies fetched:', data);
      return data as Company[];
    },
    enabled: userRole === 'master'
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (name: string) => {
      console.log('Creating company:', name);
      const { data, error } = await supabase
        .from('companies')
        .insert([{ name, status: 'active' }])
        .select()
        .single();

      if (error) {
        console.error('Error creating company:', error);
        throw error;
      }

      console.log('Company created:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setNewCompanyName('');
      setIsCreating(false);
      toast.success('Empresa criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating company:', error);
      toast.error('Erro ao criar empresa: ' + error.message);
    }
  });

  // Archive company mutation
  const archiveCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Archiving company:', id);
      const { data, error } = await supabase
        .from('companies')
        .update({ status: 'archived' })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error archiving company:', error);
        throw error;
      }

      console.log('Company archived:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa arquivada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error archiving company:', error);
      toast.error('Erro ao arquivar empresa: ' + error.message);
    }
  });

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCompanyName.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }

    createCompanyMutation.mutate(newCompanyName.trim());
  };

  const handleArchiveCompany = (id: string) => {
    if (confirm('Tem certeza que deseja arquivar esta empresa?')) {
      archiveCompanyMutation.mutate(id);
    }
  };

  if (userRole !== 'master') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h2>
          <p className="text-secondary/60">
            Apenas usuários Master podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
      <CrmHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-full mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-1">
            <div className="bg-white rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold">Configurações Master</h2>
                <p className="text-muted-foreground">
                  Configurações avançadas para usuários Master
                </p>
              </div>

              <Tabs defaultValue="companies" className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="companies">Empresas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="companies" className="mt-6">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Gerenciar Empresas
                          </CardTitle>
                          <CardDescription>
                            Gerencie todas as empresas do sistema
                          </CardDescription>
                        </div>
                        <Button onClick={() => setIsCreating(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Nova Empresa
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isCreating && (
                        <form onSubmit={handleCreateCompany} className="mb-6 p-4 border rounded-lg bg-muted/50">
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <Label htmlFor="company-name">Nome da Empresa</Label>
                              <Input
                                id="company-name"
                                value={newCompanyName}
                                onChange={(e) => setNewCompanyName(e.target.value)}
                                placeholder="Digite o nome da empresa"
                                required
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <Button type="submit" disabled={createCompanyMutation.isPending}>
                                {createCompanyMutation.isPending ? 'Criando...' : 'Criar'}
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => {
                                  setIsCreating(false);
                                  setNewCompanyName('');
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </form>
                      )}

                      <div className="space-y-4">
                        {companiesLoading ? (
                          <p className="text-center py-8 text-muted-foreground">Carregando empresas...</p>
                        ) : companies.length === 0 ? (
                          <p className="text-center py-8 text-muted-foreground">
                            Nenhuma empresa encontrada. Crie a primeira empresa para começar.
                          </p>
                        ) : (
                          companies.map((company) => (
                            <div
                              key={company.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-medium">{company.name}</h3>
                                  <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                                    {company.status === 'active' ? 'Ativa' : 'Arquivada'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Criada em: {new Date(company.created_at).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              {company.status === 'active' && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleArchiveCompany(company.id)}
                                    disabled={archiveCompanyMutation.isPending}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CrmMasterConfig;
