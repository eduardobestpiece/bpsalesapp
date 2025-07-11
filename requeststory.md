# Requisição em andamento - 11/07/2024 (Bloco 1)

## Ajustes Solicitados

### Gráfico do Funil
- Reduzir o espaçamento vertical entre as faixas (espaço mínimo, sem sobreposição).
- Todas as faixas com a mesma altura.
- Impedir quebra de linha nos textos das faixas.
- Se o nome da última faixa for grande, aumentar a largura horizontal da faixa (e das superiores proporcionalmente), nunca a altura.
- Cada faixa terá largura diferente, mas altura igual.

### Modal de Registro de Indicadores
- Exibir períodos já preenchidos com o aviso “(já preenchido)” em cinza no campo “Período” do modal, desabilitando a seleção.

### Página de Configurações do CRM (Funis, Origens, Times)
- Garantir que ao criar/editar qualquer item, ele seja sempre vinculado à empresa selecionada no menu lateral esquerdo.
- Cada empresa só pode ver e manipular seus próprios dados.

---

## Checklist
- [ ] Ajustar gráfico do funil: altura igual, espaçamento mínimo, impedir quebra de linha, largura adaptativa.
- [ ] Ajustar modal de indicador: exibir “(já preenchido)” em cinza nos períodos preenchidos.
- [ ] Corrigir cadastro/edição/listagem nas abas de configurações para sempre usar a empresa selecionada.
- [ ] Testar localmente.
- [ ] Atualizar `requeststory.md`.
- [ ] Deploy automático.
- [ ] Solicitar validação. 