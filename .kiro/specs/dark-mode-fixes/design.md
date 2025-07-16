# Design Document

## Overview

Este documento detalha o design técnico para resolver os problemas finais de dark mode na plataforma Monteo. O sistema já possui uma base sólida de dark mode implementada, mas requer ajustes específicos em componentes e páginas que ainda apresentam problemas de contraste, fundos inadequados e elementos visuais inconsistentes.

## Architecture

### Sistema de Cores Atual
O projeto já possui um sistema de cores bem estruturado no `src/index.css` com:
- Variáveis CSS para light/dark mode
- Paleta de cores definida: #131313, #1E1E1E, #161616, #1F1F1F, #FFFFFF, #A86F57
- Configuração do Tailwind CSS para suporte a dark mode

### Componentes Afetados
1. **Páginas principais**: CRM Config, Master Config, Simulador
2. **Componentes específicos**: Campo valor do imóvel, lista de alavancas, botões de alavancagem
3. **Elementos visuais**: Linha de evolução patrimonial, dados de alavancagem única
4. **Logo**: Alternância automática entre versões light/dark

## Components and Interfaces

### 1. Correção de Páginas com Fundo Branco

#### Páginas Afetadas:
- `src/pages/crm/CrmMasterConfig.tsx`
- `src/pages/Configuracoes.tsx` 
- `src/pages/Simulador.tsx`

#### Estratégia:
- Aplicar classes `bg-background` nos containers principais
- Garantir que cards usem `bg-card` 
- Verificar se todos os elementos filhos herdam as cores corretas

### 2. Correção de Contraste

#### Campo Valor do Imóvel:
- Localização: Componentes do simulador
- Problema: Fonte clara em fundo claro
- Solução: Aplicar `text-foreground` e `bg-input` adequados

#### Lista de Alavancas:
- Localização: `src/components/Administrators/LeveragesList.tsx`
- Problema: Informações escuras em fundo escuro
- Solução: Revisar classes de texto e fundo dos itens da lista

#### Exemplo de Contemplação:
- Localização: `src/components/Simulator/PatrimonialLeverageNew.tsx`
- Problema: Linha muito escura no dark mode
- Solução: Aplicar cor adequada com contraste mínimo 4.5:1

### 3. Ajustes de Texto

#### Botões de Alavancagem:
- Localização: `src/components/Simulator/PatrimonialLeverageNew.tsx`
- Mudança: Remover `uppercase` ou `text-transform: uppercase`
- Aplicar capitalização normal

### 4. Logo Específica para Dark Mode

#### Implementação:
- Criar componente `Logo` que detecta o tema atual
- Usar logo específica para dark mode: "/Users/eduardocosta/Downloads/Projeto Monteo/dist/Logo Monteo.png"
- Aplicar na página de login

### 5. Cores da Marca

#### Evolução Patrimonial:
- Localização: Componentes de gráficos (ResultsPanel, SingleLeverage, ScaledLeverage)
- Aplicar cor marrom #A86F57 nas linhas dos gráficos
- Usar variável CSS `--accent` que já está configurada

#### Dados da Alavancagem Única:
- Localização: `src/components/Simulator/SingleLeverage.tsx`
- Aplicar cor marrom nos cards de dados
- Considerar gradiente usando `bg-gradient-primary`

### 6. Master Config Unificado

#### Estratégia:
- Criar rota `/simulador/master` que renderiza o mesmo componente de `/crm/master`
- Usar o componente `CrmMasterConfig` em ambas as rotas
- Garantir que o contexto de navegação seja adequado para cada módulo

## Data Models

### Tema e Preferências
```typescript
interface ThemePreferences {
  theme: 'light' | 'dark';
  autoDetect: boolean;
}
```

### Logo Configuration
```typescript
interface LogoConfig {
  lightMode: string;
  darkMode: string;
  alt: string;
}
```

## Error Handling

### Fallbacks de Tema
- Se localStorage não estiver disponível, usar dark mode como padrão
- Se imagens de logo não carregarem, usar texto alternativo
- Se variáveis CSS não estiverem definidas, usar cores de fallback

### Contraste Inadequado
- Implementar verificação automática de contraste
- Logs de aviso para combinações de cores problemáticas
- Fallback para cores com contraste garantido

## Testing Strategy

### Testes Visuais
1. **Teste de Contraste**: Verificar se todos os elementos atendem WCAG AA (4.5:1)
2. **Teste de Páginas**: Navegar por todas as páginas em ambos os temas
3. **Teste de Componentes**: Verificar cada componente individualmente
4. **Teste de Transição**: Alternar entre temas e verificar suavidade

### Testes Funcionais
1. **Persistência de Tema**: Verificar se a preferência é salva corretamente
2. **Logo Alternância**: Confirmar troca automática da logo
3. **Master Config**: Testar sincronização entre rotas CRM e Simulador
4. **Responsividade**: Verificar em diferentes tamanhos de tela

### Checklist de Validação
- [ ] Todas as páginas têm fundo adequado no dark mode
- [ ] Todos os textos têm contraste mínimo 4.5:1
- [ ] Botões de alavancagem sem caixa alta
- [ ] Logo correta na página de login (dark mode)
- [ ] Linha de evolução patrimonial em marrom
- [ ] Dados de alavancagem única em marrom
- [ ] Rota simulador/master funcional
- [ ] Lista de alavancas legível no dark mode
- [ ] Campo valor do imóvel com contraste adequado
- [ ] Exemplo de contemplação visível no dark mode

## Implementation Notes

### Ordem de Implementação
1. Correção de fundos brancos nas páginas principais
2. Ajustes de contraste em componentes específicos
3. Aplicação das cores da marca (marrom)
4. Implementação da logo específica
5. Criação da rota master unificada
6. Ajustes de texto (remoção de caixa alta)
7. Testes e validação final

### Considerações Técnicas
- Usar variáveis CSS existentes sempre que possível
- Manter compatibilidade com sistema de temas atual
- Garantir que mudanças não afetem o light mode
- Preservar acessibilidade e usabilidade