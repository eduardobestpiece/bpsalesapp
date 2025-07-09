# Requisição em Andamento

## Indicadores: Período com Data Início e Fim + Preenchimento Automático de Mês/Ano
- Ao registrar indicador, o campo "Período" será dividido em "Data Início" (period_start) e "Data Fim" (period_end).
- O campo mês será preenchido automaticamente se todo o período estiver em um mês; caso contrário, mostrará opções dos meses envolvidos.
- O campo ano será preenchido automaticamente se todo o período estiver em um ano; caso contrário, mostrará opções dos anos envolvidos.
- O campo valor de vendas volta a ser numérico (aceita vírgula).

## Checklist
- [x] Migration SQL aplicada: adicionados period_start e period_end
- [ ] Atualizar modal de indicador para usar period_start/period_end
- [ ] Lógica automática de mês/ano conforme regras
- [ ] Campo valor de vendas numérico (aceita vírgula)
- [ ] Testar registro e edição
- [ ] Commitar e fazer deploy
- [ ] Solicitar validação do usuário 