export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      administrator_company_access: {
        Row: {
          administrator_id: string
          company_id: string
          granted_at: string
          granted_by: string | null
        }
        Insert: {
          administrator_id: string
          company_id: string
          granted_at?: string
          granted_by?: string | null
        }
        Update: {
          administrator_id?: string
          company_id?: string
          granted_at?: string
          granted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "administrator_company_access_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrator_company_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      administrators: {
        Row: {
          agio_purchase_percentage: number | null
          company_id: string | null
          created_at: string
          credit_update_type: string
          functioning: string | null
          grace_period_days: number | null
          id: string
          is_archived: boolean | null
          is_default: boolean | null
          max_embedded_percentage: number | null
          name: string
          post_contemplation_adjustment: number | null
          special_entry_fixed_value: number | null
          special_entry_installments: number | null
          special_entry_percentage: number | null
          special_entry_type: string | null
          update_month: number | null
          update_type: string | null
          updated_at: string
        }
        Insert: {
          agio_purchase_percentage?: number | null
          company_id?: string | null
          created_at?: string
          credit_update_type: string
          functioning?: string | null
          grace_period_days?: number | null
          id?: string
          is_archived?: boolean | null
          is_default?: boolean | null
          max_embedded_percentage?: number | null
          name: string
          post_contemplation_adjustment?: number | null
          special_entry_fixed_value?: number | null
          special_entry_installments?: number | null
          special_entry_percentage?: number | null
          special_entry_type?: string | null
          update_month?: number | null
          update_type?: string | null
          updated_at?: string
        }
        Update: {
          agio_purchase_percentage?: number | null
          company_id?: string | null
          created_at?: string
          credit_update_type?: string
          functioning?: string | null
          grace_period_days?: number | null
          id?: string
          is_archived?: boolean | null
          is_default?: boolean | null
          max_embedded_percentage?: number | null
          name?: string
          post_contemplation_adjustment?: number | null
          special_entry_fixed_value?: number | null
          special_entry_installments?: number | null
          special_entry_percentage?: number | null
          special_entry_type?: string | null
          update_month?: number | null
          update_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "administrators_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      app_pages: {
        Row: {
          created_at: string | null
          display_order: number | null
          is_active: boolean | null
          key: string
          label: string
          module: string | null
          parent_key: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          is_active?: boolean | null
          key: string
          label: string
          module?: string | null
          parent_key?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          is_active?: boolean | null
          key?: string
          label?: string
          module?: string | null
          parent_key?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_pages_parent_key_fkey"
            columns: ["parent_key"]
            isOneToOne: false
            referencedRelation: "app_pages"
            referencedColumns: ["key"]
          },
        ]
      }
      bid_types: {
        Row: {
          administrator_id: string | null
          allows_embedded: boolean | null
          company_id: string | null
          created_at: string
          id: string
          is_archived: boolean | null
          is_default: boolean | null
          is_loyalty: boolean | null
          loyalty_months: number | null
          name: string
          percentage: number | null
          updated_at: string
        }
        Insert: {
          administrator_id?: string | null
          allows_embedded?: boolean | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_default?: boolean | null
          is_loyalty?: boolean | null
          loyalty_months?: number | null
          name: string
          percentage?: number | null
          updated_at?: string
        }
        Update: {
          administrator_id?: string | null
          allows_embedded?: boolean | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_default?: boolean | null
          is_loyalty?: boolean | null
          loyalty_months?: number | null
          name?: string
          percentage?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_types_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["entity_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_branding: {
        Row: {
          border_radius_px: number | null
          company_id: string
          logo_horizontal_dark_url: string | null
          logo_horizontal_url: string | null
          logo_square_url: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string | null
        }
        Insert: {
          border_radius_px?: number | null
          company_id: string
          logo_horizontal_dark_url?: string | null
          logo_horizontal_url?: string | null
          logo_square_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
        }
        Update: {
          border_radius_px?: number | null
          company_id?: string
          logo_horizontal_dark_url?: string | null
          logo_horizontal_url?: string | null
          logo_square_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_branding_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          address: string | null
          cep: string | null
          city: string | null
          cnpj: string | null
          company_id: string
          country: string | null
          name: string | null
          neighborhood: string | null
          niche: string | null
          number: string | null
          state: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          company_id: string
          country?: string | null
          name?: string | null
          neighborhood?: string | null
          niche?: string | null
          number?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          company_id?: string
          country?: string | null
          name?: string | null
          neighborhood?: string | null
          niche?: string | null
          number?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          company_id: string
          created_at: string | null
          email: string
          first_name: string
          funnels: string[] | null
          id: string
          last_name: string
          leader_id: string | null
          password_hash: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["entity_status"] | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          company_id: string
          created_at?: string | null
          email: string
          first_name: string
          funnels?: string[] | null
          id?: string
          last_name: string
          leader_id?: string | null
          password_hash?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["entity_status"] | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          company_id?: string
          created_at?: string | null
          email?: string
          first_name?: string
          funnels?: string[] | null
          id?: string
          last_name?: string
          leader_id?: string | null
          password_hash?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["entity_status"] | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_crm_users_leader"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "crm_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_crm_users_team"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_types: {
        Row: {
          administrator_id: string | null
          company_id: string | null
          created_at: string
          fixed_value: number | null
          id: string
          installment_months: number
          is_archived: boolean | null
          is_optional: boolean | null
          name: string
          percentage: number | null
          type: string
          updated_at: string
        }
        Insert: {
          administrator_id?: string | null
          company_id?: string | null
          created_at?: string
          fixed_value?: number | null
          id?: string
          installment_months?: number
          is_archived?: boolean | null
          is_optional?: boolean | null
          name: string
          percentage?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          administrator_id?: string | null
          company_id?: string | null
          created_at?: string
          fixed_value?: number | null
          id?: string
          installment_months?: number
          is_archived?: boolean | null
          is_optional?: boolean | null
          name?: string
          percentage?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_types_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_connections: {
        Row: {
          base_url: string
          created_at: string
          id: string
          instance_key: string
          instance_name: string
          is_active: boolean
          name: string
          owner_email: string
          updated_at: string
        }
        Insert: {
          base_url: string
          created_at?: string
          id?: string
          instance_key: string
          instance_name: string
          is_active?: boolean
          name: string
          owner_email: string
          updated_at?: string
        }
        Update: {
          base_url?: string
          created_at?: string
          id?: string
          instance_key?: string
          instance_name?: string
          is_active?: boolean
          name?: string
          owner_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      funnel_column_settings: {
        Row: {
          columns: Json
          funnel_id: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          columns: Json
          funnel_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          columns?: Json
          funnel_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_column_settings_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_stages: {
        Row: {
          created_at: string | null
          funnel_id: string
          id: string
          name: string
          stage_order: number
          target_percentage: number | null
          target_value: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          funnel_id: string
          id?: string
          name: string
          stage_order: number
          target_percentage?: number | null
          target_value?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          funnel_id?: string
          id?: string
          name?: string
          stage_order?: number
          target_percentage?: number | null
          target_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_stages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          indicator_deadline_hours: number
          meeting_completed_stage_id: string | null
          meeting_scheduled_stage_id: string | null
          name: string
          recommendation_stage_id: string | null
          recommendations_mode: Database["public"]["Enums"]["funnel_mode"]
          sales_value_mode: Database["public"]["Enums"]["funnel_mode"]
          status: Database["public"]["Enums"]["entity_status"] | null
          updated_at: string | null
          verification_day: number | null
          verification_type: Database["public"]["Enums"]["funnel_verification"]
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          indicator_deadline_hours?: number
          meeting_completed_stage_id?: string | null
          meeting_scheduled_stage_id?: string | null
          name: string
          recommendation_stage_id?: string | null
          recommendations_mode?: Database["public"]["Enums"]["funnel_mode"]
          sales_value_mode?: Database["public"]["Enums"]["funnel_mode"]
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string | null
          verification_day?: number | null
          verification_type: Database["public"]["Enums"]["funnel_verification"]
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          indicator_deadline_hours?: number
          meeting_completed_stage_id?: string | null
          meeting_scheduled_stage_id?: string | null
          name?: string
          recommendation_stage_id?: string | null
          recommendations_mode?: Database["public"]["Enums"]["funnel_mode"]
          sales_value_mode?: Database["public"]["Enums"]["funnel_mode"]
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string | null
          verification_day?: number | null
          verification_type?: Database["public"]["Enums"]["funnel_verification"]
        }
        Relationships: [
          {
            foreignKeyName: "funnels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnels_meeting_completed_stage_id_fkey"
            columns: ["meeting_completed_stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnels_meeting_scheduled_stage_id_fkey"
            columns: ["meeting_scheduled_stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnels_recommendation_stage_id_fkey"
            columns: ["recommendation_stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_values: {
        Row: {
          created_at: string | null
          id: string
          indicator_id: string
          stage_id: string
          updated_at: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          indicator_id: string
          stage_id: string
          updated_at?: string | null
          value?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          indicator_id?: string
          stage_id?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "indicator_values_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_values_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      indicators: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string | null
          funnel_id: string
          id: string
          is_delayed: boolean | null
          month_reference: number
          period_date: string | null
          period_end: string | null
          period_start: string | null
          recommendations_count: number | null
          sales_value: number | null
          updated_at: string | null
          user_id: string
          year_reference: number
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string | null
          funnel_id: string
          id?: string
          is_delayed?: boolean | null
          month_reference: number
          period_date?: string | null
          period_end?: string | null
          period_start?: string | null
          recommendations_count?: number | null
          sales_value?: number | null
          updated_at?: string | null
          user_id: string
          year_reference: number
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string | null
          funnel_id?: string
          id?: string
          is_delayed?: boolean | null
          month_reference?: number
          period_date?: string | null
          period_end?: string | null
          period_start?: string | null
          recommendations_count?: number | null
          sales_value?: number | null
          updated_at?: string | null
          user_id?: string
          year_reference?: number
        }
        Relationships: [
          {
            foreignKeyName: "indicators_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicators_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "crm_users"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_reductions: {
        Row: {
          administrator_id: string | null
          applications: string[]
          company_id: string
          created_at: string
          id: string
          is_archived: boolean
          name: string
          reduction_percent: number
          updated_at: string
        }
        Insert: {
          administrator_id?: string | null
          applications?: string[]
          company_id: string
          created_at?: string
          id?: string
          is_archived?: boolean
          name: string
          reduction_percent: number
          updated_at?: string
        }
        Update: {
          administrator_id?: string | null
          applications?: string[]
          company_id?: string
          created_at?: string
          id?: string
          is_archived?: boolean
          name?: string
          reduction_percent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_reductions_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_reductions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_type_reductions: {
        Row: {
          id: string
          installment_reduction_id: string
          installment_type_id: string
        }
        Insert: {
          id?: string
          installment_reduction_id: string
          installment_type_id: string
        }
        Update: {
          id?: string
          installment_reduction_id?: string
          installment_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_type_reductions_installment_reduction_id_fkey"
            columns: ["installment_reduction_id"]
            isOneToOne: false
            referencedRelation: "installment_reductions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_type_reductions_installment_type_id_fkey"
            columns: ["installment_type_id"]
            isOneToOne: false
            referencedRelation: "installment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_types: {
        Row: {
          admin_tax_percent: number | null
          administrator_id: string | null
          annual_update_rate: number | null
          company_id: string | null
          created_at: string
          id: string
          installment_count: number | null
          insurance_percent: number | null
          is_archived: boolean | null
          is_default: boolean | null
          name: string
          optional_insurance: boolean | null
          reduces_admin_tax: boolean | null
          reduces_credit: boolean | null
          reduces_insurance: boolean | null
          reduces_reserve_fund: boolean | null
          reduction_percentage: number | null
          reserve_fund_percent: number | null
          updated_at: string
        }
        Insert: {
          admin_tax_percent?: number | null
          administrator_id?: string | null
          annual_update_rate?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          installment_count?: number | null
          insurance_percent?: number | null
          is_archived?: boolean | null
          is_default?: boolean | null
          name: string
          optional_insurance?: boolean | null
          reduces_admin_tax?: boolean | null
          reduces_credit?: boolean | null
          reduces_insurance?: boolean | null
          reduces_reserve_fund?: boolean | null
          reduction_percentage?: number | null
          reserve_fund_percent?: number | null
          updated_at?: string
        }
        Update: {
          admin_tax_percent?: number | null
          administrator_id?: string | null
          annual_update_rate?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          installment_count?: number | null
          insurance_percent?: number | null
          is_archived?: boolean | null
          is_default?: boolean | null
          name?: string
          optional_insurance?: boolean | null
          reduces_admin_tax?: boolean | null
          reduces_credit?: boolean | null
          reduces_insurance?: boolean | null
          reduces_reserve_fund?: boolean | null
          reduction_percentage?: number | null
          reserve_fund_percent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_types_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string | null
          current_stage_id: string
          email: string | null
          funnel_id: string
          id: string
          name: string
          phone: string | null
          responsible_id: string
          source_id: string | null
          status: Database["public"]["Enums"]["entity_status"] | null
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string | null
          current_stage_id: string
          email?: string | null
          funnel_id: string
          id?: string
          name: string
          phone?: string | null
          responsible_id: string
          source_id?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string | null
          current_stage_id?: string
          email?: string | null
          funnel_id?: string
          id?: string
          name?: string
          phone?: string | null
          responsible_id?: string
          source_id?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "crm_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      leverages: {
        Row: {
          company_id: string | null
          created_at: string | null
          daily_percentage: number | null
          fixed_property_value: number | null
          has_fixed_property_value: boolean | null
          id: string
          is_archived: boolean | null
          management_percentage: number | null
          name: string
          occupancy_rate: number | null
          real_estate_percentage: number | null
          rental_percentage: number | null
          subtype: string | null
          total_expenses: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          daily_percentage?: number | null
          fixed_property_value?: number | null
          has_fixed_property_value?: boolean | null
          id?: string
          is_archived?: boolean | null
          management_percentage?: number | null
          name: string
          occupancy_rate?: number | null
          real_estate_percentage?: number | null
          rental_percentage?: number | null
          subtype?: string | null
          total_expenses?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          daily_percentage?: number | null
          fixed_property_value?: number | null
          has_fixed_property_value?: boolean | null
          id?: string
          is_archived?: boolean | null
          management_percentage?: number | null
          name?: string
          occupancy_rate?: number | null
          real_estate_percentage?: number | null
          rental_percentage?: number | null
          subtype?: string | null
          total_expenses?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leverages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_installment_types: {
        Row: {
          id: string
          installment_type_id: string
          product_id: string
        }
        Insert: {
          id?: string
          installment_type_id: string
          product_id: string
        }
        Update: {
          id?: string
          installment_type_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_installment_types_installment_type_id_fkey"
            columns: ["installment_type_id"]
            isOneToOne: false
            referencedRelation: "installment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_installment_types_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          admin_tax_percent: number | null
          administrator_id: string | null
          company_id: string | null
          created_at: string
          credit_value: number
          id: string
          installment_value: number | null
          insurance_percent: number | null
          is_archived: boolean | null
          name: string
          reserve_fund_percent: number | null
          type: string
          updated_at: string
        }
        Insert: {
          admin_tax_percent?: number | null
          administrator_id?: string | null
          company_id?: string | null
          created_at?: string
          credit_value: number
          id?: string
          installment_value?: number | null
          insurance_percent?: number | null
          is_archived?: boolean | null
          name: string
          reserve_fund_percent?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          admin_tax_percent?: number | null
          administrator_id?: string | null
          company_id?: string | null
          created_at?: string
          credit_value?: number
          id?: string
          installment_value?: number | null
          insurance_percent?: number | null
          is_archived?: boolean | null
          name?: string
          reserve_fund_percent?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      role_page_permissions: {
        Row: {
          allowed: boolean
          company_id: string | null
          created_at: string | null
          id: string
          page: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          allowed?: boolean
          company_id?: string | null
          created_at?: string | null
          id?: string
          page: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          allowed?: boolean
          company_id?: string | null
          created_at?: string | null
          id?: string
          page?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_page_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string | null
          id: string
          lead_id: string
          responsible_id: string
          sale_date: string
          sale_value: number
          status: Database["public"]["Enums"]["entity_status"] | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          lead_id: string
          responsible_id: string
          sale_date: string
          sale_value: number
          status?: Database["public"]["Enums"]["entity_status"] | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          lead_id?: string
          responsible_id?: string
          sale_date?: string
          sale_value?: number
          status?: Database["public"]["Enums"]["entity_status"] | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "crm_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduling_availability: {
        Row: {
          company_id: string
          created_at: string
          end_time: string
          id: string
          is_active: boolean
          owner_user_id: string
          start_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          company_id: string
          created_at?: string
          end_time: string
          id?: string
          is_active?: boolean
          owner_user_id: string
          start_time: string
          updated_at?: string
          weekday: number
        }
        Update: {
          company_id?: string
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean
          owner_user_id?: string
          start_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      scheduling_calendar_settings: {
        Row: {
          company_id: string
          created_at: string
          google_calendar_id: string | null
          owner_user_id: string
          sync_enabled: boolean
          two_way_sync: boolean
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          google_calendar_id?: string | null
          owner_user_id: string
          sync_enabled?: boolean
          two_way_sync?: boolean
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          google_calendar_id?: string | null
          owner_user_id?: string
          sync_enabled?: boolean
          two_way_sync?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      scheduling_day_intervals: {
        Row: {
          company_id: string
          created_at: string
          end_time: string
          id: string
          name: string | null
          owner_user_id: string
          start_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          company_id: string
          created_at?: string
          end_time: string
          id?: string
          name?: string | null
          owner_user_id: string
          start_time: string
          updated_at?: string
          weekday: number
        }
        Update: {
          company_id?: string
          created_at?: string
          end_time?: string
          id?: string
          name?: string | null
          owner_user_id?: string
          start_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      scheduling_event_type_forms: {
        Row: {
          company_id: string
          created_at: string
          event_type_id: string
          form_id: string
          id: string
          owner_user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          event_type_id: string
          form_id: string
          id?: string
          owner_user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          event_type_id?: string
          form_id?: string
          id?: string
          owner_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduling_event_type_forms_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "scheduling_event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduling_event_type_forms_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "scheduling_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduling_event_types: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          min_gap_minutes: number
          name: string
          owner_user_id: string
          scope: string
          status: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          min_gap_minutes?: number
          name: string
          owner_user_id: string
          scope?: string
          status?: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          min_gap_minutes?: number
          name?: string
          owner_user_id?: string
          scope?: string
          status?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scheduling_events: {
        Row: {
          attendee_email: string | null
          company_id: string
          created_at: string
          created_by_user_id: string
          description: string | null
          end_at: string
          event_type_id: string | null
          google_event_id: string | null
          id: string
          owner_user_id: string
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          attendee_email?: string | null
          company_id: string
          created_at?: string
          created_by_user_id: string
          description?: string | null
          end_at: string
          event_type_id?: string | null
          google_event_id?: string | null
          id?: string
          owner_user_id: string
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          attendee_email?: string | null
          company_id?: string
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          end_at?: string
          event_type_id?: string | null
          google_event_id?: string | null
          id?: string
          owner_user_id?: string
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduling_events_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "scheduling_event_types"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduling_form_fields: {
        Row: {
          allow_comma: boolean
          created_at: string
          currency_code: string | null
          form_id: string
          id: string
          label: string
          options: Json | null
          required: boolean
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          allow_comma?: boolean
          created_at?: string
          currency_code?: string | null
          form_id: string
          id?: string
          label: string
          options?: Json | null
          required?: boolean
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          allow_comma?: boolean
          created_at?: string
          currency_code?: string | null
          form_id?: string
          id?: string
          label?: string
          options?: Json | null
          required?: boolean
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduling_form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "scheduling_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduling_forms: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          owner_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      simulator_configurations: {
        Row: {
          company_id: string
          configuration: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          configuration: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          configuration?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulator_configurations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulator_configurations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "crm_users"
            referencedColumns: ["id"]
          },
        ]
      }
      simulator_copy_map: {
        Row: {
          created_at: string
          source_id: string
          source_table: string
          target_company_id: string
          target_id: string
        }
        Insert: {
          created_at?: string
          source_id: string
          source_table: string
          target_company_id: string
          target_id: string
        }
        Update: {
          created_at?: string
          source_id?: string
          source_table?: string
          target_company_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulator_copy_map_target_company_id_fkey"
            columns: ["target_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["entity_status"] | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          leader_id: string
          name: string
          status: Database["public"]["Enums"]["entity_status"] | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          leader_id: string
          name: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          leader_id?: string
          name?: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "crm_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      auth_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_crm_user_by_email: {
        Args: { user_email: string }
        Returns: {
          avatar_url: string
          bio: string
          birth_date: string
          company_id: string
          created_at: string
          email: string
          first_name: string
          funnels: string[]
          id: string
          last_name: string
          leader_id: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["entity_status"]
          team_id: string
          updated_at: string
        }[]
      }
      get_user_role: {
        Args: { user_email: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      set_team_members: {
        Args: { p_company: string; p_member_ids: string[]; p_team: string }
        Returns: undefined
      }
      set_team_members_master: {
        Args: { p_company: string; p_member_ids: string[]; p_team: string }
        Returns: undefined
      }
      user_belongs_to_company: {
        Args: { comp_id: string; user_email: string }
        Returns: boolean
      }
    }
    Enums: {
      entity_status: "active" | "archived"
      funnel_mode: "manual" | "sistema"
      funnel_verification: "daily" | "weekly" | "monthly"
      user_role: "master" | "admin" | "leader" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      entity_status: ["active", "archived"],
      funnel_mode: ["manual", "sistema"],
      funnel_verification: ["daily", "weekly", "monthly"],
      user_role: ["master", "admin", "leader", "user"],
    },
  },
} as const
