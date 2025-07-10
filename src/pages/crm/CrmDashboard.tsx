
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadsList } from '@/components/CRM/LeadsList';
import { SalesList } from '@/components/CRM/SalesList';
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
        const tabs = [];
        if (data?.find((p: any) => p.page === 'comercial_leads' && p.allowed !== false)) tabs.push('leads');
        if (data?.find((p: any) => p.page === 'comercial_sales' && p.allowed !== false)) tabs.push('sales');
        setAllowedTabs(tabs);
        setDefaultTab(tabs[0] || 'leads');
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-full mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-1">
            <div className="bg-white rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold">Comercial</h2>
                <p className="text-muted-foreground">
                  Gerencie seus leads e vendas
                </p>
              </div>

              {allowedTabs.length > 0 && (
                <Tabs defaultValue={defaultTab} className="w-full">
                  <TabsList className={`grid w-full grid-cols-${allowedTabs.length}`}>
                    {allowedTabs.includes('leads') && (
                      <TabsTrigger value="leads">Leads</TabsTrigger>
                    )}
                    {allowedTabs.includes('sales') && (
                      <TabsTrigger value="sales">Vendas</TabsTrigger>
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
