// Removido import crypto - usando Web Crypto API nativa do browser

interface MetaCapiConfig {
  pixel_id: string;
  access_token: string;
  test_event_code?: string;
}

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  externalId?: string;
}

interface TrackingData {
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  gclid?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_source?: string;
  utm_content?: string;
  utm_term?: string;
}

interface MetaCapiPayload {
  data: Array<{
    event_name: string;
    event_time: number;
    action_source: string;
    user_data: {
      em?: string;
      ph?: string;
      fn?: string;
      ln?: string;
      country?: string;
      external_id?: string;
      client_ip_address?: string;
      client_user_agent?: string;
      fbp?: string;
      fbc?: string;
    };
    custom_data: {
      content_name?: string;
      content_category?: string;
      value?: number;
      currency?: string;
      fbclid?: string;
    };
    event_source_url?: string;
    opt_out?: boolean;
    event_id?: string;
  }>;
  test_event_code?: string;
}

export class MetaCapiService {
  private config: MetaCapiConfig;

  constructor(config: MetaCapiConfig) {
    this.config = config;
  }

  /**
   * Hash de dados sensíveis usando SHA-256
   */
  private async hashData(data: string): Promise<string> {
    if (!data) return '';
    
    try {
      // Usar Web Crypto API nativa do browser
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data.toLowerCase().trim());
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
      
      // Fallback: retornar dados sem hash
      console.log('🎯 META PIXEL - Web Crypto API não disponível, enviando dados sem hash');
      return data.toLowerCase().trim();
    } catch (error) {
      console.log('🎯 META PIXEL - Erro ao fazer hash:', error);
      return data.toLowerCase().trim(); // Retornar dados sem hash se falhar
    }
  }

  /**
   * Processar nome completo em primeiro nome e sobrenome
   */
  private processName(fullName: string): { firstName: string; lastName: string } {
    if (!fullName) return { firstName: '', lastName: '' };
    
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return {
      firstName: firstName.toLowerCase(),
      lastName: lastName.toLowerCase()
    };
  }

  /**
   * Processar telefone (apenas números)
   */
  private processPhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '');
  }

  /**
   * Capturar IP do usuário
   */
  private async getUserIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || '';
    } catch (error) {
      console.warn('Erro ao capturar IP do usuário:', error);
      return '';
    }
  }

  /**
   * Capturar User Agent
   */
  private getUserAgent(): string {
    return navigator.userAgent || '';
  }

  /**
   * Gerar ID único para o evento
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Mapear dados do usuário para formato CAPI
   */
  private async mapUserData(
    userData: UserData, 
    trackingData: TrackingData,
    formData: any,
    eventIdOverride?: string
  ): Promise<{
    user_data: any;
    custom_data: any;
    event_source_url: string;
    event_id: string;
  }> {
    const { firstName, lastName } = this.processName(userData.name || '');
    const userIP = await this.getUserIP();
    const userAgent = this.getUserAgent();
    const eventId = eventIdOverride || this.generateEventId();

    // Dados do usuário (hashados) - seguindo exemplo HTML que funciona
      const user_data = {
        em: await this.hashData(userData.email || ''),
        ph: await this.hashData(this.processPhone(userData.phone || '')),
        fn: await this.hashData((userData.fname || firstName).toLowerCase()),
        ln: await this.hashData((userData.lname || lastName).toLowerCase()),
        country: await this.hashData((userData.country || 'BR').toLowerCase()),
        external_id: await this.hashData(eventId),
        client_ip_address: userIP,
        client_user_agent: userAgent,
        fbp: trackingData.fbp || undefined,
        fbc: trackingData.fbc || undefined
      };

    // Dados customizados
    const custom_data = {
      content_name: formData.form_name || 'Formulário',
      content_category: 'lead_generation',
      value: 1,
      currency: 'BRL',
      fbclid: trackingData.fbclid || undefined
    };

    return {
      user_data,
      custom_data,
      event_source_url: formData.url_complete || '',
      event_id: eventId
    };
  }

  /**
   * Enviar evento para Meta CAPI
   */
  async sendEvent(
    userData: UserData,
    trackingData: TrackingData,
    formData: any,
    eventName: string = 'Lead',
    eventIdOverride?: string
  ): Promise<boolean> {
    try {
      const { user_data, custom_data, event_source_url, event_id } = await this.mapUserData(
        userData,
        trackingData,
        formData,
        eventIdOverride
      );

      const payload: MetaCapiPayload = {
        data: [
          {
            event_name: eventName || 'Lead',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            user_data,
            custom_data: {
              ...custom_data
            },
            event_source_url: event_source_url || '',
            opt_out: false,
            event_id: event_id || ''
          }
        ],
        test_event_code: this.config.test_event_code
      };

      // Log do test_event_code
      if (this.config.test_event_code) {
        console.log('🎯 META PIXEL - Debug - test_event_code configurado:', this.config.test_event_code);
      } else {
        console.log('🎯 META PIXEL - Debug - test_event_code não configurado');
      }

      console.log('🎯 META PIXEL - Debug - Enviando para Meta CAPI:', {
        url: `https://graph.facebook.com/v18.0/${this.config.pixel_id}/events?access_token=***`,
        payload: JSON.stringify(payload, null, 2)
      });
      
      console.log('🎯 META PIXEL - Debug - Payload detalhado:', {
        data_length: payload.data.length,
        event_name: payload.data[0].event_name,
        user_data_keys: Object.keys(payload.data[0].user_data),
        custom_data_keys: Object.keys(payload.data[0].custom_data),
        test_event_code: payload.test_event_code
      });
      
      console.log('🎯 META PIXEL - Debug - user_data detalhado:', user_data);
      console.log('🎯 META PIXEL - Debug - custom_data detalhado:', custom_data);
      console.log('🎯 META PIXEL - Debug - access_token:', this.config.access_token ? '***' + this.config.access_token.slice(-4) : 'undefined');

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.config.pixel_id}/events?access_token=${encodeURIComponent(this.config.access_token)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );
      
      console.log('🎯 META PIXEL - Debug - Response status:', response.status);
      console.log('🎯 META PIXEL - Debug - Response headers:', response.headers);

      if (response.ok) {
        console.log('🎯 META PIXEL - ✅ Meta CAPI enviado com sucesso');
        return true;
      } else {
        console.log('🎯 META PIXEL - ❌ Meta CAPI falhou:', response.status, response.statusText);
        return false;
      }

    } catch (error) {
      console.log('🎯 META PIXEL - ❌ Meta CAPI erro:', error);
      return false;
    }
  }

  /**
   * Verificar se o serviço está configurado
   */
  isConfigured(): boolean {
    return !!(this.config.pixel_id && this.config.access_token);
  }

  /**
   * Obter configuração atual
   */
  getConfig(): MetaCapiConfig {
    return { ...this.config };
  }
}

export default MetaCapiService;
