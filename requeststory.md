# Request Story - Projeto Monteo

## Última Atualização: 2025-01-27

### Requisição Atual: Correção da Fórmula do Saldo Devedor Pós Contemplação

#### Problema Identificado:
- **Saldo Devedor no Mês 31:** Estava sendo calculado incorretamente, usando o valor do lucro em vez do saldo devedor
- **Fórmula Incorreta:** A fórmula não estava aplicando corretamente a redução do embutido
- **Fórmula Correta:** Saldo devedor pós contemplação = Saldo devedor na contemplação - (Crédito acessado na contemplação * Embutido da administradora selecionada)

#### Correção Implementada:
1. **Fórmula Corrigida:** Implementada a fórmula correta do saldo devedor pós contemplação
2. **Redução do Embutido:** Aplicada corretamente a redução baseada no crédito acessado da contemplação
3. **Debug Aprimorado:** Adicionados logs detalhados para verificar cada etapa do cálculo

#### Código Corrigido:
```typescript
// ANTES (incorreto):
saldoDevedorAcumulado = saldoContemplacao - parcelaContemplacao;

// DEPOIS (corrigido):
let saldoDevedorPosContemplacao = saldoContemplacao - parcelaContemplacao;

if (embutido === 'com') {
  const embutidoPercentual = administrator.maxEmbeddedPercentage ?? 25;
  const creditoAcessadoContemplacao = calculateCreditoAcessado(contemplationMonth, baseCredit);
  const reducaoEmbutido = creditoAcessadoContemplacao * (embutidoPercentual / 100);
  saldoDevedorPosContemplacao = saldoDevedorPosContemplacao - reducaoEmbutido;
}

saldoDevedorAcumulado = saldoDevedorPosContemplacao;
```

#### Status: ✅ **CORRIGIDO**
- Fórmula do saldo devedor pós contemplação implementada corretamente
- Redução do embutido aplicada conforme especificação
- Debug logs detalhados para verificação

---

### Histórico de Requisições:

#### Requisição Anterior: Correção do Saldo Devedor no Mês 31

**Problemas Resolvidos:**
1. ✅ Reordenação da lógica de cálculo
2. ✅ Correção do acesso aos dados do array
3. ✅ Correção do valor da parcela para o mês 31

**Status**: ✅ Todas as funcionalidades implementadas e funcionando 