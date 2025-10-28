# Correção do Sistema de Detecção de Leads Duplicados

## Problema Identificado

O sistema de distribuição de leads estava distribuindo leads com o mesmo telefone ou email para usuários diferentes, violando a regra de negócio:

> **Regra:** Caso tenha o telefone OU o email igual E seja cadastro no mesmo Formulário, tem que ir para o mesmo usuário!

## Causa Raiz

A função SQL `check_duplicate_lead_responsible` estava buscando os dados de email e telefone diretamente na tabela `leads`, mas esses campos estavam vazios. Os dados reais estavam armazenados na tabela `lead_field_values`.

## Solução Implementada

### 1. Correção da Função SQL

**Arquivo:** `supabase/migrations/fix_duplicate_lead_detection_with_field_values.sql`

A função `check_duplicate_lead_responsible` foi corrigida para:

- Buscar dados de email e telefone na tabela `lead_field_values`
- Usar JOINs para conectar `leads` com `lead_field_values`
- Manter a lógica de normalização (email em lowercase, telefone apenas números)
- Priorizar leads mais recentes na verificação de duplicatas

### 2. Field IDs Utilizados

- **Email:** `04c3b689-fa22-4afc-afcd-606a99aa6050`
- **Telefone:** `2a43cc90-710e-4c93-a0f7-5d865b807299`

### 3. Lógica de Verificação

```sql
-- Buscar lead existente com mesmo email OU telefone no mesmo formulário
SELECT l.responsible_id INTO v_existing_responsible_id
FROM leads l
JOIN lead_field_values lfv_email ON l.id = lfv_email.lead_id AND lfv_email.field_id = v_email_field_id
JOIN lead_field_values lfv_telefone ON l.id = lfv_telefone.lead_id AND lfv_telefone.field_id = v_telefone_field_id
WHERE l.company_id = p_company_id
  AND l.form_id = p_form_id
  AND l.responsible_id IS NOT NULL
  AND (
      (v_clean_email != '' AND LOWER(TRIM(lfv_email.value_text)) = v_clean_email) OR
      (v_clean_telefone != '' AND REGEXP_REPLACE(lfv_telefone.value_text, '[^0-9]', '', 'g') = v_clean_telefone)
  )
ORDER BY l.created_at DESC
LIMIT 1;
```

## Testes Realizados

### Teste 1: Lead Duplicado por Email
- **Email:** `eduardo2@bpsales.com.br`
- **Telefone:** `5561981719292`
- **Resultado:** ✅ Retorna `29d7ea19-70f9-49bd-9f31-54b1aca71f9b` (Eduardo Colab)

### Teste 2: Lead Duplicado por Telefone
- **Email:** `eduardo@bpsales.com.br` (diferente)
- **Telefone:** `5561981719292` (mesmo)
- **Resultado:** ✅ Retorna `29d7ea19-70f9-49bd-9f31-54b1aca71f9b` (Eduardo Colab)

### Teste 3: Lead Novo
- **Email:** `teste@novo.com`
- **Telefone:** `11999999999`
- **Resultado:** ✅ Distribui normalmente entre os usuários configurados

## Impacto

- ✅ **Leads duplicados** agora são atribuídos ao mesmo responsável
- ✅ **Distribuição normal** continua funcionando para leads únicos
- ✅ **Performance** mantida com queries otimizadas
- ✅ **Compatibilidade** com estrutura existente preservada

## Status

**✅ CORREÇÃO APLICADA E TESTADA**

A função `assign_lead_responsible` agora funciona corretamente, garantindo que leads com o mesmo telefone ou email sejam sempre atribuídos ao mesmo responsável, respeitando a regra de negócio estabelecida.
