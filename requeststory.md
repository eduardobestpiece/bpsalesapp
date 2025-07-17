# Requisição Atual

**Funcionalidade:** Correção dos Cálculos + Nova Estrutura Unificada do Simulador

**Resumo:**
1. **Correção dos Cálculos:** Corrigir o cálculo dos ganhos mensais para alavancagem patrimonial (exemplo Airbnb/Short Stay), garantindo que siga exatamente a ordem e as fórmulas fornecidas pelo usuário, pois o valor apresentado estava incorreto.
2. **Nova Estrutura:** Eliminar as abas do simulador e criar uma interface unificada com menu lateral, combinando todas as seções em uma única página.

## Detalhes do problema:

### Cálculos Corrigidos:
- **Ganhos Mensais:** Seguir fórmula: valor da diária, ocupação, valor mensal, taxa da administradora, custos do imóvel e custos totais
- **Fluxo de Caixa Pós 240 meses:** Usar patrimônio ao final no lugar do patrimônio na contemplação
- **Pago do Próprio Bolso e Pago pelo Inquilino:** Considerar valor total do crédito acessado e calcular percentuais corretos
- **Crédito Recomendado:** Seguir fórmula correta de embutido

### Nova Estrutura Implementada:
- **Menu Lateral:** Ícones com funcionalidades de navegação e ocultação
  - Engrenagem: Configurações (crédito acessado)
  - Casinha: Alavancagem patrimonial
  - Sifrão: Financeiro (ganho de capital)
  - Seta de gráfico: Performance (futuro)
  - Relógio: Histórico (futuro)
  - Lupinha: Detalhamento (tabela mês a mês)
- **Seções Unificadas:** Todas as informações em uma única página
- **Tabela de Detalhamento:** Com configuração de colunas e meses visíveis

## Status: ✅ CONCLUÍDO
- Todos os cálculos corrigidos conforme especificação
- Nova estrutura unificada implementada com menu lateral
- Deploy realizado com sucesso