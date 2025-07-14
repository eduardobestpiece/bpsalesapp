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

# Requisição em andamento - 2024-07-10 (atualização)

## Ajustes solicitados
- **Remover** o campo “Tipo de Parcela” e tudo abaixo dele do modal de criação/edição de produto.
- **No Simulador:** o campo “Tipo de Parcela” deve exibir as opções de “Redução de Parcela” registradas para a administradora selecionada (tabela installment_reductions).

## Ações planejadas
1. Remover campo “Tipo de Parcela” do modal de produto.
2. Ajustar campo “Tipo de Parcela” do simulador para buscar reduções da administradora.
3. Testar o fluxo corrigido.
4. Executar deploy.
5. Solicitar validação do usuário.

---

**Status:** Em andamento 

# Requisição em andamento - 2024-07-10 (ajuste cálculos simulador)

## Ajustes solicitados
- Na aba “Crédito Acessado” do simulador, exibir:
  - Crédito Total Acessado
  - Parcela Total
  - **Taxa de Administração Anual** (Cálculo: (Taxa de administração / meses) * 12)
  - **Atualização anual** (Se for Imóvel: INCC; Veículo: IPCA; outro: mostrar texto e valor)

## Ações planejadas
1. Localizar componente da aba “Crédito Acessado”.
2. Adicionar/calcular “Taxa de Administração Anual”.
3. Adicionar/calcular “Atualização anual”.
4. Testar o fluxo corrigido.
5. Executar deploy.
6. Solicitar validação do usuário.

---

**Status:** Em andamento 

# Requisição em andamento - 2024-07-10 (ajuste crédito acessado e busca de créditos)

## Ajustes solicitados
- Exibir na aba “Crédito Acessado”:
  - Crédito Total Acessado
  - Parcela Total
  - Taxa de Administração Anual (Cálculo: (taxa de administração / meses) * 12)
  - Atualização anual (INCC para imóvel, IPCA para veículo, texto e valor para outros)
- Ajustar a busca/listagem de créditos:
  - Se o campo “Tipo de Parcela” for diferente de “cheia”, buscar créditos e parcelas com base no valor da “parcela especial”.

## Ações planejadas
1. Adicionar campos de resultado na aba “Crédito Acessado”.
2. Ajustar busca/listagem de créditos conforme tipo de parcela.
3. Testar o fluxo corrigido.
4. Executar deploy.
5. Solicitar validação do usuário.

---

**Status:** Em andamento 

# Requisição em andamento - 2024-07-10 (cálculo correto da parcela no simulador)

## Ajuste solicitado
- Corrigir o cálculo do valor da parcela exibido na aba “Crédito Acessado” do simulador:
  - Se o usuário selecionar “Parcela Cheia”, usar exatamente a mesma lógica do campo “Valor da parcela cheia” do modal de produto.
  - Se selecionar “Parcela Especial/Reduzida”, usar exatamente a mesma lógica do campo “Valor da parcela especial” do modal de produto.
- Centralizar a lógica de cálculo para evitar divergências.

## Ações planejadas
1. Centralizar lógica de cálculo de parcelas.
2. Ajustar simulador para usar a lógica correta.
3. Testar o fluxo corrigido.
4. Executar deploy.
5. Solicitar validação do usuário.

---

**Status:** Em andamento 

# Requisição em andamento - 2024-07-10 (correção múltiplos créditos e cálculos simulador)

## Ajuste solicitado
- Corrigir a sugestão de múltiplos créditos para atingir o valor desejado, considerando o valor da parcela reduzida ou cheia conforme seleção.
- Corrigir o cálculo da “Parcela Total” para somar corretamente as parcelas de todos os créditos sugeridos.
- Ajustar o campo “Taxas anual” para somar taxa de administração + fundo de reserva e calcular conforme a fórmula: (taxa_total / parcelas) * 12.
- Ajustar o campo “Atualização anual” para mostrar o valor (ex: 6%) e o índice (ex: INCC) em campos separados.
- Garantir que a lista de créditos e a tabela de detalhamento usem o valor correto da parcela (reduzida ou cheia).
- Exemplo: Para 2 milhões, 240 meses, reduzida, sugerir 4 créditos de 500 mil, cada um com parcela reduzida de R$ 1.950, totalizando R$ 6.500.

## Ações planejadas
1. Corrigir sugestão de múltiplos créditos.
2. Corrigir cálculo da parcela total.
3. Ajustar campo “Taxas anual”.
4. Ajustar campo “Atualização anual”.
5. Corrigir lista de créditos e detalhamento.
6. Testar o fluxo corrigido.
7. Executar deploy.
8. Solicitar validação do usuário.

---

**Status:** Em andamento 

## Data: 2024-07-10

