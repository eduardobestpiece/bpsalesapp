import { useState, useEffect } from 'react';
import { CrmHeader } from '@/components/Layout/CrmHeader';
import { PerformanceFilters } from '@/components/CRM/Performance/PerformanceFilters';
import { useIndicators } from '@/hooks/useIndicators';
import { useFunnels } from '@/hooks/useFunnels';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FunnelComparisonChart } from '@/components/CRM/Performance/FunnelChart';
import { aggregateFunnelIndicators } from '@/utils/calculationHelpers';
import { differenceInCalendarWeeks, parseISO } from 'date-fns';
import { useCrmUsers } from '@/hooks/useCrmUsers';
import { useTeams } from '@/hooks/useTeams';

interface PerformanceFilters {
  funnelId: string | string[];
  teamId?: string | string[];
  userId?: string | string[];
  period: 'day' | 'week' | 'month' | 'custom';
  start?: string;
  end?: string;
  month?: string | string[];
  year?: string | string[];
  compareId?: string;
}

const CrmPerformance = ({ embedded = false }: { embedded?: boolean }) => {
  const { crmUser } = useCrmAuth();
  const { selectedCompanyId, setSelectedCompanyId } = useCompany();
  const [filters, setFilters] = useState<PerformanceFilters | null>(null);
  const [activeTab, setActiveTab] = useState<'funnel'>('funnel');

  useEffect(() => {
    if (crmUser && crmUser.role !== 'master' && crmUser.company_id && selectedCompanyId !== crmUser.company_id) {
      setSelectedCompanyId(crmUser.company_id);
    }
  }, [crmUser, selectedCompanyId, setSelectedCompanyId]);

  // Fixed logic for determining userId for indicators
  let userIdForIndicators: string | undefined = undefined;
  if (crmUser?.role === 'user') {
    // Users can only see their own data
    userIdForIndicators = crmUser.id;
  }
  
  const { data: indicators = [] } = useIndicators(
    selectedCompanyId,
    userIdForIndicators
  );
  
  const { data: funnels = [] } = useFunnels(selectedCompanyId);
  const { data: crmUsers = [] } = useCrmUsers();
  const { data: teams = [] } = useTeams();

  // Selecionar o primeiro funil quando funnelId é um array
  const selectedFunnel = filters ? 
    (Array.isArray(filters.funnelId) && filters.funnelId.length > 0 ? 
      funnels.find(f => f.id === filters.funnelId[0]) : 
      funnels.find(f => f.id === filters.funnelId)) : 
    null;

  useEffect(() => {
    if (!filters && funnels.length > 0) {
      setFilters({
        funnelId: funnels[0].id,
        period: 'custom',
      });
    }
  }, [filters, funnels]);

  const funnelTabContent = (
    <div>
      <PerformanceFilters onFiltersChange={setFilters} funnelOnly />
      <div className="mt-10">
        {selectedFunnel ? (
          <div className="text-center">Dados do funil carregados</div>
        ) : (
          <div className="text-center text-muted-foreground py-8">Nenhum dado para exibir o funil.</div>
        )}
      </div>
    </div>
  );

  const content = (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="funnel">Funil</TabsTrigger>
      </TabsList>
      <TabsContent value="funnel">{funnelTabContent}</TabsContent>
    </Tabs>
  );

  if (embedded) {
    return (
      <>
        {content}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CrmHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-card/90 backdrop-blur-sm rounded-3xl shadow-xl border border-border p-1">
            <div className="bg-card rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold">Performance</h2>
                <p className="text-muted-foreground">
                  Acompanhe o desempenho dos funis e resultados
                </p>
              </div>
              {content}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CrmPerformance;