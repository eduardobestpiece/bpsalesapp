/**
 * Script para ser incluído na página pai onde o iframe está embedado
 * Este script captura dados de tracking e os envia para o iframe via postMessage
 */

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
    
    console.log('📊 Parent page - Found iframes:', iframes.length);
    console.log('📊 Parent page - Tracking data to send:', trackingData);
    
    iframes.forEach((iframe, index) => {
      try {
        // Aguardar um pouco para garantir que o iframe esteja carregado
        setTimeout(() => {
          try {
            // Enviar dados de tracking para o iframe
            iframe.contentWindow.postMessage({
              type: 'PARENT_TRACKING_DATA',
              data: trackingData
            }, '*');
            
            console.log(`📊 Tracking data sent to iframe ${index}:`, trackingData);
          } catch (innerError) {
            console.log(`⚠️ Could not send tracking data to iframe ${index}:`, innerError);
          }
        }, 100 * (index + 1)); // Delay escalonado para cada iframe
      } catch (error) {
        console.log(`⚠️ Error preparing to send data to iframe ${index}:`, error);
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
    
    // Observar quando iframes são adicionados à página
    const iframeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'IFRAME') {
            console.log('📊 New iframe detected, sending tracking data');
            setTimeout(sendTrackingDataToIframe, 500);
          }
        });
      });
    });
    
    iframeObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
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
    setInterval(sendTrackingDataToIframe, 3000);
    
    // Enviar dados quando a página ganha foco (caso o usuário volte para a aba)
    window.addEventListener('focus', () => {
      setTimeout(sendTrackingDataToIframe, 100);
    });
    
    console.log('📊 Parent page tracking initialized');
  }
  
  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
