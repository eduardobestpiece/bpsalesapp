# Guia do Sistema de Integrações

## Visão Geral

O sistema de integrações permite configurar webhooks, pixels do Facebook/Meta, Google Ads e Google Analytics para formulários de leads, agendamentos, resultados e vendas.

## Funcionalidades Implementadas

### ✅ Fase 1 - Estrutura Base
- [x] Tabela `form_integrations` no banco de dados
- [x] Componentes de configuração para cada tipo de integração
- [x] Interface de usuário integrada nas páginas de configuração

### ✅ Fase 2 - Sistema de Webhook
- [x] Configuração de URLs de webhook
- [x] Disparo único por usuário (evita duplicação)
- [x] Envio de todos os dados do formulário e sistema

### ✅ Fase 3 - Integrações de Tracking
- [x] **Meta Ads**: Suporte a múltiplos pixels, eventos do Facebook
- [x] **Google Ads**: Tags de conversão com tracking
- [x] **Google Analytics**: Eventos personalizados e conversões

## Como Usar

### 1. Configurar Integrações

1. Acesse **Configurações > Formulários**
2. Selecione o tipo de formulário (Leads, Agendamentos, Resultados, Vendas)
3. Vá para a aba **Integrações**
4. Configure as integrações desejadas:

#### Webhook
- URL do webhook
- Ativar/desativar

#### Meta Ads
- Código do Pixel
- Token da API
- Tipo de evento (Lead, Purchase, etc.)
- Código de teste (opcional)

#### Google Ads
- Tag do Google
- Tag de conversão

#### Google Analytics
- Tag do Google Analytics
- Tag de conversão

### 2. Dados Enviados

Todas as integrações recebem os seguintes dados:

#### Campos do Formulário
- Todos os campos preenchidos pelo usuário
- Mapeados conforme configuração em "Sender"

#### Dados do Sistema
- Nome da empresa
- Nome do formulário
- Plataforma utilizada
- Tipo de dispositivo
- IP (quando disponível)
- Navegador utilizado
- URL completa
- Parâmetros da URL
- Dados de tracking (UTM, Facebook, Google)

### 3. Disparo Único

O sistema garante que cada integração seja disparada apenas uma vez por usuário, mesmo que o formulário seja enviado múltiplas vezes.

## Estrutura Técnica

### Banco de Dados

```sql
-- Tabela principal de integrações
CREATE TABLE form_integrations (
  id UUID PRIMARY KEY,
  form_id UUID NOT NULL,
  company_id UUID REFERENCES companies(id),
  integration_type TEXT CHECK (integration_type IN ('webhook', 'meta_ads', 'google_ads', 'analytics')),
  config_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Componentes

- `IntegrationsManager`: Componente principal que gerencia todas as integrações
- `WebhookIntegration`: Configuração de webhooks
- `MetaAdsIntegration`: Configuração de pixels do Facebook
- `GoogleAdsIntegration`: Configuração de Google Ads
- `AnalyticsIntegration`: Configuração de Google Analytics

### Serviços

- `IntegrationService`: Serviço principal para processar integrações
- `useIntegrations`: Hook para gerenciar integrações no frontend
- Utilitários para carregar scripts externos (Facebook, Google)

## Exemplos de Uso

### Webhook
```json
{
  "form_fields": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "11999999999"
  },
  "company_name": "Minha Empresa",
  "form_name": "Formulário de Contato",
  "platform": "Web",
  "device": "Desktop",
  "browser": "Chrome 120.0",
  "url_complete": "https://site.com/formulario",
  "utm_source": "google",
  "utm_campaign": "campanha1"
}
```

### Meta Ads
- Evento: `Lead`
- Dados: Nome, email, telefone formatados para Facebook
- Valor: 1 BRL

### Google Ads
- Conversão disparada com ID da tag
- Valor: 1 BRL
- Transaction ID único

### Google Analytics
- Evento: `form_submission`
- Categoria: `engagement`
- Label: Nome do formulário

## Troubleshooting

### Webhook não dispara
1. Verificar se a URL está correta
2. Verificar se o webhook está ativo
3. Verificar logs do console

### Pixel Facebook não carrega
1. Verificar se o código do pixel está correto
2. Verificar se não há bloqueadores de anúncios
3. Verificar console para erros

### Google Analytics não funciona
1. Verificar se a tag está correta
2. Verificar se o Google Analytics está carregado
3. Verificar se há conflitos com outros scripts

## Próximos Passos

- [ ] Adicionar logs de integração
- [ ] Implementar retry automático para webhooks
- [ ] Adicionar métricas de conversão
- [ ] Implementar A/B testing para integrações
