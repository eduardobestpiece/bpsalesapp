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

## [2024-07-10] Correção de bugs críticos

### Problema 1: Período do indicador é sobrescrito ao editar
- Diagnóstico: O estado do período (period_date, period_start, period_end) está sendo sobrescrito por efeitos colaterais ao abrir o modal de edição, causando datas erradas.
- Solução: Garantir que, ao editar, o período nunca seja alterado automaticamente, apenas se o usuário escolher explicitamente.

### Problema 2: Erro ao salvar time (teams)
- Diagnóstico: O frontend envia o campo user_ids ao salvar times, mas a tabela teams não possui esse campo. O relacionamento é via team_id em crm_users.
- Solução: Remover user_ids do payload de teams e atualizar o campo team_id dos usuários ao salvar membros do time.

- Plano de ação criado, iniciando correção dos dois fluxos. 