# Implementation Plan

- [-] 1. Correções de Modo Escuro
  - [x] 1.1 Corrigir fundo da página Comercial aba Leads
    - Aplicar classes de dark mode adequadas no container principal
    - Garantir que todos os elementos filhos herdem as cores corretas
    - _Requirements: 1.1_
  
  - [x] 1.2 Corrigir fundo da página Comercial aba Vendas e remover botão duplicado
    - Aplicar classes de dark mode adequadas no container principal
    - Remover o botão de nova venda duplicado (manter apenas o de baixo)
    - _Requirements: 1.2, 2.2_
  
  - [x] 1.3 Corrigir fundo da página de Configurações
    - Aplicar classes de dark mode adequadas no container principal
    - _Requirements: 1.3_
  
  - [x] 1.4 Corrigir contraste das fontes na aba Parcelas
    - Identificar e corrigir as fontes sem contraste adequado
    - Aplicar classes `text-foreground` e `bg-input` adequadas
    - _Requirements: 1.4_
  
  - [x] 1.5 Corrigir cores do modal de Adição e Edição de Alavanca
    - Ajustar a seção "Imóvel tem valor fixo" para seguir o padrão de cores do modo escuro
    - _Requirements: 1.5_
  
  - [x] 1.6 Melhorar o campo de Valor do Imóvel
    - Adicionar fundo que indique que é editável
    - Formatar como moeda em reais permitindo números decimais
    - _Requirements: 1.6, 7.3_
  
  - [x] 1.7 Corrigir visibilidade da linha não percorrida do "Exemplo de contemplação"
    - Aplicar cor cinza mais clara para melhor visibilidade
    - Manter cor marrom quando a linha for percorrida
    - _Requirements: 1.7_
  
  - [x] 1.8 Ajustar cores da seção "Crédito recomendado"
    - Aplicar cores padrões da plataforma para modo claro e escuro
    - _Requirements: 1.8_
  
  - [x] 1.9 Corrigir cor da linha de progresso no gráfico da Evolução Patrimonial
    - Aplicar cor marrom da plataforma (#A86F57)
    - Fazer deploy das correções
    - _Requirements: 1.9_

- [x] 2. Ajustes de Layout
  - [x] 2.1 Aumentar espaçamento na aba do Funil da Performance
    - Adicionar margem entre "Filtros de Performance" e os elementos seguintes
    - _Requirements: 2.1_
  
  - [x] 2.2 Padronizar campo "Tipo" na aba Itens Arquivados
    - Aplicar o mesmo design dos campos de dropdown da plataforma
    - _Requirements: 2.3_
  
  - [x] 2.3 Padronizar campos do modal "Selecionar Período"
    - Aplicar o design padrão dos campos da plataforma
    - Fazer deploy dos ajustes de layout
    - _Requirements: 2.4_

- [x] 3. Novas Funcionalidades no Modal de Funis
  - [x] 3.1 Adicionar campos para fases específicas
    - Implementar campo para selecionar fase atrelada à reunião realizada
    - Implementar campo para selecionar fase atrelada à reunião agendada
    - _Requirements: 3.1, 3.2_
  
  - [x] 3.2 Atualizar banco de dados
    - Criar migração para adicionar colunas na tabela de funis
    - Implementar lógica para salvar e recuperar essas informações
    - Fazer deploy das novas funcionalidades no modal de funis
    - _Requirements: 3.3_

- [x] 4. Melhorias nos Filtros de Performance
  - [x] 4.1 Implementar multiseleção para filtros
    - Converter campos "Funil", "Equipe" e "Usuário" para permitir multiseleção
    - Adicionar opção "Todos" em cada filtro
    - _Requirements: 4.1, 4.2_
  
  - [x] 4.2 Exibir período selecionado
    - Implementar lógica para mostrar o período ao lado do botão de aplicar filtro
    - _Requirements: 4.3_
  
  - [x] 4.3 Implementar multiseleção para Mês e Ano
    - Converter campos do modal "Selecionar Período" para permitir multiseleção
    - Fazer deploy das melhorias nos filtros de performance
    - _Requirements: 4.4_

- [x] 5. Adicionar Novas Métricas
  - [x] 5.1 Implementar métricas para Dados do Período
    - Adicionar "Número de recomendações (período)"
    - Adicionar "Delay / No Show (período)"
    - Implementar cálculos corretos
    - _Requirements: 5.1, 5.2_
  
  - [x] 5.2 Implementar métricas para Dados Semanais
    - Adicionar "Número de recomendações (semana)"
    - Adicionar "Delay / No Show (semana)"
    - Implementar cálculos corretos
    - Fazer deploy das novas métricas
    - _Requirements: 5.3, 5.4_

- [x] 6. Correções nos Modais de Indicadores
  - [x] 6.1 Corrigir exibição de período no modal de Editar Indicador
    - Garantir que o período exibido seja o mesmo das colunas period_start e period_end
    - _Requirements: 6.1_
  
  - [x] 6.2 Filtrar períodos já registrados no modal de Registrar Indicador
    - Implementar lógica para não exibir períodos já registrados
    - Fazer deploy para o github das correções nos modais de indicadores
    - _Requirements: 6.2_

- [x] 7. Melhorias na Exibição de Valores
  - [x] 7.1 Corrigir exibição do item "Despesas"
    - Implementar lógica para exibir como valor em reais ou percentual conforme o valor de "Imóvel tem valor fixo"
    - _Requirements: 7.1_
  
  - [x] 7.2 Limitar taxa anual a duas casas decimais
    - Implementar formatação para garantir sempre até duas casas decimais
    - Fazer deploy das melhorias na exibição de valores
    - _Requirements: 7.2_

- [x] 8. Implementar Persistência de Dados
  - [x] 8.1 Manter valores entre navegações
    - Implementar armazenamento local para campos "Características do Imóvel" e "Exemplo de contemplação"
    - _Requirements: 8.1_
  
  - [x] 8.2 Sincronizar campos entre abas
    - Implementar atualização em tempo real para alterações em campos como "Modalidade", "Valor do aporte", etc.
    - Fazer deploy da implementação de persistência de dados
    - _Requirements: 8.2_

- [-] 9. Corrigir Cálculos de Alavancagem Patrimonial
  - [x] 9.1 Corrigir cálculo de Ganhos Mensais
    - Implementar fórmula correta considerando valor da diária, ocupação, taxa e custos
    - _Requirements: 9.1_
  
  - [x] 9.2 Corrigir cálculo de Parcela Pós-Contemplação
    - Implementar fórmula correta considerando atualizações do crédito e saldo devedor
    - _Requirements: 9.2_
  
  - [ ] 9.3 Corrigir cálculo de Fluxo de Caixa
    - Implementar fórmulas corretas para antes e após 240 meses
    - _Requirements: 9.3, 9.4_
  
  - [ ] 9.4 Corrigir cálculos de valores pagos
    - Implementar fórmulas corretas para "Pago do Próprio Bolso" e "Pago pelo Inquilino"
    - Adicionar exibição de percentuais
    - Remover campo "Capital em Caixa"
    - _Requirements: 9.5, 9.6_
  
  - [ ] 9.5 Corrigir gráfico de Evolução Patrimonial
    - Implementar cálculos corretos para patrimônio, rendimentos e fluxo de caixa
    - Considerar atualizações anuais pelo INCC
    - Fazer deploy das correções nos cálculos de alavancagem patrimonial
    - _Requirements: 9.7_

- [ ] 10. Implementar Alavancagem Escalonada Correta
  - [ ] 10.1 Adicionar novas linhas de contemplação
    - Implementar lógica para criar novas linhas a cada 60 meses
    - Somar métricas de cada contemplação
    - _Requirements: 10.1_
  
  - [ ] 10.2 Atualizar gráfico de Evolução Patrimonial
    - Adicionar exibição do mês no gráfico
    - Implementar cálculos corretos para múltiplas contemplações
    - _Requirements: 10.2_
  
  - [ ] 10.3 Corrigir contagem de imóveis
    - Implementar lógica para calcular corretamente o número total de imóveis
    - Fazer deploy da implementação de alavancagem escalonada correta
    - _Requirements: 10.3_

- [ ] 11. Melhorar Modal de Mais Configurações
  - [ ] 11.1 Sincronizar campo de Parcelas
    - Conectar com o campo "Número de parcelas" da página principal
    - _Requirements: 11.1_
  
  - [ ] 11.2 Implementar sobreposição de valores manuais
    - Garantir que valores definidos manualmente sejam usados em todos os cálculos
    - _Requirements: 11.2_
  
  - [ ] 11.3 Implementar lógica para seguro
    - Não considerar seguro desativado na base de cálculo
    - Somar seguro ativado à taxa de administração e fundo de reserva
    - Fazer deploy das melhorias no modal de mais configurações
    - _Requirements: 11.3, 11.4_

- [ ] 12. Criar Sistema de Personalização Visual
  - [ ] 12.1 Criar estrutura de banco de dados
    - Implementar tabela para armazenar configurações de layout
    - _Requirements: 12.1_
  
  - [ ] 12.2 Criar interface para personalização de cores
    - Listar todos os elementos visuais com suas cores atuais
    - Implementar seletor de cores para cada elemento
    - _Requirements: 12.2, 12.3_
  
  - [ ] 12.3 Criar interface para personalização de fontes
    - Listar todas as fontes com seus tamanhos e pesos
    - Implementar controles para alterar tamanho e peso
    - _Requirements: 12.4, 12.5_
  
  - [ ] 12.4 Criar interface para personalização de imagens
    - Exibir logo e favicon atuais
    - Implementar upload para substituir imagens
    - _Requirements: 12.6, 12.7_
  
  - [ ] 12.5 Implementar sistema para aplicar configurações
    - Criar mecanismo para gerar CSS dinâmico com base nas configurações
    - Aplicar configurações em tempo real
    - Fazer deploy do sistema de personalização visual
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 13. Definir Modo Escuro como Padrão
  - [ ] 13.1 Configurar modo escuro como padrão
    - Modificar lógica de inicialização para usar modo escuro por padrão
    - _Requirements: 13.1_
  
  - [ ] 13.2 Testar em todas as páginas
    - Verificar se o modo escuro é aplicado corretamente em toda a plataforma
    - Fazer deploy da configuração do modo escuro como padrão
    - _Requirements: 13.1_

- [ ] 14. Testes e Validação Final
  - [ ] 14.1 Testar correções de modo escuro
    - Verificar todas as páginas no modo escuro
    - Confirmar que todos os problemas foram resolvidos
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_
  
  - [ ] 14.2 Testar ajustes de layout
    - Verificar espaçamento e alinhamento de elementos
    - Confirmar que campos seguem o design padrão
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 14.3 Testar novas funcionalidades
    - Verificar funcionamento dos filtros de multiseleção
    - Confirmar cálculos corretos das novas métricas
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 14.4 Testar cálculos de alavancagem
    - Verificar precisão dos cálculos com diferentes cenários
    - Confirmar que todos os valores são exibidos corretamente
    - _Requirements: 7.1, 7.2, 7.3, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 10.1, 10.2, 10.3_
  
  - [ ] 14.5 Testar sistema de personalização
    - Verificar aplicação de cores, fontes e imagens personalizadas
    - Confirmar persistência das configurações
    - Fazer deploy final com todos os testes e validações concluídos
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_