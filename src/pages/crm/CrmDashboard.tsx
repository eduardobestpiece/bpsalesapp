
import { CrmHeader } from '@/components/Layout/CrmHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadsList } from '@/components/CRM/LeadsList';
import { SalesList } from '@/components/CRM/SalesList';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

const CrmDashboard = () => {
  const { companyId } = useCrmAuth();

  if (!companyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
        <CrmHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Carregando informações da empresa...</p>
          </div>
        </main>
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
                <h2 className="text-2xl font-bold">Dashboard CRM</h2>
                <p className="text-muted-foreground">
                  Gerencie seus leads e vendas
                </p>
              </div>

              <Tabs defaultValue="leads" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="leads">Leads</TabsTrigger>
                  <TabsTrigger value="sales">Vendas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="leads" className="mt-6">
                  <LeadsList companyId={companyId} />
                </TabsContent>
                
                <TabsContent value="sales" className="mt-6">
                  <SalesList companyId={companyId} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CrmDashboard;
