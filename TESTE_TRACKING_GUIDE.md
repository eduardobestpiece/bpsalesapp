# Guia de Teste - Tracking de Iframe

## Problema Identificado

O iframe não estava capturando os dados de tracking da página pai, mesmo com o script implementado.

## Soluções Implementadas

### 1. Script Melhorado para Página Pai

O script `src/utils/parentPageTracking.js` foi atualizado com:
- ✅ Logs detalhados para debug
- ✅ Múltiplos métodos de envio
- ✅ Observação de novos iframes
- ✅ Reenvio periódico de dados
- ✅ Resposta a solicitações do iframe

### 2. Iframe com Debug Melhorado

O `PublicForm.tsx` foi atualizado com:
- ✅ Logs detalhados de mensagens recebidas
- ✅ Solicitação ativa de dados da página pai
- ✅ Fallback para `document.referrer`
- ✅ Múltiplos métodos de captura

### 3. Arquivo de Teste

Criado `public/test-tracking.html` para testar a comunicação.

## Como Testar

### Passo 1: Acessar a Página de Teste

1. Abra o navegador e acesse:
   ```
   http://localhost:8080/test-tracking.html?utm_source=google&utm_medium=cpc&utm_campaign=teste&utm_content=banner&utm_term=consorcio&gclid=abc123&fbclid=def456
   ```

2. Verifique se os dados de tracking aparecem na seção "Dados de Tracking da Página Pai"

### Passo 2: Verificar Console do Navegador

1. Abra o DevTools (F12)
2. Vá para a aba "Console"
3. Procure por logs que começam com:
   - `📊 Parent page - Found iframes:`
   - `📊 Parent page - Tracking data to send:`
   - `📊 Tracking data sent to iframe:`

### Passo 3: Verificar Console do Iframe

1. No DevTools, vá para a aba "Console"
2. Procure por logs que começam com:
   - `🔍 Debug - Message received in iframe:`
   - `📊 Received parent tracking data:`
   - `🔍 Debug - Dados de tracking capturados:`

### Passo 4: Preencher o Formulário

1. Preencha o formulário no iframe
2. Submeta o formulário
3. Verifique se os dados de tracking foram capturados corretamente

## Logs Esperados

### Na Página Pai:
```
📊 Parent page tracking initialized
📊 Parent page - Found iframes: 1
📊 Parent page - Tracking data to send: {url: "http://localhost:8080/test-tracking.html?utm_source=google...", utmSource: "google", ...}
📊 Tracking data sent to iframe 0: {url: "http://localhost:8080/test-tracking.html?utm_source=google...", ...}
```

### No Iframe:
```
🔍 Debug - Message received in iframe: {type: "PARENT_TRACKING_DATA", data: {...}}
📊 Received parent tracking data: {url: "http://localhost:8080/test-tracking.html?utm_source=google...", ...}
🔍 Debug - Dados de tracking capturados: {finalUrl: "http://localhost:8080/test-tracking.html?utm_source=google...", utmSource: "google", ...}
```

## Dados Esperados no Webhook

Se funcionando corretamente, o webhook deve receber:

```json
{
  "form_fields": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "11999999999"
  },
  "url": "http://localhost:8080/test-tracking.html?utm_source=google&utm_medium=cpc&utm_campaign=teste&utm_content=banner&utm_term=consorcio&gclid=abc123&fbclid=def456",
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

## Troubleshooting

### Se não aparecer logs da página pai:
1. Verifique se o script está sendo executado
2. Verifique se há erros no console
3. Verifique se o iframe está carregando

### Se não aparecer logs do iframe:
1. Verifique se o iframe está recebendo mensagens
2. Verifique se há erros de CORS
3. Verifique se o iframe está carregado completamente

### Se os dados não forem capturados:
1. Verifique se a URL da página pai tem parâmetros UTM
2. Verifique se os cookies estão sendo definidos
3. Verifique se a comunicação está funcionando

## Próximos Passos

1. Teste com a página de teste fornecida
2. Verifique os logs no console
3. Confirme se os dados estão sendo capturados
4. Teste com uma página real com parâmetros UTM
5. Verifique se os dados estão sendo salvos no banco de dados
6. Verifique se os dados estão sendo enviados para o webhook
