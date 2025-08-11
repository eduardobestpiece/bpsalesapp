# Request Story - Projeto Monteo

## Última Atualização: 2025-08-11

### Requisição Atual: Lider/Admin sem permissão continuam vendo Simulador

#### Diagnóstico
- Banco (Supabase) possui linhas permitindo o simulador para `admin` na empresa Monteo Investimentos:
  - `role_page_permissions`: `('admin','simulator', allowed=true)` e `('admin','simulator_config', allowed=true)`.
- Isso sobrescreve a UI de Acessos, mantendo acesso mesmo desmarcando localmente se o save não refletir em banco.

#### Ações
- Ajustado gate do `ProtectedRoute` para fail-closed: sem registro para a página requerida, acesso NEGADO.
- Mantido uso da empresa efetiva (localStorage `selectedCompanyId` ou `companyId` do auth).

#### Recomendação de dados
- Remover entradas permissivas antigas para `admin`/`leader` no `role_page_permissions` da empresa atual ou re-salvar pela tela de Acessos (que reescreve todas as páginas da empresa).

#### Checklist
- [x] Gate fail-closed no `ProtectedRoute`
- [x] Build local ok
- [ ] Deploy
- [ ] Validar bloqueio com `admin`/`leader`

#### Status: 🔄 Aguardando deploy/validação

---

### Requisição Atual: Permissões para Líder e Administrador não aplicando regras

#### Problema
- Regras de abas funcionavam para `Usuário`, mas para `Líder` e `Administrador` estavam sendo bloqueadas quando não havia registro explícito em `role_page_permissions`.

#### Solução
- Definido fallback permissivo: se não existir registro para a página/aba, considera `allowed = true`.
- Aplicado em:
  - `CrmIndicadores.tsx` (abas performance/registro)
  - `CrmDashboard.tsx` (abas leads/vendas)
  - `CrmHeader.tsx` (links de navegação Comercial/Indicadores com default `true`).

#### Checklist
- [x] Ajustar fallback em `CrmIndicadores.tsx`
- [x] Ajustar fallback em `CrmDashboard.tsx`
- [x] Ajustar fallback em `CrmHeader.tsx`
- [x] Build local ok
- [ ] Deploy
- [ ] Testar com perfis `leader` e `admin`

#### Status: 🔄 Aguardando deploy/validação

---

### Requisição Atual: Corrigir permissões das abas em `CRM > Indicadores`

#### Contexto
- Usuário com acesso restrito à página de indicadores está visualizando as duas abas: "Performance" e "Registro de Indicadores".

#### Causa Provável
- Página `CrmIndicadores.tsx` usava `allowedTabs` fixo `['performance','registro']` sem consultar `role_page_permissions`.

#### Ações planejadas
- Ler permissões em `role_page_permissions` por `company_id` e `role`.
- Mapear chaves `indicadores_performance` e `indicadores_registro` (seed em `app_pages`).
- Renderizar apenas as abas permitidas e definir `defaultTab` dinamicamente.
- Estados de loading/erro e fallback quando nenhuma aba estiver liberada.

#### Checklist
- [x] Implementar checagem dinâmica de abas em `CrmIndicadores.tsx`
- [x] Build local ok
- [ ] Deploy
- [ ] Validar visualização conforme papel do usuário

#### Status: 🔄 Aguardando deploy/validação

---

### Requisição Atual: Deploy da aplicação (Vercel/GitHub)

#### Ações planejadas:
- Construir o projeto com `npm run build`
- Tentar publicar via Vercel CLI (`vercel deploy --prod`)
- Caso o Vercel CLI peça autenticação/vinculação: oferecer disparo via push no GitHub para acionar deploy automático
- Garantir que a porta `8080` está configurada no `vite.config.ts`

#### Checklist
- [x] Build em produção finalizado sem erros
- [x] Deploy publicado (Vercel) ou push realizado para GitHub para acionar deploy
- [x] Verificação de funcionamento
- **URL Produção:** https://consorcio-patrimonio-simulador-l72j2mifo.vercel.app

#### Status: ✅ Concluído

---

### Requisição Atual: Aplicar cor secundária em bordas e dropdowns (Configurações do Simulador)

#### Ações executadas:
- Ajustar campo "Buscar administradoras..." para usar cor secundária nas bordas quando focado
- Ajustar seletor de status (ativas/arquivadas) para usar cor secundária nas bordas quando aberto/focado
- Ajustar itens do dropdown de status para usar cor secundária em hover e item selecionado

