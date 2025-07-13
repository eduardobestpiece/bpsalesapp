# Requisição Atual

**Funcionalidade:** Redução de Parcela

**Resumo:**
Implementar uma nova aba "Redução de Parcela" na página de Configurações, com estrutura idêntica à de Administradoras, incluindo filtros, listagem, modais de criação/edição, arquivamento/restauração, cópia entre empresas e integração com Supabase. Garantir que nada afete o CRM.

**Checklist:**
- [ ] Criar componentes: `InstallmentReductionsList.tsx`, `InstallmentReductionModal.tsx`
- [ ] Adicionar nova aba "Redução de Parcela" em `Configuracoes.tsx`
- [ ] Implementar filtros: administradora e nome
- [ ] Listar colunas: Nome, Administradora, Percentual reduzido, Número de aplicações, Ações (Editar, Arquivar, Copiar)
- [ ] Modal de criação/edição: campos Nome, Administradora (dropdown + opção de adicionar), Percentual reduzido, Aplicação (multiselect: “Parcela”, “Taxa de administração”, “Fundo de reserva”, “Seguro”)
- [ ] Implementar ações: editar, arquivar/restaurar, copiar (não duplicar para mesma administradora)
- [ ] Garantir integração correta com Supabase (tabela `installment_reductions`)
- [ ] Garantir que nada afete o CRM
- [ ] Testar e validar com usuário

**Planejamento:**
1. Analisar estrutura dos componentes de Administradoras, Produtos e Tipos de Parcela para padronização.
2. Criar tipos e hooks necessários para Redução de Parcela.
3. Implementar componente de listagem com filtros e ações.
4. Implementar modal de criação/edição com validação e multiselect.
5. Integrar com Supabase para CRUD e cópia entre empresas.
6. Adicionar nova aba na página de Configurações.
7. Testar fluxo completo e garantir isolamento do CRM.
8. Documentar no `markdownstory.md` após validação.

**Status:**
Iniciando etapa 1: análise e estruturação dos componentes base. 