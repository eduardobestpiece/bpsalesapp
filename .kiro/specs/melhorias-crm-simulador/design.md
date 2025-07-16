# Design Document

## Overview

Este documento detalha o design técnico para implementar as melhorias solicitadas na plataforma Monteo, abrangendo ajustes visuais no modo escuro, correções de layout, novas funcionalidades no CRM e no Simulador, e a criação de um sistema de personalização visual. As mudanças visam melhorar a experiência do usuário, corrigir problemas existentes e adicionar recursos que permitam análises mais detalhadas e personalizáveis.

## Architecture

### Sistema de Cores e Temas
- Manter o sistema atual de variáveis CSS para light/dark mode
- Implementar o modo escuro como padrão em todas as páginas
- Criar um sistema de personalização de cores que permita substituir as variáveis CSS padrão

### Componentes Afetados
1. **Páginas do CRM**: Comercial (Leads e Vendas), Indicadores (Performance e Registro), Configurações
2. **Páginas do Simulador**: Alavancagem Patrimonial, Configurações (Parcelas e Alavancas)
3. **Componentes específicos**: Filtros de Performance, Modais de Funis, Campos de formulário
4. **Cálculos**: Alavancagem Patrimonial, Alavancagem Escalonada
5. **Personalização**: Sistema de cores, fontes e imagens

## Components and Interfaces

### 1. Correções de Modo Escuro

#### Páginas Afetadas:
- `src/pages/crm/Comercial.tsx` (abas Leads e Vendas)
- `src/pages/Configuracoes.tsx`
- `src/pages/Simulador.tsx` (aba Parcelas)

#### Estratégia:
- Aplicar classes `bg-background` nos containers principais
- Garantir que todos os elementos filhos herdem as cores corretas
- Corrigir contraste de texto usando `text-foreground`
- Padronizar campos de formulário com `bg-input`

### 2. Ajustes de Layout

#### Espaçamento na Página de Indicadores:
- Adicionar margem superior adequada entre "Filtros de Performance" e os elementos seguintes
- Usar classes como `mt-6` ou `pt-6` para criar espaço visual

#### Botões Duplicados:
- Remover o botão de nova venda duplicado na página Comercial aba Vendas

#### Campos de Formulário:
- Padronizar o campo "Tipo" na aba Itens Arquivados
- Padronizar os campos do modal "Selecionar Período"
- Usar componentes `Select` e `Input` da biblioteca de UI

### 3. Novas Funcionalidades no CRM

#### Modal de Criação e Edição de Funis:
- Adicionar campos para selecionar fases atreladas a:
  - Reunião agendada
  - Reunião realizada
- Armazenar essas informações na tabela `funnels`

#### Filtros de Performance:
- Implementar multiseleção para "Funil", "Equipe" e "Usuário"
- Adicionar opção "Todos" em cada filtro
- Exibir período selecionado ao lado do botão de aplicar filtro
- Implementar multiseleção para campos Mês e Ano no modal "Selecionar Período"

#### Novas Métricas:
- Adicionar "Número de recomendações (período)" aos Dados do Período
- Adicionar "Delay / No Show (período)" aos Dados do Período
- Adicionar "Número de recomendações (semana)" aos Dados Semanais
- Adicionar "Delay / No Show (semana)" aos Dados Semanais

### 4. Correções nos Modais de Indicadores

#### Modal de Editar Indicador:
- Garantir que o período exibido seja o mesmo registrado nas colunas period_start e period_end

#### Modal de Registrar Indicador:
- Filtrar períodos já registrados para não exibi-los como opção

### 5. Melhorias no Simulador

#### Exibição de Valores:
- Corrigir exibição do item "Despesas" na lista de alavancas
- Limitar taxa anual a duas casas decimais
- Formatar campo de Valor do Imóvel como moeda em reais

#### Persistência de Dados:
- Implementar armazenamento local (localStorage) para manter valores entre navegações
- Sincronizar campos entre abas para atualização em tempo real

### 6. Correções nos Cálculos de Alavancagem

#### Ganhos Mensais:
```typescript
// Cálculo correto
const valorDiaria = patrimonio * (percentualDiaria / 100);
const ocupacao = 30 * (taxaOcupacao / 100);
const valorMensal = ocupacao * valorDiaria;
const taxaAirbnb = valorMensal * (percentualAdministradora / 100);
const custosImovel = patrimonio * (valorDespesas / 100);
const custosTotais = taxaAirbnb + custosImovel;
const ganhosMensais = valorMensal - custosTotais;
```

