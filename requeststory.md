# Requisição em Andamento

## Bloco 1: Performance - Filtros e Layout do Funil

### Diagnóstico
- O filtro de funis na aba Performance estava utilizando o companyId do contexto de autenticação, não refletindo a empresa selecionada pelo usuário Master.
- O layout dos cards de "Dados semanais" e "Dados do Período" precisava ser alinhado acima do título do funil, em linha única.

### Ações Realizadas
- Corrigido o uso do companyId para sempre priorizar o selectedCompanyId do CompanyContext nos filtros e queries de funis e indicadores.
- Garantido que, ao trocar de empresa, os funis exibidos sejam apenas daquela empresa.
- Ajustado o layout do gráfico do funil para alinhar os cards de dados semanais e do período acima do título, todos em uma única linha, centralizados.

### Próximos Passos
- Testar localmente a troca de empresa e o alinhamento visual.
- Realizar o deploy automático.
- Solicitar validação/teste ao usuário. 