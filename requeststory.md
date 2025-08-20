# Request Story - Projeto Monteo

## Histórico de Requisições

### Última Atualização: 2025-01-17

---

## Requisição Atual: Ajuste das Colunas da Tabela de Administradoras

**Data:** 2025-01-17  
**Solicitante:** Eduardo Costa  
**Status:** ✅ Concluído

### Funcionalidade Solicitada
Ajustar as colunas da tabela de administradoras para exibir:
- Seletor (de administradora padrão)
- Nome
- Status
- % Máx. Embutido
- Entrada especial
- Ajuste pós contemplação
- Compra do ágio
- Ações

### Análise da Estrutura Atual
**Colunas atuais da tabela:**
- Seletor (radio button para padrão)
- Nome
- Status
- % Máx. Embutido
- Entrada especial
- Ajuste pós contemplação
- Compra do ágio
- Ações

**Campos disponíveis no banco:**
- `name` - Nome da administradora
- `is_archived` - Status (ativo/arquivado)
- `max_embedded_percentage` - % Máx. Embutido
- `special_entry_type` - Tipo de entrada especial
- `special_entry_percentage` - Percentual da entrada especial
- `special_entry_fixed_value` - Valor fixo da entrada especial
- `special_entry_installments` - Parcelas da entrada especial
- `functioning` - Tipo de funcionamento (included/additional)
- `post_contemplation_adjustment` - Ajuste pós contemplação
- `agio_purchase_percentage` - Percentual para compra do ágio

### Implementação Realizada
1. **Removidas colunas desnecessárias:**
   - ✅ Tipo de Atualização
   - ✅ Mês de Atualização

2. **Ajustada ordem das colunas:**
   - ✅ Seletor (mantido)
   - ✅ Nome (mantido)
   - ✅ Status (mantido)
   - ✅ % Máx. Embutido (mantido)
   - ✅ Entrada especial (nova coluna)
   - ✅ Ajuste pós contemplação (nova coluna)
   - ✅ Compra do ágio (nova coluna)
   - ✅ Ações (mantido)

3. **Implementada coluna "Entrada especial":**
   - ✅ Função `formatSpecialEntry` criada
   - ✅ Exibe baseado em `special_entry_type`
   - ✅ Formata valores de acordo com o tipo (percentual/valor fixo)
   - ✅ Mostra parcelas quando aplicável
   - ✅ Exibe tipo de funcionamento (Incluso/Adicional)

4. **Implementadas colunas adicionais:**
   - ✅ Coluna "Ajuste pós contemplação" - exibe percentual do `post_contemplation_adjustment`
   - ✅ Coluna "Compra do ágio" - exibe percentual do `agio_purchase_percentage`
   - ✅ Campos adicionados à interface `Administrator`
   - ✅ Formatação em percentual para ambas as colunas

### Checklist
- [x] Analisar estrutura atual da tabela
- [x] Verificar campos disponíveis no banco
- [x] Remover colunas desnecessárias
- [x] Implementar coluna "Entrada especial"
- [x] Ajustar ordem das colunas
- [x] Testar funcionalidade
- [x] Atualizar porta 8080
- [x] Verificar se está funcionando corretamente

### Resultado
✅ Tabela de administradoras ajustada conforme solicitado  
✅ Colunas reorganizadas na ordem especificada  
✅ Nova coluna "Entrada especial" implementada com formatação adequada  
✅ Nova coluna "Ajuste pós contemplação" implementada  
✅ Nova coluna "Compra do ágio" implementada  
✅ Colunas desnecessárias removidas  
✅ Servidor atualizado na porta 8080

---

## Requisição Anterior: Sistema de Controle de Zoom das Fontes

**Data:** 2025-01-17  
**Solicitante:** Eduardo Costa  
**Status:** ✅ Concluído

### Funcionalidade Implementada
Sistema de controle de zoom das fontes no simulador com três ícones no menu lateral direito:
- **Lupa com "+"** - Aumentar fontes (ZoomIn)
- **Lupa com "-"** - Diminuir fontes (ZoomOut)  
- **Linha horizontal** - Resetar fontes ao normal (Minus)

### Implementação Técnica

#### 1. Contexto do Simulador (SimulatorLayout.tsx)
**Adicionado ao SimulatorContextType:**
- `fontZoom: number` - Controla o percentual de zoom (padrão: 100%)
- `setFontZoom: (zoom: number) => void` - Define zoom específico
- `increaseFontSize: () => void` - Aumenta em 10% (máximo 200%)
- `decreaseFontSize: () => void` - Diminui em 10% (mínimo 50%)
- `resetFontSize: () => void` - Volta para 100%

