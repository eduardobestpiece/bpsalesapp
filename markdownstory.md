# Histórico de Atividades

## 2024-07-08

- **Implementação da persistência das etapas do funil (funnel_stages)**
  - Agora, ao criar ou editar um funil, as etapas são salvas, atualizadas e removidas corretamente no Supabase.
  - O modal de edição exibe as etapas cadastradas.
  - Status: ✅ Concluído

- **Ajuste no modal de Registrar Indicador**
  - Garantido que o seletor de funil exibe corretamente todos os funis disponíveis da empresa.
  - Adicionada mensagem de vazio caso não haja funis cadastrados.
  - Status: ✅ Concluído

- [x] Implementação da lógica de períodos dinâmicos no modal de indicador do CRM, conforme configuração do funil (diário, semanal, mensal), destacando períodos faltantes em vermelho (a partir do segundo registro) e bloqueando períodos já registrados.
- [x] Commit e deploy automático realizados.
- [ ] Aguardando validação do usuário sobre o funcionamento da nova lógica de períodos no modal.

- [x] Implementação das regras avançadas para sugestão e restrição de períodos no campo "Período" do modal de indicador:
  - Primeiro registro: períodos dos últimos 90 dias, só pode registrar no último dia do período.
  - Segundo registro em diante: só períodos entre o último registrado e o atual, sem futuros, destacando faltantes em vermelho.
- [x] Commit e deploy automático realizados.
- [ ] Aguardando validação do usuário sobre o novo comportamento do campo "Período".

- [2024-07-08] Adicionados campos de configuração de Valor das Vendas (Manual/Sistema), Recomendações (Manual/Sistema) e seleção de etapa de recomendações ao modal de criação/edição de Funil (visíveis apenas para Master/Admin). Modal de Indicador atualizado para exibir campos de Valor das Vendas e Número de Recomendações conforme configuração do funil (editável se manual, calculado se sistema). Commit e deploy realizados.
- [2024-07-08] Correção: relacionamento duplicado entre funis e etapas (Supabase) ajustado na query do frontend; crash do Select de etapa de recomendação no modal de Funil corrigido. Commit e deploy realizados.
- [2024-07-08] Implantada lógica automática para valor das vendas e recomendações no registro/edição de indicador (modo sistema): busca e soma vendas do usuário no funil/período, e conta leads de recomendação. Commit e deploy realizados.
- [2024-07-08] Correção: não enviar sales_value e recommendations_count para o Supabase ao criar/editar indicador (campos só para exibição). Commit e deploy realizados.
- [2024-07-08] Ajustes concluídos: máscara monetária no campo de valor das vendas (aceita vírgula), persistência correta de sales_value e recommendations_count no registro e edição de indicador, e campo período oculto na edição. Commit e deploy realizados.
- [2024-07-08] Correção: adicionada dependência react-input-mask ao projeto para corrigir erro de build na Vercel. Commit e deploy realizados.
- [2024-07-08] Implantação: indicadores agora usam período de data início/fim (period_start/period_end), preenchimento automático de mês/ano conforme regras do período, e valor de vendas numérico (aceita vírgula). Commit e deploy realizados.

--- 