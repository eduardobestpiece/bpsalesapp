# Requisição em Andamento — 12/07/2025

## Problemas Relatados
- Usuários associados ao time não aparecem marcados no modal de edição.
- Ao selecionar um time no funil, não filtra para os dados de todos os usuários daquele time.

## Diagnóstico
- Associação dos usuários ao time está correta no banco (`team_id` preenchido).
- Modal de times busca membros corretamente, mas pode haver problema de sincronização no MultiSelect.
- Filtro do funil não busca todos os usuários do time selecionado, apenas filtra por `userId` individual.

## Plano de Ação
1. Corrigir MultiSelect do modal para garantir marcação correta dos membros.
2. Corrigir lógica de filtragem do funil para, ao selecionar um time, filtrar indicadores de todos os usuários daquele time.
3. Testar e validar.
4. Executar deploy.
5. Solicitar conferência do usuário.

## Checklist
- [x] Verificar associação dos usuários ao time no banco.
- [x] Analisar modal de edição de times.
- [x] Analisar lógica de filtragem do funil.
- [ ] Corrigir MultiSelect do modal para garantir marcação correta dos membros.
- [ ] Corrigir lógica de filtragem do funil por time.
- [ ] Testar e validar.
- [ ] Executar deploy.
- [ ] Solicitar conferência. 