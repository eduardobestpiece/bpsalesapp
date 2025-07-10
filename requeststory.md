# Requisição em andamento (10/07/2024)

## Problemas reportados
- Após login, navegação funciona, mas ao atualizar a página (F5) fica carregando para sempre.
- As páginas do módulo CRM aparecem em branco, sem conteúdo (conforme print).

## Diagnóstico
- Os componentes principais do CRM dependem do array allowedTabs e de dados carregados via hooks.
- Se allowedTabs.length === 0, nada é renderizado (nem mensagem de erro, nem “sem permissão”, nem “sem dados”).
- Se algum hook não retorna dados (por erro, delay ou permissão), a tela pode ficar em branco.
- Não há fallback visual nem tratamento de erro/loading explícito.

## Plano de ação
1. Adicionar fallback visual para ausência de abas permitidas em todos os componentes principais do CRM.
2. Adicionar tratamento de erro e loading explícito.
3. Garantir que, mesmo sem dados, a página nunca fique em branco ou carregando para sempre.

## Status
- Iniciando pela etapa 1: ajuste no CrmIndicadores e replicar padrão para os demais. 