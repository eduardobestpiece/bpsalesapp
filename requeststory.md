# Requisição em Andamento

## Criação e Edição de Funis (Configurações CRM)
- Adicionar campos toggle (ligar/desligar):
  - Valor das Vendas: Manual/Sistema
  - Recomendações: Manual/Sistema
- Seleção da etapa do funil atrelada às recomendações
- Visibilidade restrita a Master/Admin

## Registro e Edição de Indicadores
- Valor das vendas: editável se "Manual", calculado se "Sistema"
- Número de recomendações: editável se "Manual", calculado se "Sistema" (leads de origem recomendação)

## Banco de Dados
- Adicionar na tabela `funnels`:
  - `sales_value_mode` (enum/manual/sistema)
  - `recommendations_mode` (enum/manual/sistema)
  - `recommendation_stage_id` (uuid, FK para `funnel_stages`)

## Checklist
- [ ] Migration SQL criada e aplicada
- [ ] Tipos TypeScript atualizados
- [ ] Modal de Funil atualizado (campos + permissão)
- [ ] Modal de Indicador atualizado (campos + lógica)
- [ ] Lógica de cálculo automático implementada
- [ ] Testes manuais realizados
- [ ] Deploy realizado
- [ ] Usuário validou funcionamento

---

**Status:** Iniciando etapa de migration no banco de dados. 