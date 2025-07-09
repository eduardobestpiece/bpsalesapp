# Requisição Atual

**Data:** [Preencher com data/hora atual]
**Solicitante:** Usuário

## Descrição
Ajustar o campo "Etapa ligada às Recomendações" no modal de funil (`FunnelModal`):
- No modal de **Novo Funil**, o campo deve ser dinâmico, permitindo selecionar entre as etapas criadas pelo usuário (nomes das fases adicionadas nas "Etapas do Funil").
- No modal de **Editar Funil**, o campo deve ser editável, permitindo selecionar qualquer uma das fases já registradas.
- O campo não deve ficar travado na última etapa, exceto se for a única.
- Lembrar: nos indicadores, o cálculo da média de recomendações será o número de recomendações dividido pelo valor associado a esse campo.

## Checklist
- [ ] Ajustar lógica do campo no modal de Novo Funil
- [ ] Ajustar lógica do campo no modal de Editar Funil
- [ ] Garantir atualização dinâmica conforme etapas
- [ ] Testar comportamento no frontend
- [ ] Realizar deploy

## Status
Em andamento 