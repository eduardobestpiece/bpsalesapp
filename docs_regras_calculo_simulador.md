# Regras de Cálculo – Simulador Monteo

## Crédito Acessado

O cálculo do Crédito Acessado depende do tipo de busca do usuário:

### 1. Busca por Aporte (searchType = 'contribution')
- O usuário informa o valor do aporte desejado.
- O sistema encontra o produto e prazo compatíveis e calcula o crédito acessado usando a seguinte lógica:
  - Para parcela cheia:
    - Fator = 100.000 / valor da parcela cheia para 100.000
    - Crédito acessado = (valor do aporte * fator), arredondado para múltiplos de 10.000
  - Para parcela especial (reduzida):
    - Fator = 100.000 / valor da parcela especial para 100.000
    - Crédito acessado = (valor do aporte * fator), arredondado para múltiplos de 10.000

### 2. Busca por Crédito (searchType = 'credit')
- O usuário informa o valor de crédito desejado.
- O sistema arredonda o valor para múltiplos de 10.000.

---

## Valor da Parcela

O valor da parcela é calculado a partir do crédito acessado, do produto selecionado e do tipo de parcela (cheia ou especial):

- **Parcela Cheia:**
  - Utiliza a função `calcularParcelasProduto`:
    - `full = (crédito + taxas) / número de parcelas`
    - Taxas: administração, fundo de reserva, seguro (se aplicável)
- **Parcela Especial (Reduzida):**
  - Utiliza a função `regraParcelaEspecial`:
    - Aplica reduções conforme regras do produto e tipo de redução selecionada.
    - Reduções podem ser aplicadas sobre o principal, taxa de administração, fundo de reserva e seguro, conforme configuração.

---

## Fórmulas Utilizadas

### Função `calcularParcelasProduto`
```ts
function calcularParcelasProduto({ credit, installment, reduction }) {
  // ...
  const valorCheia = (credit + ((credit * taxaAdm / 100) + (credit * fundoReserva / 100) + (credit * seguro / 100))) / nParcelas;
  // ...
  return { full: valorCheia, special: valorEspecial };
}
```

### Função `regraParcelaEspecial`
```ts
function regraParcelaEspecial({ credit, installment, reduction }) {
  // ...
  // Aplica reduções conforme configuração
  // ...
  const valorEspecial = (principal + taxa + fundo + seguroValor) / nParcelas;
  return valorEspecial;
}
```

---

## Observações
- Todos os valores são arredondados para múltiplos de 10.000.
- O cálculo considera taxas e reduções conforme o produto e o tipo de parcela.
- O valor da parcela pode variar conforme o tipo de seguro (opcional ou não).

---

## Exemplo Prático
- Usuário informa aporte de R$ 5.000, prazo de 240 meses, tipo de parcela reduzida.
- Sistema calcula fator de conversão e determina o crédito acessado.
- Valor da parcela é calculado conforme as regras acima.

---

**Essas regras são utilizadas em todos os lugares do sistema onde aparecem os campos 'Crédito Acessado' e 'Valor da Parcela'.** 