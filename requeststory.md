## Solicitação em andamento - 2024-07-10

**Requisição:** Fixar o cabeçalho da tabela de Detalhamento do Consórcio (simulação) para que fique igual ao Google Sheets (cabeçalho fixo ao rolar).

**Nova abordagem:**
- Separar o cabeçalho da tabela do corpo, deixando o cabeçalho em um `<div>` fixo acima do corpo.
- Scroll horizontal sincronizado entre cabeçalho e corpo.
- Scroll vertical apenas no corpo.
- Alinhamento perfeito das colunas.

**Status:** Em andamento

**Responsável:** IA

**Checklist:**
- [x] Atualizar requeststory.md com a nova abordagem.
- [ ] Refatorar o componente DetailTable.
- [ ] Sincronizar scroll horizontal.
- [ ] Testar visualmente.
- [ ] Atualizar a porta 8080.
- [ ] Executar o deploy.
- [ ] Solicitar conferência.

# Solicitação em andamento

**Data:** 2024-07-08

**Solicitante:** usuário

**Resumo:** Remover os campos 'Pago do Próprio Bolso' e 'Pago pelo Inquilino' da seção de Resultados da alavancagem patrimonial.

## Etapas realizadas
- Análise do contexto e histórico do projeto.
- Remoção dos cards 'Pago do Próprio Bolso' e 'Pago pelo Inquilino' dos resultados.
- Build de produção iniciado e preview em execução na porta 8080.

## Checklist
- [x] Analisar contexto e histórico
- [x] Remover campos dos resultados
- [x] Atualizar requeststory.md
- [x] Build e deploy (preview 8080)
- [ ] Validar funcionamento final
- [ ] Atualizar markdownstory.md após validação

**Aguardando validação do usuário para finalizar e atualizar o histórico.**

# Solicitação em andamento

**Data:** [Preencher com data atual]

**Solicitação:**
Adicionar ao tooltip do Gráfico de Evolução Patrimonial a informação 'Parcela do mês', replicando o valor exato da coluna 'Valor da Parcela' da tabela de detalhamento.

**Status:** Sincronização corrigida, pronto para teste

**Checklist:**
- [x] Garantir sincronização do valor da parcela entre tabela e gráfico
- [x] Adicionar informação ao tooltip
- [x] Corrigir sincronização se necessário
- [ ] Testar alteração
- [ ] Atualizar porta 8080
- [ ] Executar deploy
- [ ] Solicitar conferência