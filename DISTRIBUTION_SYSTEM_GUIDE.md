# Sistema de Distribuição Automática de Leads

## Funcionalidade Implementada

Este sistema permite que formulários com distribuição configurada automaticamente atribuam responsáveis aos leads baseado nos pesos definidos na distribuição.

## Como Funciona

### 1. Configuração da Distribuição
- Acesse a aba "Distribuição" na página de "Formulários"
- Selecione um formulário
- Adicione usuários com pesos numéricos
- O sistema calcula automaticamente os percentuais

### 2. Algoritmo de Distribuição
- Usa algoritmo de "roleta" baseado nos pesos
- Usuários com peso maior têm maior probabilidade de receber leads
- Distribuição é aleatória mas proporcional aos pesos

### 3. Atribuição Automática
- Quando um lead é criado via formulário com distribuição
- O sistema automaticamente atribui um responsável
- O campo `responsible_id` é preenchido na tabela `leads`

### 4. Webhook com Dados do Responsável
Quando um webhook está configurado, os seguintes campos são enviados:

```json
{
  "responsavel_nome": "Eduardo Costa",
  "responsavel_primeiro_nome": "Eduardo", 
  "responsavel_sobrenome": "Costa",
  "responsavel_email": "eduardo@exemplo.com",
  "responsavel_telefone": "5561981719292"
}
```

## Como Usar

### Via Edge Function (Recomendado)
```javascript
const response = await fetch('https://hpjqetugksblfiojwhzh.supabase.co/functions/v1/create-lead-with-distribution', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    form_id: 'uuid-do-formulario',
    company_id: 'uuid-da-empresa',
    nome: 'Nome do Lead',
    email: 'email@exemplo.com',
    telefone: '11999999999',
    // outros campos do lead...
  })
});
```

### Via SQL Direto
```sql
-- Criar lead com atribuição automática
INSERT INTO leads (
  form_id,
  company_id,
  nome,
  email,
  telefone,
  responsible_id
) VALUES (
  'uuid-do-formulario',
  'uuid-da-empresa', 
  'Nome do Lead',
  'email@exemplo.com',
  '11999999999',
  assign_lead_responsible('uuid-do-formulario', 'uuid-da-empresa')
);
```

## Estrutura das Tabelas

### lead_form_distributions
- `id`: UUID da distribuição
- `lead_form_id`: ID do formulário
- `company_id`: ID da empresa
- `is_active`: Se a distribuição está ativa

### lead_form_distribution_users
- `id`: UUID do registro
- `distribution_id`: ID da distribuição
- `user_id`: ID do usuário
- `number_weight`: Peso numérico (ex: 1, 2, 3)
- `percentage_weight`: Percentual calculado automaticamente

## Função SQL

### assign_lead_responsible(form_id, company_id)
Retorna o UUID do usuário responsável baseado na distribuição configurada.

**Parâmetros:**
- `p_form_id`: UUID do formulário
- `p_company_id`: UUID da empresa

**Retorno:**
- UUID do usuário responsável ou NULL se não há distribuição

## Exemplo de Distribuição

```
Usuário A: Peso 1 (33.33%)
Usuário B: Peso 2 (66.67%)
Total: Peso 3

Algoritmo:
- Gera número aleatório de 1 a 3
- Se 1: Usuário A
- Se 2 ou 3: Usuário B
```

## Benefícios

1. **Distribuição Justa**: Baseada em pesos configuráveis
2. **Automática**: Sem intervenção manual
3. **Rastreável**: Cada lead tem responsável definido
4. **Integração**: Dados do responsável enviados via webhook
5. **Flexível**: Pode ser ativado/desativado por formulário

## Monitoramento

Para verificar a distribuição:
```sql
-- Ver leads por responsável
SELECT 
  cu.first_name,
  cu.last_name,
  COUNT(l.id) as total_leads
FROM leads l
JOIN crm_users cu ON l.responsible_id = cu.id
WHERE l.form_id = 'uuid-do-formulario'
GROUP BY cu.id, cu.first_name, cu.last_name
ORDER BY total_leads DESC;
```
