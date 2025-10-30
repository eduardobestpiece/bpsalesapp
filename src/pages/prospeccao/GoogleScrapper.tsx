import { useState } from 'react';
import { ProspeccaoLayout } from '@/components/Layout/ProspeccaoLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleExtrator } from '@/components/Prospeccao/GoogleExtrator';
import { GoogleRedflag } from '@/components/Prospeccao/GoogleRedflag';
import { GoogleHistorico } from '@/components/Prospeccao/GoogleHistorico';

export default function GoogleScrapper() {
  const [activeTab, setActiveTab] = useState('extrator');

  return (
    <ProspeccaoLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Google Scrapper</h1>
          <p className="text-muted-foreground mt-2">
            Extraia dados de pesquisas do Google com filtros avançados e controle de qualidade.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="extrator">Extrator</TabsTrigger>
            <TabsTrigger value="redflag">Redflag</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="extrator" className="mt-6">
            <GoogleExtrator />
          </TabsContent>
          
          <TabsContent value="redflag" className="mt-6">
            <GoogleRedflag />
          </TabsContent>
          
          <TabsContent value="historico" className="mt-6">
            <GoogleHistorico />
          </TabsContent>
        </Tabs>
      </div>
    </ProspeccaoLayout>
  );
}
