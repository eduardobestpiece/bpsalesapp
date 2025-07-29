
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FunnelsList } from '@/components/CRM/Configuration/FunnelsList';
import { SourcesList } from '@/components/CRM/Configuration/SourcesList';
import { TeamsList } from '@/components/CRM/Configuration/TeamsList';
import { UsersList } from '@/components/CRM/Configuration/UsersList';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { supabase } from '@/integrations/supabase/client';

const CrmConfiguracoes = () => {
  const { companyId, userRole } = useCrmAuth();
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [defaultTab, setDefaultTab] = useState<string>('funnels');
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
        if (data?.find((p: any) => p.page === 'crm_config_funnels' && p.allowed !== false)) tabs.push('funnels');
        if (data?.find((p: any) => p.page === 'crm_config_sources' && p.allowed !== false)) tabs.push('sources');
        if (data?.find((p: any) => p.page === 'crm_config_teams' && p.allowed !== false)) tabs.push('teams');
        if (data?.find((p: any) => p.page === 'crm_config_users' && p.allowed !== false)) tabs.push('users');
        setAllowedTabs(tabs);
        setDefaultTab(tabs[0] || 'funnels');
        setTabsLoading(false);
      });
  }, [companyId, userRole]);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted/30">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-full mx-auto">
          <div className="bg-card/95 backdrop-blur-sm rounded-3xl shadow-xl border border-border p-1">
            <div className="bg-card rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold text-foreground">Configurações CRM</h2>
                <p className="text-muted-foreground">
                  Gerencie funis, times, origens e usuários
                </p>
              </div>

              {allowedTabs.length > 0 && (
                <Tabs defaultValue={defaultTab} className="w-full">
                  <TabsList className={`grid w-full grid-cols-${allowedTabs.length}`}>
                    {allowedTabs.includes('funnels') && (
                      <TabsTrigger value="funnels">Funis</TabsTrigger>
                    )}
                    {allowedTabs.includes('sources') && (
                      <TabsTrigger value="sources">Origens</TabsTrigger>
                    )}
                    {allowedTabs.includes('teams') && (
                      <TabsTrigger value="teams">Times</TabsTrigger>
                    )}
                    {allowedTabs.includes('users') && (
                      <TabsTrigger value="users">Usuários</TabsTrigger>
                    )}
                  </TabsList>
                  {allowedTabs.includes('funnels') && (
                    <TabsContent value="funnels" className="mt-6">
                      <FunnelsList />
                    </TabsContent>
                  )}
                  {allowedTabs.includes('sources') && (
                    <TabsContent value="sources" className="mt-6">
                      <SourcesList />
                    </TabsContent>
                  )}
                  {allowedTabs.includes('teams') && (
                    <TabsContent value="teams" className="mt-6">
                      <TeamsList />
                    </TabsContent>
                  )}
                  {allowedTabs.includes('users') && (
                    <TabsContent value="users" className="mt-6">
                      <UsersList />
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

export default CrmConfiguracoes;
