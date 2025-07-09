# Histórico de Requisições

## 2024-07-08 - Ajuste para periodicidade diária no registro de indicadores

**Problema:**
- Para funis com periodicidade diária, o campo Período é uma data única, não um intervalo.
- O sistema estava tentando extrair início e fim de um valor único, podendo gerar campos vazios ou errados.

**Solução aplicada:**
- Ajustada a função extractPeriodDates para, ao detectar um valor no formato 'YYYY-MM-DD' (diário), definir period_start e period_end como a mesma data.
- Todas as regras de mês/ano continuam automáticas, baseando-se nessa data única.

**Próximos passos:**
- Testar o registro de indicadores diários.
- Validar se o fluxo está correto para todos os tipos de periodicidade. 