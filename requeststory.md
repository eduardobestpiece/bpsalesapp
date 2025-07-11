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