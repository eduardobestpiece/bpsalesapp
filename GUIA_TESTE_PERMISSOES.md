# Guia para Testar Permissões do Líder e Usuário

## Problemas Identificados

### 1. Líder
- **Problema**: Líder só consegue ver simulador, não vê configurações no menu
- **Solução**: Dar permissões completas ao Líder igual ao Administrador

### 2. Usuário
- **Problema**: Usuário consegue acessar configurações mas tela fica vazia
- **Causa**: Usuário tem permissão para acessar a página, mas não tem permissões para as abas individuais
- **Solução**: Adicionar permissões das abas para o usuário

## Análise Realizada
1. **Usuário líder**: marketing@monteo.com.br (empresa: 5a2aa715-6017-4f50-91dd-bcd322ddc3a0)
2. **Usuário comum**: eduardocostav4@... (empresa: 5a2aa715-6017-4f50-91dd-bcd322ddc3a0)
3. **Permissões atuais**: 
   - Líder: Simulador = "allowed", Configurações = "allowed" ✅
   - Usuário: Simulador = "allowed", Configurações = "allowed" ✅
   - **Problema**: Usuário não tem permissões para abas individuais

## Scripts Criados
1. **`fix_leader_permissions_global.sql`** - Para dar permissões completas ao Líder (TODAS as empresas)
2. **`fix_user_tab_permissions_global.sql`** - Para adicionar permissões das abas ao Usuário (TODAS as empresas)
3. **`fix_leader_permissions.sql`** - Para dar permissões completas ao Líder (empresa específica)
4. **`fix_user_tab_permissions.sql`** - Para adicionar permissões das abas ao Usuário (empresa específica)
5. **`update_leader_permissions.sql`** - Para atualizar permissões específicas
6. **`create_leader_permissions.sql`** - Para criar permissões (já existe)

## Como Testar

### 1. Executar Scripts SQL
Execute os scripts no Supabase SQL Editor:

**Para TODAS as empresas (RECOMENDADO):**
```sql
-- Para Líder (todas as empresas)
-- Executar fix_leader_permissions_global.sql

-- Para Usuário (todas as empresas)  
-- Executar fix_user_tab_permissions_global.sql
```

**Para empresa específica:**
```sql
-- Para Líder (empresa específica)
-- Executar fix_leader_permissions.sql

-- Para Usuário (empresa específica)
-- Executar fix_user_tab_permissions.sql
```

### 2. Testar com Usuário Líder
1. Faça login com: **marketing@monteo.com.br**
2. Acesse: **http://localhost:8080/debug-permissions**
3. Clique em "Testar Permissões no Console"
4. Verifique se as permissões estão corretas:
   - Simulador: ✅ Acesso
   - Configurações: ✅ Acesso
   - Módulo Simulador: ✅ Acesso

### 3. Testar com Usuário Comum
1. Faça login com: **eduardocostav4@...**
2. Acesse: **http://localhost:8080/debug-tab-permissions**
3. **IMPORTANTE**: Clique primeiro em "Limpar Cache" e depois em "Recarregar Dados"
4. Verifique se as permissões das abas estão corretas:
   - Administradoras: ✅ Permitido
   - Reduções: ✅ Permitido
   - Parcelas: ✅ Permitido
   - Produtos: ✅ Permitido
   - Alavancas: ✅ Permitido
5. **Se ainda estiver vazio**: Acesse a página de configurações e verifique se as abas aparecem

### 4. Testar Comportamento
1. **Líder**:
   - Acesse: **http://localhost:8080/simulador** - Deve permitir acesso
   - Acesse: **http://localhost:8080/simulador/configuracoes** - Deve permitir acesso
   - Verifique o menu lateral: Deve mostrar tanto "Simulador" quanto "Configurações"

2. **Usuário**:
   - Acesse: **http://localhost:8080/simulador** - Deve permitir acesso
   - Acesse: **http://localhost:8080/simulador/configuracoes** - Deve mostrar conteúdo das abas
   - Verifique o menu lateral: Deve mostrar tanto "Simulador" quanto "Configurações"

### 5. Verificar Console
Abra o console do navegador e verifique os logs de debug:
- `[DEBUG] Função do usuário (key): leader/user, Nome de exibição: Líder/Usuário`
- `[DEBUG] Permissões aplicáveis (após filtro):`
- `[DEBUG] canAccessSimulator: true`
- `[DEBUG] canAccessSimulatorConfig: true`

## Resultado Esperado

### Líder
- ✅ Pode acessar simulador
- ✅ Pode acessar configurações do simulador
- ✅ Menu mostra ambas opções: Simulador e Configurações
- ✅ Pode editar/criar/arquivar nas configurações (igual ao Administrador)

### Usuário
- ✅ Pode acessar simulador
- ✅ Pode acessar configurações do simulador
- ✅ Menu mostra ambas opções: Simulador e Configurações
- ✅ Pode ver conteúdo das abas (Administradoras, Reduções, etc.)

## Se Não Funcionar
1. Verifique se os scripts SQL foram executados corretamente
2. Verifique se está logado com o usuário correto
3. Verifique os logs no console do navegador
4. Acesse `/debug-permissions` para ver informações detalhadas
5. Acesse `/debug-tab-permissions` para ver permissões das abas
6. **Para usuário com tela vazia**: Clique em "Limpar Cache" e depois "Recarregar Dados"
7. Verifique se a empresa está correta no banco de dados

## Rotas de Debug Disponíveis
- **`/test-permissions`** - Teste básico de permissões
- **`/debug-permissions`** - Debug detalhado com logs no console
- **`/debug-tab-permissions`** - Debug específico das permissões das abas 