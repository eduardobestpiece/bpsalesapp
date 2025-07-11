# Requisição em andamento (10/07/2024)

## Problemas relatados

1. **Seletor de empresas no Simulador**
   - O campo de selecionar empresa do menu à esquerda não existe no menu do módulo simulador.
2. **Exibição dos Indicadores**
   - Na aba "Registro de Indicadores" da página "Indicadores" os indicadores não estão sendo filtrados baseado na empresa.
3. **Modal de Edição do Usuário**
   - Na aba "Registro de Indicadores" da página "Indicadores", ao selecionar "Não" em "Preenchido com atraso?", o aviso de preenchido com atraso não some e não aparece a mensagem de preenchido dentro do prazo.
4. **Modal de Registro do Usuário**
   - Os campos "Valor das Vendas" e "Número de Recomendações" não aparecem para os usuários. Todos que têm permissão à página de indicadores devem ver esses campos no modal de registro de usuário e utilizá-los (exceto submasters).
5. **Permissões de usuários criados**
   - Ao adicionar um novo usuário, as permissões de empresa e funil não são aplicadas corretamente no primeiro acesso, sendo necessário editar o usuário após criado.
6. **Atualização estranha da página**
   - A página fica atualizando sozinha sem motivo aparente. Logs do console sugerem possível loop de autenticação ou efeito colateral em hooks/contextos.

---

## Plano de ação

1. Adicionar seletor de empresa no menu do Simulador
2. Corrigir filtro de indicadores por empresa na aba "Registro de Indicadores"
3. Ajustar aviso de preenchimento com atraso no modal de edição
4. Exibir campos adicionais no modal de registro de usuário (exceto submaster)
5. Corrigir associação de empresa/funil ao criar usuário
6. Investigar e corrigir atualização automática da página

---

## Checklist

- [ ] Atualizar requeststory.md com a requisição detalhada
- [ ] Adicionar seletor de empresa no menu do Simulador
- [ ] Corrigir filtro de indicadores por empresa
- [ ] Ajustar aviso de preenchimento com atraso no modal de edição
- [ ] Exibir campos adicionais no modal de registro de usuário (exceto submaster)
- [ ] Corrigir associação de empresa/funil ao criar usuário
- [ ] Investigar e corrigir atualização automática da página
- [ ] Executar deploy (aguardar confirmação do usuário)
- [ ] Solicitar validação do funcionamento 