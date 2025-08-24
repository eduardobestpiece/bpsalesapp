
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Archive, Search } from 'lucide-react';
import { useFunnels, useDeleteFunnel } from '@/hooks/useFunnels';
import { useSources, useDeleteSource } from '@/hooks/useSources';
import { useTeams, useDeleteTeam } from '@/hooks/useTeams';
import { toast } from 'sonner';
import { FunnelModal } from '@/components/CRM/Configuration/FunnelModal';
import { SourceModal } from '@/components/CRM/Configuration/SourceModal';
import { TeamModal } from '@/components/CRM/Configuration/TeamModal';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function SettingsCrm() {
  const { userRole, companyId } = useCrmAuth();
  const { selectedCompanyId } = useCompany();

  // Estados para modais
  const [showFunnelModal, setShowFunnelModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  
  // Estados para itens selecionados
  const [selectedFunnel, setSelectedFunnel] = useState<any>(null);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  
  // Estados para busca
  const [funnelSearchTerm, setFunnelSearchTerm] = useState('');
  const [sourceSearchTerm, setSourceSearchTerm] = useState('');
  const [teamSearchTerm, setTeamSearchTerm] = useState('');

  // Dados
  const { data: funnels = [], isLoading: funnelsLoading } = useFunnels(selectedCompanyId || companyId);
  const { data: sources = [], isLoading: sourcesLoading } = useSources();
  const { data: teams = [], isLoading: teamsLoading } = useTeams();

  // Mutations
  const deleteFunnelMutation = useDeleteFunnel();
  const deleteSourceMutation = useDeleteSource();
  const deleteTeamMutation = useDeleteTeam();

  const { data: perms = {} } = useQuery({
    queryKey: ['role_page_permissions', companyId, userRole],
    enabled: !!companyId && !!userRole,
    queryFn: async () => {
      const { data } = await supabase
        .from('role_page_permissions')
        .select('*')
        .eq('company_id', companyId as string)
        .eq('role', userRole as any);
      const map: Record<string, boolean> = {};
      data?.forEach((r: any) => { map[r.page] = r.allowed; });
      return map;
    }
  });

  // Buscar cores da empresa
  const { data: branding } = useQuery({
    queryKey: ['company_branding', selectedCompanyId || companyId],
    enabled: !!(selectedCompanyId || companyId),
    queryFn: async () => {
      const { data } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', selectedCompanyId || companyId)
        .maybeSingle();
      return data;
    }
  });

  const primaryColor = branding?.primary_color || '#A86F57';

  const canFunnels = perms['crm_config_funnels'] !== false;
  const canSources = perms['crm_config_sources'] !== false;
  const canTeams = perms['crm_config_teams'] !== false;

  const allowedOrder: { key: string; allowed: boolean }[] = [
    { key: 'funnels', allowed: canFunnels },
    { key: 'sources', allowed: canSources },
    { key: 'teams', allowed: canTeams },
  ];
  const firstAllowed = allowedOrder.find(i => i.allowed)?.key;
  const [tabValue, setTabValue] = useState<string>(firstAllowed || 'funnels');
  useEffect(() => {
    const next = allowedOrder.find(i => i.allowed)?.key || 'funnels';
    if (!allowedOrder.find(i => i.key === tabValue && i.allowed)) {
      setTabValue(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFunnels, canSources, canTeams]);

  // Handlers para funis
  const handleFunnelEdit = (funnel: any) => {
    setSelectedFunnel(funnel);
    setShowFunnelModal(true);
  };

  const handleFunnelCloseModal = () => {
    setShowFunnelModal(false);
    setSelectedFunnel(null);
  };

  const handleFunnelArchive = async (funnelId: string) => {
    try {
      await deleteFunnelMutation.mutateAsync(funnelId);
      toast.success('Funil arquivado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao arquivar funil');
    }
  };

  // Handlers para origens
  const handleSourceEdit = (source: any) => {
    setSelectedSource(source);
    setShowSourceModal(true);
  };

  const handleSourceCloseModal = () => {
    setShowSourceModal(false);
    setSelectedSource(null);
  };

  const handleSourceArchive = async (sourceId: string) => {
    try {
      await deleteSourceMutation.mutateAsync(sourceId);
      toast.success('Origem arquivada com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao arquivar origem');
    }
  };

  // Handlers para times
  const handleTeamEdit = (team: any) => {
    setSelectedTeam(team);
    setShowTeamModal(true);
  };

  const handleTeamCloseModal = () => {
    setShowTeamModal(false);
    setSelectedTeam(null);
  };

  const handleTeamArchive = async (teamId: string) => {
    try {
      await deleteTeamMutation.mutateAsync(teamId);
      toast.success('Time arquivado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao arquivar time');
    }
  };

  // Funções auxiliares
  const getVerificationTypeLabel = (type: string) => {
    const labels = {
      daily: 'Diário',
      weekly: 'Semanal',
      monthly: 'Mensal'
    };
    return labels[type as keyof typeof labels] || type;
  };

  // Filtros
  const filteredFunnels = funnels.filter(funnel =>
    funnel.name?.toLowerCase().includes(funnelSearchTerm.toLowerCase())
  );

  const filteredSources = sources.filter(source =>
    source.name?.toLowerCase().includes(sourceSearchTerm.toLowerCase())
  );

  const filteredTeams = teams.filter(team =>
    team.name?.toLowerCase().includes(teamSearchTerm.toLowerCase())
  );

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Configurações CRM</h1>
                  <p className="text-muted-foreground">Gerencie funis, times e origens</p>
                </div>

      <Card className="shadow-xl border-0 bg-card">
        <CardContent className="p-0">
                <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
            <TabsList className="flex items-end border-b border-border/30 bg-transparent p-0 rounded-none justify-start w-fit">
              {canFunnels && (
                <>
                  <TabsTrigger 
                    value="funnels" 
                    className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
                    style={{ '--tab-active-color': primaryColor } as React.CSSProperties}
                  >
                    Funis
                  </TabsTrigger>
                  <div className="w-px h-6 bg-border/30 self-center"></div>
                </>
              )}
              {canSources && (
                <>
                  <TabsTrigger 
                    value="sources" 
                    className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
                    style={{ '--tab-active-color': primaryColor } as React.CSSProperties}
                  >
                    Origens
                  </TabsTrigger>
                  <div className="w-px h-6 bg-border/30 self-center"></div>
                </>
              )}
              {canTeams && (
                <TabsTrigger 
                  value="teams" 
                  className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
                  style={{ '--tab-active-color': primaryColor } as React.CSSProperties}
                >
                  Times
                </TabsTrigger>
              )}
                  </TabsList>

                  {canFunnels && (
              <TabsContent value="funnels" className="p-6">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">Funis de Vendas</h2>
                      <p className="text-muted-foreground mt-1">Gerencie os funis de vendas da empresa</p>
                    </div>
                    <Button onClick={() => setShowFunnelModal(true)} variant="brandPrimaryToSecondary" className="brand-radius">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Funil
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Pesquisar por nome..."
                      value={funnelSearchTerm}
                      onChange={(e) => setFunnelSearchTerm(e.target.value)}
                      className="pl-10 field-secondary-focus no-ring-focus brand-radius"
                    />
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left py-2">Nome</TableHead>
                        <TableHead className="text-left py-2">Status</TableHead>
                        <TableHead className="text-left py-2">Verificação</TableHead>
                        <TableHead className="text-left py-2">Etapas</TableHead>
                        <TableHead className="text-right py-2">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {funnelsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-2">
                            Carregando funis...
                          </TableCell>
                        </TableRow>
                      ) : filteredFunnels.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                            {funnelSearchTerm ? 'Nenhum funil encontrado com este termo.' : 'Nenhum funil encontrado. Crie o primeiro funil para começar.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFunnels.map((funnel) => (
                          <TableRow key={funnel.id}>
                            <TableCell className="font-medium py-2">{funnel.name}</TableCell>
                            <TableCell className="py-2">
                              {funnel.status === 'active' ? (
                                <Badge
                                  className="text-white"
                                  style={{ backgroundColor: 'var(--brand-primary, #A86F57)', borderRadius: 'var(--brand-radius, 8px)' }}
                                >
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge variant="destructive" style={{ borderRadius: 'var(--brand-radius, 8px)' }}>
                                  Inativo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-2">
                              {getVerificationTypeLabel(funnel.verification_type)}
                              {funnel.verification_day && ` - Dia ${funnel.verification_day}`}
                            </TableCell>
                            <TableCell className="py-2">{funnel.stages?.length || 0} etapas</TableCell>
                            <TableCell className="text-right py-2">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="brandOutlineSecondaryHover"
                                  size="sm"
                                  onClick={() => handleFunnelEdit(funnel)}
                                  className="brand-radius"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {funnel.status === 'active' && (
                                  <Button
                                    variant="brandOutlineSecondaryHover"
                                    size="sm"
                                    onClick={() => handleFunnelArchive(funnel.id)}
                                    className="brand-radius"
                                  >
                                    <Archive className="w-4 h-4" />
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
                    </TabsContent>
                  )}
                  {canSources && (
              <TabsContent value="sources" className="p-6">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">Origens de Leads</h2>
                      <p className="text-muted-foreground mt-1">Gerencie as origens de leads da empresa</p>
                    </div>
                    <Button onClick={() => setShowSourceModal(true)} variant="brandPrimaryToSecondary" className="brand-radius">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Origem
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Pesquisar por nome..."
                      value={sourceSearchTerm}
                      onChange={(e) => setSourceSearchTerm(e.target.value)}
                      className="pl-10 field-secondary-focus no-ring-focus brand-radius"
                    />
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left py-2">Nome</TableHead>
                        <TableHead className="text-left py-2">Status</TableHead>
                        <TableHead className="text-left py-2">Descrição</TableHead>
                        <TableHead className="text-right py-2">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sourcesLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-2">
                            Carregando origens...
                          </TableCell>
                        </TableRow>
                      ) : filteredSources.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            {sourceSearchTerm ? 'Nenhuma origem encontrada com este termo.' : 'Nenhuma origem encontrada. Crie a primeira origem para começar.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSources.map((source) => (
                          <TableRow key={source.id}>
                            <TableCell className="font-medium py-2">{source.name}</TableCell>
                            <TableCell className="py-2">
                              {source.status === 'active' ? (
                                <Badge
                                  className="text-white"
                                  style={{ backgroundColor: 'var(--brand-primary, #A86F57)', borderRadius: 'var(--brand-radius, 8px)' }}
                                >
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge variant="destructive" style={{ borderRadius: 'var(--brand-radius, 8px)' }}>
                                  Inativo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-2">{source.description || 'Sem descrição'}</TableCell>
                            <TableCell className="text-right py-2">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="brandOutlineSecondaryHover"
                                  size="sm"
                                  onClick={() => handleSourceEdit(source)}
                                  className="brand-radius"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {source.status === 'active' && (
                                  <Button
                                    variant="brandOutlineSecondaryHover"
                                    size="sm"
                                    onClick={() => handleSourceArchive(source.id)}
                                    className="brand-radius"
                                  >
                                    <Archive className="w-4 h-4" />
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
                    </TabsContent>
                  )}
                  {canTeams && (
              <TabsContent value="teams" className="p-6">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">Times de Vendas</h2>
                      <p className="text-muted-foreground mt-1">Gerencie os times de vendas da empresa</p>
                    </div>
                    <Button onClick={() => setShowTeamModal(true)} variant="brandPrimaryToSecondary" className="brand-radius">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Time
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Pesquisar por nome..."
                      value={teamSearchTerm}
                      onChange={(e) => setTeamSearchTerm(e.target.value)}
                      className="pl-10 field-secondary-focus no-ring-focus brand-radius"
                    />
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left py-2">Nome</TableHead>
                        <TableHead className="text-left py-2">Status</TableHead>
                        <TableHead className="text-left py-2">Descrição</TableHead>
                        <TableHead className="text-left py-2">Membros</TableHead>
                        <TableHead className="text-right py-2">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-2">
                            Carregando times...
                          </TableCell>
                        </TableRow>
                      ) : filteredTeams.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                            {teamSearchTerm ? 'Nenhum time encontrado com este termo.' : 'Nenhum time encontrado. Crie o primeiro time para começar.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTeams.map((team) => (
                          <TableRow key={team.id}>
                            <TableCell className="font-medium py-2">{team.name}</TableCell>
                            <TableCell className="py-2">
                              {team.status === 'active' ? (
                                <Badge
                                  className="text-white"
                                  style={{ backgroundColor: 'var(--brand-primary, #A86F57)', borderRadius: 'var(--brand-radius, 8px)' }}
                                >
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge variant="destructive" style={{ borderRadius: 'var(--brand-radius, 8px)' }}>
                                  Inativo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-2">{team.description || 'Sem descrição'}</TableCell>
                            <TableCell className="py-2">{team.members?.length || 0} membros</TableCell>
                            <TableCell className="text-right py-2">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="brandOutlineSecondaryHover"
                                  size="sm"
                                  onClick={() => handleTeamEdit(team)}
                                  className="brand-radius"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {team.status === 'active' && (
                                  <Button
                                    variant="brandOutlineSecondaryHover"
                                    size="sm"
                                    onClick={() => handleTeamArchive(team.id)}
                                    className="brand-radius"
                                  >
                                    <Archive className="w-4 h-4" />
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
                    </TabsContent>
                  )}
                </Tabs>
        </CardContent>
      </Card>

      {/* Modais */}
      <FunnelModal
        isOpen={showFunnelModal}
        onClose={handleFunnelCloseModal}
        funnel={selectedFunnel}
      />
      
      <SourceModal
        isOpen={showSourceModal}
        onClose={handleSourceCloseModal}
        source={selectedSource}
      />
      
      <TeamModal
        isOpen={showTeamModal}
        onClose={handleTeamCloseModal}
        team={selectedTeam}
      />
    </>
  );
} 