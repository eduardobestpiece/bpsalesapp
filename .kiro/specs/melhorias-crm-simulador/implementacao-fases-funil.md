# Implementação de Fases Específicas no Modal de Funis

## Visão Geral

Esta documentação descreve a implementação das novas funcionalidades no Modal de Funis, que permitem selecionar fases específicas para reuniões agendadas e realizadas. Essas fases são utilizadas para calcular métricas importantes como "Delay / No Show" na página de Performance do CRM.

## Alterações Realizadas

### 1. Banco de Dados

Foram adicionadas duas novas colunas na tabela `funnels`:

- `meeting_scheduled_stage_id`: UUID que referencia a fase do funil atrelada a reuniões agendadas
- `meeting_completed_stage_id`: UUID que referencia a fase do funil atrelada a reuniões realizadas

A migração foi criada em `supabase/migrations/20250715000000-add-meeting-stage-columns-to-funnels.sql`:

```sql
-- Add meeting stage columns to funnels table
ALTER TABLE funnels
ADD COLUMN meeting_scheduled_stage_id UUID REFERENCES funnel_stages(id),
ADD COLUMN meeting_completed_stage_id UUID REFERENCES funnel_stages(id);
```

### 2. Interface do Usuário

O componente `FunnelModal.tsx` foi atualizado para incluir dois novos campos de seleção:

- **Etapa de Reunião Agendada**: Permite selecionar qual fase do funil representa reuniões agendadas
- **Etapa de Reunião Realizada**: Permite selecionar qual fase do funil representa reuniões realizadas

Esses campos aparecem na seção "Etapas do Funil" junto com o campo já existente "Etapa de Recomendações".

### 3. Lógica de Negócio

O componente `CrmPerformance.tsx` foi atualizado para calcular as métricas de "Delay / No Show" usando as fases selecionadas:

- **Delay / No Show (período)**: Calculado como 1 - (Soma da fase do funil atrelada a reunião realizada / soma da fase do funil atrelada a reunião agendada)
- **Delay / No Show (semana)**: Mesma fórmula, mas com valores semanais

### 4. Exibição de Métricas

O componente `FunnelChart.tsx` foi atualizado para exibir as novas métricas:

- Adicionados cards para "Delay / No Show (período)" e "Delay / No Show (semana)"
- Os valores são exibidos como percentuais com uma casa decimal

## Como Aplicar a Migração

Para aplicar a migração que adiciona as colunas no banco de dados, foi criado um script `apply-migration.js` na raiz do projeto. Para executá-lo:

1. Configure as variáveis de ambiente:
```sh
export SUPABASE_URL=https://jbhocghbieqxjwsdstgm.supabase.co
export SUPABASE_KEY=sua_chave_de_servico_do_supabase
```

2. Execute o script:
```sh
node apply-migration.js
```

## Como Usar a Funcionalidade

1. Acesse a página de Configurações do CRM
2. Clique em "Editar" em um funil existente ou crie um novo funil
3. Na seção "Etapas do Funil", selecione:
   - Uma fase para "Etapa de Reunião Agendada"
   - Uma fase para "Etapa de Reunião Realizada"
4. Salve o funil
5. Acesse a página de Performance para visualizar as novas métricas de "Delay / No Show"

## Considerações Técnicas

- As fases selecionadas devem existir no funil
- Se as fases não forem selecionadas, as métricas de "Delay / No Show" serão exibidas como 0%
- A migração é segura para ser aplicada em ambientes de produção, pois utiliza `ADD COLUMN IF NOT EXISTS`