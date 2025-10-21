import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { 
  BaseIntegration, 
  IntegrationType, 
  IntegrationConfig,
  UseIntegrationsReturn 
} from '@/types/integrations';

export function useIntegrations(formId: string): UseIntegrationsReturn {
  const { selectedCompanyId } = useCompany();
  const [integrations, setIntegrations] = useState<BaseIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar integrações do formulário
  const loadIntegrations = async () => {
    if (!selectedCompanyId || !formId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('form_integrations')
        .select('*')
        .eq('form_id', formId)
        .eq('company_id', selectedCompanyId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setIntegrations(data || []);
    } catch (err) {
      console.error('Erro ao carregar integrações:', err);
      setError('Erro ao carregar integrações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, [formId, selectedCompanyId]);

  // Adicionar nova integração
  const addIntegration = async (integration: Omit<BaseIntegration, 'id' | 'created_at' | 'updated_at'>) => {
    if (!selectedCompanyId) throw new Error('Company ID não encontrado');

    try {
      // Preparar dados para inserção baseado no tipo de integração
      const insertData: any = {
        form_id: formId,
        company_id: selectedCompanyId,
        integration_type: integration.integration_type,
        is_active: integration.is_active
      };

      // Adicionar campos específicos baseado no tipo de integração
      if (integration.integration_type === 'webhook') {
        insertData.webhook_url = (integration as any).webhook_url;
      } else if (integration.integration_type === 'meta_ads') {
        insertData.meta_pixel_id = (integration as any).meta_pixel_id;
        insertData.meta_pixel_token = (integration as any).meta_pixel_token;
        insertData.meta_pixel_event = (integration as any).meta_pixel_event;
        insertData.meta_capi_test = (integration as any).meta_capi_test;
      } else if (integration.integration_type === 'google_ads') {
        insertData.google_ads_tag = (integration as any).google_ads_tag;
        insertData.google_ads_event = (integration as any).google_ads_event;
      } else if (integration.integration_type === 'analytics') {
        insertData.google_analytics_tag = (integration as any).google_analytics_tag;
        insertData.google_analytics_event = (integration as any).google_analytics_event;
      }

      const { data, error: insertError } = await supabase
        .from('form_integrations')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      setIntegrations(prev => [data, ...prev]);
    } catch (err) {
      console.error('Erro ao adicionar integração:', err);
      throw err;
    }
  };

  // Atualizar integração existente
  const updateIntegration = async (id: string, updates: Partial<BaseIntegration>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('form_integrations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === id ? data : integration
        )
      );
    } catch (err) {
      console.error('Erro ao atualizar integração:', err);
      throw err;
    }
  };

  // Deletar integração
  const deleteIntegration = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('form_integrations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setIntegrations(prev => prev.filter(integration => integration.id !== id));
    } catch (err) {
      console.error('Erro ao deletar integração:', err);
      throw err;
    }
  };

  // Toggle ativo/inativo
  const toggleIntegration = async (id: string, active: boolean) => {
    await updateIntegration(id, { is_active: active });
  };

  return {
    integrations,
    loading,
    error,
    addIntegration,
    updateIntegration,
    deleteIntegration,
    toggleIntegration
  };
}

// Hook específico para cada tipo de integração
export function useWebhookIntegrations(formId: string) {
  const { integrations, ...rest } = useIntegrations(formId);
  
  return {
    ...rest,
    webhooks: integrations.filter(i => i.integration_type === 'webhook')
  };
}

export function useMetaAdsIntegrations(formId: string) {
  const { integrations, ...rest } = useIntegrations(formId);
  
  return {
    ...rest,
    metaAds: integrations.filter(i => i.integration_type === 'meta_ads')
  };
}

export function useGoogleAdsIntegrations(formId: string) {
  const { integrations, ...rest } = useIntegrations(formId);
  
  return {
    ...rest,
    googleAds: integrations.filter(i => i.integration_type === 'google_ads')
  };
}

export function useAnalyticsIntegrations(formId: string) {
  const { integrations, ...rest } = useIntegrations(formId);
  
  return {
    ...rest,
    analytics: integrations.filter(i => i.integration_type === 'analytics')
  };
}
