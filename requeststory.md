# Solicitação em Andamento

## Etapa de Usuários - Planejamento e Checklist

**Objetivo:**
Implementar o fluxo completo de gestão de usuários no CRM, incluindo convite, cadastro simplificado, seleção de funis, redefinição de senha pós-convite e recuperação de senha.

### Checklist Geral
- [x] Remover página Performance do cabeçalho e rota
- [x] Criar página de redefinição de senha pós convite (Nome, Sobrenome, E-mail, Telefone, Data de nascimento, nova senha e repetir senha)
- [x] Criar página de redefinição de senha comum (E-mail, nova senha e repetir senha)
- [ ] Ajustar fluxo de convite: criar usuário no Supabase com senha "Admin", auto-confirmar e enviar e-mail para redefinir senha/completar cadastro
- [ ] Modal de cadastro de usuários: apenas Email, Função e seleção de Funis
- [ ] Modal de edição de usuários: manter campos atuais + seleção de Funis

### Terceira Etapa: Ajuste do fluxo de convite
- [ ] Ao adicionar usuário, criar no Supabase com e-mail informado, senha "Admin" e auto-confirmação
- [ ] Enviar e-mail automático para redefinir senha e completar cadastro
- [ ] Garantir integração com a página de redefinição de senha pós convite

**Status atual:**
- Iniciando implementação do novo fluxo de convite de usuários. 