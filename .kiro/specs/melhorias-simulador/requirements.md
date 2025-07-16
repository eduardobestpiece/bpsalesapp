# Requirements Document

## Introdução

Este documento descreve os requisitos para melhorias no simulador da plataforma Monteo. As melhorias visam corrigir problemas de exibição de valores, persistência de dados entre navegações, cálculos de alavancagem patrimonial e implementação de alavancagem escalonada.

## Requisitos

### Requisito 1: Melhorias na Exibição de Valores

**User Story:** Como um usuário do simulador, quero visualizar corretamente os valores monetários e percentuais, para que eu possa tomar decisões baseadas em informações precisas.

#### Acceptance Criteria
1. WHEN o item "Imóvel tem valor fixo" for verdadeiro THEN o sistema SHALL exibir o item "Despesas" como valor em reais.
2. WHEN o item "Imóvel tem valor fixo" for falso THEN o sistema SHALL exibir o item "Despesas" como percentual.
3. WHEN a taxa anual for exibida na aba "Crédito acessado" THEN o sistema SHALL mostrar sempre até duas casas decimais (exemplo: 13,55% e nunca 13,543%).

### Requisito 2: Persistência de Dados entre Navegações

**User Story:** Como um usuário do simulador, quero que os dados inseridos sejam mantidos quando navego entre abas, para que eu não precise reinserir informações a cada mudança de aba.

#### Acceptance Criteria
1. WHEN o usuário sai da aba "Alavancagem patrimonial" e retorna para ela THEN o sistema SHALL manter os valores inseridos nos campos "Características do Imóvel" e "Exemplo de contemplação".
2. WHEN o usuário altera campos como "Modalidade", "Valor do aporte / Valor do crédito", "Número de parcelas" e "Tipo de Parcela" na aba "Alavancagem patrimonial" THEN o sistema SHALL atualizar os cálculos e regras em tempo real.

### Requisito 3: Correção dos Cálculos de Ganhos Mensais

**User Story:** Como um usuário do simulador, quero que os cálculos de ganhos mensais sejam precisos, para que eu possa confiar nas projeções financeiras apresentadas.

#### Acceptance Criteria
1. WHEN o sistema calcula os "Ganhos Mensais" THEN o sistema SHALL seguir a fórmula: (Valor do imóvel * Percentual da Diária * Ocupação * 30 dias) - (Taxa do Airbnb + Custos do imóvel).
2. WHEN o sistema calcula o valor da diária THEN o sistema SHALL multiplicar o valor do imóvel pelo percentual da diária.
3. WHEN o sistema calcula a ocupação THEN o sistema SHALL multiplicar 30 dias pela taxa de ocupação.
4. WHEN o sistema calcula o valor mensal THEN o sistema SHALL multiplicar o valor da diária pela ocupação.
5. WHEN o sistema calcula a taxa do Airbnb THEN o sistema SHALL multiplicar o valor mensal pelo percentual da administradora.
6. WHEN o sistema calcula os custos do imóvel THEN o sistema SHALL multiplicar o valor do imóvel pelo percentual das despesas totais.
7. WHEN o sistema calcula os custos totais THEN o sistema SHALL somar a taxa do Airbnb com os custos do imóvel.

### Requisito 4: Correção do Cálculo da Parcela Pós-Contemplação

**User Story:** Como um usuário do simulador, quero que o cálculo da parcela pós-contemplação seja preciso, para que eu possa planejar meus pagamentos corretamente.

#### Acceptance Criteria
1. WHEN o sistema calcula a "Parcela Pós-Contemplação" THEN o sistema SHALL considerar as atualizações do crédito a cada 12 meses.
2. WHEN o sistema calcula o saldo devedor THEN o sistema SHALL considerar as taxas e encargos adicionais.
3. WHEN o sistema calcula o valor da parcela pós-contemplação THEN o sistema SHALL dividir o saldo devedor pelo número de parcelas restantes.

### Requisito 5: Correção do Cálculo do Fluxo de Caixa

**User Story:** Como um usuário do simulador, quero que os cálculos de fluxo de caixa sejam precisos, para que eu possa avaliar a viabilidade financeira do investimento.

#### Acceptance Criteria
1. WHEN o sistema calcula o "Fluxo de Caixa Antes 240 meses" THEN o sistema SHALL subtrair a "Parcela Pós-Contemplação" dos "Ganhos Mensais".
2. WHEN o sistema calcula o "Fluxo de Caixa Pós 240 meses" THEN o sistema SHALL calcular os ganhos mensais considerando o valor atualizado do imóvel.

### Requisito 6: Correção dos Cálculos de Valores Pagos

**User Story:** Como um usuário do simulador, quero visualizar corretamente os valores pagos do próprio bolso e pelo inquilino, para que eu possa entender a distribuição dos pagamentos.

#### Acceptance Criteria
1. WHEN o sistema calcula o "Pago do Próprio Bolso" THEN o sistema SHALL somar corretamente as parcelas pagas considerando as atualizações.
2. WHEN o sistema exibe o "Pago do Próprio Bolso" THEN o sistema SHALL mostrar também o percentual em relação ao valor do crédito inicial.
3. WHEN o sistema calcula o "Pago pelo Inquilino" THEN o sistema SHALL subtrair o "Pago do Próprio Bolso" do valor do crédito inicial.
4. WHEN o sistema exibe o "Pago pelo Inquilino" THEN o sistema SHALL mostrar também o percentual em relação ao valor do crédito inicial.
5. WHEN o sistema exibe os campos de valores pagos THEN o sistema SHALL remover o campo "Capital em Caixa".

### Requisito 7: Correção do Gráfico de Evolução Patrimonial

**User Story:** Como um usuário do simulador, quero visualizar corretamente o gráfico de evolução patrimonial, para que eu possa entender a progressão do meu investimento ao longo do tempo.

#### Acceptance Criteria
1. WHEN o sistema exibe o gráfico de "Evolução Patrimonial" THEN o sistema SHALL calcular corretamente o patrimônio.
2. WHEN o sistema exibe o gráfico de "Evolução Patrimonial" THEN o sistema SHALL calcular os rendimentos igual aos "Ganhos Mensais" com atualização a cada 12 meses pelo INCC.
3. WHEN o sistema exibe o gráfico de "Evolução Patrimonial" THEN o sistema SHALL calcular o Fluxo de Caixa igual à "Parcela Pós-Contemplação" com as atualizações anuais pelo INCC.
4. WHEN o sistema exibe o gráfico de "Evolução Patrimonial" THEN o sistema SHALL garantir que o Fluxo de Caixa do último mês apresentado seja igual ao "Fluxo de Caixa Pós 240 meses".

### Requisito 8: Implementação Correta da Alavancagem Escalonada

**User Story:** Como um usuário do simulador, quero visualizar corretamente a alavancagem escalonada, para que eu possa entender o impacto de múltiplas contemplações ao longo do tempo.

#### Acceptance Criteria
1. WHEN o sistema calcula a alavancagem escalonada THEN o sistema SHALL adicionar uma nova linha no mês 61 que se soma às métricas da primeira contemplação.
2. WHEN o sistema exibe o gráfico de "Evolução Patrimonial" na alavancagem escalonada THEN o sistema SHALL incluir o mês e considerar um novo consórcio no mês 61.
3. WHEN o sistema calcula o número de imóveis na alavancagem escalonada THEN o sistema SHALL considerar 3 imóveis a cada 60 meses, totalizando 12 imóveis ao longo de 240 meses (3 no mês 61, 3 no mês 121, 3 no mês 181 e 3 no mês 241).