# Requisição Atual

**Funcionalidade:** Padronização da aba Produtos

**Resumo:**
Padronizar a aba Produtos para seguir exatamente o mesmo padrão visual, estrutural e de UX das abas Administradoras e Parcelas. Incluir todos os campos, validações e ações exigidos, garantindo que nada afete o CRM.

**Checklist:**
- [ ] Atualizar componente de listagem de Produtos (`ProductsList.tsx`) para seguir o padrão visual das outras abas
- [ ] Atualizar modal de criação/edição de Produtos (`ProductModal.tsx`) com todos os campos e validações exigidos
- [ ] Adicionar campo de valor da parcela (cálculo automático)
- [ ] Adicionar campo de Parcelas (dropdown multi seleção)
- [ ] Adicionar campos: Taxa de administração, Fundo de reserva, Seguro
- [ ] Adicionar ação de duplicar produto (com restrição de administradora)
- [ ] Garantir validação de duplicidade
- [ ] Garantir que nada afete o CRM
- [ ] Testar e validar

**Status:**
Iniciando execução do checklist para Produtos. 

# Requisição em andamento: Modal de "Mais configurações" no Simulador

## Descrição Geral
Criar um modal avançado de configurações para o simulador, contendo os campos:
- Administradora (dropdown, já selecionada a padrão)
- Tipo de Crédito (opções da administradora)
- Parcelas (dropdown ou número, com alternância Manual/Sistema)
- Taxa de administração (percentual, Manual/Sistema)
- Fundo de reserva (percentual, Manual/Sistema)
- Ativar seguro (radio: Incluir/Não incluir, com percentual dinâmico)
- Redução de parcela (Manual/Sistema, com campos dinâmicos)
- Atualização anual do crédito (Manual/Sistema, campos dinâmicos conforme tipo de crédito)

## Lógica de Manual/Sistema
- Alternância global (liga/desliga) "Manual/Sistema" no topo do modal: ao ligar, todos os campos que suportam alternância vão para Manual; ao desligar, todos vão para Sistema.
- Cada campo pode ser alternado individualmente.
- Estado padrão: tudo em Sistema.

## UX
- Botões: "Aplicar", "Salvar e Aplicar" (salva no banco para uso futuro), "Redefinir" (volta ao padrão).
- Campos e opções dinâmicas conforme administradora, tipo de crédito, parcela, etc.

## Integração
- Buscar dados de administradoras, tipos de crédito, parcelas, taxas, fundo de reserva, redução de parcela e atualização anual do Supabase.
- Salvar configurações personalizadas do usuário no Supabase (criar tabela se necessário).

## Checklist
- [ ] Criar/atualizar tabela de configurações no Supabase
- [ ] Criar componente do modal com todos os campos e lógica de alternância
- [ ] Integrar com Supabase para buscar e salvar dados
- [ ] Adicionar botões de ação (Aplicar, Salvar e Aplicar, Redefinir)
- [ ] Testar funcionamento
- [ ] Deploy automático
- [ ] Solicitar validação do usuário

--- 

# Correção de Erro no Deploy (DialogActions)

- **Problema:** Erro de build na Vercel devido à importação de `DialogActions` de `../ui/dialog`, que não existe.
- **Diagnóstico:** O componente correto para rodapé de ações é `DialogFooter`, conforme exportado em `src/components/ui/dialog.tsx`.
- **Ação:** Substituída a importação e o uso de `DialogActions` por `DialogFooter` no arquivo `src/components/Simulator/SimulatorConfigModal.tsx`.
- **Resultado:** Build local passou com sucesso. Deploy automático realizado para o GitHub.
- **Próximo passo:** Aguardar Vercel finalizar deploy e testar funcionamento no ambiente de produção. 

# Melhoria Visual do Modal de Configurações do Simulador

- **Solicitante:** Usuário
- **Descrição:** Melhorar o layout do modal de configurações do simulador para que ocupe uma altura máxima padrão (ex: 80vh), centralizado na tela, com rolagem interna do conteúdo caso ultrapasse o limite, mantendo cabeçalho e rodapé visíveis e fixos (rolagem apenas no conteúdo central).
- **Motivo:** O modal atual está esticado verticalmente e sem limite visual, prejudicando a experiência do usuário. Fixar cabeçalho e rodapé facilita o uso dos botões e a leitura do título.
- **Status:** Em andamento 

# Ajuste do Switch Global Manual/Sistema no Modal de Configurações

- **Solicitante:** Usuário
- **Descrição:**
  - O switch global ao lado do título do modal controla todos os campos "Manual/Sistema" do modal.
  - Quando ligado (Manual), todos os campos ficam em Manual; quando desligado (Sistema), todos ficam em Sistema.
  - O usuário pode customizar qualquer campo individualmente, independente do global.
  - O switch global deve refletir o estado dos campos: ligado se todos estão em Manual, desligado se todos estão em Sistema, e indeterminado se há mistura.
  - O switch global vem desligado por padrão.
- **Motivo:** Melhorar a clareza e flexibilidade para o usuário ao configurar o simulador.
- **Status:** Em andamento 

# Ajustes no Modal 'Mais Configurações' (Simulador)

