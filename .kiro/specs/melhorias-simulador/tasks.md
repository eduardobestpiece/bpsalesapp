# Implementation Plan

- [x] 1. Correções na Exibição de Valores
  - [x] 1.1 Corrigir exibição do item "Despesas"
    - Implementar lógica para exibir como valor em reais ou percentual conforme o valor de "Imóvel tem valor fixo"
    - Atualizar o componente LeveragesList.tsx para aplicar a formatação correta
    - _Requirements: 1.1, 1.2_
  
  - [x] 1.2 Limitar taxa anual a duas casas decimais
    - Modificar a função de formatação de percentuais no CreditAccessPanel.tsx
    - Garantir que a taxa anual seja exibida com no máximo duas casas decimais
    - _Requirements: 1.3_

- [x] 2. Implementar Persistência de Dados
  - [x] 2.1 Manter valores entre navegações
    - Implementar armazenamento local para campos "Características do Imóvel" e "Exemplo de contemplação"
    - Atualizar o componente PatrimonialLeverage.tsx para salvar e recuperar os dados
    - _Requirements: 2.1_
  
  - [x] 2.2 Sincronizar campos entre abas
    - Criar contexto global para compartilhar dados entre componentes
    - Implementar atualização em tempo real para alterações em campos como "Modalidade", "Valor do aporte", etc.
    - _Requirements: 2.2_

- [x] 3. Corrigir Cálculos de Ganhos Mensais
  - [x] 3.1 Implementar fórmula correta para valor da diária
    - Atualizar a função de cálculo para multiplicar o valor do imóvel pelo percentual da diária
    - _Requirements: 3.1, 3.2_
  
  - [x] 3.2 Implementar fórmula correta para ocupação
    - Atualizar a função de cálculo para multiplicar 30 dias pela taxa de ocupação
    - _Requirements: 3.1, 3.3_
  
  - [x] 3.3 Implementar fórmula correta para valor mensal
    - Atualizar a função de cálculo para multiplicar o valor da diária pela ocupação
    - _Requirements: 3.1, 3.4_
  
  - [x] 3.4 Implementar fórmula correta para taxa do Airbnb
    - Atualizar a função de cálculo para multiplicar o valor mensal pelo percentual da administradora
    - _Requirements: 3.1, 3.5_
  
  - [x] 3.5 Implementar fórmula correta para custos do imóvel
    - Atualizar a função de cálculo para multiplicar o valor do imóvel pelo percentual das despesas totais
    - _Requirements: 3.1, 3.6_
  
  - [x] 3.6 Implementar fórmula correta para custos totais
    - Atualizar a função de cálculo para somar a taxa do Airbnb com os custos do imóvel
    - _Requirements: 3.1, 3.7_
  
  - [x] 3.7 Implementar fórmula correta para ganhos mensais
    - Atualizar a função de cálculo para subtrair os custos totais do valor mensal
    - _Requirements: 3.1, 3.7_

- [x] 4. Corrigir Cálculo da Parcela Pós-Contemplação
  - [x] 4.1 Implementar fórmula correta para atualizações do crédito
    - Atualizar a função de cálculo para considerar as atualizações do crédito a cada 12 meses
    - _Requirements: 4.1_
  
  - [x] 4.2 Implementar fórmula correta para saldo devedor
    - Atualizar a função de cálculo para considerar as taxas e encargos adicionais
    - _Requirements: 4.2_
  
  - [x] 4.3 Implementar fórmula correta para parcela pós-contemplação
    - Atualizar a função de cálculo para dividir o saldo devedor pelo número de parcelas restantes
    - _Requirements: 4.3_

- [x] 5. Corrigir Cálculo do Fluxo de Caixa
  - [x] 5.1 Implementar fórmula correta para fluxo de caixa antes 240 meses
    - Atualizar a função de cálculo para subtrair a parcela pós-contemplação dos ganhos mensais
    - _Requirements: 5.1_
  
  - [x] 5.2 Implementar fórmula correta para fluxo de caixa pós 240 meses
    - Atualizar a função de cálculo para considerar o valor atualizado do imóvel
    - _Requirements: 5.2_