#### Parcela Pós-Contemplação:
```typescript
// Cálculo correto considerando atualizações do crédito
// Implementar lógica de atualização conforme mês específico
// Calcular saldo devedor e dividir pelo número de parcelas restantes
```

#### Fluxo de Caixa:
```typescript
// Fluxo de Caixa Antes 240 meses
const fluxoCaixaAntes = ganhosMensais - parcelaPosContemplacao;

// Fluxo de Caixa Pós 240 meses
// Recalcular ganhos mensais com valor atualizado do imóvel
```

#### Valores Pagos:
```typescript
// Pago do Próprio Bolso
// Somar todas as parcelas pagas antes da contemplação
const pagoProprioBolso = somaParcelas;
const percentualProprioBolso = (pagoProprioBolso / valorCredito) * 100;

// Pago pelo Inquilino
const pagoInquilino = valorCredito - pagoProprioBolso;
const percentualInquilino = (pagoInquilino / valorCredito) * 100;
```

### 7. Alavancagem Escalonada

#### Implementação:
- Adicionar lógica para criar novas linhas de contemplação a cada 60 meses
- Somar métricas de cada contemplação para cálculos totais
- Atualizar gráfico para mostrar evolução com múltiplas contemplações
- Corrigir contagem de imóveis para refletir o total correto

### 8. Modal de Mais Configurações

#### Sincronização de Campos:
- Conectar campo "Parcelas" com "Número de parcelas" da página principal
- Implementar lógica para sobrepor valores padrão quando campos são definidos como manuais

### 9. Sistema de Personalização Visual

#### Nova Aba em Master Config:
- Criar aba "Layout" com sub-abas "Normal" e "Darkmode"
- Implementar interface para listar e editar cores de todos os elementos
- Implementar interface para listar e editar fontes, tamanhos e pesos
- Implementar interface para visualizar e substituir imagens de logo e favicon

#### Armazenamento de Configurações:
- Criar tabela `layout_settings` para armazenar configurações personalizadas
- Implementar sistema para aplicar configurações personalizadas via CSS dinâmico

## Data Models

### Alterações em Tabelas Existentes

#### Tabela `funnels`:
```sql
ALTER TABLE funnels
ADD COLUMN meeting_scheduled_stage_id UUID REFERENCES funnel_stages(id),
ADD COLUMN meeting_completed_stage_id UUID REFERENCES funnel_stages(id);
```

### Novas Tabelas

#### Tabela `layout_settings`:
```sql
CREATE TABLE layout_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  theme VARCHAR(20) NOT NULL, -- 'light' ou 'dark'
  element_type VARCHAR(50) NOT NULL, -- 'color', 'font', 'image'
  element_name VARCHAR(100) NOT NULL,
  element_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Error Handling

### Validação de Dados
- Implementar validação para todos os campos de formulário
- Garantir que valores numéricos estejam dentro de limites aceitáveis
- Tratar casos de divisão por zero nos cálculos

### Fallbacks
- Definir valores padrão para todos os cálculos
- Implementar tratamento para dados ausentes ou inválidos
- Garantir que a interface não quebre mesmo com dados incompletos

## Testing Strategy

### Testes Visuais
1. **Teste de Modo Escuro**: Verificar todas as páginas no modo escuro
2. **Teste de Layout**: Verificar espaçamento e alinhamento de elementos
3. **Teste de Campos**: Verificar formatação e comportamento de campos de formulário
4. **Teste de Responsividade**: Verificar em diferentes tamanhos de tela

### Testes Funcionais
1. **Filtros de Performance**: Testar multiseleção e opção "Todos"
2. **Cálculos de Alavancagem**: Verificar precisão dos cálculos com diferentes cenários
3. **Persistência de Dados**: Testar manutenção de valores entre navegações
4. **Personalização Visual**: Testar aplicação de cores, fontes e imagens personalizadas

### Testes de Regressão
1. **Funcionalidades Existentes**: Garantir que mudanças não afetem funcionalidades já implementadas
2. **Compatibilidade**: Verificar compatibilidade com diferentes navegadores

## Implementation Notes

### Priorização
1. Correções de modo escuro e layout (alta prioridade)
2. Correções nos cálculos de alavancagem (alta prioridade)
3. Novas funcionalidades no CRM (média prioridade)
4. Persistência de dados no Simulador (média prioridade)
5. Sistema de personalização visual (baixa prioridade)

### Considerações Técnicas
- Usar variáveis CSS existentes sempre que possível
- Implementar armazenamento local para persistência de dados
- Otimizar cálculos para evitar reprocessamento desnecessário
- Criar componentes reutilizáveis para elementos comuns
- Documentar fórmulas e lógicas de cálculo para facilitar manutenção futura