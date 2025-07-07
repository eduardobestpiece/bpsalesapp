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
          created_at: string
          credit_update_type: string
          grace_period_days: number | null
          id: string
          is_archived: boolean | null
          max_embedded_percentage: number | null
          name: string
          special_entry_fixed_value: number | null
          special_entry_installments: number | null
          special_entry_percentage: number | null
          special_entry_type: string | null
          update_month: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_update_type: string
          grace_period_days?: number | null
          id?: string
          is_archived?: boolean | null
          max_embedded_percentage?: number | null
          name: string
          special_entry_fixed_value?: number | null
          special_entry_installments?: number | null
          special_entry_percentage?: number | null
          special_entry_type?: string | null
          update_month?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_update_type?: string
          grace_period_days?: number | null
          id?: string
          is_archived?: boolean | null
          max_embedded_percentage?: number | null
          name?: string
          special_entry_fixed_value?: number | null
          special_entry_installments?: number | null
          special_entry_percentage?: number | null
          special_entry_type?: string | null
          update_month?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      bid_types: {
        Row: {
          administrator_id: string | null
          allows_embedded: boolean | null
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
        ]
      }
      entry_types: {
        Row: {
          administrator_id: string | null
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
        ]
      }
      installment_types: {
        Row: {
          administrator_id: string | null
          created_at: string
          id: string
          is_archived: boolean | null
          name: string
          reduces_admin_tax: boolean | null
          reduces_credit: boolean | null
          reduces_insurance: boolean | null
          reduces_reserve_fund: boolean | null
          reduction_percentage: number | null
          type: string
          updated_at: string
        }
        Insert: {
          administrator_id?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          name: string
          reduces_admin_tax?: boolean | null
          reduces_credit?: boolean | null
          reduces_insurance?: boolean | null
          reduces_reserve_fund?: boolean | null
          reduction_percentage?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          administrator_id?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          name?: string
          reduces_admin_tax?: boolean | null
          reduces_credit?: boolean | null
          reduces_insurance?: boolean | null
          reduces_reserve_fund?: boolean | null
          reduction_percentage?: number | null
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
        ]
      }
      products: {
        Row: {
          administrator_id: string | null
          created_at: string
          credit_value: number
          id: string
          is_archived: boolean | null
          name: string
          term_options: number[]
          type: string
          updated_at: string
        }
        Insert: {
          administrator_id?: string | null
          created_at?: string
          credit_value: number
          id?: string
          is_archived?: boolean | null
          name: string
          term_options: number[]
          type: string
          updated_at?: string
        }
        Update: {
          administrator_id?: string | null
          created_at?: string
          credit_value?: number
          id?: string
          is_archived?: boolean | null
          name?: string
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
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
