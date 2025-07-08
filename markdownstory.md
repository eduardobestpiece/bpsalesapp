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

--- 