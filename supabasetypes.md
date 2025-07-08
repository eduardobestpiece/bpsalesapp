# Estrutura do Supabase – Projeto Monteo

## Tabelas Principais

### 1. **administrators**
- **id** (uuid, PK)
- name (text)
- credit_update_type (text: 'monthly' | 'annual')
- update_month (integer, 1-12)
- grace_period_days (integer)
- max_embedded_percentage (numeric)
- special_entry_type (text: 'none' | 'percentage' | 'fixed_value')
- special_entry_percentage (numeric)
- special_entry_fixed_value (numeric)
- special_entry_installments (integer)
- is_archived (boolean, default: false)
- created_at (timestamp)
- updated_at (timestamp)

### 2. **products**
- **id** (uuid, PK)
- name (text)
- type (text: 'property' | 'car')
- administrator_id (uuid, FK → administrators)
- credit_value (numeric)
- term_options (integer[])
- is_archived (boolean)
- created_at (timestamp)
- updated_at (timestamp)

### 3. **bid_types**
- **id** (uuid, PK)
- name (text)
- administrator_id (uuid, FK → administrators)
- percentage (numeric)
- allows_embedded (boolean)
- is_loyalty (boolean)
- loyalty_months (integer)
- is_default (boolean)
- is_archived (boolean)
- created_at (timestamp)
- updated_at (timestamp)

### 4. **installment_types**
- **id** (uuid, PK)
- name (text)
- administrator_id (uuid, FK → administrators)
- type (text: 'MEIA' | 'REDUZIDA')
- reduction_percentage (numeric)
- reduces_credit (boolean)
- reduces_admin_tax (boolean)
- reduces_insurance (boolean)
- reduces_reserve_fund (boolean)
- is_archived (boolean)
- created_at (timestamp)
- updated_at (timestamp)

### 5. **entry_types**
- **id** (uuid, PK)
- name (text)
- administrator_id (uuid, FK → administrators)
- type (text: 'PERCENTUAL' | 'VALOR_FIXO')
- percentage (numeric)
- fixed_value (numeric)
- installment_months (integer, default: 1)
- is_optional (boolean)
- is_archived (boolean)
- created_at (timestamp)
- updated_at (timestamp)

### 6. **funnels**
- **id** (uuid, PK)
- name (text)
- verification_type (enum: 'daily' | 'weekly' | 'monthly')
- verification_day (integer)
- company_id (uuid, FK → companies)
- created_at (timestamp)
- updated_at (timestamp)
- status (enum: 'active' | 'archived')

### 7. **funnel_stages**
- **id** (uuid, PK)
- funnel_id (uuid, FK → funnels)
- name (text)
- stage_order (integer)
- target_percentage (numeric)
- target_value (integer)
- created_at (timestamp)
- updated_at (timestamp)

### 8. **crm_users**
- **id** (uuid, PK)
- email (text, único)
- first_name (text)
- last_name (text)
- phone (text)
- birth_date (date)
- bio (text)
- avatar_url (text)
- role (enum: 'master' | 'admin' | 'leader' | 'user')
- company_id (uuid, FK → companies)
- team_id (uuid, FK → teams)
- leader_id (uuid, FK → crm_users)
- created_at (timestamp)
- updated_at (timestamp)
- status (enum: 'active' | 'archived')
- password_hash (text)

### 9. **teams**
- **id** (uuid, PK)
- name (text)
- leader_id (uuid, FK → crm_users)
- company_id (uuid, FK → companies)
- created_at (timestamp)
- updated_at (timestamp)
- status (enum: 'active' | 'archived')

### 10. **leads**
- **id** (uuid, PK)
- name (text)
- email (text)
- phone (text)
- responsible_id (uuid, FK → crm_users)
- funnel_id (uuid, FK → funnels)
- current_stage_id (uuid, FK → funnel_stages)
- source_id (uuid, FK → sources)
- company_id (uuid, FK → companies)
- created_at (timestamp)
- updated_at (timestamp)
- status (enum: 'active' | 'archived')

### 11. **sales**
- **id** (uuid, PK)
- lead_id (uuid, FK → leads)
- sale_date (date)
- sale_value (numeric)
- responsible_id (uuid, FK → crm_users)
- team_id (uuid, FK → teams)
- company_id (uuid, FK → companies)
- created_at (timestamp)
- updated_at (timestamp)
- status (enum: 'active' | 'archived')

### 12. **sources**
- **id** (uuid, PK)
- name (text)
- company_id (uuid, FK → companies)
- created_at (timestamp)
- updated_at (timestamp)
- status (enum: 'active' | 'archived')

### 13. **indicators**
- **id** (uuid, PK)
- user_id (uuid, FK → crm_users)
- funnel_id (uuid, FK → funnels)
- period_date (date)
- month_reference (integer)
- year_reference (integer)
- company_id (uuid, FK → companies)
- created_at (timestamp)
- updated_at (timestamp)

### 14. **indicator_values**
- **id** (uuid, PK)
- indicator_id (uuid, FK → indicators)
- stage_id (uuid, FK → funnel_stages)
- value (integer)
- created_at (timestamp)
- updated_at (timestamp)

### 15. **leverages**
- **id** (uuid, PK)
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

---

## Enums
- **entity_status**: 'active', 'archived'
- **user_role**: 'master', 'admin', 'leader', 'user'
- **funnel_verification**: 'daily', 'weekly', 'monthly'

---

## Observações
- Todas as tabelas possuem RLS (Row Level Security) habilitado.
- Relacionamentos entre tabelas são feitos via UUID e foreign keys.
- Campos de status permitem arquivamento lógico sem deletar dados.
- Campos de auditoria (`created_at`, `updated_at`) presentes em todas as tabelas principais.
- Para consultar relacionamentos, sempre utilize os campos *_id.

---

*Este documento serve como referência rápida para desenvolvedores e analistas do Projeto Monteo.* 