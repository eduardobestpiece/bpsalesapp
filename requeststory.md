# Solicitação em Andamento

## Etapa de Usuários - Planejamento e Checklist

**Objetivo:**
Implementar o fluxo completo de gestão de usuários no CRM, incluindo convite, cadastro simplificado, seleção de funis, redefinição de senha pós-convite e recuperação de senha.

### Checklist Geral
- [x] Remover página Performance do cabeçalho e rota
- [x] Criar página de redefinição de senha pós convite (Nome, Sobrenome, E-mail, Telefone, Data de nascimento, nova senha e repetir senha)
- [ ] Criar página de redefinição de senha comum (E-mail, nova senha e repetir senha)
- [ ] Ajustar fluxo de convite: criar usuário no Supabase com senha "Admin", auto-confirmar e enviar e-mail para redefinir senha/completar cadastro
- [ ] Modal de cadastro de usuários: apenas Email, Função e seleção de Funis
- [ ] Modal de edição de usuários: manter campos atuais + seleção de Funis

### Segunda Etapa: Página de redefinição de senha comum
- [ ] Criar rota e componente para página de redefinição de senha comum
- [ ] Formulário com campos: E-mail, Nova senha, Repetir senha
- [ ] Integração com Supabase para atualizar senha do usuário
- [ ] Mensagem de sucesso e redirecionamento para login

**Status atual:**
- Iniciando implementação da página de redefinição de senha comum. 