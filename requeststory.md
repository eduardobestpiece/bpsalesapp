# Requisição: Reestruturação da listagem e modal de indicadores

## Contexto
O usuário solicitou melhorias na tela de indicadores e no modal de registro, para melhor usabilidade e controle dos períodos e etapas.

## Itens solicitados
- Agrupar indicadores por funil na listagem.
- Cabeçalho dinâmico: "Período", "Mês", "Ano" e nome de cada etapa do funil.
- Cada linha: valores alinhados ao cabeçalho, botão de editar e arquivar.
- No modal, trocar "Data do Período" para "Período".
- Períodos baseados na configuração do funil (ex: semanal, iniciando na sexta), exibindo opções como "Do dia 04/07/2025 ao dia 10/07/2025".
- Períodos faltantes (sem registro) aparecem em vermelho, mas só do segundo registro em diante.
- O cálculo dos períodos começa a partir do primeiro registro daquele funil.
- Ordem dos campos no modal: "Mês", "Ano", "Funil", "Período", "Resultados por Etapa".
- "Mês" e "Ano" sugerem o mês/ano atual, com meses exibidos com a primeira letra maiúscula.

## Checklist
- [ ] Refatorar listagem de indicadores para agrupar por funil e exibir cabeçalho dinâmico.
- [ ] Refatorar linhas para alinhar valores conforme cabeçalho, com botões de editar/arquivar.
- [ ] Refatorar modal: trocar campo para "Período" e gerar opções dinâmicas conforme funil.
- [ ] Implementar lógica de períodos faltantes (vermelho) a partir do segundo registro.
- [ ] Ajustar ordem dos campos no modal.
- [ ] Garantir mês/ano atual como padrão, com meses formatados corretamente.
- [ ] Testar e validar. 