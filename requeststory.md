# Requisição Atual

**Data:** 08/07/2024

## Descrição
Correção de crash e exibição de indicadores:
- Proteção contra null/undefined em todos os usos de `.includes` em arrays (ex: periodosUsuario, periodosRegistrados, roles).
- Garantido que periodosUsuario e periodosRegistrados nunca sejam null/undefined, sempre arrays.
- Protegido uso de `.includes` em `period_date` na filtragem de indicadores (CrmIndicadores.tsx).
- Exibição do período corrigida: agora mostra 'De DD/MM/YYYY até DD/MM/YYYY' usando period_start e period_end.
- Lógica de liberação de períodos corrigida: agora compara início do próximo período com period_end do último registro do usuário.
- Ajuste do input de valor de vendas para aceitar formato brasileiro (type="text"), convertendo apenas ao salvar.
- Deploy automático realizado.

## Status
- [x] Análise do erro
- [x] Correção aplicada no código
- [x] Deploy automático (commit/push)
- [ ] Validação do usuário

## Observações
Aguardando validação final do usuário para marcar como concluído. 