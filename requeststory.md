# Histórico de Requisições

## 2024-07-08 - Erro ao registrar indicador em outro funil (localeCompare)

**Problema:**
- Ao tentar registrar um indicador em um segundo funil, a tela ficou branca e o console mostrou erro: `Cannot read properties of null (reading 'localeCompare')`.
- O erro ocorre ao ordenar registros de indicadores por campos de data (period_end), quando algum registro tem valor nulo.

**Análise:**
- O código fazia ordenação usando `.sort((a, b) => new Date(b.period_end).getTime() - new Date(a.period_end).getTime())` sem proteger contra valores nulos.
- Se algum registro tem `period_end` nulo, `new Date(null)` resulta em data inválida, causando problemas em ordenações e, em outros pontos, o uso de `localeCompare` em strings nulas.

**Plano:**
1. Identificar todos os pontos de ordenação por `period_end` ou uso de `localeCompare`.
2. Proteger todas as ordenações para garantir que ambos os valores comparados são strings válidas (fallback para string vazia ou 0).
3. Testar o fluxo de registro em múltiplos funis.
4. Deploy automático.
5. Solicitar validação do usuário.

**Correção aplicada:**
- Todas as ordenações por `period_end` agora usam fallback para 0 caso o campo seja nulo:
  ```js
  .sort((a, b) => {
    const aDate = a.period_end ? new Date(a.period_end).getTime() : 0;
    const bDate = b.period_end ? new Date(b.period_end).getTime() : 0;
    return bDate - aDate;
  })
  ```
- Isso garante que registros com datas nulas não causam crash.

**Próximos passos:**
- Testar o registro de indicadores em diferentes funis e usuários.
- Validar se o erro foi resolvido. 