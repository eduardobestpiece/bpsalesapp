# Histórico de Atividades

## [Preencher com data/hora atual] - Correção do campo "Etapa ligada às Recomendações" no FunnelModal

- O campo agora sempre exibe apenas a última etapa cadastrada no funil, conforme a regra de negócio.
- O valor é atualizado automaticamente ao adicionar ou remover etapas.
- Campo ficou desabilitado para edição manual, garantindo integridade.
- Commit realizado e deploy automático efetuado.

## [Preencher com data/hora atual] - Atualização do campo "Etapa ligada às Recomendações" no FunnelModal

- No modal de Novo Funil, o campo permite selecionar qualquer etapa criada pelo usuário, atualizado dinamicamente conforme as etapas são adicionadas.
- No modal de Editar Funil, o campo permite selecionar qualquer etapa já registrada no funil.
- O campo só fica travado se houver apenas uma etapa.
- Commit realizado e deploy automático efetuado.

## [Preencher com data/hora atual] - Correção da persistência do campo "Etapa ligada às Recomendações"

- O campo agora sempre salva e recupera o id da etapa (UUID), nunca o índice.
- O valor selecionado permanece corretamente ao reabrir o modal de edição ou após criar um novo funil.
- Commit realizado e deploy automático efetuado.

## [Preencher com data/hora atual] - Correção final do campo "Etapa ligada às Recomendações"

- O campo agora só é preenchido automaticamente no modo Novo Funil (criação), nunca sobrescrevendo o valor salvo ao editar.
- Ao editar um funil, o valor selecionado é sempre o que está salvo no banco.
- Commit realizado e deploy automático efetuado.

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

- [2024-07-08] Adicionados campos de configuração de Valor das Vendas (Manual/Sistema), Recomendações (Manual/Sistema) e seleção de etapa de recomendações ao modal de criação/edição de Funil (visíveis apenas para Master/Admin). Modal de Indicador atualizado para exibir campos de Valor das Vendas e Número de Recomendações conforme configuração do funil (editável se manual, calculado se sistema). Commit e deploy realizados.
- [2024-07-08] Correção: relacionamento duplicado entre funis e etapas (Supabase) ajustado na query do frontend; crash do Select de etapa de recomendação no modal de Funil corrigido. Commit e deploy realizados.
- [2024-07-08] Implantada lógica automática para valor das vendas e recomendações no registro/edição de indicador (modo sistema): busca e soma vendas do usuário no funil/período, e conta leads de recomendação. Commit e deploy realizados.
- [2024-07-08] Correção: não enviar sales_value e recommendations_count para o Supabase ao criar/editar indicador (campos só para exibição). Commit e deploy realizados.
- [2024-07-08] Ajustes concluídos: máscara monetária no campo de valor das vendas (aceita vírgula), persistência correta de sales_value e recommendations_count no registro e edição de indicador, e campo período oculto na edição. Commit e deploy realizados.
- [2024-07-08] Correção: adicionada dependência react-input-mask ao projeto para corrigir erro de build na Vercel. Commit e deploy realizados.
- [2024-07-08] Implantação: indicadores agora usam período de data início/fim (period_start/period_end), preenchimento automático de mês/ano conforme regras do período, e valor de vendas numérico (aceita vírgula). Commit e deploy realizados.
- [2024-07-08] Correção: validação obrigatória para mês/ano do período e nunca enviar string vazia para campos inteiros ao registrar indicador. Commit e deploy realizados.
- [2024-07-08] Correção: indicador agora usa campos de data início/fim, mês/ano dinâmicos e valor de vendas numérico com vírgula, com validação reforçada. Commit e deploy realizados.
- [2024-07-08] Correção: modal de indicador agora preenche mês/ano automaticamente, só mostra select se necessário, campos alinhados, valor de vendas decimal sem máscara. Commit e deploy realizados.
- [2024-07-08] Correção final: preenchimento automático de mês/ano conforme regras e visual do campo valor das vendas igual ao de recomendações. Commit e deploy realizados.
- [2024-07-08] Correção: preenchimento automático inteligente de mês/ano no modal de indicador, baseado em todos os dias do período. Commit e deploy realizados.
- [2024-07-08] Correção: logs detalhados e preenchimento automático robusto de mês/ano no modal de indicador. Commit e deploy realizados.
- [2024-07-08] Correção: lógica de mês/ano baseada apenas em data início/fim do período (regra simples e direta). Commit e deploy realizados.
- [2024-07-08] Correção: atualização correta de periodStart/periodEnd ao selecionar período, com logs para depuração. Commit e deploy realizados.
- [2024-07-08] Correção: extração de datas do período agora aceita formato ISO e extenso, com logs detalhados. Commit e deploy realizados.

