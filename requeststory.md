# Requisição em andamento

## Data: 2024-07-10

### Regras principais
- Nada pode afetar o funcionamento do módulo CRM.
- Dados de configurações e simulador devem ser únicos por empresa (seleção no menu lateral).
- Master pode copiar dados entre empresas.
- Administrador vê/edita apenas dados da própria empresa.
- SubMaster vê todas as empresas, pode copiar dados, mas não edita/arquiva.
- Abas de Entradas e Tipos de Lances devem ser removidas.

### Estrutura do banco (Supabase)
- Todas as tabelas de configurações/simulador possuem coluna `company_id`.
- Permissões de acesso por papel já existem na tabela `crm_users` e `role_page_permissions`.

### Checklist do Plano
- [x] Verificar estrutura de tabelas no Supabase (MCP) para empresas e permissões.
- [x] Garantir que todas as queries de configurações/simulador filtram por empresa selecionada.
- [x] Implementar lógica de cópia de dados entre empresas (apenas para Master/SubMaster) para:
  - [x] Administradoras
  - [x] Produtos
  - [x] Alavancas
  - [x] Tipos de Parcelas
  - [x] Tipos de Lances
- [ ] Garantir que permissões estão corretas no frontend e backend.
- [ ] Garantir que nada afeta o CRM.
- [ ] Atualizar `requeststory.md` com o andamento.
- [ ] Executar deploy.
- [ ] Solicitar conferência.

---

**Próximos passos:**
- Revisar permissões e garantir que apenas Master/SubMaster veem e usam a cópia.
- Validar se há mais entidades que precisam da função de cópia.
- Garantir que nada afeta o CRM.
- Executar deploy e solicitar conferência. 

## [13/07/2024] Nova solicitação - Ajustes na aba Administradoras

### Regras principais
- Nada pode afetar o funcionamento do módulo CRM.
- Usuários só podem arquivar administradoras (não podem excluir).
- Administradoras arquivadas vão para a aba de itens arquivados do Master Config e podem ser recuperadas pelo master.
- Modal de criação/edição:
  - Campo “Tipo de Atualização” com opções: “Mês específico” ou “Após 12 parcelas”.
  - Se “Mês específico” for selecionado, mostrar campo “Mês de Atualização” com nomes dos meses.
  - Se “Após 12 parcelas” for selecionado, ocultar campo “Mês de Atualização”.
  - Botão do modal: “Cadastrar” (criação) e “Salvar” (edição).
  - Adicionar campo “Administradora padrão” (apenas uma por empresa).
  - Modal de edição carrega dados da administradora.

### Checklist do Plano
- [ ] Remover botão de excluir da lista de administradoras.
- [ ] Garantir que arquivamento funciona e só master pode restaurar.
- [ ] Atualizar modal de criação/edição conforme regras (tipos, meses, botão, campo padrão).
- [ ] Garantir que só uma administradora por empresa pode ser padrão.
- [ ] Atualizar `requeststory.md` com o andamento.
- [ ] Executar deploy.
- [ ] Solicitar conferência. 

## Solicitação 2024-07-10

### Problema
- Ao clicar em "Adicionar administradora", o modal abre em modo de edição.
- Ao salvar no modal de edição, o modal não fecha automaticamente.

### Diagnóstico
- Não existe botão de "Adicionar administradora" na tela.
- O modal só é aberto via edição, nunca em modo de adição.
- O fechamento do modal depende do prop `onSuccess`, que não está sendo passado.

### Plano
- Adicionar botão "Adicionar administradora".
- Corrigir chamada do modal para abrir limpo (adição).
- Passar corretamente o prop `onSuccess` para fechar o modal ao salvar.

### Checklist
- [ ] Adicionar botão "Adicionar administradora" na aba de administradoras.
- [ ] Corrigir chamada do modal para abrir em modo de adição (`selectedAdministrator = null`).
- [ ] Passar corretamente o prop `onSuccess` para o modal.
- [ ] Testar: ao clicar em "Adicionar administradora", abrir modal limpo.
- [ ] Testar: ao salvar, fechar modal e atualizar lista. 