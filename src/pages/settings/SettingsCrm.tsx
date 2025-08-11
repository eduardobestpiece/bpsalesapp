
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsLayout } from '@/components/Layout/SettingsLayout';
import { FunnelsList } from '@/components/CRM/Configuration/FunnelsList';
import { SourcesList } from '@/components/CRM/Configuration/SourcesList';
import { TeamsList } from '@/components/CRM/Configuration/TeamsList';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function SettingsCrm() {
  const { userRole, companyId } = useCrmAuth();

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

  return (
    <SettingsLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted/30">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-full mx-auto">
            <div className="bg-card/95 backdrop-blur-sm rounded-3xl shadow-xl border border-border p-1">
              <div className="bg-card rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
                <div className="text-center space-y-2 mb-8">
                  <h2 className="text-2xl font-bold text-foreground">Configurações CRM</h2>
                  <p className="text-muted-foreground">Gerencie funis, times e origens</p>
                </div>
                <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    {canFunnels && <TabsTrigger value="funnels">Funis</TabsTrigger>}
                    {canSources && <TabsTrigger value="sources">Origens</TabsTrigger>}
                    {canTeams && <TabsTrigger value="teams">Times</TabsTrigger>}
                  </TabsList>
                  {canFunnels && (
                    <TabsContent value="funnels" className="mt-6">
                      <FunnelsList />
                    </TabsContent>
                  )}
                  {canSources && (
                    <TabsContent value="sources" className="mt-6">
                      <SourcesList />
                    </TabsContent>
                  )}
                  {canTeams && (
                    <TabsContent value="teams" className="mt-6">
                      <TeamsList />
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SettingsLayout>
  );
} 