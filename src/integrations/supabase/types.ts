export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
