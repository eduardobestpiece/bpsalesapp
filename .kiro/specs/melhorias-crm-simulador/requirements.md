# Requirements Document

## Introduction

Esta especificação aborda um conjunto abrangente de melhorias para a plataforma Monteo, incluindo ajustes de design no CRM e no Simulador, novas funcionalidades para análise de desempenho, correções nos cálculos de alavancagem patrimonial e personalização visual da plataforma. O objetivo é aprimorar a experiência do usuário, corrigir problemas visuais no modo escuro e adicionar recursos que permitam análises mais detalhadas e personalizáveis.

## Requirements

### Requirement 1

**User Story:** Como usuário da plataforma, eu quero que todos os elementos visuais estejam corretamente formatados no modo escuro, para que eu possa usar a aplicação confortavelmente em ambientes com pouca luz.

#### Acceptance Criteria

1. WHEN o modo escuro estiver ativado THEN a página Comercial aba Leads SHALL ter fundo escuro apropriado
2. WHEN o modo escuro estiver ativado THEN a página Comercial aba Vendas SHALL ter fundo escuro apropriado
3. WHEN o modo escuro estiver ativado THEN a página de Configurações SHALL ter fundo escuro apropriado
4. WHEN o modo escuro estiver ativado THEN as fontes na aba Parcelas da página de Configurações do simulador SHALL ter contraste adequado com o fundo
5. WHEN o modo escuro estiver ativado THEN o modal de Adição e Edição de Alavanca SHALL seguir o padrão de cores do modo escuro
6. WHEN o modo escuro estiver ativado THEN o campo de Valor do Imóvel na seção "Características do Imóvel" SHALL ter fundo que indique que é editável
7. WHEN o modo escuro estiver ativado THEN a linha não percorrida do "Exemplo de contemplação" SHALL ser visível com um cinza mais claro
8. WHEN o modo escuro estiver ativado THEN a seção "Crédito recomendado" SHALL usar as cores padrões da plataforma
9. WHEN o modo escuro estiver ativado THEN o gráfico da Evolução Patrimonial SHALL ter a linha de progresso na cor marrom da plataforma

### Requirement 2

**User Story:** Como usuário da plataforma, eu quero que o layout dos elementos seja consistente e espaçado adequadamente, para que eu tenha uma experiência visual agradável.

#### Acceptance Criteria

1. WHEN eu visualizar a aba do Funil na Performance da Página de Indicadores THEN os elementos "Dados semanais", "Resultados do Funil Consultores Externos" e "Dados do Período" SHALL ter espaçamento adequado em relação à seção "Filtros de Performance"
2. WHEN eu visualizar a página Comercial aba Vendas THEN SHALL existir apenas um botão de nova venda (o de baixo)
3. WHEN eu visualizar a aba de Itens Arquivados da página de Configurações do Master THEN o campo "Tipo" SHALL ter o mesmo design dos campos de dropdown da plataforma
4. WHEN eu visualizar o modal "Selecionar Período" nos "Filtros de Performance" THEN os campos SHALL seguir o padrão visual da plataforma

### Requirement 3

**User Story:** Como usuário do CRM, eu quero poder configurar fases específicas do funil para diferentes tipos de eventos, para que eu possa acompanhar melhor o progresso dos leads.

#### Acceptance Criteria

1. WHEN eu acessar o modal de Criação e Edição de Funis THEN o sistema SHALL permitir selecionar uma fase para atrelar a reunião realizada
2. WHEN eu acessar o modal de Criação e Edição de Funis THEN o sistema SHALL permitir selecionar uma fase para atrelar a reunião agendada
3. WHEN eu salvar as configurações do funil THEN o sistema SHALL armazenar essas associações para uso nas análises de desempenho

### Requirement 4

**User Story:** Como usuário do CRM, eu quero ter filtros mais flexíveis na análise de desempenho, para que eu possa visualizar dados de múltiplos funis, equipes e usuários simultaneamente.

#### Acceptance Criteria

