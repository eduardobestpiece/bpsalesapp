import { supabase } from '@/integrations/supabase/client';
import { IntegrationData, BaseIntegration } from '@/types/integrations';
import { loadFacebookPixel, trackFacebookEvent } from '@/utils/facebookPixel';
import { loadGoogleAnalytics, trackGoogleEvent, trackGoogleAdsConversion } from '@/utils/googleAnalytics';
import MetaCapiService from './metaCapiService';

// Serviço para gerenciar disparos de integrações
export class IntegrationService {
  private static instance: IntegrationService;
  private processedSubmissions: Set<string> = new Set();

  static getInstance(): IntegrationService {
    if (!IntegrationService.instance) {
      IntegrationService.instance = new IntegrationService();
    }
    return IntegrationService.instance;
  }

  // Verificar se o envio já foi processado (disparo único)
  private hasBeenProcessed(sessionId: string): boolean {
    return this.processedSubmissions.has(sessionId);
  }

  // Marcar envio como processado
  private markAsProcessed(sessionId: string): void {
    this.processedSubmissions.add(sessionId);
  }

  // Gerar ID único para a sessão baseado no formulário e dados do usuário
  private generateSessionId(formId: string, userData: any): string {
    const userIdentifier = userData.email || userData.telefone || userData.phone || 'anonymous';
    return `${formId}-${userIdentifier}-${Date.now()}`;
  }

  // Coletar dados do sistema para envio
  private async collectSystemData(): Promise<Partial<IntegrationData>> {
    // Obter parâmetros da URL pai (iframe)
    const parentParams = await this.getParentUrlParams();
    
    // Tentar extrair parâmetros do document.referrer se disponível
    let referrerParams: Record<string, string> = {};
    if (document.referrer && document.referrer !== window.location.href) {
      try {
        const referrerUrl = new URL(document.referrer);
        referrerUrl.searchParams.forEach((value, key) => {
          referrerParams[key] = value;
        });
      } catch (error) {
        // Erro ao processar referrer
      }
    }
    
    const correctUrl = await this.getCorrectUrl();
    const urlWithoutParams = await this.getUrlWithoutParams();
    
    // Coletar cookies do Facebook
    const fbpCookie = this.getCookieValue('_fbp');
    const fbcCookie = this.getCookieValue('_fbc');
    const fbidCookie = this.getCookieValue('_fbid');
    
    console.log('🎯 META PIXEL - Debug - Cookies coletados:', {
      fbp: fbpCookie,
      fbc: fbcCookie,
      fbid: fbidCookie
    });
    
    console.log('🎯 META PIXEL - Debug - document.cookie completo:', document.cookie);
    console.log('🎯 META PIXEL - Debug - URL atual:', window.location.href);
    console.log('🎯 META PIXEL - Debug - URL pai:', parentParams);
    console.log('🎯 META PIXEL - Debug - Parâmetros da URL atual:', {
      utm_campaign: this.getUrlParam('utm_campaign'),
      utm_medium: this.getUrlParam('utm_medium'),
      utm_source: this.getUrlParam('utm_source'),
      fbclid: this.getUrlParam('fbclid'),
      fbc: this.getUrlParam('fbc'),
      fbp: this.getUrlParam('fbp')
    });
    
    const systemData = {
      platform: 'Web',
      device: this.getDeviceType(),
      browser: navigator.userAgent,
      url_complete: correctUrl,
      url_without_params: urlWithoutParams,
      url_params: { ...parentParams, ...referrerParams },
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      // Dados de tracking - priorizar parâmetros da URL pai, depois referrer, depois URL atual
      utm_campaign: parentParams.utm_campaign || referrerParams.utm_campaign || this.getUrlParam('utm_campaign') || '',
      utm_medium: parentParams.utm_medium || referrerParams.utm_medium || this.getUrlParam('utm_medium') || '',
      utm_content: parentParams.utm_content || referrerParams.utm_content || this.getUrlParam('utm_content') || '',
      utm_source: parentParams.utm_source || referrerParams.utm_source || this.getUrlParam('utm_source') || '',
      utm_term: parentParams.utm_term || referrerParams.utm_term || this.getUrlParam('utm_term') || '',
      fbclid: parentParams.fbclid || referrerParams.fbclid || this.getUrlParam('fbclid') || '',
      fbid: parentParams.fbid || referrerParams.fbid || this.getUrlParam('fbid') || fbidCookie || '',
      fbc: parentParams.fbc || referrerParams.fbc || this.getUrlParam('fbc') || fbcCookie || '',
      fbp: parentParams.fbp || referrerParams.fbp || this.getUrlParam('fbp') || fbpCookie || '',
      gclid: parentParams.gclid || referrerParams.gclid || this.getUrlParam('gclid') || ''
    };
    
    return systemData;
  }

