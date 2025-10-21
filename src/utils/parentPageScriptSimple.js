// Script para ser adicionado na página pai que contém o iframe
// Este script permite que o iframe acesse a URL da página pai

(function() {
  console.log('🔍 Debug - Script da página pai carregado');
  
  // Escutar mensagens do iframe
  window.addEventListener('message', function(event) {
    console.log('🔍 Debug - Mensagem recebida do iframe:', event.data);
    
    if (event.data.type === 'GET_PARENT_URL') {
      console.log('🔍 Debug - Enviando URL da página pai para o iframe:', window.location.href);
      
      // Enviar URL de volta para o iframe
      event.source.postMessage({
        type: 'PARENT_URL_RESPONSE',
        url: window.location.href
      }, '*');
    }
    
    // Listener para redirecionamento
    if (event.data.type === 'REDIRECT' && event.data.url) {
      console.log('🔍 Debug - Mensagem de redirecionamento recebida:', event.data.url);
      window.location.href = event.data.url;
    }
  });
  
  // Também enviar URL automaticamente quando o iframe carregar
  window.addEventListener('load', function() {
    console.log('🔍 Debug - Página pai carregada, enviando URL para iframes');
    
    // Enviar URL para todos os iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow.postMessage({
          type: 'PARENT_URL_RESPONSE',
          url: window.location.href
        }, '*');
        console.log('🔍 Debug - URL enviada para iframe:', window.location.href);
      } catch (error) {
        console.log('🔍 Debug - Erro ao enviar URL para iframe:', error);
      }
    });
  });
  
  console.log('🔍 Debug - Script da página pai configurado');
})();
