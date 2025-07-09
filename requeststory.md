## Requisição em andamento - 08/07/2024

### Problema
O campo “Etapa ligada às Recomendações” no modal de Funil não funciona bem na criação, pois as etapas ainda não têm id até serem salvas no banco. O fluxo atual é confuso e pouco intuitivo.

### Solução aprovada pelo usuário
- Adicionar um campo de seleção (radio button) diretamente em cada etapa na lista de “Etapas do Funil”.
- O usuário marca qual etapa será usada para recomendação (apenas uma por funil).
- O campo `recommendation_stage_id` do funil será preenchido automaticamente com o id da etapa marcada.
- O Select separado será removido do modal.
- O fluxo de criação e edição ficará igual, sem necessidade de salvar duas vezes.

### Plano de Ação
1. Adicionar um campo de seleção (radio) em cada etapa na lista de etapas do funil.
2. Permitir selecionar apenas uma etapa por funil.
3. Ao salvar, o campo `recommendation_stage_id` do funil recebe o id da etapa marcada.
4. Na edição, o radio já vem marcado conforme o valor salvo.
5. Remover o Select separado do modal.
6. Testar criação e edição.
7. Atualizar histórico e encerrar.

### Checklist
- [x] Registrar a nova requisição e plano em `requeststory.md`
- [x] Planejar a alteração no componente de etapas do funil
- [ ] Implementar o campo de seleção em cada etapa
- [ ] Garantir que o valor é salvo corretamente no banco
- [ ] Testar criação e edição
- [ ] Atualizar histórico e encerrar 