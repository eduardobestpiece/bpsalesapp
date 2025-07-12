# Solicitação em andamento

## Data: 2024-07-10

### Requisição
- **Resumo:** Apagar o campo/filtro de time (Equipe) da tela de performance e refazê-lo do zero, garantindo que funcione corretamente e de forma simples.
- **Contexto:** O filtro anterior apresentava problemas de lógica e permissões, dificultando a filtragem correta dos dados por equipe.
- **Objetivo:** Permitir ao usuário selecionar uma equipe ativa da empresa para filtrar os dados de performance, sem lógica complexa de permissão. O filtro deve ser simples, funcional e intuitivo.
- **Checklist:**
  - [x] Analisar implementação atual do filtro de time
  - [x] Analisar hooks de times e usuários
  - [x] Analisar tipagens
  - [x] Remover filtro antigo de time
  - [x] Implementar novo filtro de time (apenas times ativos da empresa)
  - [ ] Testar integração do novo filtro com a tela de performance
  - [ ] Validar funcionamento correto com dados reais
  - [ ] Realizar deploy
  - [ ] Solicitar validação do usuário

### Status
- Primeira etapa concluída: filtro antigo removido e novo filtro implementado.
- Próximo passo: testar integração e funcionamento do novo filtro. 