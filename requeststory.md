# Requisição em Andamento

## Bloco 1.2: Performance - Correção do Gráfico do Funil e Agregação de Dados

### Diagnóstico
- O gráfico do funil estava afastado do título e dos cards, prejudicando o layout visual.
- Os dados do funil para "Todos os usuários" estavam zerados, pois a soma dos indicadores não estava correta para admin, master e líder.
- Os cards de "Dados semanais" e "Dados do Período" não estavam mostrando os valores corretos: semana deveria ser a média por semana, período o total do período.

### Ações Realizadas
- Refatorado o cálculo dos dados semanais e do período no container, agregando todos os indicadores filtrados corretamente.
- Ajustado o layout do gráfico do funil para bloco visual único, com cards e título juntos e gráfico imediatamente abaixo.
- Cards agora mostram os valores corretos para semana (média) e período (total), mesmo para "Todos os usuários".

### Próximos Passos
- Testar localmente as correções.
- Realizar o deploy automático.
- Solicitar validação/teste ao usuário. 