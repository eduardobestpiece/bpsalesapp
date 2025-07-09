# Requisição em andamento

**Data:** 2024-07-08

**Solicitante:** Usuário

**Descrição:**
Reformulação do filtro de indicadores (CRM):

- Remover o campo de filtro de texto atual.
- Adicionar botão de filtro (ícone) ao lado esquerdo do botão "Registrar Indicador".
- Ao clicar, abrir modal "Filtros de indicadores".
- Permitir ao usuário retirar todos os filtros (botão "Limpar filtros").
- Opções de filtro:
  - Filtrar por período (campo de data início e data fim)
  - Filtrar por mês
  - Filtrar por ano
  - Filtrar por funil (apenas se o usuário tiver acesso a 2 funis ou mais)
  - Filtrar por equipe (apenas para administradores e master)
  - Filtrar por usuário (apenas para administradores e master)
- Aplicar filtros à listagem de indicadores.
- Garantir que o usuário pode remover filtros facilmente.

**Checklist:**
- [ ] Atualizar requeststory.md com a nova requisição.
- [ ] Remover campo de filtro de texto atual.
- [ ] Adicionar botão de filtro (ícone) ao lado esquerdo do botão "Registrar Indicador".
- [ ] Criar modal "Filtros de indicadores" com todas as opções.
- [ ] Permitir limpar todos os filtros.
- [ ] Aplicar filtros à listagem de indicadores.
- [ ] Testar todos os fluxos.
- [ ] Atualizar histórico e checklist.
- [ ] Executar deploy.
- [ ] Solicitar validação do usuário.

**Status:** Em andamento

--- 

## 2024-07-08 - Problema no filtro de indicadores

- O filtro de indicadores foi implementado conforme solicitado (modal, filtros dinâmicos, integração com listagem), porém o usuário relatou que não está funcionando corretamente.
- Ponto de partida: código do filtro já está no repositório e disponível na interface.
- O que foi tentado: usuário testou o filtro, mas não houve efeito na listagem de indicadores.
- Próximos passos: analisar o código, dependências e integração com a listagem para identificar e corrigir o problema. 

## 2024-07-08 - Nova solicitação: melhorias na lista de indicadores

- Regras de visualização por perfil (admin/master vê todos, líder vê equipe, usuário vê apenas os próprios).
- Status visual (bolinha colorida) e mensagem conforme prazo de preenchimento do indicador (verde, amarelo, vermelho).
- Exibir valor da última etapa na coluna correspondente.
- Corrigir cálculo da coluna "Média de Recomendações" para dividir pelo valor da etapa correta.
- Adicionar seletor para ações em massa (visível apenas para admin/master).
- Próximos passos: analisar código, dependências e banco para planejar as alterações. 

## 2024-07-08 - Nova solicitação: ações em massa na lista de indicadores

- Ações em massa devem ser aplicadas por funil (não pode selecionar indicadores de funis diferentes).
- Opções de ação em massa: Arquivar ou Alterar Período.
- Alteração de período só pode ocorrer se todos os selecionados tiverem períodos iguais.
- Ao clicar em Alterar Período, abrir o modal de Alterar Período.
- Próximos passos: planejar e implementar as ações em massa conforme regras acima. 

## 2024-07-08 - Solicitação de redesign da página de indicadores

- Exibir todos os indicadores em uma única tabela (sem separação por funil).
- Campo de seleção de funil fixo ao lado esquerdo dos filtros (sempre visível).
- Remover seleção de funil do modal de filtros.
- Primeira coluna: bolinha colorida (verde, amarela ou vermelha) indicando status do prazo.
- Segunda coluna: checkbox para seleção múltipla.
- Colunas principais: Período, Última Etapa (com valor), Média de Recomendações, Ações, etc.
- Menu de ações por linha e menu de ações em massa acima da tabela.
- Visual mais limpo: linhas alternadas, cabeçalho fixo, bordas arredondadas, espaçamento confortável, mantendo as cores da plataforma.
- Próximos passos: refatorar layout, ajustar filtros e colunas, aplicar novo visual e testar. 