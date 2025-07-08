# Requisição: Correção de exibição de funis no modal de indicador

## Contexto
O usuário relatou que, ao abrir o modal de registro de indicador, aparece a mensagem "Nenhum funil disponível para seleção.", mesmo havendo funis cadastrados e ativos no Supabase para a empresa correta.

## Diagnóstico
- Funis ativos existem no banco para a empresa correta.
- O hook useFunnels está correto e retorna os funis filtrando por company_id e status.
- O modal pode estar recebendo companyId indefinido ou renderizando antes do carregamento dos dados.

## Plano de Correção
1. Garantir que o companyId passado ao hook useFunnels nunca seja undefined (usar fallback do usuário logado).
2. Adicionar tratamento de loading no modal para evitar renderizar mensagem de "Nenhum funil disponível" antes do carregamento.
3. Testar o fluxo e pedir validação ao usuário.

## Checklist
- [ ] Ajustar fallback de companyId no IndicatorModal
- [ ] Adicionar loading para evitar mensagem prematura
- [ ] Testar e validar
- [ ] Deploy automático
- [ ] Solicitar validação ao usuário 