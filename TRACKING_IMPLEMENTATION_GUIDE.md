# Guia de Implementação de Tracking para Iframes

## Problema Identificado

O iframe estava capturando a URL do próprio formulário (`http://localhost:8080/form/...`) em vez da URL da página pai onde está embedado, e não estava capturando os cookies de tracking corretamente.

## Solução Implementada

### 1. Script para Página Pai

Para que o iframe capture corretamente os dados de tracking da página pai, é necessário incluir o seguinte script na página onde o iframe está embedado:

```html
<script>
(function() {
  'use strict';
  
  // Função para obter parâmetros da URL
  function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};
    for (const [key, value] of urlParams.entries()) {
      params[key] = value;
    }
    return params;
  }
  
  // Função para obter cookies
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
  }
  
  // Função para capturar dados de tracking
  function captureTrackingData() {
    return {
      url: window.location.href,
      urlParams: getUrlParams(),
      utmSource: getUrlParams().utm_source || '',
      utmMedium: getUrlParams().utm_medium || '',
      utmCampaign: getUrlParams().utm_campaign || '',
      utmContent: getUrlParams().utm_content || '',
      utmTerm: getUrlParams().utm_term || '',
      gclid: getUrlParams().gclid || '',
      fbclid: getUrlParams().fbclid || '',
      fbc: getCookie('_fbc') || '',
      fbp: getCookie('_fbp') || '',
      fbid: getCookie('_fbid') || ''
    };
  }
  
  // Função para enviar dados para o iframe
  function sendTrackingDataToIframe() {
    const trackingData = captureTrackingData();
    
    // Encontrar todos os iframes na página
    const iframes = document.querySelectorAll('iframe');
    
    iframes.forEach(iframe => {
      try {
        // Enviar dados de tracking para o iframe
        iframe.contentWindow.postMessage({
          type: 'PARENT_TRACKING_DATA',
          data: trackingData
        }, '*');
        
        console.log('📊 Tracking data sent to iframe:', trackingData);
      } catch (error) {
        console.log('⚠️ Could not send tracking data to iframe:', error);
      }
    });
  }
  
  // Função para responder a solicitações do iframe
  function handleIframeRequests(event) {
    if (event.data && typeof event.data === 'object') {
      if (event.data.type === 'REQUEST_PARENT_URL') {
        // Responder com a URL da página pai
        event.source.postMessage({
          type: 'PARENT_URL_RESPONSE',
          url: window.location.href
        }, '*');
      } else if (event.data.type === 'REQUEST_COOKIE') {
        // Responder com o valor do cookie solicitado
        const cookieValue = getCookie(event.data.cookieName);
        event.source.postMessage({
          type: 'PARENT_COOKIE_RESPONSE',
          cookieName: event.data.cookieName,
          cookieValue: cookieValue
        }, '*');
      }
    }
  }
  
  // Inicializar quando o DOM estiver pronto
  function init() {
    // Enviar dados imediatamente
    sendTrackingDataToIframe();
    
    // Enviar dados quando a URL mudar (SPA)
    let currentUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        setTimeout(sendTrackingDataToIframe, 100);
      }
    });
    
    urlObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Escutar solicitações do iframe
    window.addEventListener('message', handleIframeRequests);
    
    // Reenviar dados periodicamente (para garantir que o iframe receba)
    setInterval(sendTrackingDataToIframe, 5000);
    
    console.log('📊 Parent page tracking initialized');
  }
  
  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
</script>
```

### 2. Dados Capturados

O script captura os seguintes dados da página pai:

- **URL Completa**: URL da página onde o iframe está embedado
- **Parâmetros UTM**: utm_source, utm_medium, utm_campaign, utm_content, utm_term
- **Parâmetros de Tracking**: gclid, fbclid
- **Cookies de Tracking**: _fbc, _fbp, _fbid

### 3. Como Funciona

1. **Captura Automática**: O script captura automaticamente todos os dados de tracking da página pai
2. **Envio para Iframe**: Os dados são enviados para o iframe via `postMessage`
3. **Recebimento no Iframe**: O iframe recebe os dados e os usa para salvar no banco de dados
4. **Fallback**: Se não conseguir capturar da página pai, usa a URL atual como fallback

### 4. Exemplo de Uso

```html
<!DOCTYPE html>
<html>
<head>
    <title>Minha Página</title>
</head>
<body>
    <h1>Minha Página com Iframe</h1>
    
    <!-- Iframe do formulário -->
    <iframe src="http://localhost:8080/form/SEU_FORM_ID" width="100%" height="600"></iframe>
    
    <!-- Script de tracking (obrigatório) -->
    <script>
        // [Código do script acima]
    </script>
</body>
</html>
```

### 5. Dados Enviados para Webhook

Com a implementação, o webhook receberá:

```json
{
  "form_fields": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "11999999999"
  },
  "url": "https://meusite.com.br/landing?utm_source=google&utm_campaign=teste",
  "utm_campaign": "teste",
  "utm_medium": "cpc",
  "utm_source": "google",
  "utm_content": "banner",
  "utm_term": "consorcio",
  "gclid": "abc123",
  "fbclid": "def456",
  "fbc": "fb.1.1234567890.1234567890",
  "fbp": "fb.1.1234567890.1234567890",
  "fbid": "1234567890"
}
```

### 6. Arquivo de Exemplo

Um arquivo de exemplo completo está disponível em: `public/iframe-tracking-example.html`

## Resultado

Agora o sistema captura corretamente:
- ✅ URL da página pai (onde o iframe está embedado)
- ✅ Parâmetros UTM da página pai
- ✅ Cookies de tracking da página pai
- ✅ Envio correto para webhooks e integrações
- ✅ Salvamento correto no banco de dados