1. WHEN eu acessar os "Filtros de Performance" do Funil THEN as opções "Funil", "Equipe" e "Usuário" SHALL permitir multiseleção
2. WHEN eu acessar os "Filtros de Performance" do Funil THEN as opções "Funil", "Equipe" e "Usuário" SHALL incluir a opção "Todos"
3. WHEN eu aplicar um filtro por período THEN o sistema SHALL exibir o período selecionado ao lado esquerdo do botão de aplicar filtro
4. WHEN eu acessar o Modal "Selecionar Período" THEN os campos Mês e Ano SHALL permitir multiseleção

### Requirement 5

**User Story:** Como usuário do CRM, eu quero visualizar métricas adicionais nos dados de desempenho, para que eu possa analisar a eficácia das recomendações e o índice de não comparecimento.

#### Acceptance Criteria

1. WHEN eu visualizar os "Dados do Período" THEN o sistema SHALL exibir o "Número de recomendações (período)" calculado como a soma das recomendações do período
2. WHEN eu visualizar os "Dados do Período" THEN o sistema SHALL exibir o "Delay / No Show (período)" calculado como 1 - (Soma da fase do funil atrelada a reunião realizada / soma da fase do funil atrelada a reunião agendada)
3. WHEN eu visualizar os "Dados semanais" THEN o sistema SHALL exibir o "Número de recomendações (semana)" calculado como a soma das recomendações do período dividido pelo número de semanas do período
4. WHEN eu visualizar os "Dados semanais" THEN o sistema SHALL exibir o "Delay / No Show (semana)" calculado como 1 - (Soma da fase do funil atrelada a reunião realizada / soma da fase do funil atrelada a reunião agendada)

### Requirement 6

**User Story:** Como usuário do CRM, eu quero que os modais de indicadores exibam informações corretas sobre os períodos, para que eu possa confiar nos dados apresentados.

#### Acceptance Criteria

1. WHEN eu abrir o modal de "Editar Indicador" THEN o sistema SHALL exibir o período registrado nas colunas period_start e period_end da tabela indicators
2. WHEN eu abrir o modal de "Registrar Indicador" THEN o sistema SHALL NÃO exibir períodos já registrados pelo usuário

### Requirement 7

**User Story:** Como usuário do Simulador, eu quero que os valores e cálculos sejam exibidos corretamente, para que eu possa tomar decisões baseadas em informações precisas.

#### Acceptance Criteria

1. WHEN eu visualizar a lista de alavancas THEN o item "Despesas:" SHALL aparecer como valor em reais se "Imóvel tem valor fixo" for verdadeiro, ou como percentual caso contrário
2. WHEN eu visualizar a taxa anual na aba Crédito acessado THEN ela SHALL ter sempre até duas casas decimais (exemplo: 13,55%)
3. WHEN eu inserir o valor do imóvel THEN o campo SHALL estar no formato de moeda em reais e permitir números decimais

### Requirement 8

**User Story:** Como usuário do Simulador, eu quero que meus dados de configuração sejam persistentes entre navegações, para que eu não precise reinserir informações a cada acesso.

#### Acceptance Criteria

1. WHEN eu sair da aba alavancagem patrimonial e voltar para ela THEN o sistema SHALL manter os valores inseridos nos campos "Características do Imóvel" e "Exemplo de contemplação"
2. WHEN eu alterar os campos "Modalidade", "Valor do aporte / Valor do crédito", "Número de parcelas" e "Tipo de Parcela" na aba de alavancagem patrimonial THEN o sistema SHALL atualizar os cálculos e regras em tempo real

### Requirement 9

**User Story:** Como usuário do Simulador, eu quero que os cálculos de alavancagem patrimonial sejam precisos, para que eu possa confiar nas projeções financeiras.

#### Acceptance Criteria

