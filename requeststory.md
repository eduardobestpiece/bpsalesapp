# Requisição Atual

**Funcionalidade:** Correção dos Cálculos de Ganhos Mensais da Alavancagem Patrimonial

**Resumo:**
Corrigir o cálculo dos ganhos mensais para alavancagem patrimonial (exemplo Airbnb/Short Stay), garantindo que siga exatamente a ordem e as fórmulas fornecidas pelo usuário, pois o valor apresentado atualmente está incorreto. O cálculo correto deve considerar: valor da diária, ocupação, valor mensal, taxa da administradora, custos do imóvel e custos totais, conforme detalhado.

## Detalhes do problema:
- O cálculo atual dos ganhos mensais está retornando um valor muito acima do esperado.
- O valor correto, segundo o exemplo fornecido, deveria ser R$ 14.472,91, mas o sistema retorna R$ 43.419.
- Fórmulas e variáveis detalhadas pelo usuário devem ser seguidas à risca.

## Parâmetros do exemplo:
- Modalidade: Aporte
- Valor do aporte: 5000
- Número de parcelas: 240
- Tipo de Parcela: Reduzida
- Nome da Alavanca: Airbnb
- Tipo de Alavanca: Alavanca Imobiliária
- Subtipo: Short Stay
- Imóvel tem valor fixo: FALSO
- Percentual da Diária: 0,06%
- Percentual da Administradora: 15%
- Taxa de Ocupação: 70%
- Valor das Despesas Totais: 0,35%
- Valor do imóvel: 500000
- Administradora: Magalu
- Tipo de Atualização: Mês específico (Setembro)
- Carência: 60 dias
- Máximo embutido: 25%
- Redução de parcela: Reduzida (50%)
- Taxa de administração: 27%
- Fundo de reserva: 1%
- Seguro: 1% (opcional)
- Exemplo de contemplação: a cada 60 meses, alavancagem simples, com embutido

## Ordem correta do cálculo dos ganhos mensais:
1. Valor da diária: patrimônio na contemplação * 0,06%
2. Ocupação: 30 * 70%
3. Valor mensal: dias ocupados * valor da diária
4. Taxa do Airbnb: valor mensal * 15%
5. Custos do imóvel: patrimônio na contemplação * 0,35%
6. Custos totais: taxa do Airbnb + custos do imóvel
7. Ganhos mensais: valor mensal - custos totais

## Status:
Aguardando correção e validação.