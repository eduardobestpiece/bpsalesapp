# Requisição Atual

**Data:** 08/07/2024

## Descrição
Correção de crash ao registrar/acessar indicadores:
- Proteção contra null/undefined em todos os usos de `.includes` em arrays (ex: periodosUsuario, periodosRegistrados, roles).
- Garantido que periodosUsuario e periodosRegistrados nunca sejam null/undefined, sempre arrays.
- Protegido uso de `.includes` em `period_date` na filtragem de indicadores (CrmIndicadores.tsx).
- Ajuste do input de valor de vendas para aceitar formato brasileiro (type="text"), convertendo apenas ao salvar.
- Deploy automático realizado.

## Status
- [x] Análise do erro
- [x] Correção aplicada no código
- [x] Deploy automático (commit/push)
- [ ] Validação do usuário

## Observações
Aguardando validação do usuário para marcar como concluído. 