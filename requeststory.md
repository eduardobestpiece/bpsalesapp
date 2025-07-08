# Requisição em andamento

## Objetivo
Ajustar a lógica do campo "Período" no modal de indicador conforme regras detalhadas para o primeiro e segundo registro do usuário para cada funil.

## Novos Ajustes Solicitados
- Se for o **primeiro registro** do usuário para aquele funil:
  - Sugerir períodos dentro do espaço de 90 dias antes de hoje, do mais recente para o mais antigo.
  - O usuário só poderá adicionar registros para aquele período no último dia do período (ex: se o período termina numa quinta, só pode registrar a partir da quinta).
- Se for o **segundo registro** (ou mais) do usuário para aquele funil:
  - Só aparecerão nas opções de período a partir do último registrado até o período do dia vigente.
  - Mostrar em vermelho se está faltando algum (como já está).
  - NÃO apresentar períodos futuros.

## Checklist
- [x] Analisar regras e impacto na lógica atual
- [ ] Implementar sugestão de períodos para o primeiro registro (90 dias antes de hoje, ordem decrescente)
- [ ] Restringir seleção para o último dia do período
- [ ] Ajustar lógica para segundo registro: só períodos entre o último registrado e o atual, sem futuros
- [ ] Testar e ajustar interface
- [ ] Realizar deploy

**Ponto de partida:**
- Lógica de períodos dinâmicos já implementada, mas sem diferenciação entre primeiro e segundo registro do usuário para o funil.

**Próximo passo:**
Atualizar a lógica do campo "Período" no modal conforme as novas regras acima. 