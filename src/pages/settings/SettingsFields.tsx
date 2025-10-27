import { useEffect, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { ClientFieldsPage } from '@/components/Managers/ClientFieldsPage';
import { CompanyFieldsPage } from '@/components/Managers/CompanyFieldsPage';
import { SaleFieldsPage } from '@/components/Managers/SaleFieldsPage';
import { LeadFieldsPage } from '@/components/Managers/LeadFieldsPage';

export default function SettingsFields() {
  const { companyId } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const [tabValue, setTabValue] = useState('campos-lead');

  const effectiveCompanyId = selectedCompanyId || companyId;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Campos</h1>
        <p className="text-muted-foreground">Gerencie os campos personalizados para leads, clientes, empresas e vendas.</p>
      </div>

      <Card className="shadow-xl border-0 bg-card">
        <CardContent className="p-0">
          <Tabs value={tabValue} onValueChange={(v) => setTabValue(v as any)} className="w-full">
            <TabsList className="flex items-end border-b border-border/30 bg-transparent p-0 rounded-none justify-start w-fit">
              <TabsTrigger 
                value="campos-lead" 
                className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
              >
                Campos Lead
              </TabsTrigger>
              <div className="w-px h-6 bg-border/30 self-center"></div>
              <TabsTrigger 
                value="campos-cliente" 
                className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
              >
                Campos Cliente
              </TabsTrigger>
              <div className="w-px h-6 bg-border/30 self-center"></div>
              <TabsTrigger 
                value="campos-empresa" 
                className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
              >
                Campos Empresa
              </TabsTrigger>
              <div className="w-px h-6 bg-border/30 self-center"></div>
              <TabsTrigger 
                value="campos-venda" 
                className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
              >
                Campos Venda
              </TabsTrigger>
            </TabsList>

            <TabsContent value="campos-lead" className="p-6">
              <LeadFieldsPage companyId={effectiveCompanyId} />
            </TabsContent>

            <TabsContent value="campos-cliente" className="p-6">
              <ClientFieldsPage companyId={effectiveCompanyId} />
            </TabsContent>

            <TabsContent value="campos-empresa" className="p-6">
              <CompanyFieldsPage companyId={effectiveCompanyId} />
            </TabsContent>

            <TabsContent value="campos-venda" className="p-6">
              <SaleFieldsPage companyId={effectiveCompanyId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
