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

--- 