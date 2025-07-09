# Requisição em andamento

**Data:** 2024-07-08

**Solicitante:** Usuário

**Descrição:**
Adicionar o campo `indicator_deadline_hours` nos Funis do CRM para definir o prazo de preenchimento do indicador (em horas). O campo já foi criado manualmente no Supabase. Agora, o sistema deve permitir editar/visualizar esse campo no modal de Funil, garantir que seja salvo/lido corretamente e atualizar os tipos do frontend.

**Checklist:**
- [x] Adicionar o campo `indicator_deadline_hours` nos tipos do frontend (`crm.ts` e `supabase/types.ts`).
- [x] Adicionar o campo no estado e formulário do modal de Funil (`FunnelModal.tsx`), com explicação e validação.
- [ ] Garantir que o campo seja enviado/salvo ao criar/editar funis.
- [ ] Atualizar a leitura do funil para trazer o campo.
- [ ] Testar o fluxo de criação/edição.
- [ ] Atualizar `requeststory.md` com a requisição.
- [ ] Executar deploy.
- [ ] Solicitar validação do usuário.

**Status:** Em andamento

--- 