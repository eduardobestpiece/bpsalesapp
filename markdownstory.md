# Histórico de Atividades - 11/07/2024

## Entregas e Correções deste ciclo

### 1. Permissões (role_page_permissions)
- SQL executado para garantir que master/admin tenham acesso total a todas as páginas e empresas.
- Corrigido erro 406 e bloqueios indevidos.

### 2. Editor de Indicador
- Corrigido reconhecimento do período ao editar (period_start/period_end).
- Campo "Preenchido com atraso?" agora aparece e é editável para master/admin, refletindo corretamente o status.

### 3. Simulador
- Todos os dados do Simulador (administradoras, produtos, tipos de lance, tipos de parcela, alavancagens) agora são filtrados pela empresa selecionada no contexto global.
- Seleção de empresa persiste entre páginas e recarregamentos.
- Removida opção "Todas as empresas".

### 4. Estabilidade e Navegação
- Providers globais garantidos fora do roteador, evitando loops e recarregamentos.
- Listener de autenticação revisado para evitar múltiplos fetchs e loops.
- Navegação entre abas e páginas estável, sem recarregamentos desnecessários.

### 5. Deploy
- Todas as correções foram enviadas para o GitHub.
- Build automático na Vercel iniciado.

---

**Checklist deste ciclo:**
- [x] Corrigir permissões no banco
- [x] Corrigir editor de indicador (período e atraso)
- [x] Filtro de empresa no Simulador
- [x] Persistência e estabilidade
- [x] Deploy

---

**Próximos passos:**
- Aguardar build e testar todas as áreas.
- Se tudo estiver funcionando, marcar como concluído.
- Se houver ajustes, iniciar novo ciclo. 

## [11/07/2024] Ajuste de redirecionamento após logout

- Revisado e padronizado o fluxo de logout em todos os menus (CRM, Simulador, Sidebar) para garantir que o usuário seja sempre redirecionado para a página de login ("/crm/login") ao sair.
- Comentários adicionados no código para facilitar futuras manutenções.
- O redirecionamento após login permanece para "/home".
- Solicitação registrada em `requeststory.md`.

--- 

## [11/07/2024] Ajustes CRM: Usuários, Empresas e Indicadores

- Adicionado campo de seleção de empresa no cadastro/edição de usuário (Configurações CRM).
- Filtro de funis agora depende da empresa selecionada.
- Campo "preenchido com atraso" (is_delayed) agora pode ser editado por administradores e master no registro de indicadores.
- Regras de visualização dos indicadores ajustadas:
  - Master: vê todos os indicadores de todas as empresas.
  - Administrador: vê todos os indicadores da própria empresa.
  - Líder: vê todos os indicadores da equipe da empresa.
  - Usuário: vê apenas seus próprios indicadores.
- Tipagem ajustada para refletir os campos extras do banco.
- Solicitação registrada em `requeststory.md`.

--- 

## [11/07/2024] Filtro Global de Empresa e Papel SubMaster

- Implementado contexto global de empresa e seletor para Master.
- Todos os dados do CRM e Simulador agora são filtrados pela empresa selecionada.
- Criado o papel SubMaster (visualização total, sem permissão de edição/criação/exclusão).
- Ajustados todos os módulos (Usuários, Leads, Vendas, Indicadores, Produtos, Administradores, Tipos de Entrada, Lances, Alavancagens, etc) para bloquear qualquer ação para SubMaster.
- Telas, botões e formulários de ação agora respeitam o bloqueio para SubMaster.
- Solicitação registrada e checklist atualizado em `requeststory.md`.

--- 