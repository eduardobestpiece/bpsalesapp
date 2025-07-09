# Solicitação em Andamento

## Etapa de Usuários - Planejamento e Checklist

**Objetivo:**
Implementar o fluxo completo de gestão de usuários no CRM, incluindo convite, cadastro simplificado, seleção de funis, redefinição de senha pós-convite e recuperação de senha.

### Checklist Geral
- [x] Remover página Performance do cabeçalho e rota
- [x] Criar página de redefinição de senha pós convite (Nome, Sobrenome, E-mail, Telefone, Data de nascimento, nova senha e repetir senha)
- [x] Criar página de redefinição de senha comum (E-mail, nova senha e repetir senha)
- [x] Ajustar fluxo de convite: criar usuário no Supabase com senha "Admin", auto-confirmar e enviar e-mail para redefinir senha/completar cadastro
- [ ] Modal de cadastro de usuários: apenas Email, Função e seleção de Funis
- [ ] Modal de edição de usuários: manter campos atuais + seleção de Funis

### Quarta Etapa: Modal de edição de usuários
- [ ] Modal de edição deve permitir editar Nome, Sobrenome, Telefone, Função e selecionar Funis permitidos
- [ ] Salvar alterações no banco e refletir imediatamente na listagem

**Status atual:**
- Iniciando implementação do modal de edição de usuários (campos atuais + seleção de Funis). 