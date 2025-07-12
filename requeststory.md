# Requisição em andamento - 11/07/2024 (Bloco 1 - Ajustes Avançados)

## Ajustes Solicitados

### Indicadores/Performance
- Remover aba “Performance geral” da página de Indicadores > Performance.
- Gráfico do funil: percentuais de conversão da primeira até a penúltima faixa; comparativo do período anterior à esquerda de cada faixa (verde se melhorou, vermelho se piorou); header com “Média semanal” à esquerda e período à direita; exibição automática do funil ao entrar na página (primeiro funil disponível).

### Modal de Registro/Edição de Indicadores
- Garantir aviso “(já preenchido)” em cinza nos períodos já preenchidos no campo “Período”.
- Adicionar botão de salvar no modal de edição de indicador.

### Usuários
- Apenas Master pode selecionar empresa ao registrar/editar usuário.
- Administradores e líderes podem atribuir funis a usuários da própria empresa.

### Configurações do CRM
- Corrigir filtro de funis por empresa selecionada (inclusive para Master/Admin).

---

## Checklist
- [x] Análise do histórico, contexto e estrutura do projeto
- [x] Localização dos pontos de ajuste nas páginas e componentes
- [ ] Remover aba “Performance geral” da página de Indicadores
- [ ] Ajustar gráfico do funil (percentuais, comparativo, header, exibição automática)
- [ ] Corrigir aviso de “(já preenchido)” no modal de registro de indicador
- [ ] Adicionar botão de salvar no modal de edição de indicador
- [ ] Campo de seleção de empresa no registro/edição de usuário só para Master
- [ ] Permitir atribuição de funil a usuários por administradores/líderes
- [ ] Corrigir filtro de funis por empresa selecionada (inclusive para Master)
- [ ] Testar localmente
- [ ] Atualizar `requeststory.md`
- [ ] Deploy automático
- [ ] Solicitar validação

---

### Plano de Ação
1. Remover a aba “Performance geral” da página de Indicadores (src/pages/crm/CrmPerformance.tsx e src/pages/crm/CrmIndicadores.tsx)
2. Ajustar o gráfico do funil conforme solicitado (src/components/CRM/Performance/FunnelChart.tsx)
3. Corrigir aviso e botão no modal de indicadores (src/components/CRM/IndicatorModal.tsx)
4. Ajustar permissões e filtros de empresa/funil para usuários (src/pages/crm/Configuration e src/components/CRM/Configuration/UsersList.tsx)
5. Testar localmente e atualizar históricos
6. Realizar deploy automático
7. Solicitar validação ao usuário 