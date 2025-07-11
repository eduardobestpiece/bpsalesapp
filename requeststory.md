# Solicitação em andamento (11/07/2024)

**Solicitante:** Usuário
**Descrição:**

## Seletor de Empresa Global (Master)
- Adicionar seletor de empresa no menu lateral, visível apenas para Master.
- Ao selecionar uma empresa, todos os dados exibidos na plataforma (CRM e Simulador) devem ser filtrados pela empresa escolhida.
- O filtro de empresa deve ser global, afetando todos os módulos.
- Garantir que todos os dados existentes estejam associados à empresa "Best Piece" (ID: 334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b).

## Função SubMaster
- Criar novo tipo de usuário: SubMaster.
- SubMaster pode visualizar tudo (igual ao Master), mas não pode editar, excluir ou registrar nada.
- Apenas o Master pode criar usuários com esse perfil.

**Checklist:**
- [x] Garantir associação de todos os dados existentes à empresa Best Piece
- [x] Criar contexto global para empresa selecionada
- [x] Adicionar seletor de empresa na sidebar (apenas para Master)
- [x] Garantir que todos os hooks/queries usem a empresa selecionada
- [x] Adicionar papel "submaster" no banco e frontend
- [x] Ajustar cadastro/edição de usuário para permitir "SubMaster" (apenas Master)
- [x] Garantir permissão somente leitura para SubMaster
- [x] Testar todos os fluxos
- [x] Atualizar histórico
- [x] Realizar deploy

--- 