#### 2. Menu Lateral (SimulatorMenu.tsx)
**Novos ícones adicionados:**
- Importados: `ZoomIn`, `ZoomOut`, `Minus` do lucide-react
- Quarto menu criado com os três controles
- Handler `handleZoomClick` para processar as ações
- Tooltips explicativos para cada ação

#### 3. Aplicação do Zoom via CSS
**Sistema implementado:**
- useEffect monitora mudanças em `fontZoom`
- Aplica `fontSize: ${zoom}%` no elemento `.simulator-layout`
- Classe adicionada na div principal do simulador
- Zoom aplicado a todas as fontes e números do simulador

### Características do Sistema
- **Range de zoom:** 50% a 200%
- **Incremento:** 10% por clique
- **Aplicação:** Todas as fontes do simulador
- **Persistência:** Mantém zoom durante a sessão
- **Interface:** Ícones intuitivos no menu lateral

### Resultado
✅ Sistema funcional de controle de zoom  
✅ Três ícones no menu lateral direito  
✅ Zoom aplicado a todo o simulador  
✅ Controles intuitivos e responsivos

---

## Requisição Anterior: Controle da Entrada Especial nos Cálculos

---

## Requisição Atual: Correção do Modal de Redução de Parcela

**Data:** 2025-01-17  
**Solicitante:** Eduardo Costa  
**Status:** 🔄 Em Andamento

### Problema Identificado
Ao tentar editar uma Redução de Parcela e clicar em salvar no modal, a operação não estava sendo salva. Além disso, o campo "Administradora" não estava sendo pré-preenchido corretamente.

### Análise do Problema
**Causas identificadas:**
1. **Prop incorreto:** O modal `InstallmentReductionModal` estava sendo chamado com `onClose={closeModals}` 
2. **Campo não pré-preenchido:** O campo "Administradora" não estava sendo inicializado corretamente
3. **Possível problema de validação:** O formulário pode estar falhando na validação

### Correção Implementada
1. **Alterado prop do modal:**
   - ❌ `onClose={closeModals}` 
   - ✅ `onSuccess={closeModals}`

2. **Adicionados logs de debug extensivos:**
   - Logs na função `onSubmit` para monitorar o fluxo
   - Logs no `useEffect` para verificar inicialização do formulário
   - Logs no campo Select para verificar valor da administradora
   - Logs no botão de submit para verificar clique
   - Logs no formulário para verificar valores atuais

3. **Verificação da função `closeModals`:**
   - Confirmação de que a função inclui `handleRefresh()`
   - Função responsável por fechar modais e atualizar listas

### Investigação em Andamento
- [x] Adicionar logs de debug para identificar problema
- [x] Verificar inicialização do campo administradora
- [x] Verificar se formulário está sendo submetido
- [x] Identificar causa específica do problema
- [ ] Implementar correção definitiva
- [ ] Remover logs de debug
- [ ] Testar funcionalidade completa

### Problema Específico Identificado
**Causa raiz encontrada:**
- O campo `administrator_id` está ficando vazio (`""`) quando o formulário é submetido
- O botão está sendo clicado e o formulário renderizado corretamente
- Mas o `onSubmit` não está sendo chamado devido a falha na validação
- O campo Select não está mantendo o valor corretamente
- **Erro de validação específico:** `Form errors: {administrator_id: {…}}`
- **Erro específico:** `{message: 'Administradora é obrigatória', type: 'too_small'}`

### Correções Aplicadas
1. **Campo Select corrigido:**
   - Adicionado `defaultValue={field.value || ''}`
   - Garantido que o valor seja sempre uma string válida
   - Adicionado log no `onValueChange` para monitorar mudanças

2. **Estado local adicionado:**
   - Criado estado `selectedAdminId` para controlar o valor do Select
   - Sincronização entre estado local e formulário
   - Garantia de que o valor não seja perdido

3. **Logs de validação adicionados:**
   - Log dos erros de validação do formulário
   - Log específico no `handleSubmit` para verificar se está sendo chamado
   - Log específico para erro de `administrator_id`
   - Log no schema de validação

4. **Debug do onSubmit:**
   - Log específico para confirmar se a função está sendo executada
   - Log de erros de validação no handleSubmit

5. **Schema de validação ajustado:**
   - Adicionado `refine` para log dos dados de validação
   - Temporariamente mais permissivo para debug

### Correção Definitiva Implementada
- **Estado local para Select:** `selectedAdminId` para controlar o valor
- **Sincronização:** Entre estado local e campo do formulário
- **Valor controlado:** Select usa `selectedAdminId || field.value || ''`
- **Forçar atualização:** Campo `administrator_id` é forçado antes da submissão
- **Schema limpo:** Removido `refine` que causava problemas de validação

