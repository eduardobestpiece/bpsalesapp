# Requisição em andamento (10/07/2024)

## Problemas reportados
- Após login, usuário não é redirecionado para /home (fica na tela de login).
- Módulo CRM não exibe dados, erros 406 nas queries para role_page_permissions e funnel_column_settings.

## Diagnóstico
- Falta de redirecionamento automático após login.
- Erros 406 indicam problemas de RLS ou permissões no Supabase.

## Plano de ação
1. Corrigir redirecionamento pós-login.
2. Revisar e ajustar políticas RLS das tabelas role_page_permissions e funnel_column_settings.
3. Testar login e navegação no CRM.
4. Testar carregamento das abas e dados.
5. Atualizar histórico e documentação.

## Status
- Iniciando pela etapa 1: corrigir redirecionamento pós-login. 