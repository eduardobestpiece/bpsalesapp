// Tipos para o sistema de integrações de formulários

export type IntegrationType = 'webhook' | 'meta_ads' | 'google_ads' | 'analytics';

export interface BaseIntegration {
  id: string;
  form_id: string;
  company_id: string;
  integration_type: IntegrationType;
  config_data: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Configuração específica para Webhook
export interface WebhookConfig {
  url: string;
  enabled: boolean;
}

// Configuração específica para Meta Ads
export interface MetaAdsConfig {
  pixel_code: string;
  api_token: string;
  event_type: string;
  custom_event_name?: string;
  test_code?: string;
  enabled: boolean;
}

// Configuração específica para Google Ads
export interface GoogleAdsConfig {
  google_tag: string;
  conversion_tag: string;
  enabled: boolean;
}

// Configuração específica para Google Analytics
export interface AnalyticsConfig {
  analytics_tag: string;
  conversion_tag: string;
  enabled: boolean;
}

// Union type para todas as configurações
export type IntegrationConfig = 
  | WebhookConfig 
  | MetaAdsConfig 
  | GoogleAdsConfig 
  | AnalyticsConfig;

// Tipos para eventos do Facebook
export type FacebookEventType = 
  | 'Lead'
  | 'CompleteRegistration'
  | 'Purchase'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'ViewContent'
  | 'Search'
  | 'AddToWishlist'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'Schedule'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe'
  | 'Custom';

// Dados que serão enviados para as integrações
export interface IntegrationData {
  // Dados do formulário
  form_fields: Record<string, any>;
  
  // Dados do sistema
  company_name: string;
  form_name: string;
  lead_id?: string; // NOVO: ID do lead no backend
  platform: string;
  device: string;
  ip: string;
  browser: string;
  url_complete: string;
  url_without_params: string;
  url_params: Record<string, any>;
  
  // Dados de tracking
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_source?: string;
  utm_term?: string;
  fbclid?: string;
  fbid?: string;
  fbc?: string;
  fbp?: string;
  gclid?: string;
  
  // Dados de responsável
  responsible_id?: string;
  responsible_name?: string;
  
  // Dados do usuário
  user_agent: string;
  timestamp: string;
}

// Hook para gerenciar integrações
export interface UseIntegrationsReturn {
  integrations: BaseIntegration[];
  loading: boolean;
  error: string | null;
  addIntegration: (integration: Omit<BaseIntegration, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateIntegration: (id: string, updates: Partial<BaseIntegration>) => Promise<void>;
  deleteIntegration: (id: string) => Promise<void>;
  toggleIntegration: (id: string, active: boolean) => Promise<void>;
}
