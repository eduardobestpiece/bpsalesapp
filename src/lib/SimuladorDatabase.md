# Simulador Monteo – Estrutura de Banco e Lógicas de Cálculo

---

## PARTE 1 – Estrutura do Banco de Dados (Supabase)

### Tabelas Principais do Módulo Simulador

#### 1. administrators
- **Colunas:**
  - id (uuid, PK)
  - name (text)
  - credit_update_type (text: 'monthly' | 'annual')
  - update_month (integer)
  - grace_period_days (integer)
  - max_embedded_percentage (numeric)
  - special_entry_type (text: 'none' | 'percentage' | 'fixed_value')
  - special_entry_percentage (numeric)
  - special_entry_fixed_value (numeric)
  - special_entry_installments (integer)
  - is_archived (boolean)
  - created_at (timestamp)
  - updated_at (timestamp)
  - company_id (uuid)
  - is_default (boolean)
  - update_type (text: 'specific_month' | 'after_12_installments')
- **Exemplo de dado:**
  - name: Magalu, credit_update_type: annual, update_month: 9, grace_period_days: 60, max_embedded_percentage: 25.00, ...

#### 2. bid_types
- **Colunas:**
  - id (uuid, PK)
  - name (text)
  - administrator_id (uuid)
  - percentage (numeric)
  - allows_embedded (boolean)
  - is_loyalty (boolean)
  - loyalty_months (integer)
  - is_default (boolean)
  - is_archived (boolean)
  - created_at (timestamp)
  - updated_at (timestamp)
  - company_id (uuid)
- **Exemplo de dado:**
  - name: Lance fixo, percentage: 25.00, allows_embedded: true, ...

#### 3. products
- **Colunas:**
  - id (uuid, PK)
  - name (text)
  - type (text: 'property' | 'car')
  - administrator_id (uuid)
  - credit_value (numeric)
  - is_archived (boolean)
  - created_at (timestamp)
  - updated_at (timestamp)
  - company_id (uuid)
  - installment_value (numeric)
  - admin_tax_percent (numeric)
  - reserve_fund_percent (numeric)
  - insurance_percent (numeric)
- **Exemplo de dado:**
  - name: R$ 500.000,00 (Imóvel), type: property, credit_value: 500000.00, ...

#### 4. installment_types
- **Colunas:**
  - id (uuid, PK)
  - name (text)
  - administrator_id (uuid)
  - reduction_percentage (numeric)
  - reduces_credit (boolean)
  - reduces_admin_tax (boolean)
  - reduces_insurance (boolean)
  - reduces_reserve_fund (boolean)
  - is_archived (boolean)
  - created_at (timestamp)
  - updated_at (timestamp)
  - company_id (uuid)
  - is_default (boolean)
  - admin_tax_percent (numeric)
  - reserve_fund_percent (numeric)
  - insurance_percent (numeric)
  - optional_insurance (boolean)
  - installment_count (integer)
- **Exemplo de dado:**
  - name: 240, admin_tax_percent: 27, reserve_fund_percent: 1, insurance_percent: 1, ...

#### 5. entry_types
- **Colunas:**
  - id (uuid, PK)
  - name (text)
  - administrator_id (uuid)
  - type (text: 'PERCENTUAL' | 'VALOR_FIXO')
  - percentage (numeric)
  - fixed_value (numeric)
  - installment_months (integer)
  - is_optional (boolean)
  - is_archived (boolean)
  - created_at (timestamp)
  - updated_at (timestamp)
  - company_id (uuid)

#### 6. leverages
- **Colunas:**
  - id (uuid, PK)
  - name (text)
  - type (text: 'real_estate' | 'vehicle')
  - subtype (text: 'short_stay' | 'commercial_residential')
  - has_fixed_property_value (boolean)
  - fixed_property_value (numeric)
  - daily_percentage (numeric)
  - rental_percentage (numeric)
  - management_percentage (numeric)
  - real_estate_percentage (numeric)
  - total_expenses (numeric)
  - occupancy_rate (numeric)
  - is_archived (boolean)
  - created_at (timestamp)
  - updated_at (timestamp)
  - company_id (uuid)
- **Exemplo de dado:**
  - name: Airbnb, type: real_estate, subtype: short_stay, daily_percentage: 0.06, management_percentage: 15, total_expenses: 0.35, occupancy_rate: 70, ...

