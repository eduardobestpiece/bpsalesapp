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