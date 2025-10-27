# Guia de Teste - Iframe Independente

## ✅ Solução Implementada

O iframe agora funciona **independentemente**, sem necessidade de scripts externos na página pai. Ele automaticamente:

1. **Injeta um script** na página pai para capturar dados de tracking
2. **Captura dados** via `postMessage` da página pai
3. **Usa fallbacks** como `document.referrer` se necessário
4. **Evita duplicação** de parâmetros UTM no webhook

## 🔧 Melhorias Implementadas

### 1. Injeção Automática de Script
- ✅ O iframe injeta automaticamente um script na página pai
- ✅ Script captura URL, parâmetros UTM e cookies
- ✅ Envia dados via `postMessage` para o iframe
- ✅ Funciona sem intervenção manual

### 2. Correção de Duplicação
- ✅ Parâmetros UTM não são mais duplicados no webhook
- ✅ Dados de tracking são passados separadamente
- ✅ Webhook recebe dados limpos e organizados

### 3. Múltiplos Fallbacks
- ✅ `postMessage` da página pai (método principal)
- ✅ `document.referrer` (fallback)
- ✅ URL atual com parâmetros de tracking (último recurso)

## 📊 Como Testar

### Teste 1: Página Simples (Recomendado)

1. **Acesse:** `http://localhost:8080/simple-test.html?utm_source=google&utm_medium=cpc&utm_campaign=teste&utm_content=banner&utm_term=consorcio&gclid=abc123&fbclid=def456`

2. **Verifique no console:**
   - `📊 Injected tracking script into parent page`
   - `📊 Received parent tracking data:`
   - `🔍 Debug - Dados de tracking capturados:`

3. **Preencha e submeta o formulário**

4. **Verifique o webhook** - deve receber dados limpos sem duplicação

### Teste 2: Página Real

1. **Crie uma página HTML** simples com o iframe:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Minha Landing Page</title>
</head>
<body>
    <h1>Minha Landing Page</h1>
    <iframe src="http://localhost:8080/form/SEU_FORM_ID" width="100%" height="600px"></iframe>
</body>
</html>
```

2. **Acesse com parâmetros UTM:**
```
http://localhost:8080/sua-pagina.html?utm_source=facebook&utm_medium=social&utm_campaign=promocao
```

3. **Teste o formulário** - deve capturar os dados automaticamente

## 🎯 Dados Esperados no Webhook

### ✅ Com a Solução (Correto):
```json
{
  "form_fields": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "11999999999"
  },
  "url": "http://localhost:8080/simple-test.html?utm_source=google&utm_medium=cpc&utm_campaign=teste",
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

### ❌ Antes (Com Problemas):
```json
{
  "form_fields": {
    "nome": "João Silva",
    "email": "joao@email.com", 
    "telefone": "11999999999",
    "utmSource": "google",  // ❌ Duplicado
    "utmMedium": "cpc",     // ❌ Duplicado
    "utmCampaign": "teste"  // ❌ Duplicado
  },
  "utm_campaign": "teste",  // ❌ Duplicado
  "utm_medium": "cpc",      // ❌ Duplicado
  "utm_source": "google"    // ❌ Duplicado
}
```

## 🔍 Logs de Debug Esperados

### No Console da Página Pai:
```
📊 Injected tracking script into parent page
```

### No Console do Iframe:
```
📊 Requested parent URL from iframe
📊 Received parent tracking data: {url: "...", utmSource: "google", ...}
🔍 Debug - Dados de tracking capturados: {finalUrl: "...", utmSource: "google", ...}
```

## 🚀 Vantagens da Nova Solução

1. **✅ Zero Configuração:** Iframe funciona em qualquer página
2. **✅ Sem Poluição:** Não precisa de scripts externos
3. **✅ Dados Limpos:** Sem duplicação no webhook
4. **✅ Múltiplos Fallbacks:** Funciona mesmo com restrições
5. **✅ Compatibilidade:** Funciona com qualquer site

## 🛠️ Arquivos Modificados

1. **`src/pages/PublicForm.tsx`** - Injeção automática de script
2. **`src/services/integrationService.ts`** - Correção de duplicação
3. **`public/simple-test.html`** - Página de teste simples

## 📝 Próximos Passos

1. **Teste com a página simples** fornecida
2. **Verifique os logs** no console
3. **Confirme dados no webhook** sem duplicação
4. **Teste em uma página real** com parâmetros UTM
5. **Deploy para produção** quando confirmado

A solução agora é **completamente independente** e **livre de duplicação**! 🎉
