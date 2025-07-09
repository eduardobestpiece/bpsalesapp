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

## 2024-07-08 - Ações de arquivar e excluir para Master na lista de indicadores

**Implementação:**
- Agora, na lista "Meus Indicadores", o usuário Master vê os botões de Arquivar e Excluir na coluna Ações.
- Arquivar: atualiza o campo archived_at do indicador com a data/hora atual (item some da lista principal e vai para os arquivados).
- Excluir: remove o indicador do banco de dados (ação irreversível).

**Próximos passos:**
- Exibir aba "Itens arquivados" para Master.
- Implementar página de arquivados com filtro, lista, excluir e recuperar. 