### Descrição
Correção do bug no simulador onde a consulta para a tabela `installment_reductions` do Supabase estava enviando `administrator_id=null`, causando erro 400 e impedindo o cálculo/sugestão de créditos e parcelas.

### Diagnóstico
- Produtos e tipos de parcela estavam sendo carregados normalmente.
- O erro 400 ocorria porque o filtro `administrator_id` era enviado como `null` ou string vazia.
- Isso impedia o fluxo de cálculo e exibição dos resultados.

### Ação executada
- Corrigido o código do componente `NewSimulatorLayout.tsx` para **NUNCA** enviar o filtro `administrator_id` se o valor for nulo ou vazio.
- Agora, se não houver administradora selecionada, a consulta de reduções de parcela é ignorada e o array de reduções é limpo.

### Próximos passos
- Testar o fluxo do simulador sem administradora selecionada (não deve dar erro e deve funcionar com parcela cheia).
- Testar o fluxo com administradora selecionada (deve buscar as reduções corretamente).
- Validar se os campos de crédito, parcela, taxas, etc., são preenchidos normalmente.
- Realizar deploy automático.
- Solicitar validação ao usuário. 

# Continuação da requisição em andamento

## Data: 2024-07-10

### Diagnóstico
- O simulador exibia apenas o menor produto, mesmo que a soma das parcelas de outros produtos ficasse mais próxima do valor de aporte digitado.

### Ação executada
- Implementada lógica inteligente para sugerir a combinação de créditos (até 2 produtos) cuja soma das parcelas reduzidas fique mais próxima do valor de aporte digitado, permitindo múltiplos produtos.

### Próximos passos
- Solicitar ao usuário que atualize a página, realize uma simulação e verifique se agora a plataforma sugere a melhor combinação de créditos possível. 

## 2024-07-10 - Correção de erro de build Vercel

- Problema: Uso de 'await' fora de função 'async' em `src/components/Simulator/CreditAccessPanel.tsx` (linha 228).
- Ação: Tornar a função/callback que contém o 'await buscarReducao' uma função async.
- Checklist:
  - [x] Localizar e corrigir o uso de 'await' fora de função 'async'
  - [ ] Verificar outros usos de 'await' no arquivo
  - [ ] Testar build localmente (opcional)
  - [ ] Realizar deploy
  - [ ] Solicitar validação 

## 2024-07-10 - Mudança de dinâmica do simulador de crédito

- Não sugerir mais créditos automaticamente.
- O cálculo será feito com base no percentual que a parcela cheia ou reduzida representa do crédito.
- O usuário digita o valor da parcela desejada, e a plataforma calcula o crédito correspondente usando o percentual.
- O valor sugerido de crédito será arredondado para o múltiplo de 20 mil acima.
- O usuário poderá adicionar/remover cotas manualmente para montar a simulação.
- Se o valor total das cotas for menor que o simulado, aparece aviso vermelho; se igual ou maior, aviso verde.
- Remover a sugestão automática de créditos.

### Checklist
- [ ] Adaptar cálculo de crédito sugerido por percentual
- [ ] Arredondar crédito para múltiplos de 20 mil
- [ ] Exibir valor da parcela correspondente
- [ ] Permitir adicionar/remover cotas manualmente
- [ ] Exibir aviso visual (vermelho/verde)
- [ ] Remover sugestão automática de créditos
- [ ] Testar novo fluxo
- [ ] Realizar deploy
- [ ] Solicitar validação 

## Solicitação em andamento (10/07/2024)

### Ajustes visuais e semânticos no Simulador (Montagem de Cotas)

- Substituir "Valor do aporte" por "Acréscimo no Aporte" (soma dos aportes dos créditos selecionados menos o valor de aporte do cliente).
- Substituir "Diferença" por "Acréscimo no Crédito" (soma dos créditos selecionados menos o valor de crédito acessado).
- Unificar o layout dos cards de resumo em duas linhas:
  - Primeira linha: "Crédito Acessado", "Valor da Parcela", "Taxa anual", "Atualização anual".
  - Segunda linha: "Total do Crédito", "Total da Parcela", "Acréscimo no Aporte", "Acréscimo no Crédito" (só aparece após selecionar o primeiro produto).
  - Os cards da segunda linha agora ficam vermelhos se o total de créditos for menor que o crédito acessado.
  - Removidos os campos "Total do Crédito", "Total da Parcela" e "Aproximação do valor desejado:" do rodapé da montagem de cotas.
  - Iniciada análise de lentidão ao trocar o tipo de parcela no simulador.
- Cards de acréscimo devem aparecer em destaque positivo.
- Ajustar o layout visual para destacar o aumento de aporte/crédito como benefício.
- Solicitação registrada e ajustes em andamento. 

Otimização de performance: busca de reduções de parcela agora em paralelo (Promise.all), eliminando lentidão na montagem de cotas e sugestão de créditos. 