#### 7. installment_reductions
- **Colunas:**
  - id (uuid, PK)
  - company_id (uuid)
  - name (text)
  - administrator_id (uuid)
  - reduction_percent (numeric)
  - applications (text[])
  - is_archived (boolean)
  - created_at (timestamp)
  - updated_at (timestamp)
- **Exemplo de dado:**
  - name: Reduzida, reduction_percent: 50, applications: ["installment"], ...

#### 8. product_installment_types
- **Colunas:**
  - id (uuid, PK)
  - product_id (uuid)
  - installment_type_id (uuid)

#### 9. installment_type_reductions
- **Colunas:**
  - id (uuid, PK)
  - installment_type_id (uuid)
  - installment_reduction_id (uuid)

#### 10. simulator_configurations
- **Colunas:**
  - id (uuid, PK)
  - user_id (uuid)
  - company_id (uuid)
  - configuration (jsonb)
  - created_at (timestamp)
  - updated_at (timestamp)

---

## PARTE 2 – Lógicas de Cálculo do Simulador

### 1. Crédito Acessado
- Busca por Aporte: Fator = 100.000 / valor da parcela cheia para 100.000; Crédito acessado = (valor do aporte * fator), arredondado para múltiplos de 10.000.
- Busca por Crédito: arredondar para múltiplos de 10.000.

### 2. Valor da Parcela
- Parcela Cheia: (crédito + taxas) / número de parcelas. Taxas: administração, fundo de reserva, seguro.
- Parcela Especial: aplica reduções conforme configuração do produto e tipo de redução.

### 3. Funções principais
- `calcularParcelasProduto({ credit, installment, reduction })` – Calcula valor da parcela cheia e especial.
- `regraParcelaEspecial({ credit, installment, reduction })` – Aplica reduções e retorna valor da parcela especial.
- `calculateLeverageValues({ creditValue, propertyValue, propertyCount, contemplationMonth, termMonths, dailyRate, occupancyRate, fixedCosts, appreciationRate })` – Calcula todos os indicadores de alavancagem patrimonial.

### 4. Fórmulas de Alavancagem Patrimonial
- Ganhos Mensais (short-stay): ganhosMensais = ((patrimonioNaContemplacaoCalculado = patrimonioNaContemplacao * (1 + taxaValorizacao)^(contemplationMonth / 12)) × (30 × occupancyRate) - fixedCosts) × numeroImoveis
- Ganhos Mensais (aluguel tradicional): ganhosMensais = (monthlyRent - fixedCosts) × numeroImoveis
- Patrimônio na Contemplação: patrimonioNaContemplacao = valor do crédito acessado ou patrimônio informado
- Patrimônio ao Final: patrimonioAoFinal = patrimonioNaContemplacaoCalculado * (1 + taxaValorizacao) ^ ((termMonths - contemplationMonth) / 12)
- Fluxo de Caixa Antes: ganhosMensais - parcelaMensalConsorcio
- Fluxo de Caixa Após: ganhosMensais
- Pago do Próprio Bolso: parcelaMensalConsorcio * contemplationMonth
- Pago pelo Inquilino: ganhosMensais * (termMonths - contemplationMonth)
- Capital em Caixa: fluxoCaixaAntes * (termMonths - contemplationMonth)

### 5. Outras Lógicas e Regras
- Arredondamentos: sempre para múltiplos de 10.000 (crédito) ou 100.000 (embutido).
- Cálculo de embutido: (Valor do Imóvel + (Valor do imóvel * (Percentual embutido + (Percentual embutido * Percentual embutido)))), arredondado para cima para múltiplos de 100 mil.
- Número de imóveis: Math.ceil(Crédito acessado / Valor do imóvel)

### 6. Funções auxiliares
- `calculateConsortium`, `calculateAdvancedConsortium`, `calculateHalfInstallment`, `calculateAirbnb`, `calculateCommercialProperty`, `calculatePatrimonialEvolution` – Funções utilitárias para simulações e projeções.

### 7. Observações
- Todas as fórmulas e funções estão detalhadas em `src/lib/docs_regras_calculo_simulador.md` e nos arquivos de utilitários do simulador.
- Exemplos práticos e regras de arredondamento estão documentados para cada campo relevante.

---

**Este documento serve como referência completa da estrutura de dados e das regras de cálculo do módulo Simulador Monteo.** 