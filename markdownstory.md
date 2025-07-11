Bloco 1
# Problema 1
- Quando eu tento como master, atualizar a empresa de um usuário, aparece sucesso porem ao reabrir a pessoa, ela está com a empresa antiga ainda selecionada, aparentando que não atualizou (para o master isso). Agora se eu logar com o usuário, ele estará na empresa selecionada (na empresa correta). Preciso que apareça certinho para o master
# Problema 2
- O usuário administrador ainda está tendo a opção de “Desativar” o usuário Master, isso não pode existir!
# Problema 3
- Na página times, no modal de criar o time, ainda não está aparecendo a lista de todos os usuários da empresa no campo de escolher o lider (está aparecendo somente o master e o admin, quero que qualquer um possa ser selecionado como lider pelo master ou admin)
# Problema 3
- Na página times, no modal de editar o time, ainda não está aparecendo a lista de todos os usuários da empresa no campo de escolher o lider (está aparecendo somente o master e o admin, quero que qualquer um possa ser selecionado como lider pelo master ou admin)
# Problema 4
- No modal de “Editar Time” ainda não está aparecendo o campo dropdown de multi seleção para selecionar os usuários daquela empresa que eu quero que pertençam a aquela equipe.

## [11/07/2024] Correções Bloco 1 - Usuários e Times CRM

- Corrigido: Após o master atualizar a empresa de um usuário, ao reabrir o cadastro, a empresa correta aparece imediatamente.
- Corrigido: Administradores não veem mais a opção de desativar o usuário Master.
- Corrigido: No modal de criar/editar time, agora é possível selecionar qualquer usuário da empresa como líder.
- Corrigido: O campo de multi seleção de membros do time aparece corretamente tanto na criação quanto na edição, listando todos os usuários da empresa.
- Deploy automático realizado.
- Solicitação registrada e checklist atualizado em `requeststory.md`.

## [12/07/2024] Ajustes Bloco 1 - Indicadores e Usuários

- Corrigido: Ao arquivar um indicador, a tela permanece na mesma aba, sem redirecionar para Performance.
- Corrigido: O modal de alterar período só altera o período ao clicar em Salvar; ao cancelar, nada é alterado.
- Corrigido: O usuário master não aparece mais na listagem de usuários para nenhum outro usuário (exceto ele mesmo).
- Deploy automático realizado.
- Solicitação registrada e checklist atualizado em `requeststory.md`.

## [12/07/2024] Correção definitiva - Modal de Alterar Período do Indicador

- Corrigido: O modal de alterar período agora só altera o período do indicador ao clicar em Salvar. Ao cancelar, nada do estado principal é alterado.
- Deploy automático realizado.
- Solicitação registrada e checklist atualizado em `requeststory.md`.

- [2024-07-10] Implementação da lógica real do gráfico duplo do funil e comparativo na aba Performance do CRM:
    - Função utilitária criada para agrupar indicadores por semana/mês e calcular conversão por etapa.
    - Gráfico duplo e comparativo agora usam dados reais do Supabase, respeitando filtros dinâmicos.
    - Deploy automático realizado após commit.
    - Usuário orientado a validar se tudo está funcionando corretamente.
- [2024-07-10] Correção de bugs críticos:
    - Corrigido bug do período do indicador: ao editar, o período nunca é sobrescrito automaticamente, apenas se o usuário escolher.
    - Corrigido bug de times: campo user_ids removido do payload, membros do time agora são atualizados corretamente via team_id dos usuários.
    - Commit e deploy realizados após rebase.