  // Obter URL correta (página pai se em iframe)
  private async getCorrectUrl(): Promise<string> {
    // PRIORIDADE 1: Tentar acessar URL da página pai
    try {
      if (window.parent && window.parent !== window) {
        const parentUrl = window.parent.location.href;
        if (parentUrl && parentUrl !== window.location.href) {
          return parentUrl;
        }
      }
    } catch (error) {
      // Não foi possível acessar window.parent.location.href
    }
    
    // PRIORIDADE 2: Tentar comunicação via postMessage
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'GET_PARENT_URL' }, '*');
        
        // Aguardar resposta por um tempo limitado usando Promise
        const parentUrl = await new Promise<string>((resolve) => {
          let parentUrlReceived = false;
          let parentUrl = '';
          
          const messageHandler = (event: MessageEvent) => {
            if (event.data.type === 'PARENT_URL_RESPONSE' && event.data.url) {
              parentUrl = event.data.url;
              parentUrlReceived = true;
              window.removeEventListener('message', messageHandler);
              resolve(parentUrl);
            }
          };
          
          window.addEventListener('message', messageHandler);
          
          // Timeout de 1000ms
          setTimeout(() => {
            if (!parentUrlReceived) {
              window.removeEventListener('message', messageHandler);
              resolve('');
            }
          }, 1000);
        });
        
        if (parentUrl) {
          return parentUrl;
        }
      }
    } catch (postMessageError) {
      // Erro na comunicação via postMessage
    }
    
    return this.getFallbackUrl();
  }

  // Obter URL de fallback
  private getFallbackUrl(): string {
    // PRIORIDADE 2: document.referrer (fallback)
    if (document.referrer && document.referrer !== window.location.href && !document.referrer.includes('localhost')) {
      return document.referrer;
    }

    // Último fallback: URL atual
    return window.location.href;
  }

  // Obter parâmetros da URL pai (para iframe)
  private async getParentUrlParams(): Promise<Record<string, string>> {
    try {
      // PRIORIDADE 1: Tentar acessar URL da página pai (mais confiável para iframes)
      if (window.parent && window.parent.location.href !== window.location.href) {
        const parentUrl = new URL(window.parent.location.href);
        const params: Record<string, string> = {};
        parentUrl.searchParams.forEach((value, key) => {
          params[key] = value;
        });
        return params;
      }
    } catch (error) {
      // Não foi possível acessar parâmetros da página pai
    }
    
    // PRIORIDADE 2: Tentar comunicação via postMessage para obter URL pai
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'GET_PARENT_URL' }, '*');
        
        const parentUrl = await new Promise<string>((resolve) => {
          let parentUrlReceived = false;
          let parentUrl = '';
          
          const messageHandler = (event: MessageEvent) => {
            if (event.data.type === 'PARENT_URL_RESPONSE' && event.data.url) {
              parentUrl = event.data.url;
              parentUrlReceived = true;
              window.removeEventListener('message', messageHandler);
              resolve(parentUrl);
            }
          };
          
          window.addEventListener('message', messageHandler);
          
          // Timeout de 1000ms
          setTimeout(() => {
            if (!parentUrlReceived) {
              window.removeEventListener('message', messageHandler);
              resolve('');
            }
          }, 1000);
        });
        
        if (parentUrl) {
          const parentUrlObj = new URL(parentUrl);
          const params: Record<string, string> = {};
          parentUrlObj.searchParams.forEach((value, key) => {
            params[key] = value;
          });
          return params;
        }
      }
    } catch (postMessageError) {
      // Erro na comunicação via postMessage para parâmetros
    }
    
    // PRIORIDADE 3: document.referrer (fallback)
    if (document.referrer && document.referrer !== window.location.href && !document.referrer.includes('localhost')) {
      try {
        const referrerUrl = new URL(document.referrer);
        const params: Record<string, string> = {};
        referrerUrl.searchParams.forEach((value, key) => {
          params[key] = value;
        });
        return params;
      } catch (error) {
      }
    }
    
    return {};
  }

  // Obter URL sem parâmetros
  private async getUrlWithoutParams(): Promise<string> {
    const url = await this.getCorrectUrl();
    return url.split('?')[0];
  }

  // Obter valor de cookie
  private getCookieValue(name: string): string {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift() || '';
      return cookieValue;
    }
    return '';
  }

  // Mapear campos do formulário para nomes do webhook
  private async mapFormFieldsToWebhookNames(formId: string, formFields: Record<string, any>): Promise<Record<string, any>> {
    try {
      // Buscar configuração de campos do formulário
      const { data: fieldConfigs, error } = await supabase
        .from('lead_form_fields')
        .select('field_id, field_name, placeholder_text')
        .eq('lead_form_id', formId);

      if (error) {
        return formFields; // Retornar campos originais se houver erro
      }

      // Buscar sender_name para cada campo individualmente
      const fieldMapping: Record<string, string> = {};
      
      // Processar campos em paralelo com timeout
      const fieldPromises = (fieldConfigs || []).map(async (field) => {
        try {
          // Timeout de 2 segundos para cada consulta
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 2000)
          );
          
          const queryPromise = supabase
            .from('lead_custom_fields')
            .select('sender_name')
            .eq('id', field.field_id)
            .single();

          const { data: customField, error: customFieldError } = await Promise.race([
            queryPromise,
            timeoutPromise
          ]) as any;

          if (!customFieldError && customField?.sender_name) {
            fieldMapping[field.field_id] = customField.sender_name.trim();
          } else {
            // Fallback para placeholder_text ou field_name
            const webhookName = field.placeholder_text || field.field_name;
            if (webhookName && webhookName.trim()) {
              fieldMapping[field.field_id] = webhookName.trim();
            }
          }
        } catch (error) {
          // Fallback para placeholder_text ou field_name
          const webhookName = field.placeholder_text || field.field_name;
          if (webhookName && webhookName.trim()) {
            fieldMapping[field.field_id] = webhookName.trim();
          }
        }
      });

      // Aguardar todas as consultas com timeout geral
      try {
        await Promise.allSettled(fieldPromises);
      } catch (error) {
        // Erro geral no mapeamento de campos
      }

      // Mapear campos do formulário
      const mappedFields: Record<string, any> = {};
      
      Object.keys(formFields).forEach(fieldId => {
        const senderName = fieldMapping[fieldId];
        const fieldValue = formFields[fieldId];
        
        if (senderName) {
          // Verificar se é campo de telefone
          if (this.isPhoneField(senderName, fieldValue)) {
            this.mapPhoneField(mappedFields, senderName, fieldValue);
          }
          // Verificar se é campo de nome e sobrenome
          else if (this.isNameField(senderName, fieldValue)) {
            this.mapNameField(mappedFields, senderName, fieldValue);
          }
          // Campo normal
          else {
            mappedFields[senderName] = fieldValue;
          }
        } else {
          // Manter campo original se não houver mapeamento
          mappedFields[fieldId] = fieldValue;
        }
      });

      return mappedFields;

    } catch (error) {
      return formFields; // Retornar campos originais em caso de erro
    }
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|tablet/.test(userAgent)) {
      return 'Mobile';
    }
    return 'Desktop';
  }

  private getUrlParam(param: string): string | undefined {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param) || undefined;
  }

  // Verificar se é campo de telefone
  private isPhoneField(senderName: string, fieldValue: any): boolean {
    if (!fieldValue || typeof fieldValue !== 'string') return false;
    
    // Verificar se o sender contém palavras relacionadas a telefone
    const phoneKeywords = ['telefone', 'phone', 'celular', 'mobile', 'contato'];
    const senderLower = senderName.toLowerCase();
    
    return phoneKeywords.some(keyword => senderLower.includes(keyword));
  }

  // Verificar se é campo de nome e sobrenome
  private isNameField(senderName: string, fieldValue: any): boolean {
    if (!fieldValue || typeof fieldValue !== 'string') return false;
    
    // Verificar se o sender contém palavras relacionadas a nome
    const nameKeywords = ['nome', 'name', 'sobrenome', 'surname', 'fullname', 'full_name'];
    const senderLower = senderName.toLowerCase();
    
    return nameKeywords.some(keyword => senderLower.includes(keyword));
  }

  // Mapear campo de telefone
  private mapPhoneField(mappedFields: Record<string, any>, senderName: string, fieldValue: string): void {
    console.log('📞 Debug - Mapeando campo de telefone:', { senderName, fieldValue });
    
    // Limpar o valor (remover caracteres especiais)
    const cleanPhone = fieldValue.replace(/[^\d]/g, '');
    
    // Campo original
    mappedFields[senderName] = cleanPhone;
    
    // Verificar se o número já tem DDI (começa com 55 e tem pelo menos 12 dígitos)
    if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
      mappedFields[`${senderName}_ddi`] = '55';
      mappedFields[`${senderName}_noddi`] = cleanPhone.substring(2);
    } else {
      // Se não tem DDI, assumir que é Brasil (55) se o número tem exatamente 11 dígitos
      if (cleanPhone.length === 11) {
        mappedFields[`${senderName}_ddi`] = '55';
        mappedFields[`${senderName}_noddi`] = cleanPhone;
        // Atualizar o campo original com DDI
        mappedFields[senderName] = '55' + cleanPhone;
      } else {
        // Para outros casos, manter como está
        mappedFields[`${senderName}_ddi`] = '';
        mappedFields[`${senderName}_noddi`] = cleanPhone;
      }
    }
    
    console.log('📞 Debug - Telefone mapeado:', {
      [senderName]: mappedFields[senderName],
      [`${senderName}_ddi`]: mappedFields[`${senderName}_ddi`],
      [`${senderName}_noddi`]: mappedFields[`${senderName}_noddi`]
    });
  }

  // Mapear campo de nome e sobrenome
  private mapNameField(mappedFields: Record<string, any>, senderName: string, fieldValue: string): void {
    console.log('👤 Debug - Mapeando campo de nome:', { senderName, fieldValue });
    
    // Campo original
    mappedFields[senderName] = fieldValue;
    
    // Separar nome e sobrenome
    const nameParts = fieldValue.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Adicionar campos separados
    mappedFields['lead_fname'] = firstName;
    mappedFields['lead_lname'] = lastName;
    
    console.log('👤 Debug - Nome mapeado:', {
      [senderName]: mappedFields[senderName],
      'lead_fname': mappedFields['lead_fname'],
      'lead_lname': mappedFields['lead_lname']
    });
  }

  // Carregar integrações ativas para um formulário
  async getActiveIntegrations(formId: string): Promise<BaseIntegration[]> {
    try {
      console.log('🔍 Debug - Buscando integrações para formId:', formId);
      
      // Buscar integrações ativas
      const { data, error } = await supabase
        .from('form_integrations')
        .select('*')
        .eq('form_id', formId)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Debug - Erro ao buscar integrações:', error);
        throw error;
      }
      
      console.log('🔍 Debug - Integrações encontradas:', data);
      console.log('🔍 Debug - Número de integrações:', data?.length || 0);
      
      return data || [];
    } catch (error) {
      console.error('❌ Debug - Erro ao carregar integrações:', error);
      return [];
    }
  }

  // Disparar webhook
  async triggerWebhook(webhook: BaseIntegration, data: IntegrationData): Promise<void> {
    console.log('🔗 Debug - triggerWebhook chamado');
    console.log('🔗 Debug - webhook object:', webhook);
    console.log('🔗 Debug - webhook keys:', Object.keys(webhook));
    
    const webhookUrl = (webhook as any).webhook_url;
    const isActive = webhook.is_active;
    
    console.log('🔗 Debug - Webhook URL:', webhookUrl);
    console.log('🔗 Debug - Webhook ativo:', isActive);
    console.log('🔗 Debug - Webhook type:', typeof webhookUrl);
    
    if (!webhookUrl || !isActive) {
      console.log('⚠️ Debug - Webhook desabilitado ou sem URL');
      console.log('⚠️ Debug - webhookUrl:', webhookUrl);
      console.log('⚠️ Debug - isActive:', isActive);
      return;
    }

    try {
      console.log('🔗 Debug - Iniciando envio do webhook');
      console.log('🔗 Debug - URL do webhook:', webhookUrl);
      console.log('🔗 Debug - Dados a serem enviados:', data);
      
      // Tentar diferentes métodos para contornar CORS
      const webhookData = {
        ...data,
        timestamp: new Date().toISOString(),
        source: 'bp-app-form'
      };

      console.log('🔗 Debug - Dados finais do webhook:', webhookData);

      // Método 1: Fetch direto (pode falhar por CORS)
      try {
        console.log('🔗 Debug - Tentando fetch direto');
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors', // Tentar CORS
          body: JSON.stringify(webhookData)
        });

        console.log('🔗 Debug - Resposta do fetch:', response.status, response.statusText);
        
        if (response.ok) {
          console.log('✅ Debug - Webhook enviado com sucesso via fetch direto');
          return;
        }
      } catch (corsError) {
        console.log('⚠️ Debug - CORS bloqueado, tentando método alternativo:', corsError);
        // CORS bloqueado, tentando método alternativo
      }

      // Método 2: Usar JSONP ou iframe para contornar CORS
      try {
        console.log('🔗 Debug - Tentando método alternativo (proxy)');
        await this.sendWebhookViaProxy(webhookUrl, webhookData);
        console.log('✅ Debug - Webhook enviado com sucesso via proxy');
      } catch (proxyError) {
        console.error('❌ Debug - Erro no método alternativo:', proxyError);
        throw proxyError;
      }

    } catch (error) {
      // Não falhar o processo principal se o webhook falhar
    }
  }

  // Método alternativo para enviar webhook via proxy
  private async sendWebhookViaProxy(url: string, data: any): Promise<void> {
    // Método 1: Tentar usar fetch com no-cors
    try {
      const response = await fetch(url, {
        method: 'POST',
        mode: 'no-cors', // Não verificar CORS
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      return;
    } catch (noCorsError) {
      // no-cors falhou, tentando iframe
    }

    // Método 2: Usar iframe oculto para enviar dados
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      
      document.body.appendChild(iframe);
      
      // Criar formulário dentro do iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        const form = iframeDoc.createElement('form');
        form.method = 'POST';
        form.action = url;
        form.style.display = 'none';

        // Adicionar dados como campos ocultos
        Object.keys(data).forEach(key => {
          const input = iframeDoc.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = typeof data[key] === 'object' ? JSON.stringify(data[key]) : String(data[key]);
          form.appendChild(input);
        });

        iframeDoc.body.appendChild(form);
        form.submit();
        
        // Remover iframe após envio
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }
    } catch (iframeError) {
      throw iframeError;
    }
  }

  // Disparar Meta Ads
  async triggerMetaAds(metaAd: BaseIntegration, data: IntegrationData): Promise<void> {
    const pixelId = (metaAd as any).meta_pixel_id;
    const accessToken = (metaAd as any).meta_pixel_token;
    const eventType = (metaAd as any).meta_pixel_event;
    const testCode = (metaAd as any).meta_capi_test;
    const isActive = metaAd.is_active;
    
    console.log('🎯 META PIXEL - Iniciando disparo do pixel Meta');
    console.log('🎯 META PIXEL - Configuração:', { pixelId, hasToken: !!accessToken, eventType, isActive, testCode });
    
    if (!isActive || !pixelId) {
      console.log('🎯 META PIXEL - Pixel desabilitado ou sem ID');
      return;
    }

    try {
      // Gerar event_id único para deduplicação entre CAPI e Pixel
      const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      console.log('🎯 META PIXEL - event_id gerado:', eventId);

      // PRIORIDADE 1: Tentar Meta CAPI (Conversions API) se configurado
      if (accessToken) {
        try {
          console.log('🎯 META PIXEL - Debug - Configuração CAPI:', {
            pixel_id: pixelId,
            access_token: accessToken ? '***' + accessToken.slice(-4) : 'undefined',
            test_event_code: testCode
          });
          
          const metaCapi = new MetaCapiService({
            pixel_id: pixelId,
            access_token: accessToken,
            test_event_code: testCode
          });

          // Mapear dados do usuário para CAPI conforme especificação
          const userData = this.mapUserDataForMeta(data);

          // Mapear dados de tracking
          const trackingData = {
            fbclid: data.fbclid,
            fbc: data.fbc,
            fbp: data.fbp,
            gclid: data.gclid,
            utm_campaign: data.utm_campaign,
            utm_medium: data.utm_medium,
            utm_source: data.utm_source,
            utm_content: data.utm_content,
            utm_term: data.utm_term
          };

          // Enviar via CAPI
          console.log('🎯 META PIXEL - Tentando Meta CAPI');
          console.log('🎯 META PIXEL - Debug - userData para CAPI:', userData);
          console.log('🎯 META PIXEL - Debug - trackingData para CAPI:', trackingData);
          const capiSuccess = await metaCapi.sendEvent(
            userData,
            trackingData,
            data,
            eventType || 'Lead',
            eventId
          );
          
          if (capiSuccess) {
            console.log('🎯 META PIXEL - ✅ Meta CAPI enviado com sucesso');
            // Continuar para executar também o pixel cliente-side
          } else {
            console.log('🎯 META PIXEL - ❌ Meta CAPI falhou, tentando pixel cliente-side');
          }
        } catch (capiError) {
          console.log('🎯 META PIXEL - ❌ Meta CAPI erro:', capiError);
          // Meta CAPI falhou, continuar com fallback
        }
      }
      
      // Pixel cliente-side (sempre executar junto com CAPI) com eventID para dedupe
      if (pixelId) {
        console.log('🎯 META PIXEL - Disparando pixel cliente-side');
        this.loadPixelAndTrack(pixelId, eventType || 'Lead', data, eventId);
      }
    } catch (error) {
      console.log('🎯 META PIXEL - ❌ Erro geral:', error);
      // Não falhar o processo principal se o Meta Ads falhar
    }
  }

  // Mapear dados do usuário para Meta conforme especificação
  private mapUserDataForMeta(data: IntegrationData): any {
    console.log('🎯 META PIXEL - Debug - Dados do formulário:', data.form_fields);
    
    // Buscar campos específicos nos dados do formulário
    const email = data.form_fields.lead_email || data.form_fields.email || data.form_fields.e_mail || data.form_fields.email_address || '';
    const phone = data.form_fields.lead_telefone || data.form_fields.telefone || data.form_fields.phone || data.form_fields.phone_number || '';
    const fullName = data.form_fields.lead_nome_e_sobrenome || data.form_fields.nome || data.form_fields.name || data.form_fields.full_name || '';
    const firstName = data.form_fields.lead_fname || data.form_fields.primeiro_nome || data.form_fields.first_name || '';
    const lastName = data.form_fields.lead_lname || data.form_fields.sobrenome || data.form_fields.last_name || '';
    
    console.log('🎯 META PIXEL - Debug - Campos encontrados:', {
      email,
      phone,
      fullName,
      firstName,
      lastName
    });
    
    // Aplicar formatação conforme especificação
    const userData = {
      // email: minúsculas, sem espaços, sem caracteres especiais
      email: email ? email.toLowerCase().trim() : '',
      
      // phone: número com DDI sem espaços ou caracteres especiais
      phone: phone ? phone.replace(/[^\d]/g, '') : '',
      
      // name: nome e sobrenome com minúsculas
      name: fullName ? fullName.toLowerCase().trim() : '',
      
      // fname: primeiro nome com minúsculas sem espaços
      fname: firstName ? firstName.toLowerCase().trim().replace(/\s+/g, '') : '',
      
      // lname: sobrenome com minúsculas
      lname: lastName ? lastName.toLowerCase().trim() : '',
      
      // Dados de tracking
      fbc: data.fbc || '',
      fbp: data.fbp || '',
      fbclid: data.fbclid || '',
      
      // IP (será obtido pelo MetaCapiService)
      ip: data.ip || ''
    };
    
    console.log('🎯 META PIXEL - Debug - Dados mapeados:', userData);
    
    return userData;
  }

  // Carregar pixel e disparar evento de forma assíncrona
  private loadPixelAndTrack(pixelId: string, eventType: string, data: IntegrationData, eventId?: string): void {
    // Mapear dados do usuário para Meta conforme especificação
    const userData = this.mapUserDataForMeta(data);
    
    // Advanced Matching para init
    const advancedMatching: Record<string, any> = {
      em: userData.email || undefined,
      ph: userData.phone || undefined,
      fn: userData.fname || undefined,
      ln: userData.lname || undefined,
      country: (data.url_params?.country || 'br').toString().toLowerCase()
    };

    // Dados do evento no browser
    const eventData = {
      content_name: data.form_name,
      content_category: 'form_submission',
      value: 1,
      currency: 'BRL'
    } as Record<string, any>;

    // Carregar pixel de forma assíncrona
    console.log('🎯 META PIXEL - Chamando loadFacebookPixel com pixelId:', pixelId);
    console.log('🎯 META PIXEL - Debug - eventData para pixel:', eventData);
    loadFacebookPixel(pixelId)
      .then(() => {
        console.log('🎯 META PIXEL - ✅ Pixel carregado, inicializando com advanced matching');
        try {
          // Re-inicializar com advanced matching (não quebra se já existir)
          (window as any).fbq && (window as any).fbq('init', pixelId, advancedMatching);
        } catch {}
        console.log('🎯 META PIXEL - Disparando evento com eventID para dedupe:', eventId);
        (window as any).fbq
          ? (window as any).fbq('track', eventType, eventData, eventId ? { eventID: eventId } : undefined)
          : trackFacebookEvent(eventType, eventData);
        console.log('🎯 META PIXEL - ✅ Evento disparado com sucesso');
      })
      .catch((error) => {
        console.log('🎯 META PIXEL - ⚠️ Pixel não carregou, erro:', error);
        // Pixel não carregou, tentar disparar mesmo assim (pode funcionar se já estiver carregado)
        if ((window as any).fbq) {
          (window as any).fbq('track', eventType, eventData, eventId ? { eventID: eventId } : undefined);
        } else {
          trackFacebookEvent(eventType, eventData);
        }
        console.log('🎯 META PIXEL - ✅ Evento disparado (fallback)');
      });
  }

  // Disparar Google Ads
  async triggerGoogleAds(googleAd: BaseIntegration, data: IntegrationData): Promise<void> {
    const googleAdsTag = (googleAd as any).google_ads_tag;
    const googleAdsEvent = (googleAd as any).google_ads_event;
    const isActive = googleAd.is_active;
    
    console.log('📘 Debug - Google Ads Tag:', googleAdsTag);
    console.log('📘 Debug - Google Ads Event:', googleAdsEvent);
    console.log('📘 Debug - Google Ads Ativo:', isActive);
    
    if (!isActive || !googleAdsTag) {
      console.log('⚠️ Debug - Google Ads desabilitado ou sem tag');
      return;
    }

    try {
      // Carregar Google Analytics se necessário
      if (googleAdsTag) {
        await loadGoogleAnalytics(googleAdsTag);
      }
      
      // Disparar conversão
      trackGoogleAdsConversion(
        googleAdsEvent || 'conversion',
        1,
        'BRL',
        data.timestamp
      );
      
      console.log('Google Ads conversion disparada:', googleAdsEvent);
    } catch (error) {
      console.error('Erro ao disparar Google Ads:', error);
      throw error;
    }
  }

  // Disparar Google Analytics
  async triggerAnalytics(analytics: BaseIntegration, data: IntegrationData): Promise<void> {
    const analyticsTag = (analytics as any).google_analytics_tag;
    const analyticsEvent = (analytics as any).google_analytics_event;
    const isActive = analytics.is_active;
    
    console.log('📘 Debug - Analytics Tag:', analyticsTag);
    console.log('📘 Debug - Analytics Event:', analyticsEvent);
    console.log('📘 Debug - Analytics Ativo:', isActive);
    
    if (!isActive || !analyticsTag) {
      console.log('⚠️ Debug - Analytics desabilitado ou sem tag');
      return;
    }

    try {
      // Carregar Google Analytics se necessário
      if (analyticsTag) {
        await loadGoogleAnalytics(analyticsTag);
      }
      
      // Disparar evento de conversão
      trackGoogleEvent(analyticsEvent || 'form_submission', {
        'event_category': 'engagement',
        'event_label': data.form_name,
        'value': 1,
        'custom_parameters': {
          'form_id': data.form_fields.form_id,
          'company_name': data.company_name
        }
      });
      
      console.log('Google Analytics event disparado:', analyticsEvent);
    } catch (error) {
      console.error('Erro ao disparar Google Analytics:', error);
      throw error;
    }
  }

  // Processar todas as integrações de um formulário
  async processFormIntegrations(
    formId: string, 
    formFields: Record<string, any>,
    companyName: string,
    formName: string
  ): Promise<void> {
    console.log('🔍 Debug - processFormIntegrations chamado com:', {
      formId,
      formFields,
      companyName,
      formName
    });

    // Processar integrações sem timeout excessivo
    try {
      console.log('🔍 Debug - Chamando processIntegrationsInternal');
      await this.processIntegrationsInternal(formId, formFields, companyName, formName);
      console.log('✅ Debug - processIntegrationsInternal concluído com sucesso');
    } catch (error) {
      console.error('❌ Debug - Erro no processamento de integrações:', error);
      // Erro no processamento de integrações
    }
  }

  private async processIntegrationsInternal(
    formId: string, 
    formFields: Record<string, any>,
    companyName: string,
    formName: string
  ): Promise<void> {
    try {
      // Gerar ID único para esta sessão
      const sessionId = this.generateSessionId(formId, formFields);
      
      // Verificar se já foi processado
      if (this.hasBeenProcessed(sessionId)) {
        console.log('Integrações já processadas para esta sessão');
        return;
      }

      // Marcar como processado
      this.markAsProcessed(sessionId);

      // Carregar integrações ativas
      const integrations = await this.getActiveIntegrations(formId);
      
      console.log('🔍 Debug - Integrações encontradas:', integrations);
      console.log('🔍 Debug - Número de integrações:', integrations.length);
      
      if (integrations.length === 0) {
        console.log('⚠️ Debug - Nenhuma integração ativa encontrada');
        return;
      }

      // Coletar dados do sistema
      const systemData = await this.collectSystemData();

      // Mapear campos do formulário para nomes do webhook
      const mappedFormFields = await this.mapFormFieldsToWebhookNames(formId, formFields);

      // Preparar dados completos
      const integrationData: IntegrationData = {
        form_fields: mappedFormFields,
        company_name: companyName,
        form_name: formName,
        ...systemData
      } as IntegrationData;

      // Processar cada integração
      const promises = integrations.map(async (integration) => {
        console.log('🔍 Debug - Processando integração:', integration.integration_type);
        console.log('🔍 Debug - Configuração da integração:', integration);
        try {
          switch (integration.integration_type) {
            case 'webhook':
              console.log('🔗 Debug - Disparando webhook');
              await this.triggerWebhook(integration, integrationData);
              break;
            case 'meta_ads':
              console.log('📘 Debug - Disparando Meta Ads');
              await this.triggerMetaAds(integration, integrationData);
              break;
            case 'google_ads':
              console.log('📘 Debug - Disparando Google Ads');
              await this.triggerGoogleAds(integration, integrationData);
              break;
            case 'analytics':
              console.log('📘 Debug - Disparando Analytics');
              await this.triggerAnalytics(integration, integrationData);
              break;
            default:
              console.warn('Tipo de integração não suportado:', integration.integration_type);
          }
        } catch (error) {
          console.error(`❌ Debug - Erro ao processar integração ${integration.integration_type}:`, error);
          // Não falhar o processo principal se uma integração falhar
        }
      });

      // Aguardar todas as integrações
      await Promise.allSettled(promises);
      
      console.log('Todas as integrações processadas com sucesso');
    } catch (error) {
      console.error('Erro ao processar integrações:', error);
      throw error;
    }
  }
}

// Exportar instância singleton
export const integrationService = IntegrationService.getInstance();
