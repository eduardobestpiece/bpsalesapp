
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Table, Kanban } from 'lucide-react';
import { LeadsList } from '@/components/CRM/LeadsList';
import { LeadsTable } from '@/components/CRM/LeadsTable';
import { LeadsFilters } from '@/components/CRM/LeadsFilters';
import { LeadsKanban } from '@/components/CRM/LeadsKanban';
import { SalesList } from '@/components/CRM/SalesList';
import { LeadModal } from '@/components/CRM/LeadModal';

import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const CrmDashboard = () => {
  const { companyId, userRole } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const effectiveCompanyId = selectedCompanyId || companyId;
  
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [defaultTab, setDefaultTab] = useState<string>('leads');
  const [tabsLoading, setTabsLoading] = useState(true);
  const [tabsError, setTabsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFunnelIds, setSelectedFunnelIds] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Auto-switch para tabela quando múltiplos funis são selecionados
  useEffect(() => {
    if (selectedFunnelIds.length > 1 && viewMode === 'kanban') {
      setViewMode('table');
    }
  }, [selectedFunnelIds.length, viewMode]);

  const handleEditLead = (lead: any) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
  };

  const handleCloseLeadModal = () => {
    setShowLeadModal(false);
    setSelectedLead(null);
  };

  // Buscar cores da empresa para o estilo das abas
  const { data: branding } = useQuery({
    queryKey: ['company_branding', effectiveCompanyId],
    enabled: !!effectiveCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .maybeSingle();
      return data;
    }
  });

  const primaryColor = branding?.primary_color || '#A86F57';

  useEffect(() => {
    if (!effectiveCompanyId || !userRole) return;

    // Master tem acesso total
    if (userRole === 'master') {
      setAllowedTabs(['leads', 'sales']);
      setDefaultTab('leads');
      setTabsLoading(false);
      setTabsError(null);
      return;
    }

    setTabsLoading(true);
    setTabsError(null);
    supabase
      .from('role_page_permissions')
      .select('page, allowed')
      .eq('company_id', effectiveCompanyId)
      .eq('role', userRole)
      .then(({ data, error }) => {
        if (error) {
          setTabsError('Erro ao carregar permissões.');
          setTabsLoading(false);
          return;
        }
        const tabs: string[] = [];
        const pages = new Map((data || []).map((p: any) => [p.page, p.allowed]));
        const leadsAllowed = pages.has('comercial_leads') ? pages.get('comercial_leads') !== false : true;
        const salesAllowed = pages.has('comercial_sales') ? pages.get('comercial_sales') !== false : true;
        if (leadsAllowed) tabs.push('leads');
        if (salesAllowed) tabs.push('sales');
        setAllowedTabs(tabs);
        setDefaultTab(tabs[0] || 'leads');
        setTabsLoading(false);
      });
  }, [effectiveCompanyId, userRole]);

  if (!effectiveCompanyId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando informações da empresa...</p>
      </div>
    );
  }

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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Comercial</h1>
        <p className="text-muted-foreground">Gerencie seus leads e vendas</p>
      </div>

      <Card className="shadow-xl border-0 bg-card">
        <CardContent className="p-0">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="flex items-end border-b border-border/30 bg-transparent p-0 rounded-none justify-start w-fit">
              {allowedTabs.includes('leads') && (
                <>
                  <TabsTrigger 
                    value="leads" 
                    className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[var(--tab-active-color)]"
                    style={{ 
                      '--tab-active-color': primaryColor 
                    } as React.CSSProperties}
                  >
                    Leads
                  </TabsTrigger>
                  <div className="w-px h-6 bg-border/30 self-center"></div>
                </>
              )}
              {allowedTabs.includes('sales') && (
                <TabsTrigger 
                  value="sales" 
                  className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[var(--tab-active-color)]"
                  style={{ 
                    '--tab-active-color': primaryColor 
                  } as React.CSSProperties}
                >
                  Vendas
                </TabsTrigger>
              )}
            </TabsList>
            
            {allowedTabs.includes('leads') && (
              <TabsContent value="leads" className="p-6">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">Leads</h2>
                      <p className="text-muted-foreground mt-1">Gerencie seus leads e oportunidades</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Toggle de visualização */}
                      <div className="flex items-center border border-border rounded-lg p-1">
                        <Button
                          variant={viewMode === 'table' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('table')}
                          className="h-8 px-3 text-xs"
                        >
                          <Table className="w-3 h-3 mr-1" />
                          Lista
                        </Button>
                        <Button
                          variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('kanban')}
                          disabled={selectedFunnelIds.length !== 1}
                          className="h-8 px-3 text-xs"
                          title={selectedFunnelIds.length !== 1 ? 'Selecione exatamente um funil para usar o Kanban' : ''}
                        >
                          <Kanban className="w-3 h-3 mr-1" />
                          Kanban
                        </Button>
                      </div>
                      
                      <Button 
                        onClick={() => setShowLeadModal(true)} 
                        disabled={userRole === 'submaster'}
                        variant="brandPrimaryToSecondary"
                        className="brand-radius"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Lead
                      </Button>
                    </div>
                  </div>
                  <LeadsFilters
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    selectedFunnelIds={selectedFunnelIds}
                    onSelectedFunnelIdsChange={setSelectedFunnelIds}
                  />
                  {viewMode === 'table' ? (
                    <LeadsTable 
                      searchTerm={searchTerm} 
                      selectedFunnelIds={selectedFunnelIds}
                      onEdit={handleEditLead} 
                    />
                  ) : (
                    <LeadsKanban
                      searchTerm={searchTerm}
                      selectedFunnelIds={selectedFunnelIds}
                      onEdit={handleEditLead}
                    />
                  )}
                </div>
              </TabsContent>
            )}
            
            {allowedTabs.includes('sales') && (
              <TabsContent value="sales" className="p-6">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">Vendas</h2>
                      <p className="text-muted-foreground mt-1">Acompanhe suas vendas e resultados</p>
                    </div>
                  </div>
                  <SalesList companyId={effectiveCompanyId} />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
      <LeadModal
        isOpen={showLeadModal}
        onClose={handleCloseLeadModal}
        companyId={effectiveCompanyId}
        lead={selectedLead}
      />
    </div>
  );
};

export default CrmDashboard;
