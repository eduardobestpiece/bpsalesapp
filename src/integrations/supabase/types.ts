export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      administrators: {
        Row: {
          company_id: string | null
          created_at: string
          credit_update_type: string
          grace_period_days: number | null
          id: string
          is_archived: boolean | null
          is_default: boolean | null
          max_embedded_percentage: number | null
          name: string
          special_entry_fixed_value: number | null
          special_entry_installments: number | null
          special_entry_percentage: number | null
          special_entry_type: string | null
          update_month: number | null
          update_type: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          credit_update_type: string
          grace_period_days?: number | null
          id?: string
          is_archived?: boolean | null
          is_default?: boolean | null
          max_embedded_percentage?: number | null
          name: string
          special_entry_fixed_value?: number | null
          special_entry_installments?: number | null
          special_entry_percentage?: number | null
          special_entry_type?: string | null
          update_month?: number | null
          update_type?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          credit_update_type?: string
          grace_period_days?: number | null
          id?: string
          is_archived?: boolean | null
          is_default?: boolean | null
          max_embedded_percentage?: number | null
          name?: string
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
          password_hash: string
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
          password_hash: string
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
          password_hash?: string
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
          type: string
          updated_at: string
        }
        Insert: {
          admin_tax_percent?: number | null
          administrator_id?: string | null
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
          type: string
          updated_at?: string
        }
        Update: {
          admin_tax_percent?: number | null
          administrator_id?: string | null
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
          type?: string
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
          term_options: number[]
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
          term_options: number[]
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
          term_options?: number[]
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
      get_user_role: {
        Args: { user_email: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      user_belongs_to_company: {
        Args: { user_email: string; comp_id: string }
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
