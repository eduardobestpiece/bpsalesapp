# Requisição em andamento

## [13/07/2024] Bloco 3 - Ajustes Times, Funil Colorido, Comparativo e Indicadores

### Modal de Criação/Edição de Times
- Exibir apenas usuários da empresa selecionada no menu lateral.
- Se um líder for escolhido, ele deve sumir da lista de membros da equipe (pois já pertence à equipe como líder).

### Gráfico Funil
- Remover o funil sem cor (deixar apenas o funil colorido e o comparativo).
- Funil colorido: faixas uma abaixo da outra, cada uma menor que a anterior, cores seguindo o padrão da plataforma, última faixa com degradê verde.
- Exibir nome da fase centralizado, valor semanal à esquerda, valor do período à direita, taxa de conversão entre etapas.
- Corrigir aglomeração e garantir responsividade e visual limpo.

### Modal de “Detalhamento do Comparativo”
- Transformar o modal em um filtro comparativo: só aparece se estiver filtrado para usuário/equipe específica.
- Permitir comparar o funil atual com outro usuário/equipe (seleção no modal).
- Exibir lado a lado os dados do funil filtrado e do comparativo.

### Modal de Edição de Indicador
- Exibir sempre todos os períodos dos últimos 90 dias, independente de quantos indicadores já foram adicionados.
- Períodos já preenchidos aparecem como “(preenchido)” e ficam desabilitados para seleção.

---

**Checklist:**
- [ ] Ajustar modal de times (empresa e líder)
- [ ] Atualizar funil colorido (layout, cores, valores, conversão)
- [ ] Transformar modal de comparativo em filtro comparativo
- [ ] Ajustar modal de edição de indicador (períodos dos últimos 90 dias)
- [ ] Testar todos os fluxos
- [ ] Atualizar histórico e realizar deploy

## Observações
- Deploy só será realizado após a conclusão de todas as etapas acima, conforme orientação do usuário.
- Prints e regras estão registrados no chat e devem ser seguidos à risca. 