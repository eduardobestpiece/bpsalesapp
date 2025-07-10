# Requisição Atual

**Data:** 2024-07-10
**Solicitante:** Usuário

## Descrição
1. Revisar e ajustar globalmente o dark mode, contraste e acessibilidade em todos os componentes, páginas e layouts do sistema Monteo (Simulador e CRM).
2. [NOVO] Adicionar uma nova aba "Acessos" em Configurações Master, permitindo definir quais páginas/rotas cada função (Administrador, Líder, Usuário) pode acessar/visualizar. Se desmarcar, o usuário não vê nem o botão, nem a página/rota.

## Ponto de Partida
- O projeto já possui variáveis CSS para temas e um ThemeSwitch funcional.
- Diversos componentes e páginas já utilizam classes utilitárias do Tailwind, mas há trechos com cores fixas e gradientes que precisam de revisão.
- Estrutura de Tabs já implementada em CrmMasterConfig.

## O que foi alterado
- Mapeamento completo de todos os diretórios e arquivos de UI (Simulador, CRM, Administradores, Layout, UI compartilhada, páginas).
- Planejamento para revisão e ajuste de todos os pontos críticos de contraste e tema.
- Planejamento para implementação do controle de acessos por função.

## Próximos passos do checklist
- [x] Mapear todos os arquivos e pontos de UI para revisão
- [ ] Revisar e ajustar todos os componentes de UI compartilhados (src/components/ui)
- [ ] Revisar e ajustar todos os layouts (src/components/Layout)
- [ ] Revisar e ajustar todos os componentes do Simulador
- [ ] Revisar e ajustar todos os componentes do CRM (incluindo Performance, Configuração, etc)
- [ ] Revisar e ajustar todos os componentes de Administradores
- [ ] Revisar e ajustar todas as páginas (src/pages)
- [ ] Testar o dark mode e contraste em todos os fluxos
- [ ] Adicionar aba "Acessos" em Configurações Master
- [ ] Criar UI de permissões por função/página
- [ ] Definir e criar estrutura no banco para salvar permissões
- [ ] Implementar lógica para esconder botões/menus/páginas conforme permissões
- [ ] Testar com cada função
- [ ] Atualizar documentação e histórico 