1. WHEN eu visualizar os "Ganhos Mensais" THEN o sistema SHALL calcular corretamente considerando valor da diária, ocupação, taxa do Airbnb e custos do imóvel
2. WHEN eu visualizar a "Parcela Pós-Contemplação" THEN o sistema SHALL calcular corretamente considerando as atualizações do crédito e o saldo devedor
3. WHEN eu visualizar o "Fluxo de Caixa Antes 240 meses" THEN o sistema SHALL calcular como Ganhos Mensais - Parcela Pós-Contemplação
4. WHEN eu visualizar o "Fluxo de Caixa Pós 240 meses" THEN o sistema SHALL calcular considerando o valor atualizado do imóvel
5. WHEN eu visualizar o "Pago do Próprio Bolso" THEN o sistema SHALL calcular corretamente a soma das parcelas pagas e exibir o percentual do crédito pago
6. WHEN eu visualizar o "Pago pelo Inquilino" THEN o sistema SHALL calcular como valor do crédito menos o valor pago do próprio bolso e exibir o percentual
7. WHEN eu visualizar o gráfico de "Evolução Patrimonial" THEN o sistema SHALL calcular corretamente o patrimônio, rendimentos e fluxo de caixa com atualizações anuais pelo INCC

### Requirement 10

**User Story:** Como usuário do Simulador, eu quero que a alavancagem escalonada funcione corretamente, para que eu possa visualizar o impacto de múltiplas contemplações ao longo do tempo.

#### Acceptance Criteria

1. WHEN eu selecionar alavancagem escalonada THEN o sistema SHALL adicionar uma nova linha no mês 61 que se soma às métricas da primeira contemplação
2. WHEN eu visualizar o gráfico de "Evolução Patrimonial" na alavancagem escalonada THEN o sistema SHALL exibir o patrimônio, rendimentos, fluxo de caixa e o mês
3. WHEN eu visualizar a alavancagem escalonada THEN o sistema SHALL calcular corretamente o número de imóveis (3 no mês 61, 3 no mês 121, 3 no mês 181 e 3 no mês 241, totalizando 12 imóveis)

### Requirement 11

**User Story:** Como usuário do Simulador, eu quero que o modal de "Mais configurações" funcione corretamente, para que eu possa personalizar os parâmetros de simulação.

#### Acceptance Criteria

1. WHEN eu alterar o campo "Parcelas" no modal "Mais configurações" THEN o sistema SHALL sincronizar com o campo "Número de parcelas" da página do simulador
2. WHEN eu converter um campo para manual e aplicar um valor THEN o sistema SHALL usar esse valor em todos os cálculos do simulador, sobrepondo o valor padrão
3. WHEN eu desativar o seguro THEN o sistema SHALL não considerá-lo na base de cálculo
4. WHEN eu ativar o seguro e definir um percentual THEN o sistema SHALL somá-lo à taxa de administração e fundo de reserva nos cálculos

### Requirement 12

**User Story:** Como administrador master, eu quero poder personalizar as cores, fontes e imagens da plataforma, para que ela reflita a identidade visual da minha empresa.

#### Acceptance Criteria

1. WHEN eu acessar a aba "Layout" em Master Config THEN o sistema SHALL exibir duas sub-abas: "Normal" e "Darkmode"
2. WHEN eu visualizar qualquer sub-aba de Layout THEN o sistema SHALL listar todos os elementos visuais da plataforma com suas cores atuais
3. WHEN eu visualizar qualquer sub-aba de Layout THEN o sistema SHALL permitir alterar a cor de cada elemento
4. WHEN eu visualizar qualquer sub-aba de Layout THEN o sistema SHALL listar todas as fontes com seus tamanhos e pesos
5. WHEN eu visualizar qualquer sub-aba de Layout THEN o sistema SHALL permitir alterar o tamanho e peso de cada fonte
6. WHEN eu visualizar qualquer sub-aba de Layout THEN o sistema SHALL exibir as imagens de logo e favicon atuais
7. WHEN eu visualizar qualquer sub-aba de Layout THEN o sistema SHALL permitir substituir as imagens de logo e favicon

### Requirement 13

**User Story:** Como usuário da plataforma, eu quero que o modo escuro seja o padrão em todas as páginas, para que eu tenha uma experiência visual consistente.

#### Acceptance Criteria

1. WHEN eu acessar qualquer página da plataforma pela primeira vez THEN o sistema SHALL exibir a página no modo escuro por padrão