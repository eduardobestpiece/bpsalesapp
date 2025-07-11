# Requisição em andamento (11/07/2024)

## Problemas relatados

1. **Troca de página zera seleção de empresa**
   - Sempre que troca de página, a seleção de empresa volta para "Todas as empresas" (que não deveria existir).
   - A seleção de empresa deve ser obrigatória e persistente por usuário até que ele troque manualmente.
2. **Permissões (Master sem acesso)**
   - Mesmo como master, ao acessar "Comercial" e "Configurações" aparece mensagem de falta de permissão.
3. **Editor de Indicador**
   - Modal não reconhece o período do indicador, impedindo salvar alterações.
   - Campo "Preenchido com atraso?" só aparece para master/admin, mas deve ser editável e refletir corretamente o status.
4. **Empresa no Simulador**
   - Seleção de empresa no Simulador não altera os dados exibidos.
   - Pode ser necessário garantir que todos os dados estejam ligados à empresa "Best Piece".
5. **Atualização desnecessária ao trocar de aba**
   - Ao trocar de aba, ocorre atualização/reload maluco, com múltiplos fetchs e logs de autenticação.
   - Plataforma deve ser estável, sem recarregar a cada navegação.

---

## Plano de ação

1. Persistir seleção de empresa por usuário (sem opção "todas")
2. Corrigir permissões de acesso (role_page_permissions)
3. Corrigir editor de indicador (período e campo atraso)
4. Filtrar dados do Simulador pela empresa
5. Eliminar atualização desnecessária ao trocar de aba

---

## Checklist

- [ ] Atualizar requeststory.md com a requisição detalhada
- [ ] Persistir seleção de empresa por usuário (sem opção "todas")
- [ ] Corrigir permissões de acesso (role_page_permissions)
- [ ] Corrigir editor de indicador (período e campo atraso)
- [ ] Filtrar dados do Simulador pela empresa
- [ ] Eliminar atualização desnecessária ao trocar de aba
- [ ] Executar deploy
- [ ] Solicitar validação do funcionamento 

---

# Requisição em andamento: Carregamento infinito global após F5

**Sintoma:** Ao atualizar (F5) qualquer página, o app entra em carregamento infinito. No console:
```
[CrmAuth] Initializing auth...
[CrmAuth] Auth state changed: SIGNED_IN ...
[CrmAuth] Buscando CRM user para: ...
```

**Contexto:**
- O contexto de autenticação depende do usuário CRM e da empresa.
- Se o usuário CRM não existe ou não tem empresa, o app pode não renderizar nada útil.
- O loading global só termina se a promise de busca do usuário CRM resolver.

**Plano de ação:**
1. Revisar fluxo de inicialização do contexto de autenticação global.
2. Garantir que o loading sempre finalize, mesmo se o usuário CRM não existir.
3. Adicionar fallback visual global para usuário CRM inexistente ou sem empresa.
4. Corrigir o fluxo para nunca travar o loading global.
5. Executar deploy e pedir validação.

**Status:** Em andamento. 

---

# Requisição em andamento: Ajustes no Modal e Lista de Indicadores

**Solicitante:** Usuário
**Data:** (preencher com a data atual)

## Ajustes Solicitados

### Modal de edição de indicador
- Corrigir para que, ao editar, o período original seja mantido (não sobrescrever com data de hoje).
- Remover o campo "Preenchido com atraso?" do modal.
- Mover a data de preenchimento para baixo, alinhada à esquerda, na mesma linha dos botões "Cancelar" e "Atualizar".

### Lista de indicadores
- Permitir que todos os usuários possam arquivar (excluir) indicadores preenchidos.
- Adicionar coluna "Usuário" (visível apenas para administradores, master e líderes) mostrando quem preencheu o indicador.
- Adicionar ícone de "homenzinho" ao lado esquerdo do seletor de funil, que filtra para "meus indicadores" (visível apenas para administradores, master e líderes).

## Plano de ação
1. Corrigir o modal de edição para manter o período original e remover o campo "Preenchido com atraso?".
2. Ajustar layout do modal conforme solicitado.
3. Permitir arquivamento de indicadores para todos os usuários.
4. Adicionar coluna "Usuário" na lista, visível apenas para administradores, master e líderes.
5. Adicionar filtro "meus indicadores" com ícone de homenzinho, visível apenas para administradores, master e líderes.
6. Testar e validar.
7. Executar deploy.
8. Solicitar validação ao usuário.

**Status:** Em andamento. 