- **Solicitante:** Usuário
- **Descrição:**
  - Corrigir o campo 'Parcelas' para puxar corretamente as opções ligadas à administradora selecionada e garantir que a edição traga os dados corretos.
  - Verificar no Supabase as tabelas do módulo simulação e seus dados para identificar possíveis problemas.
  - Adicionar campo de porcentagem 'Atualização anual' (padrão 6%).
  - No campo 'Redução de parcela', manter o percentual e adicionar campo de seleção para 'Aplicação' (igual ao modal de editar/criar Redução de Parcela).
  - No campo 'Atualização anual do crédito', buscar do campo 'Tipo de Atualização' da administradora se for 'Sistema'.
    - Se 'Após 12 parcelas', mostrar apenas esse campo.
    - Se 'Mês específico', mostrar campos 'Mês de Atualização' e 'Carência (em dias)'.
    - Se 'Manual', os campos são editáveis.
- **Motivo:** Melhorar a experiência e garantir o correto funcionamento do simulador.
- **Status:** Em andamento 

## Ajustes modal "Mais Configurações" (Simulador)

- **Campo "Parcelas"**
  - O campo "Parcelas" não está puxando corretamente as parcelas ligadas à administradora selecionada.
  - Ao editar um registro de configuração, as informações da parcela não estão sendo carregadas corretamente.
  - Solicitação: Verificar as tabelas do módulo simulação no Supabase e os dados, identificar se o problema está no Supabase ou no projeto.

- **Campo "Atualização anual"**
  - Adicionar campo de porcentagem chamado "Atualização anual" (padrão: 6%).

- **Campo "Redução de parcela"**
  - Manter o percentual.
  - Adicionar campo de seleção para "Aplicação" (igual ao modal de editar/criar Redução de Parcela).

- **Campo "Atualização anual do crédito"**
  - Buscar do campo "Tipo de Atualização" da administradora se for selecionado do sistema.
  - Se for "Após 12 parcelas", mostrar apenas "Após 12 parcelas".
  - Se for "Mês específico", mostrar campos "Mês de Atualização" e "Carência (em dias)".
  - Se selecionado como manual, os campos são editáveis.

---

**Status:** Em análise e execução dos ajustes solicitados. 

# Solicitação em andamento (10/07/2024)

**Ajuste no Modal de Produto**

- Remover campos “Nome” e “Opções de Prazo (meses)” do modal de produto.
- Nome do produto será gerado automaticamente concatenando valor do crédito e tipo (ex: “R$ 500.000 (Imóvel)”).
- Remover coluna de opções de prazo do Supabase.
- Campo de parcelas será multiseleção.
- Cálculo dos valores de parcela considerará a maior parcela selecionada.

Checklist:
- [ ] Remover campos do modal de produto
- [ ] Gerar nome automaticamente
- [ ] Remover coluna do Supabase (SQL)
- [ ] Tornar parcelas multiseleção
- [ ] Ajustar cálculos de valores de parcela
- [ ] Testar alterações
- [ ] Deploy
- [ ] Solicitar validação 

# Solicitação em andamento (10/07/2024)

**Ajuste no Modal de Produto - Cálculo da Parcela Especial e Multiseleção**

- Permitir multiseleção no campo "Parcelas" e permitir marcar uma como padrão.
- O cálculo do campo "Valor da parcela cheia" permanece igual.
- O cálculo do campo "Valor da parcela especial" deve seguir a lógica detalhada pelo usuário, considerando as flags de aplicação da redução para cada componente (principal, taxa de administração, fundo de reserva, seguro).
- Se não houver parcela padrão selecionada, usar a de maior prazo.
- Testar com os dados fornecidos (Magalu, 240 meses, 27% taxa adm, 1% fundo reserva, 1% seguro, redução 50% só na parcela, crédito 500.000).

Checklist:
- [ ] Ajustar campo de parcelas para multiseleção e seleção de padrão
- [ ] Implementar cálculo correto da parcela especial conforme regras
- [ ] Garantir fallback para maior prazo se não houver padrão
- [ ] Testar com os dados fornecidos
- [ ] Atualizar histórico e preparar para deploy 

# Solicitação: Ajuste do cálculo da parcela especial no modal de produto

**Problema relatado:**
- Valor da parcela especial igual ao da cheia, mesmo havendo redução cadastrada.

**Análise:**
- A busca da redução estava atrelada apenas à parcela padrão.
- Se nenhuma parcela era marcada como padrão, a redução não era buscada.

**Ação aplicada:**
- Busca automática da redução para a parcela de maior prazo, caso nenhuma esteja marcada como padrão.
- Aviso visual caso não exista redução cadastrada para a parcela selecionada.

**Status:**
- Deploy realizado.
- Aguardando validação do usuário no fluxo de criação/edição de produto. 

# Solicitação: Correção dos fluxos de Redução de Parcela e Edição de Produto

**Status:**
- Todos os problemas relatados foram corrigidos.
- Edição de parcela e produto funcionando corretamente.
- Reduções e parcelas associadas aparecem corretamente ao editar.
- Cálculo da parcela especial validado.
- Deploy realizado para produção. 

# Requisição em andamento - 2024-07-10

## Problemas relatados
- Sistema acusa duplicidade de produto mesmo quando o valor do crédito é diferente.
- Campo "Tipo de Parcela" deve exibir sempre "Parcela Cheia" e as "Parcelas Especiais" das parcelas selecionadas.

## Ações planejadas
1. Corrigir verificação de duplicidade para considerar também o valor do crédito.
2. Ajustar campo "Tipo de Parcela" para exibir:
   - Sempre "Parcela Cheia"
   - E as "Parcelas Especiais" associadas às parcelas selecionadas
3. Testar o fluxo corrigido
4. Executar deploy
5. Solicitar validação do usuário

---

**Status:** Em andamento 