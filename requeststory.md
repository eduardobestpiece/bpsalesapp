# Requisição Atual

**Data:** 2024-07-09
**Solicitante:** Usuário

## Descrição
Ajustar o fluxo de convite de usuário para que, ao adicionar um novo usuário pela plataforma, o Supabase envie automaticamente um e-mail de convite para o usuário acessar a plataforma.

## Ponto de Partida
- O frontend já possui formulário e chamada para função Edge `invite-user`.
- A função Edge criava o usuário no Auth, mas não disparava o e-mail de convite (usava endpoint de admin com senha e email_confirm).

## O que foi alterado
- A função Edge foi ajustada para usar o endpoint `/auth/v1/invite` do Supabase, garantindo o envio automático do e-mail de convite.

## Próximos passos do checklist
- [x] Ajustar função Edge para disparar convite
- [ ] Garantir que o template de convite está ativo no Supabase
- [ ] Testar o fluxo completo
- [ ] Atualizar documentação e histórico 