# Requisição em Andamento

## Registro e Edição de Indicadores (Lógica Automática)
- Valor das vendas: se "Manual", campo editável; se "Sistema", valor calculado automaticamente com base nas vendas do usuário naquele funil e período.
- Número de recomendações: se "Manual", campo editável; se "Sistema", valor calculado automaticamente com base nos leads do usuário naquele funil e período, cuja origem seja "Recomendação".

## Checklist
- [x] Campos e permissões já implementados nos modais
- [ ] Buscar vendas do usuário para o funil e período selecionados (modo "Sistema")
- [ ] Buscar leads de recomendação do usuário para o funil e período selecionados (modo "Sistema")
- [ ] Atualizar modal de indicador para exibir valores automáticos e bloquear edição
- [ ] Testar e validar
- [ ] Commitar e fazer deploy
- [ ] Solicitar validação do usuário

---

**Status:** Iniciando implementação da lógica automática no modal de indicador. 