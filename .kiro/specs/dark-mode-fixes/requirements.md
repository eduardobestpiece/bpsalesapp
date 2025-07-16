# Requirements Document

## Introduction

Esta especificação aborda as correções finais necessárias para o sistema de dark mode da plataforma Monteo, incluindo problemas de contraste, fundos brancos em páginas específicas, ajustes de cores da marca e melhorias funcionais. O objetivo é garantir uma experiência visual consistente e acessível em todo o sistema.

## Requirements

### Requirement 1

**User Story:** Como usuário da plataforma, eu quero que todas as páginas tenham suporte adequado ao dark mode, para que eu possa usar a aplicação confortavelmente em ambientes com pouca luz.

#### Acceptance Criteria

1. WHEN o dark mode estiver ativado THEN a página de configurações do CRM SHALL ter fundo escuro apropriado
2. WHEN o dark mode estiver ativado THEN a página Master Config SHALL ter fundo escuro apropriado  
3. WHEN o dark mode estiver ativado THEN a página do simulador SHALL ter fundo escuro apropriado
4. WHEN o dark mode estiver ativado THEN o campo do valor do imóvel SHALL ter contraste adequado entre fonte e fundo

### Requirement 2

**User Story:** Como usuário da plataforma, eu quero que todos os elementos tenham contraste adequado no dark mode, para que eu possa ler e interagir com todos os componentes facilmente.

#### Acceptance Criteria

1. WHEN o dark mode estiver ativado THEN a linha do "Exemplo de contemplação" SHALL ser visível com contraste adequado
2. WHEN o dark mode estiver ativado THEN a lista na página de Alavancas SHALL ter informações legíveis com contraste adequado
3. WHEN qualquer texto for exibido no dark mode THEN o contraste SHALL atender aos padrões WCAG AA (mínimo 4.5:1)

### Requirement 3

**User Story:** Como usuário da plataforma, eu quero que os elementos visuais sigam a identidade da marca, para que a experiência seja consistente e profissional.

#### Acceptance Criteria

1. WHEN a página de login estiver no dark mode THEN a logo SHALL ser a versão específica para dark mode
2. WHEN os botões de alavancagem forem exibidos THEN eles SHALL usar capitalização normal (não caixa alta)
3. WHEN a linha da "Evolução Patrimonial" for exibida THEN ela SHALL usar a cor marrom da plataforma (#A86F57)
4. WHEN as informações "Dados da Alavancagem Única" forem exibidas THEN elas SHALL usar a cor marrom da plataforma

### Requirement 4

**User Story:** Como administrador master, eu quero acessar as configurações master tanto pelo módulo CRM quanto pelo Simulador, para que eu tenha flexibilidade de navegação entre os módulos.

#### Acceptance Criteria

1. WHEN eu acessar "Master Config" no módulo simulação THEN o sistema SHALL me levar para uma página com as mesmas funcionalidades da página "crm/master"
2. WHEN eu fizer alterações em qualquer uma das páginas master THEN as alterações SHALL ser refletidas em ambas as páginas
3. WHEN eu acessar "simulador/master" THEN a página SHALL ter a mesma interface e funcionalidades da página "crm/master"

### Requirement 5

**User Story:** Como desenvolvedor, eu quero que o sistema de cores seja consistente e bem estruturado, para que futuras manutenções sejam mais fáceis.

#### Acceptance Criteria

1. WHEN o sistema de dark mode for implementado THEN as cores SHALL seguir a paleta definida (#131313, #1E1E1E, #161616, #1F1F1F, #FFFFFF, #A86F57)
2. WHEN elementos da marca forem exibidos THEN eles SHALL usar a cor marrom oficial (#A86F57)
3. WHEN gradientes forem aplicados THEN eles SHALL usar variações da cor marrom da plataforma