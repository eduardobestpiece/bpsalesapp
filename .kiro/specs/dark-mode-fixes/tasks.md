# Implementation Plan

- [x] 1. Corrigir fundos brancos nas páginas principais
  - Aplicar classes de dark mode adequadas nas páginas CRM Config, Master Config e Simulador
  - Garantir que containers principais usem `bg-background` e cards usem `bg-card`
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Corrigir contraste do campo valor do imóvel
  - Identificar e corrigir o campo de valor do imóvel no simulador
  - Aplicar classes `text-foreground` e `bg-input` adequadas
  - _Requirements: 1.4_

- [x] 3. Corrigir contraste da linha "Exemplo de contemplação"
  - Localizar o componente PatrimonialLeverageNew.tsx
  - Aplicar cor adequada com contraste mínimo 4.5:1 para o texto
  - _Requirements: 2.1_

- [x] 4. Corrigir contraste da lista de alavancas
  - Revisar componente LeveragesList.tsx
  - Ajustar classes de texto e fundo dos itens da lista para melhor legibilidade
  - _Requirements: 2.2_

- [x] 5. Remover caixa alta dos botões de alavancagem
  - Localizar botões "Alavancagem Simples" e "Alavancagem Escalonada"
  - Remover classes `uppercase` ou propriedades CSS de text-transform
  - Faça o deploy ao final de tudo
  - _Requirements: 3.2_

- [x] 6. Implementar logo específica para dark mode
  - Criar ou atualizar componente Logo para detectar tema atual
  - Aplicar logo específica na página de login para dark mode
  - _Requirements: 3.1_

- [ ] 7. Aplicar cor cinza mais claro na linha de "Evolução Patrimonial"
  - Localizar componentes de gráficos (ResultsPanel, SingleLeverage, ScaledLeverage)
  - Aplicar cor marrom #A86F57 nas linhas dos gráficos usando variável CSS --accent
  - Faça o deploy ao final de tudo
  - _Requirements: 3.3_

- [x] 8. Aplicar cor marrom nos "Dados da Alavancagem Única"
  - Localizar componente SingleLeverage.tsx
  - Aplicar cor marrom nos cards de dados, considerando gradiente
  - _Requirements: 3.4_

- [x] 9. Criar rota unificada para Master Config
  - Implementar rota `/simulador/master` que renderiza o mesmo componente de `/crm/master`
  - Garantir que o contexto de navegação seja adequado para cada módulo
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 10. Testes e validação final
  - Executar checklist de validação completo
  - Verificar contraste WCAG AA em todos os componentes
  - Testar navegação e funcionalidade em ambos os temas
  - Faça o deploy ao final de tudo
  - _Requirements: 2.3, 5.1, 5.2, 5.3_