#### Status: 🔄 Em progresso

---

### Requisição Atual: Reinício do servidor na porta 8080

#### Ações executadas:
- Encerrados processos que ocupavam a porta `8080` (`kill -9` nos PIDs ativos)
- Reiniciado servidor Vite com `nohup npm run dev -- --host --port 8080` em background
- Verificado serviço escutando em `*:8080` (LISTEN)
- Validada resposta HTTP `200` em `http://localhost:8080`

#### Status: ✅ Porta 8080 reiniciada e serviço operacional

---

### Requisição Atual: Ajustes no Funcionamento do Simulador - Mudança de Modalidade

#### Problema Identificado:
- **Espaçamento abaixo do cabeçalho:** Uma pequena faixa visível abaixo do header fixo estava aparecendo.
- **Causa:** O `header` é `fixed` com altura `min-h-16`, e o conteúdo dentro de `SidebarInset` não possuía padding superior correspondente.
- **Necessidade:** Ajustar o layout para que o conteúdo comece logo abaixo do cabeçalho, sem sobreposição e sem faixa vazia.

#### Análise Técnica:
1. **Estrutura Atual:** O sistema já possui lógica para ambas as modalidades
2. **Problema:** Falta sincronização automática quando a modalidade muda
3. **Componentes Afetados:** CreditAccessPanel, cálculos de crédito e parcela
4. **Dados:** searchType ('contribution' vs 'credit') não está sendo usado corretamente

#### Plano de Implementação:

**Fase 1 - Análise e Diagnóstico:**
- ✅ Verificar estrutura atual do projeto
- ✅ Identificar componentes responsáveis pelos cálculos
- ✅ Analisar fluxo de dados entre modalidade e cálculos

**Fase 2 - Correção da Sincronização:**
- ✅ Implementar trigger automático quando modalidade muda
- ✅ Atualizar cálculos baseados no searchType
- ✅ Sincronizar dados entre componentes

**Fase 3 - Testes e Validação:**
- ✅ Testar mudança de modalidade
- ✅ Verificar se cálculos são atualizados corretamente
- ✅ Validar consistência dos dados

#### Implementações Realizadas:

**1. Ajuste de Layout no Container Principal:**
- ✅ Adicionado `pt-16` em `SidebarInset` para compensar a altura do header fixo (`min-h-16`)
- ✅ Comentário no código explicando o motivo do padding
- ✅ Removida a faixa/folga aparente logo abaixo do cabeçalho

**2. Manutenção da Implementação Anterior (Modalidade):**
- ✅ Mantida a sincronização de cálculos ao mudar de "Aporte" para "Crédito"
- ✅ Lógica unificada no `CreditAccessPanel`

#### Status: ✅ **CONCLUÍDO**

---

### Histórico de Requisições:

#### Requisição Anterior: Correções no Cabeçalho Fixo da Tabela "Detalhamento do Consórcio"

**Problemas Identificados:**
1. **Cabeçalho Quadrado:** Cabeçalho sem arredondamento nos cantos superior esquerdo e direito
2. **Desalinhamento das Colunas:** Itens do cabeçalho não alinhados perfeitamente com suas respectivas colunas
3. **Erro de Compilação:** Erro `Cannot access 'visibleKeys' before initialization` que quebrava a tela

**Correções Implementadas:**

**1. Arredondamento do Cabeçalho:**
- ✅ Adicionado `rounded-t-lg` ao thead
- ✅ Aplicado `borderRadius: '8px 8px 0 0'` ao container do cabeçalho
- ✅ Implementado arredondamento dinâmico: primeira coluna `8px 0 0 0`, última coluna `0 8px 0 0`

