// Script para ser adicionado na página pai que contém o iframe
// Este script permite que o iframe acesse a URL da página pai

(function() {
  // Escutar mensagens do iframe
  window.addEventListener('message', function(event) {
    if (event.data.type === 'GET_PARENT_URL') {
      // Enviar URL de volta para o iframe
      event.source.postMessage({
        type: 'PARENT_URL_RESPONSE',
        url: window.location.href
      }, '*');
    }
    
    // Listener para redirecionamento
    if (event.data.type === 'REDIRECT' && event.data.url) {
      window.location.href = event.data.url;
    }
  });
  
  // Também enviar URL automaticamente quando o iframe carregar
  window.addEventListener('load', function() {
    // Enviar URL para todos os iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow.postMessage({
          type: 'PARENT_URL_RESPONSE',
          url: window.location.href
        }, '*');
      } catch (error) {
        // Erro ao enviar URL para iframe
      }
    });
  });
})();
