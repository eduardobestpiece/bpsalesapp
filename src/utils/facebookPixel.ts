// Utilitários para Facebook Pixel

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

// Carregar Facebook Pixel
export function loadFacebookPixel(pixelId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window não disponível'));
      return;
    }

    // Verificar se já foi carregado
    if (window.fbq) {
      console.log('🎯 META PIXEL - Facebook Pixel já carregado');
      resolve();
      return;
    }
    
    console.log('🎯 META PIXEL - Carregando Facebook Pixel:', pixelId);
    
    // Verificar se o script já existe
    const existingScript = document.querySelector('script[src*="fbevents.js"]');
    console.log('🎯 META PIXEL - Verificando script existente:', !!existingScript);
    if (existingScript) {
      console.log('🎯 META PIXEL - Script já existe, aguardando fbq...');
      setTimeout(() => {
        console.log('🎯 META PIXEL - Verificando fbq após timeout...');
        console.log('🎯 META PIXEL - window.fbq disponível:', !!window.fbq);
        if (window.fbq) {
          console.log('🎯 META PIXEL - ✅ Facebook Pixel já carregado');
          resolve();
        } else {
          console.log('🎯 META PIXEL - ⚠️ Script existe mas fbq não disponível');
          resolve();
        }
      }, 100);
      return;
    }

    // Inicializar fbq primeiro
    (function(f: any, b: any, e: string, v: string) {
      if (f.fbq) return;
      const n: any = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      const t = b.createElement(e);
      t.async = true;
      t.src = v;
      const s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
      
      // Inicializar o pixel
      n('init', pixelId);
      
      console.log('🎯 META PIXEL - Script inicializado');
      
      // Aguardar carregamento do script externo
      t.onload = () => {
        console.log('🎯 META PIXEL - Script fbevents.js carregado');
        setTimeout(() => {
          console.log('🎯 META PIXEL - window.fbq disponível:', !!window.fbq);
          if (window.fbq) {
            console.log('🎯 META PIXEL - ✅ Facebook Pixel carregado com sucesso');
            resolve();
          } else {
            console.log('🎯 META PIXEL - ⚠️ fbq ainda não disponível, tentando mesmo assim');
            resolve();
          }
        }, 500);
      };
      
      t.onerror = (error: any) => {
        console.log('🎯 META PIXEL - ❌ Erro ao carregar script:', error);
        reject(new Error('Erro ao carregar Facebook Pixel'));
      };
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  });
}

// Disparar evento do Facebook
export function trackFacebookEvent(eventName: string, eventData: any = {}): void {
  console.log('🎯 META PIXEL - Tentando disparar evento:', eventName);
  console.log('🎯 META PIXEL - Dados do evento:', eventData);
  console.log('🎯 META PIXEL - fbq disponível:', !!window.fbq);
  console.log('🎯 META PIXEL - window disponível:', typeof window !== 'undefined');
  
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      console.log('🎯 META PIXEL - Chamando window.fbq...');
      window.fbq('track', eventName, eventData);
      console.log('🎯 META PIXEL - ✅ Evento disparado com sucesso:', eventName);
    } catch (error) {
      console.log('🎯 META PIXEL - ❌ Erro ao disparar evento:', error);
    }
  } else {
    console.log('🎯 META PIXEL - ❌ fbq não disponível, evento não disparado');
    console.log('🎯 META PIXEL - window:', typeof window);
    console.log('🎯 META PIXEL - fbq:', window.fbq);
  }
}

// Disparar conversão personalizada
export function trackFacebookConversion(eventName: string, value: number = 1, currency: string = 'BRL', customData: any = {}): void {
  const eventData = {
    value,
    currency,
    ...customData
  };
  
  trackFacebookEvent(eventName, eventData);
}

// Verificar se Facebook Pixel está carregado
export function isFacebookPixelLoaded(): boolean {
  return typeof window !== 'undefined' && !!window.fbq;
}
