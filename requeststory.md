# Requisição em andamento

**Data:** 2024-07-08

**Solicitante:** Usuário

**Descrição:**
Melhorias nos modais de Indicador (CRM):

## Modal de “Editar Indicador”
- Exibir a data e hora em que o usuário preencheu o indicador, acima do botão de alterar período.
- Ao lado do título “Editar Indicador”, mostrar um status visual (bolinha colorida + mensagem) conforme o prazo definido no Funil:
  - Verde: “Preenchido dentro do prazo”
  - Amarelo: “Preenchido 24 horas após prazo”
  - Vermelho: “Preenchido fora do prazo”
  - Regras: Prazo = data fim do período + indicator_deadline_hours (em horas). Se preenchido até o prazo: verde. Até 24h após: amarelo. Acima de 24h após: vermelho.
- Nos campos de “Resultados por Etapa”, exibir um abaixo do outro, mostrando ao lado:
  - Comparativo com a meta
  - Percentual atingido
  - Mensagem: Verde “Meta atingida. Parabéns!” ou Vermelha “Meta não atingida, consulte seu líder”.

## Modal de “Registrar Indicador”
- Para mês e ano, preencher automaticamente com base na data fim do período. Se o período ocupar dois meses/anos, selecionar automaticamente o da data fim, mas manter o campo editável.
- Nos campos de “Resultados por Etapa”, exibir um abaixo do outro, mostrando ao lado:
  - Comparativo com a meta
  - Percentual atingido
  - Mensagem: Verde “Meta atingida. Parabéns!” ou Vermelha “Meta não atingida, consulte seu líder”.

**Checklist:**
- [ ] Atualizar requeststory.md com a nova requisição.
- [ ] Implementar exibição da data/hora de preenchimento no modal de edição.
- [ ] Implementar status visual do prazo ao lado do título.
- [ ] Ajustar layout dos campos de resultados por etapa (um abaixo do outro) e exibir comparativo/meta/mensagem.
- [ ] Ajustar lógica de mês/ano no modal de registro para preencher automaticamente com base na data fim.
- [ ] Testar todos os fluxos.
- [ ] Atualizar histórico e checklist.
- [ ] Executar deploy.
- [ ] Solicitar validação do usuário.

**Status:** Em andamento

--- 