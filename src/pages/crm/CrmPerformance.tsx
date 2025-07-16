import { useState } from 'react';
import { CrmHeader } from '@/components/Layout/CrmHeader';
import { PerformanceFilters } from '@/components/CRM/Performance/PerformanceFilters';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
  const { selectedCompanyId } = useCompany();
  const [filters, setFilters] = useState<PerformanceFilters | null>(null);
  const [activeTab, setActiveTab] = useState<'funnel'>('funnel');

  const funnelTabContent = (
    <div>
      <PerformanceFilters onFiltersChange={setFilters} funnelOnly />
      <div className="mt-10">
        <div className="text-center text-muted-foreground py-8">
          Dados do funil carregados
        </div>
      </div>
    </div>
  );

  const content = (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'funnel')}>
      <TabsList className="mb-6">
        <TabsTrigger value="funnel">Funil</TabsTrigger>
      </TabsList>
      <TabsContent value="funnel">{funnelTabContent}</TabsContent>
    </Tabs>
  );

  if (embedded) {
    return <>{content}</>;
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
