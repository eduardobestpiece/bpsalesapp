## Requisição em andamento - 08/07/2024

### Problema
No campo "Período" dos modais "Registrar Indicado", "Editar Indicador" e "Alterar Período", atualmente o último dia considerado é ontem. O usuário deseja que o período inclua o dia de hoje também.

### Plano de Ação
1. Localizar todos os componentes/modais que usam o campo "Período".
2. Identificar a lógica que define o último dia do período.
3. Alterar para considerar o dia de hoje como último dia.
4. Testar todos os modais citados.
5. Executar o deploy.
6. Solicitar validação do usuário.

### Checklist
- [x] Registrar requisição em `requeststory.md`
- [ ] Localizar todos os usos do campo "Período"
- [ ] Alterar lógica para incluir o dia de hoje
- [ ] Testar nos três modais
- [ ] Executar deploy
- [ ] Solicitar validação 