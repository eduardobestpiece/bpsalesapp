import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WebhookIntegration } from './WebhookIntegration';
import { MetaAdsIntegration } from './MetaAdsIntegration';
import { GoogleAdsIntegration } from './GoogleAdsIntegration';
import { AnalyticsIntegration } from './AnalyticsIntegration';

interface IntegrationsManagerProps {
  formId: string;
  formType: 'leads' | 'agendamentos' | 'resultados' | 'vendas';
}

export function IntegrationsManager({ formId, formType }: IntegrationsManagerProps) {
  // Estado para controlar a aba ativa com persistência
  const [activeTab, setActiveTab] = useState<string>(() => {
    const storageKey = `integrations-tab-${formId}`;
    return localStorage.getItem(storageKey) || 'webhook';
  });

  // Salvar aba ativa no localStorage sempre que mudar
  useEffect(() => {
    const storageKey = `integrations-tab-${formId}`;
    localStorage.setItem(storageKey, activeTab);
  }, [activeTab, formId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Integrações</h2>
        <p className="text-muted-foreground">
          Configure integrações para o formulário de {formType}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          <TabsTrigger value="meta">Meta Ads</TabsTrigger>
          <TabsTrigger value="google">Google Ads</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="webhook" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Webhook</CardTitle>
            </CardHeader>
            <CardContent>
              <WebhookIntegration formId={formId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meta" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Meta Ads</CardTitle>
            </CardHeader>
            <CardContent>
              <MetaAdsIntegration formId={formId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="google" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Google Ads</CardTitle>
            </CardHeader>
            <CardContent>
              <GoogleAdsIntegration formId={formId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Google Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsIntegration formId={formId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
