# Requisição Atual

**Data:** 08/07/2024

## Descrição
Correção de crash e exibição de indicadores:
- Proteção contra null/undefined em todos os usos de `.includes` em arrays (ex: periodosUsuario, periodosRegistrados, roles).
- Garantido que periodosUsuario e periodosRegistrados nunca sejam null/undefined, sempre arrays.
- Protegido uso de `.includes` em `period_date` na filtragem de indicadores (CrmIndicadores.tsx).
- Exibição do período corrigida: agora mostra 'De DD/MM/YYYY até DD/MM/YYYY' usando period_start e period_end.
- Ajuste do input de valor de vendas para aceitar formato brasileiro (type="text"), convertendo apenas ao salvar.
- Deploy automático realizado.

## Status
- [x] Análise do erro
- [x] Correção aplicada no código
- [x] Deploy automático (commit/push)
- [ ] Validação do usuário

## Observações
Próxima etapa: corrigir lógica de liberação de períodos (usar period_end do último registro). 