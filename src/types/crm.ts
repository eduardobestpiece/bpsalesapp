
export type UserRole = 'master' | 'submaster' | 'admin' | 'leader' | 'user';

export interface CrmUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  company_id: string;
  team_id?: string;
  leader_id?: string;
  status: 'active' | 'archived';
  avatar_url?: string;
  phone?: string;
  bio?: string;
  birth_date?: string;
  funnels?: string[];
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  company_id: string;
  leader_id: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  leader?: CrmUser;
  members?: CrmUser[];
}

export interface Source {
  id: string;
  name: string;
  company_id: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface FunnelStage {
  id: string;
  name: string;
  funnel_id: string;
  stage_order: number;
  target_percentage?: number;
  target_value?: number;
  created_at: string;
  updated_at: string;
}

export interface Funnel {
  id: string;
  name: string;
  company_id: string;
  status: 'active' | 'archived';
  verification_type: 'weekly' | 'biweekly' | 'monthly';
  verification_day?: number;
  indicator_deadline_hours: number;
  recommendations_mode: 'manual' | 'automatic';
  sales_value_mode: 'manual' | 'automatic';
  recommendation_stage_id?: string;
  created_at: string;
  updated_at: string;
  stages?: FunnelStage[];
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company_id: string;
  funnel_id: string;
  current_stage_id: string;
  source_id?: string;
  responsible_id: string;
  status: 'active' | 'archived';
  archived_at?: string;
  created_at: string;
  updated_at: string;
  responsible?: CrmUser;
  source?: Source;
  current_stage?: FunnelStage;
  funnel?: Funnel;
}

export interface Sale {
  id: string;
  lead_id: string;
  sale_date: string;
  sale_value: number;
  responsible_id: string;
  team_id?: string;
  company_id: string;
  status: 'active' | 'archived';
  archived_at?: string;
  created_at: string;
  updated_at: string;
  lead?: Lead;
  responsible?: CrmUser;
  team?: Team;
}

export interface IndicatorValue {
  id: string;
  indicator_id: string;
  stage_id: string;
  value: number;
  created_at: string;
  updated_at: string;
  stage?: FunnelStage;
}

export interface Indicator {
  id: string;
  user_id: string;
  funnel_id: string;
  company_id: string;
  month_reference: number;
  year_reference: number;
  period_start?: string;
  period_end?: string;
  period_date?: string;
  recommendations_count?: number;
  sales_value?: number;
  is_delayed?: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
  user?: CrmUser;
  funnel?: Funnel;
  values?: IndicatorValue[];
}

export interface IndicatorWithValues extends Indicator {
  values: IndicatorValue[];
}
