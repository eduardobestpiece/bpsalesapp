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

# Última Requisição

- Adicionar campo "Ágio (%)" ao modal "Mais configurações", sincronizado com a seção "Ganho de Capital", na mesma linha de "Número de parcelas" e "Mês Contemplação". Valor deve ser salvo/aplicado corretamente.
- Adicionada engrenagem de configurações na seção "Ganho de Capital", que exibe o campo "Ágio (%)" apenas ao clicar, oculto por padrão.
- Agora a seção "Ganho de Capital" só é exibida se o ROI da operação for maior ou igual a 110%. Se for menor, a seção é ocultada automaticamente.
- Corrigido cálculo da "Renda passiva" na etapa "Nova Alavancagem Patrimonial" para considerar o "Patrimônio ao final" em vez do patrimônio na contemplação.
- Ajustado cálculo da "Renda passiva" para Alavancagem Escalonada usar o Fluxo de Caixa do último mês do gráfico, enquanto Alavancagem Simples continua usando o patrimônio final.
- Corrigido cálculo do Fluxo de Caixa no gráfico da Nova Alavancagem Patrimonial para considerar a atualização anual da parcela, usando a mesma lógica da tabela de detalhamento.
- Corrigida lógica da Alavancagem Escalonada para considerar corretamente a adição de novos créditos a cada contemplação, incluindo custo inicial e atualizações de créditos anteriores.
- Adicionadas informações "Parcela do mês" e "Parcelas pagas" ao tooltip do gráfico de evolução patrimonial.
- Corrigido cálculo das parcelas pagas para incluir as parcelas pagas antes da contemplação no gráfico de evolução patrimonial.
- Corrigido valor da parcela no gráfico para usar a parcela inicial correta da tabela de detalhamento.
- Corrigido cálculo das parcelas para considerar atualização anual antes da contemplação e acumular parcelas pagas mês a mês corretamente.
- Corrigido cálculo da parcela pós-contemplação para usar o valor exato da tabela de detalhamento.
- Corrigido para usar prazo dinâmico do campo "Número de parcelas" em vez de fixar em 240 meses.
- Corrigida lógica da alavancagem escalonada para somar corretamente as parcelas de todos os créditos ativos.
- Corrigida lógica da alavancagem escalonada para não atualizar parcela no mês da contemplação e somar corretamente parcelas existentes + novas.
- Status: Concluído.