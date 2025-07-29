# Planejamento - Correção do Erro de Formato de Data nos Indicadores

## Análise do Problema

### Problemas Identificados:
1. **Erro HTTP 400**: "invalid input syntax for type date: "2025-07-18_2025-07-24""
2. **Formato de data incorreto**: Campo `period_date` recebendo formato "YYYY-MM-DD_YYYY-MM-DD" em vez de data única
3. **Warning de acessibilidade**: `DialogContent` sem `Description` ou `aria-describedby`

### Análise da Estrutura:
- **Arquivo principal**: `src/components/CRM/IndicatorModal.tsx`
- **Hook de dados**: `src/hooks/useIndicators.ts`
- **Funções de período**: `src/lib/utils.ts`
- **Tipos**: `src/types/crm.ts` e `src/integrations/supabase/types.ts`

### Análise do Banco de Dados:
- Campo `period_date` no banco espera formato `date` (YYYY-MM-DD)
- Funções de período geram formato "YYYY-MM-DD_YYYY-MM-DD" para períodos semanais/mensais
- Campo `period_start` e `period_end` são separados no banco

## Checklist de Correções

### ✅ Etapa 1: Análise e Planejamento
- [x] Entender bem o que foi pedido
- [x] Verificar o histórico da conversa
- [x] Analisar estrutura de documentos
- [x] Verificar banco de dados
- [x] Registrar requisição em requeststory.md
- [x] Criar planejamento e checklist

### ✅ Etapa 2: Implementação das Correções
- [x] Corrigir formato de data no IndicatorModal
- [x] Ajustar lógica de envio para usar period_start/period_end
- [x] Corrigir warning de acessibilidade do DialogContent
- [x] Adicionar logs de debug para investigação
- [ ] Testar registro de indicadores
- [ ] Verificar se funciona para todos os tipos de período

### ⏳ Etapa 3: Teste e Deploy
- [ ] Testar as alterações
- [ ] Executar deploy
- [ ] Conferir se tudo está funcionando

## Soluções Propostas

### 1. Formato de Data
**Problema**: `period_date` recebendo "2025-07-18_2025-07-24"
**Solução**: 
- Usar `period_start` e `period_end` separadamente
- Manter `period_date` como data única (primeira data do período)
- Ajustar lógica de envio no IndicatorModal

### 2. Warning de Acessibilidade
**Problema**: `DialogContent` sem `Description`
**Solução**:
- Adicionar `DialogDescription` ou `aria-describedby`
- Melhorar acessibilidade do modal

### 3. Lógica de Períodos
**Problema**: Funções geram formato incorreto
**Solução**:
- Manter funções de geração de períodos como estão
- Ajustar apenas a lógica de envio no modal
- Extrair datas de início e fim do valor do período

## Status Atual
✅ **Implementação concluída** - Correções de formato de data aplicadas

### Correções Implementadas:

#### 1. Formato de Data ✅
- **Problema**: `period_date` recebendo "2025-07-18_2025-07-24" em vez de data única
- **Solução**: Extrair apenas a data de início do período para usar como `period_date`
- **Resultado**: Campo `period_date` agora recebe formato correto (YYYY-MM-DD)

#### 2. Warning de Acessibilidade ✅
- **Problema**: `DialogContent` sem `Description` ou `aria-describedby`
- **Solução**: Adicionado `DialogDescription` com texto descritivo
- **Resultado**: Warning de acessibilidade resolvido

#### 3. Logs de Debug ✅
- **Problema**: Difícil identificar valores sendo enviados
- **Solução**: Adicionados logs de debug para verificar valores antes do envio
- **Resultado**: Melhor visibilidade dos dados sendo enviados

### Próximos Passos:
- [x] Testar registro de indicadores com as correções
- [x] Identificar problema na exibição do período no modal de edição
- [x] Ajustar espaçamento entre filtros e cards de dados
- [ ] Verificar se funciona para todos os tipos de período (diário, semanal, mensal)
- [ ] Remover logs de debug após validação

### Problemas Identificados e Corrigidos:

#### 1. Modal de Edição com Período Incorreto ✅
- **Problema**: Modal de edição mostrava período incorreto (apenas data de início)
- **Causa**: Código estava usando `indicator.period_date` em vez de `period_start` e `period_end`
- **Solução**: Alterada a lógica para usar `period_start` e `period_end` separadamente
- **Resultado**: Modal agora deve mostrar o período correto

#### 2. Períodos Já Preenchidos Ainda Aparecendo ✅
- **Problema**: Períodos já preenchidos pelo usuário ainda aparecem no dropdown
- **Causa**: Lógica de verificação estava usando `period_date` em vez de criar chave única com `period_start` e `period_end`
- **Solução**: Alterada a lógica para criar chave única `${period_start}_${period_end}`
- **Resultado**: Períodos já preenchidos devem aparecer como "já preenchido" ou não aparecer

#### 3. Espaçamento entre Filtros e Cards de Dados ✅
- **Problema**: Cards de "Dados semanais" e "Dados do Período" muito próximos da seção de "Filtros de Performance"
- **Solução**: Adicionado `mt-6` (24px) de espaçamento entre os filtros e os cards
- **Resultado**: Melhor separação visual entre as seções

#### 4. Cores do Degradê do Funil ✅
- **Problema**: Degradê do funil estava usando cores #AA725B para #CBA89A
- **Solução**: Alterado para degradê de #AA725B para #93614C
- **Resultado**: Degradê mais escuro e consistente com a identidade visual 