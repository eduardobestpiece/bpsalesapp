import { supabase } from '../integrations/supabase/client';

export interface RedirectConfig {
  redirectEnabled: boolean;
  redirectUrl: string;
}

/**
 * Carrega configurações de redirecionamento para um formulário específico
 */
export const loadFormRedirectConfig = async (leadFormId: string, companyId: string): Promise<RedirectConfig> => {
  try {
    console.debug('[redirectManager] Carregando configurações para:', { leadFormId, companyId });
    
    const { data, error } = await supabase
      .from('form_redirects')
      .select('redirect_enabled, redirect_url')
      .eq('lead_form_id', leadFormId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (error) {
      console.warn('Erro ao carregar configurações de redirecionamento:', error);
      return { redirectEnabled: false, redirectUrl: '' };
    }

    console.debug('[redirectManager] Dados carregados:', data);

    const result = {
      redirectEnabled: data?.redirect_enabled || false,
      redirectUrl: data?.redirect_url || ''
    };

    console.debug('[redirectManager] Configurações retornadas:', result);
    return result;
  } catch (error) {
    console.error('Erro ao carregar configurações de redirecionamento:', error);
    return { redirectEnabled: false, redirectUrl: '' };
  }
};

/**
 * Salva configurações de redirecionamento para um formulário específico
 */
export const saveFormRedirectConfig = async (
  leadFormId: string, 
  companyId: string, 
  config: RedirectConfig
): Promise<boolean> => {
  try {
    console.debug('[redirectManager] Salvando configurações:', {
      leadFormId,
      companyId,
      config
    });

    const payload = {
      lead_form_id: leadFormId,
      company_id: companyId,
      redirect_enabled: config.redirectEnabled,
      redirect_url: config.redirectUrl,
      updated_at: new Date().toISOString()
    };

    console.debug('[redirectManager] Payload:', payload);

    const { error } = await supabase
      .from('form_redirects')
      .upsert(payload, {
        onConflict: 'lead_form_id,company_id'
      });

    if (error) {
      console.error('Erro ao salvar configurações de redirecionamento:', error);
      return false;
    }

    console.debug('[redirectManager] Configurações salvas com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao salvar configurações de redirecionamento:', error);
    return false;
  }
};

/**
 * Remove configurações de redirecionamento para um formulário
 */
export const deleteFormRedirectConfig = async (leadFormId: string, companyId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('form_redirects')
      .delete()
      .eq('lead_form_id', leadFormId)
      .eq('company_id', companyId);

    if (error) {
      console.error('Erro ao deletar configurações de redirecionamento:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar configurações de redirecionamento:', error);
    return false;
  }
};
