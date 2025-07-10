
export type UserRole = 'master' | 'admin' | 'leader' | 'user';
export type EntityStatus = 'active' | 'archived';
export type FunnelVerification = 'daily' | 'weekly' | 'monthly';

export interface Company {
  id: string;
  name: string;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface CrmUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  birth_date?: string;
  bio?: string;
  avatar_url?: string;
  role: UserRole;
  company_id: string;
  team_id?: string;
  leader_id?: string;
  status: EntityStatus;
  password_hash: string;
  created_at: string;
  updated_at: string;
  funnels?: string[];
}

export interface Team {
  id: string;
  name: string;
  leader_id: string;
  company_id: string;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Funnel {
  id: string;
  name: string;
  verification_type: FunnelVerification;
  verification_day?: number;
  company_id: string;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
  indicator_deadline_hours?: number; // Prazo de preenchimento do indicador em horas (0 = até o fim do período, 24 = 1 dia após, etc)
}

export interface FunnelStage {
  id: string;
  funnel_id: string;
  name: string;
  stage_order: number;
  target_percentage?: number;
  target_value?: number;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  name: string;
  company_id: string;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  responsible_id: string;
  funnel_id: string;
  current_stage_id: string;
  source_id?: string;
  company_id: string;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  lead_id: string;
  sale_date: string;
  sale_value: number;
  responsible_id: string;
  team_id?: string;
  company_id: string;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Indicator {
  id: string;
  user_id: string;
  funnel_id: string;
  period_date: string;
  month_reference: number;
  year_reference: number;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface IndicatorValue {
  id: string;
  indicator_id: string;
  stage_id: string;
  value: number;
  created_at: string;
  updated_at: string;
}

// Extended types for Supabase queries with joins
export interface FunnelWithStages extends Funnel {
  stages: FunnelStage[];
}

export interface LeadWithRelations extends Lead {
  responsible: Pick<CrmUser, 'first_name' | 'last_name'>;
  funnel: Pick<Funnel, 'name'>;
  current_stage: Pick<FunnelStage, 'name'>;
  source?: Pick<Source, 'name'>;
}

export interface SaleWithRelations extends Sale {
  lead: Pick<Lead, 'name'>;
  responsible: Pick<CrmUser, 'first_name' | 'last_name'>;
  team?: Pick<Team, 'name'>;
}
