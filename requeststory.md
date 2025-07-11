# Requisição em andamento

## [12/07/2024] Bloco 2 - Indicadores, Filtros, Usuários

### Problema
- Mesmo sem o campo de alterar período, ao editar um indicador pela segunda vez, o período é alterado automaticamente para “De 10/07/2025 até 10/07/2025”.
- Descobrir a causa, corrigir e eliminar esse bug.

### Ajustes
- Modal de edição de indicador: remover a data de criação do topo (já existe no rodapé).
- Filtros de indicadores: o seletor de funil só aparece para quem está atribuído a mais de um funil.
- Lista de indicadores: diminuir o tamanho das fontes do cabeçalho e das linhas.
- Usuários: não permitir atribuir papel de líder pelo modal de usuário; só é possível virar líder ao ser atribuído como líder de um time na página de Times.

---

**Checklist:**
- [ ] Diagnosticar e eliminar a causa do bug de alteração automática do período ao editar indicador
- [ ] Remover a data de criação do topo do modal de edição de indicador
- [ ] Exibir seletor de funil apenas para usuários com mais de um funil atribuído
- [ ] Diminuir fontes da lista de indicadores (cabeçalho e linhas)
- [ ] Bloquear atribuição de papel de líder pelo modal de usuário
- [ ] Testar todos os fluxos corrigidos
- [ ] Atualizar histórico e realizar deploy 

## [2024-07-10] Implementação da nova aba Funil na Performance (Bloco 3)

- Usuário autorizou prosseguir com checklist, deploy e finalização da funcionalidade da nova aba Funil na página de Performance do CRM, conforme wireframe e regras detalhadas.
- Próximos passos: finalizar lógica real dos dados, modal de configuração do comparativo, responsividade/adaptação dos nomes das etapas, e realizar deploy.
- Histórico e contexto completos registrados no markdownstory.md. 

## [2024-07-10] Correção definitiva dos bugs de período do indicador e membros do time

- O bug do período do indicador persiste: mesmo sem campo de alteração, o período é sobrescrito ao editar. Será garantida imutabilidade total do período durante a edição.
- O bug dos membros do time persiste: membros não permanecem salvos ao reabrir o modal. Será garantida busca correta dos membros ao abrir e update correto no banco.
- Nova rodada de correção iniciada. 

## [2024-07-10] Refatoração do modal de edição do indicador

- Solicitação: Excluir o modal de edição do indicador atual.
- Novo modal de edição deve exibir apenas:
  - Valor de Vendas
  - Número de Recomendações
  - Resultados por Etapa
  - Data de preenchimento no final (próximo aos botões)
- Não deve permitir editar funil ou período.
- Modal de criação permanece exatamente como está.
- Iniciando refatoração. 

## [2024-07-10] Nova regra para seleção de período na criação de indicador

- Solicitação: Ao criar indicador, exibir todos os períodos dos últimos 90 dias.
- Períodos já preenchidos devem aparecer em cinza claro, com '(preenchido)' e não podem ser selecionados.
- Iniciando implementação. 