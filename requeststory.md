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