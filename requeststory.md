# Requisição em Andamento

## Ajuste nos Registros e Edições de Indicadores
- Campo "Valor das Vendas" deve ser monetário, aceitando vírgula para centavos.
- Ao registrar, os campos "Valor de Vendas" e "Recomendações" devem ser salvos corretamente.
- Na edição, campo "Valor das Vendas" também deve ser monetário.
- Campo "Período" deve ser oculto no modal de edição (não editável, não obrigatório).

## Checklist
- [x] Migration SQL aplicada com sucesso
- [ ] Máscara monetária no campo de valor das vendas (registro e edição)
- [ ] Persistir corretamente os campos sales_value e recommendations_count ao criar indicador
- [ ] Persistir corretamente os campos sales_value e recommendations_count ao editar indicador
- [ ] Ocultar campo "Período" no modal de edição de indicador 