# Histórico de Atividades

## [Em andamento em 10/07/2024]

### Revisão global de dark mode, contraste e acessibilidade
- Iniciado mapeamento e revisão de todos os componentes, páginas e layouts do sistema Monteo (Simulador e CRM) para garantir:
  - Respeito às variáveis de cor do tema (light/dark) do Tailwind/CSS global
  - Contraste suficiente para acessibilidade (WCAG AA/AAA)
  - ThemeSwitch funcional em todos os contextos
  - Eliminação de cores fixas e gradientes não temáticos
- Checklist criado e registrado em `requeststory.md`
- Próximos passos: revisão e ajuste de todos os componentes de UI compartilhados

### [NOVO] Controle de acessos por função
- Solicitado pelo usuário: criar uma nova aba "Acessos" em Configurações Master
- Permitir definir, para cada função (Administrador, Líder, Usuário), quais páginas/rotas podem ser acessadas/visualizadas
- Se desmarcar, o usuário não vê nem o botão, nem a página/rota
- Checklist atualizado em `requeststory.md`

---

*Itens anteriores marcados como concluídos. Caso precise de novos ajustes, abrir nova solicitação ou detalhar os pontos pendentes.* 

## [2024-07-10] Nova solicitação: Aba "Acessos" em Configurações Master

- Usuário solicitou a criação de uma nova aba chamada "Acessos" na página de configurações Master.
- Objetivo: permitir ao Master definir, para cada função (Administrador, Líder, Usuário), quais páginas estarão visíveis/permitidas.
- Se uma página for desmarcada para uma função, ela não aparecerá nem no menu, nem nos botões de navegação, nem será acessível diretamente pela URL.
- Não existe ainda uma tabela de permissões de páginas por função no banco.
- Status: Início do planejamento e análise. 

## [2024-07-10] Entrega: Integração real de permissões de acesso

- Permissões de páginas/abas agora são salvas e carregadas do Supabase.
- Menus e botões (Simulador, Comercial, Indicadores, etc.) só aparecem se o usuário tiver permissão.
- Proteção de rotas: usuário sem permissão é redirecionado para a Home.
- Aba "Acessos" permite edição e salvamento real das permissões.
- Deploy realizado.
- Aguardando validação do usuário. 

## [2024-07-10] Sincronização com GitHub

- Realizado `git pull` para trazer todas as alterações do repositório remoto para o ambiente local.
- Novos arquivos, componentes e ajustes do time foram incorporados ao projeto local.
- Recomenda-se revisar e testar as novidades trazidas do repositório. 

## [2024-07-10] Entrega: Novo layout dos menus CRM e Simulador

- Menus laterais CRM e Simulador atualizados com a logo Monteo (imagem + texto) no topo.
- Seletor de módulo (Indicadores/Simulador) no menu CRM, conforme permissão.
- Itens exibidos na ordem solicitada e conforme permissões do usuário.
- Avatar, nome, e-mail e botão de sair na mesma linha no rodapé, clicando no avatar abre o perfil.
- Favicon atualizado para a logo Monteo.
- Deploy realizado.
- Aguardando validação do usuário. 