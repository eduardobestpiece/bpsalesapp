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