### Correção Final Aplicada
1. **Forçar valor antes da submissão:**
   ```typescript
   const formDataWithAdmin = {
     ...data,
     administrator_id: selectedAdminId || data.administrator_id
   };
   ```

2. **Schema de validação limpo:**
   - Removido `refine` que causava problemas
   - Validação direta sem interferências

3. **Logs de debug mantidos:**
   - Para monitorar o comportamento
   - Verificar se o valor está sendo mantido

### Solução Definitiva Implementada
1. **Função handleSaveClick criada:**
   - Contorna a validação do react-hook-form
   - Usa estado local diretamente
   - Validação manual dos campos obrigatórios

2. **Botão atualizado:**
   - Usa `handleSaveClick` em vez de `onSubmit`
   - Tipo `button` em vez de `submit`
   - Controle direto do salvamento

3. **Estrutura simplificada:**
   - Formulário mantido apenas para campos
   - Lógica de salvamento separada
   - Sem dependência da validação automática

### Melhorias Implementadas
1. **Modal fecha após salvar:**
   - Adicionado `onOpenChange(false)` após sucesso
   - Melhor experiência do usuário

2. **Estilo dos campos padronizado:**
   - Campos Nome e Percentual: `campo-brand brand-radius field-secondary-focus no-ring-focus`
   - Select: `select-trigger-brand brand-radius`
   - Consistência com o design da empresa

3. **Botão com cor primária:**
   - Alterado para `variant="brandPrimaryToSecondary"`
   - Usa a cor primária da empresa
   - Consistência visual

4. **Opção "Seguro" removida:**
   - Removida da lista de aplicações
   - Mantidas: Parcela, Taxa de administração, Fundo de reserva
   - Simplificação das opções disponíveis

5. **Contagem de aplicações implementada:**
   - Coluna "Nº de aplicações" agora mostra o número correto
   - Baseado no array `applications` do Supabase
   - Exemplo: Parcela + Taxa de adm = "2"
   - Função `getApplicationsCount` implementada corretamente

### Problema Identificado na Contagem
- **Valores incorretos:** Campos mostrando 5 quando só tem 2 aplicações
- **Magalu:** Mostra 3 quando só tem 1 aplicação selecionada
- **Investigação em andamento:** Logs adicionados para debug dos dados
- **Possível causa:** Dados não estão sendo carregados corretamente do Supabase

### Causa Raiz Identificada
- **Dados duplicados no Supabase:** `'installment'` e `'parcela'` (mesma coisa)
- **Valores incorretos:** `'admin_tax'` e `'taxa_adm'` (mesma coisa)
- **Aplicações inválidas:** Dados salvos com valores antigos/incorretos

### Correção Implementada
- **Filtro de aplicações válidas:** Apenas `['installment', 'admin_tax', 'reserve_fund']`
- **Remoção de duplicatas:** Usando `Set` para garantir valores únicos
- **Contagem correta:** Baseada nas aplicações válidas e únicas

### Campo Administradora Corrigido
- **Problema:** Campo não vinha pré-preenchido ao editar
- **Causa:** Ordem de execução - `selectedAdminId` definido antes dos administradores carregarem
- **Solução:** Separado em dois `useEffect` - primeiro carrega administradores, depois define o valor
- **Resultado:** Campo agora vem pré-preenchido corretamente ao editar

### Limpeza de Código
- **Logs de debug removidos:** Todos os `console.log` foram removidos
- **Código limpo:** Modal e lista funcionando sem logs desnecessários
- **Performance melhorada:** Sem overhead de logs em produção

### Filtro de Administradora Implementado
- **Novo filtro:** Adicionado entre pesquisa e situação na aba "Redução de Parcela"
- **Funcionalidade:** Permite filtrar reduções por administradora específica
- **Opções:** "Todas Adms" + lista das administradoras da empresa
- **Integração:** Usa o estado `reductionAdminFilter` já existente
- **Query:** Busca administradoras ativas da empresa para popular o select
- **Correção:** Resolvido erro do Radix UI SelectItem com valor vazio
- **Estado:** Mudado de string vazia para "all" para compatibilidade
- **Alinhamento:** Corrigido alinhamento do texto para esquerda nos campos Select
- **CSS:** Adicionadas classes customizadas para forçar alinhamento à esquerda
- **Textos:** Ajustados para "Todas Adms" e "Todas Situações" para melhor UX

### Resultado
✅ Modal de redução de parcela corrigido  
✅ Função de salvar funcionando corretamente  
✅ Lista sendo atualizada após salvar  
✅ Logs de debug adicionados para monitoramento

---
