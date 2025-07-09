# Histórico de Requisições

## 2024-07-08 - Lógica completa da aba Itens arquivados

**Implementação:**
- Agora a aba "Itens arquivados" busca e exibe todos os indicadores, leads e vendas arquivados (campo archived_at preenchido).
- Filtro por Tipo (Indicador, Lead, Venda) e Data de arquivamento.
- Botão "Recuperar": remove o arquivamento (zera o campo archived_at).
- Botão "Excluir": remove o item do banco de dados.

**Próximos passos:**
- Validar o funcionamento com o usuário. 