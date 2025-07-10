# Requisição Atual

**Data:** 2024-07-10
**Solicitante:** Usuário

## Descrição
Revisar e ajustar globalmente o dark mode, contraste e acessibilidade em todos os componentes, páginas e layouts do sistema Monteo (Simulador e CRM), garantindo que:
- Todos os elementos respeitem as variáveis de cor do tema (light/dark) definidas no Tailwind e no CSS global.
- O contraste seja suficiente para acessibilidade (WCAG AA/AAA sempre que possível).
- O botão de alternância de tema (ThemeSwitch) funcione em todos os contextos e layouts.
- Não haja trechos de UI "quebrados" ou com cores fixas que prejudiquem a experiência no dark mode.

## Ponto de Partida
- O projeto já possui variáveis CSS para temas e um ThemeSwitch funcional.
- Diversos componentes e páginas já utilizam classes utilitárias do Tailwind, mas há trechos com cores fixas e gradientes que precisam de revisão.

## O que foi alterado
- Mapeamento completo de todos os diretórios e arquivos de UI (Simulador, CRM, Administradores, Layout, UI compartilhada, páginas).
- Planejamento para revisão e ajuste de todos os pontos críticos de contraste e tema.

## Próximos passos do checklist
- [x] Mapear todos os arquivos e pontos de UI para revisão
- [ ] Revisar e ajustar todos os componentes de UI compartilhados (src/components/ui)
- [ ] Revisar e ajustar todos os layouts (src/components/Layout)
- [ ] Revisar e ajustar todos os componentes do Simulador
- [ ] Revisar e ajustar todos os componentes do CRM (incluindo Performance, Configuração, etc)
- [ ] Revisar e ajustar todos os componentes de Administradores
- [ ] Revisar e ajustar todas as páginas (src/pages)
- [ ] Testar o dark mode e contraste em todos os fluxos
- [ ] Atualizar documentação e histórico 