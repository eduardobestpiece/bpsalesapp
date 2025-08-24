
import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useModule } from '@/contexts/ModuleContext';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Company {
  id: string;
  name: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at?: string;
}

const CrmMasterConfig = () => {
  // Detect which module we're in based on the URL path
  const location = useLocation();
  const { setModule } = useModule();
  const isSimulatorModule = location.pathname.startsWith('/simulador');
  
  // Set the correct module context based on the current path
  useEffect(() => {
    if (isSimulatorModule) {
      setModule('simulator');
    } else {
      setModule('crm');
    }
  }, [isSimulatorModule, setModule]);
  const { userRole, companyId, session, user } = useCrmAuth();
  const queryClient = useQueryClient();
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  // Campos adicionais do cadastro rápido
  const [newCnpj, setNewCnpj] = useState('');
  const [newNiche, setNewNiche] = useState('');
  const [newCep, setNewCep] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newStateUF, setNewStateUF] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newTimezone, setNewTimezone] = useState('America/Sao_Paulo');

  // CEP -> auto preencher endereço
  const handleNewCepChange = useCallback(async (value: string) => {
    const onlyDigits = (value || '').replace(/\D/g, '').slice(0, 8);
    setNewCep(onlyDigits);
    if (onlyDigits.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${onlyDigits}/json/`);
        const data = await res.json();
        if (data?.erro) {
          toast.error('CEP não encontrado');
          return;
        }
        setNewStreet(data?.logradouro || '');
        setNewNeighborhood(data?.bairro || '');
        setNewCity(data?.localidade || '');
        setNewStateUF(data?.uf || '');
      } catch (e) {
        toast.error('Erro ao buscar CEP');
      }
    }
  }, []);

  // Permissões de abas - usando useMemo para evitar re-renders
  const allowedTabs = useMemo(() => {
    // Sempre retornar um array válido para master
    if (userRole === 'master') {
      return ['companies', 'archived', 'accesses', 'permissions'];
    }
    return [];
  }, [userRole]);

  const defaultTab = useMemo(() => {
    return allowedTabs[0] || 'companies';
  }, [allowedTabs]);

  const [tabsLoading, setTabsLoading] = useState(false);
  const [tabsError, setTabsError] = useState<string | null>(null);

  // Remover o useEffect que causava infinite loop - usar useMemo acima
  useEffect(() => {
    if (userRole === 'master') {
      setTabsLoading(false);
      setTabsError(null);
    }
  }, [userRole]);

  // Debug useEffect removido

  // Fallback visual para loading, erro ou ausência de abas
  if (tabsLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><span>Carregando permissões...</span></div>;
  }
  if (tabsError) {
    return <div className="flex items-center justify-center min-h-[400px] text-red-500">{tabsError}</div>;
  }
  if (allowedTabs.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">Você não tem permissão para acessar esta área ou nenhuma aba está disponível para seu perfil.</div>;
  }

  // Fetch companies
  const { data: companies = [], isLoading: companiesLoading, error: companiesError } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      // Debug logs removidos
      
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      return data as Company[];
    },
    enabled: userRole === 'master'
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('companies')
        .insert([{ name, status: 'active' }])
        .select()
        .single();

      if (error) {
        throw error;
      }
      // Opcional: criar perfil da empresa com dados básicos se fornecidos
      try {
        await supabase.from('company_profiles').insert({
          company_id: data.id,
          cnpj: newCnpj || null,
          niche: newNiche || null,
          cep: newCep || null,
          address: newStreet || null,
          number: newNumber || null,
          neighborhood: newNeighborhood || null,
          city: newCity || null,
          state: newStateUF || null,
          country: newCountry || null,
          timezone: newTimezone || 'America/Sao_Paulo'
        });
      } catch {}
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setNewCompanyName('');
      setNewCnpj(''); setNewNiche(''); setNewCep(''); setNewStreet(''); setNewNumber(''); setNewNeighborhood(''); setNewCity(''); setNewStateUF(''); setNewCountry(''); setNewTimezone('America/Sao_Paulo');
      setIsCreating(false);
      toast.success('Empresa criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar empresa: ' + error.message);
    }
  });

  // Archive company mutation
  const archiveCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('companies')
        .update({ status: 'archived' })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa arquivada com sucesso!');
    },
    onError: (error: any) => {
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

  // Usar useCallback para estabilizar a função
  const fetchArchived = useCallback(async () => {
    setIsLoadingArchived(true);
    try {
      // Buscar todos os itens arquivados
      const [indicators, leads, sales, administrators] = await Promise.all([
        supabase.from('indicators').select('*').not('archived_at', 'is', null),
        supabase.from('leads').select('*').not('archived_at', 'is', null),
        supabase.from('sales').select('*').not('archived_at', 'is', null),
        supabase.from('administrators').select('*, companies(name)').eq('is_archived', true),
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
      if (administrators.data) items = items.concat(administrators.data.map((a: any) => ({
        id: a.id,
        type: 'administrator',
        archived_at: a.updated_at || a.created_at,
        description: `Administradora: ${a.name} (${a.companies?.name || 'Empresa desconhecida'})`
      })));
      setArchivedItems(items);
    } catch (error) {
    } finally {
      setIsLoadingArchived(false);
    }
  }, []);

  useEffect(() => {
    if (userRole === 'master') {
      fetchArchived();
    }
  }, [userRole, fetchArchived]);

  // Filtro usando useMemo para evitar re-renders
  const filteredArchived = useMemo(() => {
    return archivedItems.filter(item => {
      if (archivedType && item.type !== archivedType) return false;
      if (archivedDate && item.archived_at) {
        const itemDate = new Date(item.archived_at).toISOString().slice(0, 10);
        if (itemDate !== archivedDate) return false;
      }
      return true;
    });
  }, [archivedItems, archivedType, archivedDate]);

  // Ações
  const handleRecover = async (item: any) => {
    let table = '';
    if (item.type === 'indicator') table = 'indicators';
    if (item.type === 'lead') table = 'leads';
    if (item.type === 'sale') table = 'sales';
    if (item.type === 'administrator') table = 'administrators';
    if (item.type === 'administrator') {
      await supabase.from(table).update({ is_archived: false }).eq('id', item.id);
    } else {
      await supabase.from(table).update({ archived_at: null }).eq('id', item.id);
    }
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

  // Antes de usar allowedTabs, garantir que é array
  const safeAllowedTabs = Array.isArray(allowedTabs) ? allowedTabs : [];

  // Antes de usar companies, garantir que é array
  const safeCompanies = Array.isArray(companies) ? companies : [];

  // Antes de usar archivedItems, garantir que é array
  const safeArchivedItems = Array.isArray(archivedItems) ? archivedItems : [];

  // Debug logs removidos

  // Garantir que defaultTab é string válida
  const safeDefaultTab = typeof defaultTab === 'string' && defaultTab ? defaultTab : (safeAllowedTabs[0] || 'companies');

  // LOG para tabs

  // Renderização defensiva de companies
  let renderedCompanies = null;
  try {
    renderedCompanies = safeCompanies.map((company) => (
      <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-medium">{company.name}</h3>
            <Badge className="brand-radius" style={{ backgroundColor: 'var(--brand-primary)' }}>
              {company.status === 'active' ? 'Ativa' : 'Inativa'}
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
              className="brand-radius hover:bg-[var(--brand-secondary)] active:bg-[var(--brand-secondary)] focus:bg-[var(--brand-secondary)]"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    ));
  } catch (e) {
    renderedCompanies = <p className="text-center py-8 text-red-500">Erro ao renderizar empresas.</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-background to-muted/10 dark:from-[#131313] dark:via-[#1E1E1E] dark:to-[#161616]">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-full mx-auto">
          <div className="bg-background/90 backdrop-blur-sm rounded-3xl shadow-xl border border-border/50 p-1">
            <div className="bg-card rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold">Configurações Master</h2>
                <p className="text-muted-foreground">
                  Configurações avançadas para usuários Master
                </p>
              </div>

              {safeAllowedTabs.length > 0 && (
                <Tabs defaultValue={safeDefaultTab} className="w-full">
                  <TabsList className={`grid w-full grid-cols-${safeAllowedTabs.length}`}>
                    {safeAllowedTabs.includes('companies') && (
                      <TabsTrigger value="companies">Empresas</TabsTrigger>
                    )}
                    {safeAllowedTabs.includes('archived') && (
                      <TabsTrigger value="archived">Itens arquivados</TabsTrigger>
                    )}
                    {safeAllowedTabs.includes('accesses') && (
                      <TabsTrigger value="accesses">Acessos</TabsTrigger>
                    )}
                    {safeAllowedTabs.includes('permissions') && (
                      <TabsTrigger value="permissions">Permissões</TabsTrigger>
                    )}
                  </TabsList>
                  {safeAllowedTabs.includes('companies') && (
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
                            <Button onClick={() => setIsCreating(true)} variant="brandPrimaryToSecondary" className="brand-radius">
                              <Plus className="w-4 h-4 mr-2" />
                              Nova Empresa
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {isCreating && (
                            <FullScreenModal
                              isOpen={isCreating}
                              onClose={() => setIsCreating(false)}
                              title="Criar nova empresa"
                              actions={
                                <>
                                  <Button type="button" variant="outline" className="brand-radius" onClick={() => setIsCreating(false)}>Cancelar</Button>
                                  <Button type="button" onClick={handleCreateCompany as any} disabled={createCompanyMutation.isPending} variant="brandPrimaryToSecondary" className="brand-radius">
                                    {createCompanyMutation.isPending ? 'Criando...' : 'Criar'}
                                  </Button>
                                </>
                              }
                            >
                              <form onSubmit={handleCreateCompany} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1 md:col-span-2">
                                    <Label>Nome da empresa *</Label>
                                    <Input value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} required className="brand-radius field-secondary-focus no-ring-focus" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label>CNPJ</Label>
                                    <Input value={newCnpj} onChange={(e) => setNewCnpj(e.target.value)} className="brand-radius field-secondary-focus no-ring-focus" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label>Nicho</Label>
                                    <Input value={newNiche} onChange={(e) => setNewNiche(e.target.value)} className="brand-radius field-secondary-focus no-ring-focus" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label>CEP</Label>
                                    <Input value={newCep} onChange={(e) => handleNewCepChange(e.target.value)} placeholder="Somente números" className="brand-radius field-secondary-focus no-ring-focus" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label>Endereço</Label>
                                    <Input value={newStreet} onChange={(e) => setNewStreet(e.target.value)} className="brand-radius field-secondary-focus no-ring-focus" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label>Número</Label>
                                    <Input value={newNumber} onChange={(e) => setNewNumber(e.target.value)} className="brand-radius field-secondary-focus no-ring-focus" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label>Bairro</Label>
                                    <Input value={newNeighborhood} onChange={(e) => setNewNeighborhood(e.target.value)} className="brand-radius field-secondary-focus no-ring-focus" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label>Cidade</Label>
                                    <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} className="brand-radius field-secondary-focus no-ring-focus" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label>Estado</Label>
                                    <Input value={newStateUF} onChange={(e) => setNewStateUF(e.target.value)} className="brand-radius field-secondary-focus no-ring-focus" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label>País</Label>
                                    <Input value={newCountry} onChange={(e) => setNewCountry(e.target.value)} className="brand-radius field-secondary-focus no-ring-focus" />
                                  </div>
                                  <div className="space-y-1 md:col-span-2">
                                    <Label>Fuso horário</Label>
                                    <Select value={newTimezone} onValueChange={setNewTimezone}>
                                      <SelectTrigger className="brand-radius select-trigger-brand"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="America/Sao_Paulo">America/Sao_Paulo</SelectItem>
                                        <SelectItem value="America/Bahia">America/Bahia</SelectItem>
                                        <SelectItem value="America/Fortaleza">America/Fortaleza</SelectItem>
                                        <SelectItem value="America/Manaus">America/Manaus</SelectItem>
                                        <SelectItem value="America/Belem">America/Belem</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </form>
                            </FullScreenModal>
                          )}

                          <div className="space-y-4">
                            {companiesLoading ? (
                              <p className="text-center py-8 text-muted-foreground">Carregando empresas...</p>
                            ) : safeCompanies.length === 0 ? (
                              <p className="text-center py-8 text-muted-foreground">
                                Nenhuma empresa encontrada. Crie a primeira empresa para começar.
                              </p>
                            ) : (
                              renderedCompanies
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
                  {safeAllowedTabs.includes('archived') && (
                    <TabsContent value="archived" className="mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Itens arquivados</CardTitle>
                          <CardDescription>Consulte e gerencie todos os itens arquivados do sistema</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Filtros */}
                          <div className="flex gap-4 mb-4">
                            <div className="min-w-[180px]">
                              <Label className="mb-1 block">Tipo</Label>
                              <Select value={archivedType || 'all'} onValueChange={(v) => setArchivedType(v === 'all' ? '' : v)}>
                                <SelectTrigger className="brand-radius select-trigger-brand">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all" className="dropdown-item-brand">Todos</SelectItem>
                                  <SelectItem value="indicator" className="dropdown-item-brand">Indicador</SelectItem>
                                  <SelectItem value="lead" className="dropdown-item-brand">Lead</SelectItem>
                                  <SelectItem value="sale" className="dropdown-item-brand">Venda</SelectItem>
                                  <SelectItem value="administrator" className="dropdown-item-brand">Administradora</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="mb-1 block">Data</Label>
                              <Input id="filter-date" type="date" value={archivedDate} onChange={e => setArchivedDate(e.target.value)} className="brand-radius field-secondary-focus no-ring-focus" />
                            </div>
                          </div>
                          {/* Lista de itens arquivados */}
                          <div className="rounded-md overflow-hidden border" style={{ borderColor: '#333333', borderRadius: 'var(--brand-radius)' }}>
                            <div className="overflow-x-auto max-w-full">
                              <table className="min-w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold">Data arquivamento</th>
                                    <th className="px-3 py-2 text-left font-semibold">Tipo</th>
                                    <th className="px-3 py-2 text-left font-semibold">Descrição</th>
                                    <th className="px-3 py-2 text-center font-semibold">Ações</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {isLoadingArchived ? (
                                    <tr><td colSpan={4} className="text-center py-4">Carregando...</td></tr>
                                  ) : filteredArchived.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-4">Nenhum item arquivado encontrado.</td></tr>
                                  ) : filteredArchived.map((item, idx) => (
                                    <tr key={item.type + '-' + item.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                                      <td className="px-3 py-2">{item.archived_at ? new Date(item.archived_at).toLocaleDateString('pt-BR') : '-'}</td>
                                      <td className="px-3 py-2">{item.type === 'indicator' ? 'Indicador' : item.type === 'lead' ? 'Lead' : item.type === 'sale' ? 'Venda' : item.type === 'administrator' ? 'Administradora' : ''}</td>
                                      <td className="px-3 py-2">{item.description}</td>
                                      <td className="px-3 py-2 text-center">
                                        <div className="flex gap-2 justify-center">
                                          <Button variant="brandOutlineSecondaryHover" size="sm" onClick={() => handleRecover(item)} className="brand-radius">Recuperar</Button>
                                          <Button variant="destructive" size="sm" onClick={() => handleDelete(item)} className="brand-radius">Excluir</Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
                  {safeAllowedTabs.includes('accesses') && (
                    <TabsContent value="accesses" className="mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Permissões de Acesso</CardTitle>
                          <CardDescription>
                            Defina quais páginas e abas cada função pode acessar. Desmarque para ocultar do menu, botões e impedir acesso direto.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <AccessPermissionsTable />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
                  {safeAllowedTabs.includes('permissions') && (
                    <TabsContent value="permissions" className="mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Permissões de Acesso</CardTitle>
                          <CardDescription>
                            Defina quais páginas e abas cada função pode acessar. Desmarque para ocultar do menu, botões e impedir acesso direto.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <AccessPermissionsTable />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CrmMasterConfig;

function AccessPermissionsTable() {
  const { companyId } = useCrmAuth();
  const [permissions, setPermissions] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [pages, setPages] = useState<{ key: string; label: string; type: 'module' | 'page' | 'tab'; indent?: boolean }[]>([]);
  const [rawPages, setRawPages] = useState<any[]>([]);
  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [companyId]);
  const roles = [
    { key: 'admin', label: 'Administrador' },
    { key: 'leader', label: 'Líder' },
    { key: 'user', label: 'Usuário' },
  ];

  // Mapa de hierarquia: parent -> [children] e child -> parent
  const hierarchy = useMemo(() => {
    const parentToChildren: Record<string, string[]> = {};
    const childToParent: Record<string, string> = {};
    (rawPages || []).forEach((row: any) => {
      if (!row.parent_key) {
        if (!parentToChildren[row.key]) parentToChildren[row.key] = [];
      } else {
        if (!parentToChildren[row.parent_key]) parentToChildren[row.parent_key] = [];
        parentToChildren[row.parent_key].push(row.key);
        childToParent[row.key] = row.parent_key;
      }
    });
    return { parentToChildren, childToParent };
  }, [rawPages]);

  const handleChange = (role: string, itemKey: string, value: boolean) => {
    const isChild = !!hierarchy.childToParent[itemKey];
    const parentKey = isChild ? hierarchy.childToParent[itemKey] : itemKey;
    const children = hierarchy.parentToChildren[parentKey] || [];

    setPermissions((prev: any) => {
      const next = { ...prev };
      const rolePerms = { ...(next[role] || {}) };

      if (!isChild) {
        // Mudou uma página (pai): marcar/desmarcar todos os filhos
        rolePerms[parentKey] = value;
        for (const child of children) {
          rolePerms[child] = value;
        }
      } else {
        // Mudou uma aba (filho)
        rolePerms[itemKey] = value;
        if (value) {
          // Se marcar uma aba, marca o pai automaticamente
          rolePerms[parentKey] = true;
        } else {
          // Se desmarcar, verifica se ainda existe alguma aba marcada; se nenhuma, desmarca o pai
          const anyChildChecked = children.some((c) => (c === itemKey ? false : !!rolePerms[c]));
          rolePerms[parentKey] = anyChildChecked;
        }
      }

      next[role] = rolePerms;
      return next;
    });
  };

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    const rows = [];
    const itemsToSave = pages.filter(p => p.type !== 'module');
    for (const role of roles) {
      for (const page of itemsToSave) {
        rows.push({
          role: role.key,
          page: page.key,
          allowed: permissions?.[role.key]?.[page.key] ?? true,
          company_id: companyId,
        });
      }
    }
    const { error: delError } = await supabase
      .from('role_page_permissions')
      .delete()
      .eq('company_id', companyId);
    if (delError) {
      toast.error('Erro ao salvar permissões: ' + delError.message);
      setSaving(false);
      return;
    }
    const { error: insError } = await supabase
      .from('role_page_permissions')
      .insert(rows);
    if (insError) {
      toast.error('Erro ao salvar permissões: ' + insError.message);
      setSaving(false);
      return;
    }
    toast.success('Permissões salvas com sucesso!');
    setSaving(false);
  };

  const handleSyncStructure = async () => {
    if (!companyId) return;
    setSyncing(true);
    
    try {
      // 1. Buscar todas as páginas ativas do sistema
      const { data: activePages, error: pagesError } = await supabase
        .from('app_pages')
        .select('key, label, parent_key, module, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (pagesError) {
        toast.error('Erro ao buscar páginas: ' + pagesError.message);
        setSyncing(false);
        return;
      }

      // 2. Buscar permissões existentes
      const { data: existingPermissions, error: permsError } = await supabase
        .from('role_page_permissions')
        .select('*')
        .eq('company_id', companyId);
      
      if (permsError) {
        toast.error('Erro ao buscar permissões: ' + permsError.message);
        setSyncing(false);
        return;
      }

      // 3. Identificar páginas que precisam de permissões
      const pageKeys = activePages?.map(p => p.key) || [];
      const existingPageKeys = existingPermissions?.map(p => p.page) || [];
      
      const missingPages = pageKeys.filter(key => !existingPageKeys.includes(key));
      const obsoletePages = existingPageKeys.filter(key => !pageKeys.includes(key));

      // 4. Remover permissões de páginas obsoletas
      if (obsoletePages.length > 0) {
        const { error: delError } = await supabase
          .from('role_page_permissions')
          .delete()
          .eq('company_id', companyId)
          .in('page', obsoletePages);
        
        if (delError) {
          toast.error('Erro ao remover permissões obsoletas: ' + delError.message);
          setSyncing(false);
          return;
        }
      }

      // 5. Adicionar permissões para páginas que faltam
      if (missingPages.length > 0) {
        const newPermissions = [];
        for (const role of roles) {
          for (const pageKey of missingPages) {
            // Definir permissões padrão baseadas no tipo de página
            let defaultAllowed = true;
            if (pageKey.includes('config') || pageKey.includes('master')) {
              defaultAllowed = role.key === 'admin' || role.key === 'master';
            } else if (pageKey === 'profile') {
              defaultAllowed = true; // Todos podem acessar perfil
            } else if (pageKey === 'simulator') {
              defaultAllowed = true; // Todos podem acessar simulador
            }
            
            newPermissions.push({
              role: role.key,
              page: pageKey,
              allowed: defaultAllowed,
              company_id: companyId,
            });
          }
        }

        if (newPermissions.length > 0) {
          const { error: insError } = await supabase
            .from('role_page_permissions')
            .insert(newPermissions);
          
          if (insError) {
            toast.error('Erro ao adicionar novas permissões: ' + insError.message);
            setSyncing(false);
            return;
          }
        }
      }

      // 6. Recarregar dados
      await loadPages();
      await loadPermissions();
      
      const changes = [];
      if (missingPages.length > 0) changes.push(`${missingPages.length} páginas adicionadas`);
      if (obsoletePages.length > 0) changes.push(`${obsoletePages.length} páginas removidas`);
      
      if (changes.length > 0) {
        toast.success(`Estrutura sincronizada! ${changes.join(', ')}`);
      } else {
        toast.success('Estrutura já está atualizada!');
      }
      
    } catch (error) {
      toast.error('Erro durante sincronização: ' + (error as any).message);
    } finally {
      setSyncing(false);
    }
  };

  // Função mais robusta que lê dinamicamente toda a estrutura da plataforma
  const handleFullStructureSync = async () => {
    console.log('Iniciando sincronização completa...');
    if (!companyId) return;
    setSyncing(true);
    
    try {
      // 1. Definir estrutura real da aplicação
      const realStructure = [
        // CRM Module
        { key: 'dashboard', label: 'Dashboard', module: 'crm', parent_key: null, display_order: 5 },
        { key: 'comercial', label: 'Comercial', module: 'crm', parent_key: null, display_order: 30 },
        { key: 'comercial_leads', label: 'Leads', module: 'crm', parent_key: 'comercial', display_order: 31 },
        { key: 'comercial_sales', label: 'Vendas', module: 'crm', parent_key: 'comercial', display_order: 32 },
        
        { key: 'indicadores', label: 'Indicadores', module: 'crm', parent_key: null, display_order: 40 },
        { key: 'indicadores_performance', label: 'Performance', module: 'crm', parent_key: 'indicadores', display_order: 41 },
        { key: 'indicadores_registro', label: 'Registro de Indicadores', module: 'crm', parent_key: 'indicadores', display_order: 42 },
        { key: 'reports', label: 'Relatórios', module: 'crm', parent_key: null, display_order: 45 },
        
        // Simulator Module
        { key: 'simulator', label: 'Simulador', module: 'simulator', parent_key: null, display_order: 10 },
        { key: 'simulator_config', label: 'Configurações', module: 'simulator', parent_key: null, display_order: 20 },
        { key: 'simulator_config_administrators', label: 'Administradoras', module: 'simulator', parent_key: 'simulator_config', display_order: 201 },
        { key: 'simulator_config_reductions', label: 'Redução de Parcela', module: 'simulator', parent_key: 'simulator_config', display_order: 202 },
        { key: 'simulator_config_installments', label: 'Parcelas', module: 'simulator', parent_key: 'simulator_config', display_order: 203 },
        { key: 'simulator_config_products', label: 'Produtos', module: 'simulator', parent_key: 'simulator_config', display_order: 204 },
        { key: 'simulator_config_leverages', label: 'Alavancas', module: 'simulator', parent_key: 'simulator_config', display_order: 205 },
        
        // Settings Module
        { key: 'crm_config', label: 'Configurações CRM', module: 'settings', parent_key: null, display_order: 50 },
        { key: 'crm_config_funnels', label: 'Funis', module: 'settings', parent_key: 'crm_config', display_order: 51 },
        { key: 'crm_config_sources', label: 'Origens', module: 'settings', parent_key: 'crm_config', display_order: 52 },
        { key: 'crm_config_teams', label: 'Times', module: 'settings', parent_key: 'crm_config', display_order: 53 },
        { key: 'crm_config_users', label: 'Usuários', module: 'settings', parent_key: 'crm_config', display_order: 54 },
        { key: 'settings_users', label: 'Usuários', module: 'settings', parent_key: null, display_order: 60 },
        { key: 'settings_users_list', label: 'Lista de Usuários', module: 'settings', parent_key: 'settings_users', display_order: 601 },
        { key: 'settings_profile', label: 'Meu Perfil', module: 'settings', parent_key: null, display_order: 70 },
        { key: 'settings_profile_info', label: 'Informações Pessoais', module: 'settings', parent_key: 'settings_profile', display_order: 701 },
        { key: 'settings_profile_integrations', label: 'Integrações', module: 'settings', parent_key: 'settings_profile', display_order: 702 },
        { key: 'settings_profile_security', label: 'Segurança', module: 'settings', parent_key: 'settings_profile', display_order: 703 },
        { key: 'settings_company', label: 'Empresa', module: 'settings', parent_key: null, display_order: 80 },
        { key: 'settings_company_data', label: 'Dados da empresa', module: 'settings', parent_key: 'settings_company', display_order: 801 },
        { key: 'settings_company_branding', label: 'Identidade visual', module: 'settings', parent_key: 'settings_company', display_order: 802 },
        
        
        // Master Module
        { key: 'master_config', label: 'Configurações Master', module: 'master', parent_key: null, display_order: 200 },
        { key: 'master_config_companies', label: 'Empresas', module: 'master', parent_key: 'master_config', display_order: 201 },
        { key: 'master_config_archived', label: 'Itens arquivados', module: 'master', parent_key: 'master_config', display_order: 202 },
        { key: 'master_config_accesses', label: 'Acessos', module: 'master', parent_key: 'master_config', display_order: 203 },
        { key: 'master_config_permissions', label: 'Permissões', module: 'master', parent_key: 'master_config', display_order: 204 },
        
        // User Module
        { key: 'profile', label: 'Meu Perfil', module: 'user', parent_key: null, display_order: 100 },
      ];

      console.log('Estrutura real definida:', realStructure);

      // 2. Atualizar estrutura no banco de dados
      const { error: updateError } = await supabase
        .from('app_pages')
        .upsert(realStructure, { onConflict: 'key' });
      
      if (updateError) {
        console.error('Erro ao atualizar estrutura:', updateError);
        toast.error('Erro ao atualizar estrutura: ' + updateError.message);
        setSyncing(false);
        return;
      }

      console.log('Estrutura atualizada no banco!');

      // 3. Buscar permissões existentes
      const { data: existingPermissions, error: permsError } = await supabase
        .from('role_page_permissions')
        .select('*')
        .eq('company_id', companyId);
      
      if (permsError) {
        console.error('Erro ao buscar permissões:', permsError);
        toast.error('Erro ao buscar permissões: ' + permsError.message);
        setSyncing(false);
        return;
      }

      console.log('Permissões existentes:', existingPermissions);

      // 4. Identificar mudanças
      const realPageKeys = realStructure.map(p => p.key);
      const existingPageKeys = existingPermissions?.map(p => p.page) || [];
      
      const missingPages = realPageKeys.filter(key => !existingPageKeys.includes(key));
      const obsoletePages = existingPageKeys.filter(key => !realPageKeys.includes(key));

      console.log('Páginas faltando:', missingPages);
      console.log('Páginas obsoletas:', obsoletePages);

      // 5. Remover permissões obsoletas
      if (obsoletePages.length > 0) {
        const { error: delError } = await supabase
          .from('role_page_permissions')
          .delete()
          .eq('company_id', companyId)
          .in('page', obsoletePages);
        
        if (delError) {
          console.error('Erro ao remover permissões obsoletas:', delError);
          toast.error('Erro ao remover permissões obsoletas: ' + delError.message);
          setSyncing(false);
          return;
        }
        console.log('Permissões obsoletas removidas!');
      }

      // 6. Adicionar permissões para páginas que faltam
      if (missingPages.length > 0) {
        const newPermissions = [];
        for (const role of roles) {
          for (const pageKey of missingPages) {
            // Definir permissões padrão baseadas no tipo de página
            let defaultAllowed = true;
            if (pageKey.includes('config') || pageKey.includes('master')) {
              defaultAllowed = role.key === 'admin' || role.key === 'master';
            } else if (pageKey === 'profile') {
              defaultAllowed = true; // Todos podem acessar perfil
            } else if (pageKey === 'simulator') {
              defaultAllowed = true; // Todos podem acessar simulador
            }
            
            newPermissions.push({
              role: role.key,
              page: pageKey,
              allowed: defaultAllowed,
              company_id: companyId,
            });
          }
        }

        console.log('Novas permissões a serem inseridas:', newPermissions);

        if (newPermissions.length > 0) {
          const { error: insError } = await supabase
            .from('role_page_permissions')
            .insert(newPermissions);
          
          if (insError) {
            console.error('Erro ao adicionar novas permissões:', insError);
            toast.error('Erro ao adicionar novas permissões: ' + insError.message);
            setSyncing(false);
            return;
          }
          console.log('Novas permissões inseridas!');
        }
      }

      // 7. Recarregar dados
      console.log('Recarregando dados...');
      await loadPages();
      await loadPermissions();
      
      const changes = [];
      if (missingPages.length > 0) changes.push(`${missingPages.length} páginas adicionadas`);
      if (obsoletePages.length > 0) changes.push(`${obsoletePages.length} páginas removidas`);
      
      if (changes.length > 0) {
        console.log('Sincronização completa!', changes);
        toast.success(`Estrutura completa sincronizada! ${changes.join(', ')}`);
      } else {
        console.log('Estrutura já estava atualizada!');
        toast.success('Estrutura já está atualizada!');
      }
      
    } catch (error) {
      console.error('Erro durante sincronização:', error);
      toast.error('Erro durante sincronização: ' + (error as any).message);
    } finally {
      setSyncing(false);
    }
  };

  // Função para recarregar páginas
  const loadPages = async () => {
    const { data, error } = await supabase
      .from('app_pages')
      .select('key,label,parent_key,module,display_order,is_active')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) {
      toast.error('Erro ao carregar páginas: ' + error.message);
      return;
    }
    const parents = (data || []).filter(p => !p.parent_key);
    const children = (data || []).filter(p => !!p.parent_key);
    setRawPages(data || []);

    // Agrupar por módulo e ordenar por display_order
    const moduleToParents: Record<string, any[]> = {};
    parents.forEach(p => {
      const mod = p.module || 'outros';
      if (!moduleToParents[mod]) moduleToParents[mod] = [];
      moduleToParents[mod].push(p);
    });
    const moduleOrder = Object.entries(moduleToParents)
      .map(([mod, arr]) => [mod, Math.min(...arr.map((x: any) => x.display_order || 0))] as const)
      .sort((a, b) => a[1] - b[1])
      .map(([mod]) => mod);

    const moduleLabel = (m: string) => m === 'simulator' ? 'Simulador' : m === 'settings' ? 'Configurações' : m === 'crm' ? 'CRM' : (m.charAt(0).toUpperCase() + m.slice(1));

    const list: { key: string; label: string; type: 'module' | 'page' | 'tab'; indent?: boolean }[] = [];
    moduleOrder.forEach(mod => {
      list.push({ key: `__module__:${mod}`, label: moduleLabel(mod), type: 'module' });
      const modParents = (moduleToParents[mod] || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      modParents.forEach(p => {
        list.push({ key: p.key, label: p.label, type: 'page' });
        children
          .filter(c => c.parent_key === p.key)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .forEach(c => {
            list.push({ key: c.key, label: c.label, type: 'tab', indent: true });
          });
      });
    });
    setPages(list);
  };

  // Função para recarregar permissões
  const loadPermissions = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('role_page_permissions')
      .select('*')
      .eq('company_id', companyId);
    
    if (error) {
      toast.error('Erro ao carregar permissões: ' + error.message);
      setLoading(false);
      return;
    }
    
    const perms: any = {};
    roles.forEach(r => { perms[r.key] = {}; });
    data?.forEach((row: any) => {
      if (!perms[row.role]) perms[row.role] = {};
      perms[row.role][row.page] = row.allowed;
    });
    setPermissions(perms);
    setLoading(false);
  };

  const safePermissions = permissions && typeof permissions === 'object' ? permissions : {};

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando permissões...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md overflow-hidden border" style={{ borderColor: '#333333', borderRadius: 'var(--brand-radius)' }}>
        <div className="overflow-x-auto max-w-full">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Módulo / Página / Abas</th>
                {roles.map(role => (
                  <th key={role.key} className="px-3 py-2 text-center font-semibold">{role.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map((item, idx) => (
                <tr key={item.key} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                  <td className={`px-3 py-2 ${item.type === 'module' ? 'font-semibold' : 'font-medium'}${item.type === 'page' ? ' pl-6' : ''}${item.type === 'tab' ? ' pl-12' : ''}`}>{item.label}</td>
                  {roles.map(role => (
                    <td key={role.key} className="px-3 py-2 text-center">
                      {item.type !== 'module' ? (
                        <div className="inline-flex items-center justify-center">
                          <Checkbox
                            checked={safePermissions?.[role.key]?.[item.key] ?? true}
                            onCheckedChange={(v) => handleChange(role.key, item.key, Boolean(v))}
                            className="h-5 w-5"
                          />
                        </div>
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">* Apenas usuários Master podem editar essas permissões.</div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="brand-radius"
            onClick={handleSyncStructure}
            disabled={syncing}
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar Estrutura'}
          </Button>
          <Button
            variant="outline"
            className="brand-radius"
            onClick={handleFullStructureSync}
            disabled={syncing}
          >
            {syncing ? 'Sincronizando...' : 'Sincronização Completa'}
          </Button>
          <Button
            variant="brandPrimaryToSecondary"
            className="brand-radius"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar Permissões'}
          </Button>
        </div>
      </div>
    </div>
  );
}
