# Solicitação em andamento

**Data:** <!-- Preencher com a data/hora atual -->

**Solicitante:** Usuário

**Descrição:**
Criar uma nova aba chamada "Acessos" dentro da página de configurações do Master (CrmMasterConfig). Nessa aba, o usuário Master poderá definir, para cada função (Administrador, Líder e Usuário), quais páginas estarão visíveis/permitidas. Se uma página for desmarcada para uma função, ela não aparecerá nem no menu, nem nos botões de navegação, nem será acessível diretamente pela URL.

**Contexto:**
- O sistema já possui controle de funções (master, admin, leader, user) e permissões básicas por função.
- Não existe ainda uma tabela de permissões de páginas por função no banco.
- O objetivo é permitir que o Master personalize o acesso às páginas principais (ex: Simulador, CRM, Indicadores, etc) para cada função.

**Checklist inicial:**
- [ ] Analisar estrutura de abas em CrmMasterConfig
- [ ] Planejar tabela de permissões no Supabase
- [ ] Implementar interface de configuração na nova aba
- [ ] Adaptar menus e botões para respeitar as permissões
- [ ] Garantir que rotas protegidas respeitem as permissões
- [ ] Testar e validar com diferentes funções

**Status:** Em análise e planejamento 