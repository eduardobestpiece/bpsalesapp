
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadsList } from '@/components/CRM/LeadsList';
import { SalesList } from '@/components/CRM/SalesList';
import { AgendaScheduler } from '@/components/CRM/AgendaScheduler';
import { AgendaTemp } from '@/components/CRM/AgendaTemp';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { supabase } from '@/integrations/supabase/client';

const CrmDashboard = () => {
  const { companyId, userRole } = useCrmAuth();
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [defaultTab, setDefaultTab] = useState<string>('leads');
  const [tabsLoading, setTabsLoading] = useState(true);
  const [tabsError, setTabsError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !userRole) return;

    // Master tem acesso total
    if (userRole === 'master') {
      setAllowedTabs(['leads', 'sales', 'agenda', 'agenda_temp']);
      setDefaultTab('agenda');
      setTabsLoading(false);
      setTabsError(null);
      return;
    }

    setTabsLoading(true);
    setTabsError(null);
    supabase
      .from('role_page_permissions')
      .select('page, allowed')
      .eq('company_id', companyId)
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
        const agendaAllowed = pages.has('comercial_agenda') ? pages.get('comercial_agenda') !== false : true;
        if (leadsAllowed) tabs.push('leads');
        if (salesAllowed) tabs.push('sales');
        if (agendaAllowed) { tabs.push('agenda'); tabs.push('agenda_temp'); }
        setAllowedTabs(tabs);
        setDefaultTab(tabs.includes('agenda') ? 'agenda' : (tabs[0] || 'leads'));
        setTabsLoading(false);
      });
  }, [companyId, userRole]);

  if (!companyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Carregando informações da empresa...</p>
          </div>
        </main>
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-background to-muted/10 dark:from-[#131313] dark:via-[#1E1E1E] dark:to-[#161616]">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-full mx-auto">
          <div className="bg-background/90 backdrop-blur-sm rounded-3xl shadow-xl border border-border/50 p-1">
            <div className="bg-card rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold">Comercial</h2>
                <p className="text-muted-foreground">
                  Gerencie seus leads e vendas
                </p>
              </div>

              {allowedTabs.length > 0 && (
                <Tabs defaultValue={defaultTab} className="w-full">
                  <TabsList className="mb-2 flex w-full gap-2">
                    {allowedTabs.includes('leads') && (
                      <TabsTrigger className="flex-1 brand-radius" value="leads">Leads</TabsTrigger>
                    )}
                    {allowedTabs.includes('sales') && (
                      <TabsTrigger className="flex-1 brand-radius" value="sales">Vendas</TabsTrigger>
                    )}
                    {allowedTabs.includes('agenda') && (
                      <TabsTrigger className="flex-1 brand-radius" value="agenda">Agenda</TabsTrigger>
                    )}
                    {allowedTabs.includes('agenda_temp') && (
                      <TabsTrigger className="flex-1 brand-radius" value="agenda_temp">Agenda Temporaria</TabsTrigger>
                    )}
                  </TabsList>
                  {allowedTabs.includes('leads') && (
                    <TabsContent value="leads" className="mt-6">
                      <LeadsList companyId={companyId} />
                    </TabsContent>
                  )}
                  {allowedTabs.includes('sales') && (
                    <TabsContent value="sales" className="mt-6">
                      <SalesList companyId={companyId} />
                    </TabsContent>
                  )}
                  {allowedTabs.includes('agenda') && (
                    <TabsContent value="agenda" className="mt-6">
                      <AgendaScheduler companyId={companyId!} />
                    </TabsContent>
                  )}
                  {allowedTabs.includes('agenda_temp') && (
                    <TabsContent value="agenda_temp" className="mt-6">
                      <AgendaTemp companyId={companyId!} />
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

export default CrmDashboard;
