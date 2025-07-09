## Requisição em andamento - 08/07/2024

### Problema
No modal "Editar Funil" e "Novo Funil" (aba Funis), ao selecionar uma fase no campo "Etapa ligada às Recomendações", a informação não está sendo salva corretamente. Mesmo após salvar, ao editar novamente, o campo volta para "Selecione a etapa". Logs mostram que o valor é enviado e recebido corretamente do Supabase.

### Análise Inicial
- O valor `recommendation_stage_id` está sendo salvo e retornado do Supabase.
- O problema parece estar na exibição do valor salvo no campo do formulário ao reabrir o modal.

### Plano de Ação
1. Confirmar onde o valor de `recommendation_stage_id` é lido e setado no formulário do modal.
2. Verificar se o valor está sendo corretamente passado para o componente de seleção ao abrir o modal.
3. Corrigir o carregamento inicial do valor selecionado.
4. Testar a criação e edição de funis para garantir que o valor é salvo e exibido corretamente.
5. Executar o deploy.
6. Solicitar validação do usuário.

### Checklist
- [x] Registrar requisição em `requeststory.md`
- [ ] Analisar e corrigir o carregamento do valor no modal
- [ ] Testar criação e edição de funis
- [ ] Executar deploy
- [ ] Solicitar validação do usuário 