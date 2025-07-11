# Requisição em andamento - 11/07/2024

## Ajustes Solicitados

### Gráfico do Funil
- Corrigir empilhamento das faixas (espaçamento vertical).
- Reduzir o arredondamento das faixas.
- Responsividade: última faixa pode ser maior e texto menor se necessário.

### Página de Configurações (Abas Funis, Origens, Times)
- Garantir que ao criar/editar itens, eles sejam sempre vinculados à empresa selecionada no menu lateral.
- Cada empresa só pode ver seus próprios dados.

### Modal de Registro de Indicador
- Exibir sempre todos os períodos dos últimos 90 dias, independentemente de quantos indicadores já existem.
- Períodos já preenchidos aparecem como “(preenchido)” e ficam desabilitados para seleção.

---

## Checklist
- [ ] Ajustar gráfico do funil (espaçamento, responsividade, border-radius)
- [ ] Corrigir vinculação e visualização por empresa nas abas Funis, Origens e Times
- [ ] Ajustar modal de registro de indicador (períodos dos últimos 90 dias, preenchidos desabilitados)
- [ ] Testar localmente
- [ ] Atualizar `requeststory.md`
- [ ] Deploy automático
- [ ] Solicitar validação 