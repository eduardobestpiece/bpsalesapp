# Requisição Atual

**Data:** [Preencher com data/hora atual]
**Solicitante:** Usuário

## Descrição
Corrigir o campo "Etapa ligada às Recomendações" no modal de edição de funil (`FunnelModal`) para que sempre mostre a última etapa cadastrada, mesmo que o usuário ainda não tenha salvo o funil. Atualmente, o campo permite selecionar qualquer etapa, mas a regra de negócio é que recomendações estejam sempre ligadas à última etapa do funil.

## Checklist
- [ ] Analisar o componente FunnelModal e a lógica de etapas
- [ ] Ajustar o campo para exibir apenas a última etapa cadastrada
- [ ] Garantir que o valor seja atualizado ao adicionar/remover etapas
- [ ] Testar o comportamento no frontend
- [ ] Realizar deploy

## Status
Em andamento 