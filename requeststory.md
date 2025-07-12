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
- [x] Remover aba “Performance geral” da página de Indicadores
- [x] Ajustar gráfico do funil (alinhamento do comparativo, header, exibição de 0% se não houver período anterior, comparação correta de períodos, filtro funcional, agregação por perfil)
- [x] Corrigir aviso de “(já preenchido)” no modal de registro de indicador
- [x] Adicionar botão de salvar no modal de edição de indicador
- [x] Campo de seleção de empresa no registro/edição de usuário só para Master
- [x] Permitir atribuição de funil a usuários por administradores/líderes
- [x] Corrigir filtro de funis por empresa selecionada (inclusive para Master)
- [x] Testar localmente
- [x] Atualizar `requeststory.md`
- [x] Deploy automático
- [x] Solicitar validação

---

### Detalhamento das Alterações
- Gráfico do funil ajustado: comparativo agora alinhado à faixa, bloco “COMPARATIVO” após header, exibe 0% se não houver período anterior, comparação sempre com período imediatamente anterior, filtro funcional, agregação por perfil (admin, líder, usuário).
- Seleção automática da aba Funil ao entrar na página de Indicadores.
- Modal de edição de indicadores corrigido: erro ao salvar resolvido, período exibido exatamente como registrado.
- Modal de registro/edição de usuários: administradores e líderes podem selecionar funis para o usuário, campo de empresa só para Master.
- Checklist concluído e pronto para deploy. 