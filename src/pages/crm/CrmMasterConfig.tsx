
import { useState, useEffect } from 'react';
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

  // --- ITENS ARQUIVADOS ---
  const [archivedType, setArchivedType] = useState('');
  const [archivedDate, setArchivedDate] = useState('');
  const [archivedItems, setArchivedItems] = useState<any[]>([]);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);

  useEffect(() => {
    const fetchArchived = async () => {
      setIsLoadingArchived(true);
      // Buscar todos os itens arquivados
      const [indicators, leads, sales] = await Promise.all([
        supabase.from('indicators').select('*').not('archived_at', 'is', null),
        supabase.from('leads').select('*').not('archived_at', 'is', null),
        supabase.from('sales').select('*').not('archived_at', 'is', null),
      ]);
      let items: any[] = [];
      if (indicators.data) items = items.concat(indicators.data.map((i: any) => ({
        id: i.id,
        type: 'indicator',
        archived_at: i.archived_at,
        description: `Indicador: ${i.period_start ? `De ${new Date(i.period_start).toLocaleDateString('pt-BR')}` : ''}${i.period_end ? ` até ${new Date(i.period_end).toLocaleDateString('pt-BR')}` : ''}`
      })));
      if (leads.data) items = items.concat(leads.data.map((l: any) => ({
        id: l.id,
        type: 'lead',
        archived_at: l.archived_at,
        description: `Lead: ${l.name || l.id}`
      })));
      if (sales.data) items = items.concat(sales.data.map((s: any) => ({
        id: s.id,
        type: 'sale',
        archived_at: s.archived_at,
        description: `Venda: ${s.sale_date ? new Date(s.sale_date).toLocaleDateString('pt-BR') : s.id}`
      })));
      setArchivedItems(items);
      setIsLoadingArchived(false);
    };
    fetchArchived();
  }, []);

  // Filtro
  const filteredArchived = archivedItems.filter(item => {
    if (archivedType && item.type !== archivedType) return false;
    if (archivedDate && item.archived_at) {
      const itemDate = new Date(item.archived_at).toISOString().slice(0, 10);
      if (itemDate !== archivedDate) return false;
    }
    return true;
  });

  // Ações
  const handleRecover = async (item: any) => {
    let table = '';
    if (item.type === 'indicator') table = 'indicators';
    if (item.type === 'lead') table = 'leads';
    if (item.type === 'sale') table = 'sales';
    await supabase.from(table).update({ archived_at: null }).eq('id', item.id);
    setArchivedItems(prev => prev.filter(i => i.id !== item.id || i.type !== item.type));
  };
  const handleDelete = async (item: any) => {
    if (!window.confirm('Tem certeza que deseja excluir este item? Essa ação não pode ser desfeita.')) return;
    let table = '';
    if (item.type === 'indicator') table = 'indicators';
    if (item.type === 'lead') table = 'leads';
    if (item.type === 'sale') table = 'sales';
    await supabase.from(table).delete().eq('id', item.id);
    setArchivedItems(prev => prev.filter(i => i.id !== item.id || i.type !== item.type));
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
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="companies">Empresas</TabsTrigger>
                  <TabsTrigger value="archived">Itens arquivados</TabsTrigger>
                  <TabsTrigger value="accesses">Acessos</TabsTrigger>
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
                <TabsContent value="archived" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Itens arquivados</CardTitle>
                      <CardDescription>Consulte e gerencie todos os itens arquivados do sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Filtros */}
                      <div className="flex gap-4 mb-4">
                        <div>
                          <Label htmlFor="filter-type">Tipo</Label>
                          <select id="filter-type" className="block w-full border rounded px-2 py-1" value={archivedType} onChange={e => setArchivedType(e.target.value)}>
                            <option value="">Todos</option>
                            <option value="indicator">Indicador</option>
                            <option value="lead">Lead</option>
                            <option value="sale">Venda</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="filter-date">Data</Label>
                          <Input id="filter-date" type="date" className="block w-full" value={archivedDate} onChange={e => setArchivedDate(e.target.value)} />
                        </div>
                      </div>
                      {/* Lista de itens arquivados */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-y-1">
                          <thead>
                            <tr className="bg-muted">
                              <th className="px-2 py-1 text-left font-semibold">Data arquivamento</th>
                              <th className="px-2 py-1 text-left font-semibold">Tipo</th>
                              <th className="px-2 py-1 text-left font-semibold">Descrição</th>
                              <th className="px-2 py-1 text-center font-semibold">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoadingArchived ? (
                              <tr><td colSpan={4} className="text-center py-4">Carregando...</td></tr>
                            ) : filteredArchived.length === 0 ? (
                              <tr><td colSpan={4} className="text-center py-4">Nenhum item arquivado encontrado.</td></tr>
                            ) : filteredArchived.map(item => (
                              <tr key={item.type + '-' + item.id}>
                                <td className="px-2 py-1">{item.archived_at ? new Date(item.archived_at).toLocaleDateString('pt-BR') : '-'}</td>
                                <td className="px-2 py-1">{item.type === 'indicator' ? 'Indicador' : item.type === 'lead' ? 'Lead' : 'Venda'}</td>
                                <td className="px-2 py-1">{item.description}</td>
                                <td className="px-2 py-1 text-center">
                                  <div className="flex gap-2 justify-center">
                                    <Button variant="outline" size="sm" onClick={() => handleRecover(item)}>Recuperar</Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item)}>Excluir</Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="accesses" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Permissões de Acesso</CardTitle>
                      <CardDescription>
                        Defina quais páginas e abas cada função pode acessar. Desmarque para ocultar do menu, botões e impedir acesso direto.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-y-1">
                          <thead>
                            <tr className="bg-muted">
                              <th className="px-2 py-1 text-left font-semibold">Página / Aba</th>
                              <th className="px-2 py-1 text-center font-semibold">Administrador</th>
                              <th className="px-2 py-1 text-center font-semibold">Líder</th>
                              <th className="px-2 py-1 text-center font-semibold">Usuário</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Estrutura detalhada, checkboxes editáveis (apenas visual, sem salvar ainda) */}
                            {[
                              { key: 'simulator', label: 'Simulador' },
                              { key: 'simulator_config', label: 'Configurações do Simulador', indent: true },
                              { key: 'comercial', label: 'Comercial' },
                              { key: 'comercial_leads', label: 'Leads', indent: true },
                              { key: 'comercial_sales', label: 'Vendas', indent: true },
                              { key: 'indicadores', label: 'Indicadores' },
                              { key: 'indicadores_performance', label: 'Performance', indent: true },
                              { key: 'indicadores_registro', label: 'Registro de Indicadores', indent: true },
                              { key: 'crm_config', label: 'Configurações CRM' },
                              { key: 'crm_config_funnels', label: 'Funis', indent: true },
                              { key: 'crm_config_sources', label: 'Origens', indent: true },
                              { key: 'crm_config_teams', label: 'Times', indent: true },
                              { key: 'crm_config_users', label: 'Usuários', indent: true },
                            ].map((item) => (
                              <tr key={item.key}>
                                <td className={`px-2 py-1 font-medium${item.indent ? ' pl-8' : ''}`}>{item.label}</td>
                                <td className="px-2 py-1 text-center">
                                  <input type="checkbox" defaultChecked />
                                </td>
                                <td className="px-2 py-1 text-center">
                                  <input type="checkbox" defaultChecked />
                                </td>
                                <td className="px-2 py-1 text-center">
                                  <input type="checkbox" defaultChecked />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="text-xs text-muted-foreground mt-4">
                          * Apenas usuários Master podem editar essas permissões. (Funcionalidade visual, salvar no banco em breve)
                        </div>
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