## 2024-07-08 - Concluído

- Melhorias implementadas nos modais de Indicador (CRM):
  - Exibição da data/hora de preenchimento no modal de edição.
  - Status visual (bolinha colorida + mensagem) ao lado do título, conforme prazo do funil.
  - Campos de resultados por etapa em layout vertical, com comparativo, percentual e mensagem de meta atingida/não atingida em tempo real.
  - Preenchimento automático de mês/ano com base na data fim do período no modal de registro, mantendo campo editável.
- Testes realizados e checklist atualizado.
- Deploy realizado (commit e push para o GitHub).

**Status:** Concluído e aguardando validação do usuário.

## 2024-07-08 - Concluído

- Melhorias implementadas no modal de Alterar Período (CRM):
  - Exibição do período preenchido e de todos os períodos dos últimos 90 dias ainda não preenchidos.
  - Preenchimento automático de mês/ano com base na data fim do período selecionado, mantendo campo editável.
  - Estrutura pronta para seleção em massa (aplicação de período/mês/ano para múltiplos indicadores).
- Testes realizados e checklist atualizado.
- Pronto para deploy.

**Status:** Concluído e aguardando validação do usuário.

## 2024-07-08 - Concluído

- Reformulação completa do filtro de indicadores (CRM):
  - Remoção do campo de filtro de texto.
  - Botão de filtro (ícone) ao lado do botão "Registrar Indicador".
  - Modal "Filtros de indicadores" com opções: período, mês, ano, funil, equipe e usuário (dinâmicos).
  - Filtros aplicados à listagem de indicadores em tempo real.
  - Botão "Limpar filtros" para remover todos os filtros.
- Testes realizados e checklist atualizado.
- Pronto para deploy.

**Status:** Concluído e aguardando validação do usuário.

## 2024-07-08 - Concluído

- Melhorias na lista de indicadores (CRM):
  - Filtragem por perfil: admin/master veem todos, líder vê equipe, usuário vê apenas os próprios.
  - Status visual (bolinha colorida e mensagem) indicando prazo de preenchimento.
  - Exibição do valor da última etapa logo abaixo do nome.
  - Cálculo correto da média de recomendações (dividindo pela etapa correta).
  - Checkbox para seleção em massa (apenas admin/master).
- Testes realizados e checklist atualizado.
- Deploy automático realizado.

**Status:** Concluído e aguardando validação do usuário.

## 2024-07-08 - Correção de erro de build

- Corrigido erro de build na Vercel causado por duplicidade de declaração da variável `selectedFunnelId` em `CrmIndicadores.tsx`.
- Agora só existe uma declaração, eliminando o conflito e permitindo o deploy.
- Deploy automático realizado.

**Status:** Correção aplicada e aguardando validação do usuário.

- [x] **08/07/2024** - Removida a página Performance do cabeçalho e da rota do CRM, conforme solicitado. Deploy automático acionado. Próxima etapa: funcionalidades de usuários (convite, redefinição de senha, cadastro/edição simplificados).

- [ ] **07/07/2024** - Correção da estrutura do JSX na tela de indicadores do CRM:
    - CardHeader agora contém apenas cabeçalho, filtros e botões.
    - CardContent contém apenas a tabela/listagem.
    - Fechamento correto das tags e remoção de divs desnecessárias.
    - Commit e push realizados para deploy automático.
    - Aguardando validação do usuário para confirmar funcionamento e ausência de erros de build/renderização.

- [ ] **08/07/2024** - Criada página de redefinição de senha comum e rota /crm/redefinir-senha. Deploy automático acionado. Aguardando validação do usuário.
- [ ] **08/07/2024** - Ajustado fluxo de convite: criação automática no Supabase Auth (senha Admin, auto-confirmação), seleção de funis e modal de cadastro simplificado. Deploy automático acionado. Aguardando validação do usuário.
- [ ] **08/07/2024** - Modal de edição de usuários ajustado: permite editar nome, sobrenome, telefone, função e funis. Deploy automático acionado. Aguardando validação do usuário.
- [ ] **08/07/2024** - Frontend ajustado para usar a Edge Function invite-user no convite de usuário (corrige erro 403, fluxo seguro). Deploy automático acionado. Aguardando validação do usuário.

--- 