**2. Alinhamento Dinâmico das Colunas:**
- ✅ Implementado sistema de medição automática de larguras
- ✅ Função `measureAndSyncColumnWidths` para sincronizar cabeçalho e corpo
- ✅ Aplicação de larguras uniformes baseadas no maior tamanho encontrado
- ✅ Largura mínima de 80px garantida
- ✅ **MELHORIA:** Sistema de refs para medição precisa de cada célula
- ✅ **MELHORIA:** `requestAnimationFrame` para garantir medidas atualizadas
- ✅ **MELHORIA:** Função `forceAlignment` para aplicar alinhamento perfeito
- ✅ **MELHORIA:** Controle de largura exata com `width`, `minWidth` e `maxWidth`
- ✅ **SISTEMA DINÂMICO:** Medição de todas as células do corpo da tabela
- ✅ **SISTEMA DINÂMICO:** Comparação entre cabeçalho e maior conteúdo da coluna
- ✅ **SISTEMA DINÂMICO:** Aplicação automática da maior largura encontrada
- ✅ **SISTEMA DINÂMICO:** Elementos temporários para medição precisa
- ✅ **SINCRONIZAÇÃO PERFEITA:** `tableLayout: 'fixed'` para alinhamento exato
- ✅ **SINCRONIZAÇÃO PERFEITA:** `boxSizing: 'border-box'` para controle preciso
- ✅ **SINCRONIZAÇÃO PERFEITA:** Largura total calculada e aplicada em ambos os containers
- ✅ **SINCRONIZAÇÃO PERFEITA:** Padding uniforme para medição precisa
- ✅ **CORREÇÃO:** Remoção de `tableLayout: 'fixed'` que causava larguras excessivas
- ✅ **CORREÇÃO:** Sistema de medição simplificado com estilos básicos
- ✅ **CORREÇÃO:** Margem de segurança de apenas 16px adicionada
- ✅ **CORREÇÃO:** Remoção de cálculos de largura total desnecessários
- ✅ **ALINHAMENTO PERFEITO:** Estilos IDÊNTICOS para cabeçalho e corpo
- ✅ **ALINHAMENTO PERFEITO:** Padding uniforme `8px 16px` aplicado inline
- ✅ **ALINHAMENTO PERFEITO:** `textAlign: 'left'` forçado inline
- ✅ **ALINHAMENTO PERFEITO:** Remoção de classes CSS conflitantes
- ✅ **SOLUÇÃO FINAL:** Larguras fixas baseadas no tipo de conteúdo
- ✅ **SOLUÇÃO FINAL:** Mês: 60px, Créditos: 140px, Valores médios: 110-130px
- ✅ **SOLUÇÃO FINAL:** Sistema ultra simples e direto
- ✅ **SOLUÇÃO FINAL:** Alinhamento garantido por larguras idênticas
- ✅ **LÓGICA EXATA:** Se Tamanho Horizontal do cabeçalho > Tamanho horizontal dos valores da coluna
- ✅ **LÓGICA EXATA:** Então: Tamanho da coluna e do cabeçalho = Tamanho Horizontal do cabeçalho
- ✅ **LÓGICA EXATA:** Senão: Tamanho da coluna e do cabeçalho = Tamanho horizontal dos valores da coluna
- ✅ **LÓGICA EXATA:** Medição REAL do tamanho horizontal usando elementos temporários
- ✅ **ABORDAGEM SIMPLIFICADA:** Uma única tabela com cabeçalho sticky
- ✅ **ABORDAGEM SIMPLIFICADA:** Remoção de todas as funções complexas de medição
- ✅ **ABORDAGEM SIMPLIFICADA:** Estrutura nativa do HTML table
- ✅ **ABORDAGEM SIMPLIFICADA:** CSS sticky para cabeçalho fixo

**3. Correção do Erro de Compilação:**
- ✅ Movido `visibleKeys` para antes do return
- ✅ Adicionado `useCallback` para otimizar performance
- ✅ Implementado `useEffect` com timeout para garantir DOM atualizado

#### Status: ✅ **CORRIGIDO**

---

### Histórico de Requisições:

#### Requisição Anterior: Cabeçalho Fixo na Tabela "Detalhamento do Consórcio"

**Requisição:**
- Separar o cabeçalho da tabela e mantê-lo fixo durante scroll vertical
- Cabeçalho rola junto com a tabela durante scroll horizontal
- Manter a caixa com scroll vertical e horizontal como está

**Implementação Realizada:**
- Separação da estrutura em dois containers independentes
- Sincronização horizontal entre cabeçalho e corpo
- Utilização das refs existentes para sincronização
- Altura otimizada: Cabeçalho 50px + corpo 350px = total 400px

**Status**: ✅ **IMPLEMENTADO**

#### Requisição Anterior: Subir Plataforma para Preview na Porta 8080

**Requisição:**
- Iniciar o servidor de desenvolvimento na porta 8080 para preview da plataforma
- Comando Executado: `npm run dev -- --port 8080`