- [x] 6. Corrigir Cálculos de Valores Pagos
  - [x] 6.1 Implementar fórmula correta para pago do próprio bolso
    - Atualizar a função de cálculo para somar corretamente as parcelas pagas considerando as atualizações
    - _Requirements: 6.1_
  
  - [x] 6.2 Adicionar exibição de percentual para pago do próprio bolso
    - Atualizar o componente para exibir o percentual em relação ao valor do crédito inicial
    - _Requirements: 6.2_
  
  - [x] 6.3 Implementar fórmula correta para pago pelo inquilino
    - Atualizar a função de cálculo para subtrair o pago do próprio bolso do valor do crédito inicial
    - _Requirements: 6.3_
  
  - [x] 6.4 Adicionar exibição de percentual para pago pelo inquilino
    - Atualizar o componente para exibir o percentual em relação ao valor do crédito inicial
    - _Requirements: 6.4_
  
  - [x] 6.5 Remover campo "Capital em Caixa"
    - Atualizar o componente para não exibir mais esse campo
    - _Requirements: 6.5_

- [ ] 7. Corrigir Gráfico de Evolução Patrimonial
  - [ ] 7.1 Implementar cálculo correto para patrimônio
    - Atualizar a função de cálculo para considerar o valor correto do patrimônio
    - _Requirements: 7.1_
  
  - [ ] 7.2 Implementar cálculo correto para rendimentos
    - Atualizar a função de cálculo para considerar os ganhos mensais com atualização a cada 12 meses pelo INCC
    - _Requirements: 7.2_
  
  - [ ] 7.3 Implementar cálculo correto para fluxo de caixa
    - Atualizar a função de cálculo para considerar a parcela pós-contemplação com as atualizações anuais pelo INCC
    - _Requirements: 7.3_
  
  - [ ] 7.4 Garantir consistência no último mês
    - Atualizar a função de cálculo para garantir que o fluxo de caixa do último mês seja igual ao fluxo de caixa pós 240 meses
    - _Requirements: 7.4_

- [ ] 8. Implementar Alavancagem Escalonada Correta
  - [ ] 8.1 Adicionar novas linhas de contemplação
    - Implementar lógica para criar novas linhas a cada 60 meses
    - Atualizar o componente ScaledLeverage.tsx para somar métricas de cada contemplação
    - _Requirements: 8.1_
  
  - [ ] 8.2 Atualizar gráfico de evolução patrimonial
    - Modificar o componente PatrimonyChart.tsx para incluir o mês no gráfico
    - Implementar lógica para considerar um novo consórcio no mês 61
    - _Requirements: 8.2_
  
  - [ ] 8.3 Corrigir contagem de imóveis
    - Implementar lógica para calcular corretamente o número total de imóveis
    - Considerar 3 imóveis a cada 60 meses, totalizando 12 imóveis ao longo de 240 meses
    - _Requirements: 8.3_

- [ ] 9. Testes e Validação
  - [ ] 9.1 Testar exibição de valores
    - Verificar se o item "Despesas" é exibido corretamente como valor em reais ou percentual
    - Confirmar que a taxa anual é exibida com no máximo duas casas decimais
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 9.2 Testar persistência de dados
    - Verificar se os valores são mantidos ao navegar entre abas
    - Confirmar que as alterações em campos como "Modalidade" atualizam os cálculos em tempo real
    - _Requirements: 2.1, 2.2_
  
  - [ ] 9.3 Testar cálculos de alavancagem
    - Verificar se os ganhos mensais são calculados corretamente
    - Confirmar que a parcela pós-contemplação é calculada corretamente
    - Verificar se o fluxo de caixa é calculado corretamente
    - Confirmar que os valores pagos são calculados e exibidos corretamente
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 9.4 Testar gráfico de evolução patrimonial
    - Verificar se o patrimônio, rendimentos e fluxo de caixa são calculados corretamente
    - Confirmar que o fluxo de caixa do último mês é igual ao fluxo de caixa pós 240 meses
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 9.5 Testar alavancagem escalonada
    - Verificar se as novas linhas de contemplação são adicionadas corretamente
    - Confirmar que o gráfico de evolução patrimonial inclui o mês e considera um novo consórcio no mês 61
    - Verificar se o número de imóveis é calculado corretamente
    - _Requirements: 8.1, 8.2, 8.3_