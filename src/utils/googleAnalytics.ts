// Utilitários para Google Analytics e Google Ads

declare global {
  interface Window {
    gtag: any;
    dataLayer: any[];
  }
}

// Carregar Google Tag Manager
export function loadGoogleTagManager(gtmId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window não disponível'));
      return;
    }

    // Verificar se já foi carregado
    if (window.gtag) {
      resolve();
      return;
    }

    // Inicializar dataLayer
    window.dataLayer = window.dataLayer || [];

    // Carregar script do GTM
    const script = document.createElement('script');
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Erro ao carregar Google Tag Manager'));
    
    document.head.appendChild(script);
  });
}

// Carregar Google Analytics
export function loadGoogleAnalytics(gaId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window não disponível'));
      return;
    }

    // Verificar se já foi carregado
    if (window.gtag) {
      resolve();
      return;
    }

    // Carregar script do Google Analytics
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script.async = true;
    
    script.onload = () => {
      // Inicializar gtag
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
      
      window.gtag('js', new Date());
      window.gtag('config', gaId);
      
      resolve();
    };
    
    script.onerror = () => reject(new Error('Erro ao carregar Google Analytics'));
    
    document.head.appendChild(script);
  });
}

// Disparar evento do Google Analytics
export function trackGoogleEvent(eventName: string, eventData: any = {}): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventData);
    console.log('Google Analytics event disparado:', eventName, eventData);
  } else {
    console.warn('Google Analytics não carregado');
  }
}

// Disparar conversão do Google Ads
export function trackGoogleAdsConversion(conversionId: string, value: number = 1, currency: string = 'BRL', transactionId?: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    const eventData: any = {
      'send_to': conversionId,
      'value': value,
      'currency': currency
    };
    
    if (transactionId) {
      eventData['transaction_id'] = transactionId;
    }
    
    window.gtag('event', 'conversion', eventData);
    console.log('Google Ads conversion disparada:', conversionId);
  } else {
    console.warn('Google Analytics não carregado');
  }
}

// Disparar evento personalizado
export function trackCustomEvent(eventName: string, parameters: any = {}): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
    console.log('Custom event disparado:', eventName, parameters);
  } else {
    console.warn('Google Analytics não carregado');
  }
}

// Verificar se Google Analytics está carregado
export function isGoogleAnalyticsLoaded(): boolean {
  return typeof window !== 'undefined' && !!window.gtag;
}

// Configurar dados do usuário
export function setUserProperties(properties: Record<string, any>): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      'custom_map': properties
    });
  }
}
