# Solicitação em andamento

## Data: 2024-07-10

### Requisição
- **Resumo:** Atualização completa do módulo Simulador, com isolamento multiempresa, permissões avançadas, layout padronizado e novas regras de arquivamento, cópia e edição para administradoras, redução de parcela, parcelas, produtos e alavancas. Nada pode afetar o funcionamento do módulo CRM.

### Detalhamento das demandas (Bloco 1)

#### Leyout
- [x] Menu sanduíche igual ao CRM no Simulador.
- [x] Opção “Master Config” no menu lateral (apenas para master).

#### Estrutura
- [x] Seleção de empresa no menu lateral (dados isolados por empresa).
- [ ] Opção de copiar dados de uma empresa para outra (master/submaster) para administradoras, produtos, alavancas, redução de parcelas, parcelas, entradas e alavancas.

#### Permissões
- [x] Master vê e gerencia tudo de todas as empresas.
- [x] Admin vê/edita apenas dados da própria empresa.
- [x] SubMaster vê tudo, pode copiar, mas não edita/arquiva.

#### Configurações (Layout igual Administradoras)
##### Administradoras
- [x] Remover opção de exclusão (só arquivar).
- [x] Arquivados vão para aba de itens arquivados do Master Config (em andamento).
- [x] Modal: “Tipo de Atualização” com “Mês específico” (nomes dos meses) ou “Após 12 parcelas”.
- [x] Modal: campo padrão (apenas uma por empresa).
- [x] Modal: botões “Cadastrar”/“Salvar” conforme contexto.
- [x] Modal de edição carrega dados corretamente.

##### Redução de Parcela
- [ ] Estrutura igual Administradoras.
- [ ] Filtro por administradora e nome.
- [ ] Colunas e ações conforme solicitado.
- [ ] Arquivamento igual administradoras.
- [ ] Modal: campos e lógica conforme solicitado, botão para adicionar administradora.

##### Parcelas
- [ ] Arquivamento igual administradoras.
- [ ] Colunas e ações conforme solicitado.
- [ ] Modal: campos conforme solicitado, botão para adicionar administradora, campo padrão.

##### Produtos
- [ ] Um botão de adicionar.
- [ ] Layout igual administradoras.
- [ ] Arquivamento igual administradoras.
- [ ] Colunas e ações conforme solicitado.
- [ ] Modal: campos conforme solicitado, cálculo automático do valor da parcela.

##### Alavancas
- [ ] Manter como está.

### Status Atual
- Layout, permissões e administradoras: concluídos.
- Em andamento: Redução de Parcela (estrutura, filtros, colunas, arquivamento, modal, botão para adicionar administradora).
- Próximos: Parcelas, Produtos, Alavancas, Cópia de Dados, reforço de permissões.

### 2024-07-10 - Continuação
- [x] Criado componente `InstallmentReductionModal.tsx` para Redução de Parcela, seguindo padrão dos modais de Administradoras.
  - Campos: nome, administradora (seleção), valor/percentual, datas de início/fim, campo padrão, arquivado (apenas master), botões Cadastrar/Salvar.
  - Lógica de permissões: master/admin editam, submaster apenas visualiza.
  - Busca administradoras da empresa.
  - Pronto para integração com a lista de Redução de Parcela.
- [x] Integrado o modal e a lista de Redução de Parcela (`InstallmentReductionModal` e `InstallmentReductionList`) na página de Configurações.
  - Adicionado botão de adicionar, filtros por nome/status, abertura/edição conforme permissões.
  - Modal e lista seguem padrão visual das demais entidades.
  - Pronto para testes e ajustes finais.

---

**Todas as alterações estão sendo feitas sem afetar o CRM.**
**Cada etapa é registrada e validada.** 