**Verificações Realizadas:**
1. ✅ Porta Livre: Verificação de que a porta 8080 não estava em uso
2. ✅ Servidor Iniciado: Processo Vite iniciado com sucesso
3. ✅ Resposta HTTP: Servidor respondendo com código 200 (OK)
4. ✅ Processo Ativo: Confirmação de que o processo está rodando em background

**Status**: ✅ **PLATAFORMA RODANDO**

#### Requisição Anterior: Remoção de Percentuais Zerados no Gráfico do Funil

**Problema Identificado:**
- Percentuais zerados sem utilidade à esquerda do funil "Resultados do Funil Consultores Externos"
- Interface poluída com informações desnecessárias

**Correção Implementada:**
- Remoção do elemento de comparação que exibia "0%" quando não havia dados
- Limpeza da interface mantendo apenas informações relevantes

**Status**: ✅ **CORRIGIDO**

#### Requisição Anterior: Correção de Permissões no Módulo CRM

**Problemas Resolvidos:**
1. ✅ Associação do usuário master a empresa existente no banco
2. ✅ Sistema de cache melhorado para manter consistência
3. ✅ Permissões verificadas corretamente usando companyId da empresa

**Status**: ✅ Todas as funcionalidades implementadas e funcionando 

# Request Story

## 2025-08-08 — Módulo Configurações

- Criado novo módulo "Configurações" com layout e sidebar próprios.
- Movida a página de Configurações do Simulador para `Configurações > Simulador`.
- Movidas as Configurações do CRM (abas Funis, Origens, Times) para `Configurações > CRM`.
- Página independente mantida: `Configurações > Usuários` (lista de usuários do CRM)
- Unificada a "Master Config" (CRM + Simulador) em `Configurações > Master` (apenas para master).
- Adicionada página `Configurações > Leyout` (admin/master) com:
  - Upload de logo quadrada e vertical (armazenadas no Storage bucket `branding`).
  - Campo "Cor primária" com seletor de cor e input HEX.
  - Persistência em tabela `company_branding` no Supabase.
- Removida a página `Configurações > Empresas` do menu; gestão de empresas permanece apenas na `Configurações > Master`.
- Atualizadas rotas e sidebars de `CRM` e `Simulador` para incluir o novo módulo "Configurações" no dropdown de módulo.
- Adicionado suporte a `settings` em `ModuleContext`.
- Mantidos redirecionamentos das rotas antigas para as novas.

Impacto: branding por empresa centralizado, personalização visual (logo/cor) e governança por perfil. 

### Requisição Atual: Redesign da página de Acessos (Permissões)

#### Ações executadas:
- Modernizado layout da tabela de permissões em `CrmMasterConfig` (aba Acessos)
- Cabeçalho sticky com blur e tipografia mais forte
- Linhas listradas e bordas #333333 com `brand-radius`
- Substituídos checkboxes nativos por `Checkbox` do UI com cores dinâmicas
- Botão "Salvar Permissões" usando `variant="brandPrimaryToSecondary"` e `brand-radius`

#### Status: ✅ Concluído

--- 

### Requisição Atual: Redesign da página de Itens arquivados

#### Ações executadas:
- Filtros com `Select` estilizado e `Input` com `brand-radius`
- Tabela com cabeçalho sticky, listras, borda `#333333` e `brand-radius`
- Botões "Recuperar" (variant `brandOutlineSecondaryHover`) e "Excluir" (variant `destructive`) com `brand-radius`

#### Status: ✅ Concluído

--- 

### Requisição Atual: Rodapé do usuário nas sidebars deve abrir `Configurações > Meu Perfil`

#### Escopo
- `CRM`, `Simulador` e `Configurações`: clique no avatar, nome ou e-mail no rodapé da sidebar redireciona para `/configuracoes/perfil`.

#### Implementação
- `CrmSidebar.tsx`: novo handler `handleUserFooterClick` usando `navigate('/configuracoes/perfil')`; tornou nome/e-mail clicáveis.
- `SimulatorSidebar.tsx`: mesmo ajuste do CRM.
- Rotas já existentes em `App.tsx` para `/configuracoes/perfil` (componente `SettingsPerfil`).

#### Checklist
- [x] Aplicar mudança no `CrmSidebar.tsx`
- [x] Aplicar mudança no `SimulatorSidebar.tsx`
- [x] Build local ok
- [ ] Deploy
- [ ] Validar navegação em todos os módulos

#### Status: 🔄 Aguardando deploy/validação 