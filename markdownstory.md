# Histórico de Atividades

## 2024-07-08

- **Correção de filtro administrator_id nas listagens do CRM**
  - Corrigido o filtro de `administrator_id` nos componentes de Produtos, Parcelas, Tipos de Lances e Entradas.
  - Agora o filtro só é aplicado se o valor for válido (não nulo, não undefined, não 'all'), evitando erro 400 e exibindo corretamente os dados.
  - Componentes alterados:
    - ProductsList.tsx
    - InstallmentTypesList.tsx
    - BidTypesList.tsx
    - EntryTypesList.tsx
  - Status: ✅ Concluído

- **Ajuste no modal Registrar Indicador para exibir todos os funis**
  - Alterado o hook useFunnels para aceitar parâmetro de status ('active', 'archived', 'all').
  - No modal Registrar Indicador, agora são exibidos todos os funis cadastrados (ativos e arquivados).
  - Objetivo: permitir selecionar qualquer funil ao registrar um novo indicador.
  - Status: ✅ Concluído

- **Ajuste no modal de criação/edição de funil**
  - Removido o campo "Valor Base para Cálculos".
  - Primeira etapa do funil agora aceita apenas valor (quantidade), sem campo de percentual.
  - Da segunda etapa em diante, mantido percentual e valor, mas o cálculo de base usa o valor da etapa anterior.
  - Objetivo: tornar o fluxo de criação/edição de funil mais intuitivo e alinhado ao processo de negócio.
  - Status: ✅ Concluído

--- 