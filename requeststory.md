# Requisição Atual

**Data:** [Preencher com data/hora atual]
**Solicitante:** Usuário

## Descrição
Debug do campo "Etapa ligada às Recomendações" no funil:
- Confirmado que a coluna recommendation_stage_id já existe na tabela funnels do Supabase.
- Próximo passo: debugar o frontend para garantir que o valor está sendo enviado corretamente ao Supabase e não está sendo sobrescrito antes do envio.

## Checklist
- [x] Verificar estrutura do banco e existência da coluna
- [ ] Analisar montagem do objeto funnelData no frontend
- [ ] Garantir que o valor correto está sendo enviado no update/insert
- [ ] Testar fluxo completo de criação e edição
- [ ] Realizar deploy

## Status
Em andamento 