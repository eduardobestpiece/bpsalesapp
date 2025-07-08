# Requisição em andamento

## Objetivo
Implementar a lógica para gerar as opções de período no modal de indicador, conforme a configuração do funil selecionado (semanal, diário ou mensal), destacando períodos faltantes em vermelho (a partir do segundo registro).

## Contexto
- O campo "Período" do modal deve exibir opções dinâmicas baseadas em:
  - verification_type ("daily", "weekly", "monthly")
  - verification_day (ex: dia da semana de início)
  - mês e ano selecionados
- Períodos já registrados devem ser destacados (ou bloqueados) para evitar duplicidade.
- Períodos faltantes devem ser destacados em vermelho, mas só do segundo registro em diante.
- Ordem dos campos já está correta no modal.

## Checklist
- [x] Analisar estrutura de dados do funil e indicadores
- [x] Verificar como buscar indicadores já registrados
- [x] Planejar funções utilitárias para gerar períodos dinâmicos
- [ ] Implementar geração dinâmica de períodos no modal
- [ ] Destacar períodos faltantes conforme regra
- [ ] Testar e ajustar interface
- [ ] Realizar deploy

**Ponto de partida:**
- O modal já exibe os campos corretamente, mas as opções de período ainda são estáticas.
- Estrutura de dados e hooks já analisados.

**Próximo passo:**
Implementar a função utilitária para gerar períodos dinâmicos (diário, semanal, mensal) e integrar ao modal. 