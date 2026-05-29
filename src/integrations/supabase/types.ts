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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cold_storage: {
        Row: {
          best_before: string | null
          cartons: number | null
          chamber_no: string
          created_at: string
          id: string
          packing_date: string | null
          product_name: string
          quantity_kg: number
          temp_max: number | null
          temp_min: number | null
          temperature_c: number | null
          updated_at: string
        }
        Insert: {
          best_before?: string | null
          cartons?: number | null
          chamber_no: string
          created_at?: string
          id?: string
          packing_date?: string | null
          product_name: string
          quantity_kg: number
          temp_max?: number | null
          temp_min?: number | null
          temperature_c?: number | null
          updated_at?: string
        }
        Update: {
          best_before?: string | null
          cartons?: number | null
          chamber_no?: string
          created_at?: string
          id?: string
          packing_date?: string | null
          product_name?: string
          quantity_kg?: number
          temp_max?: number | null
          temp_min?: number | null
          temperature_c?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          action_taken: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          incident_date: string
          incident_type: string
          persons_involved: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          incident_date?: string
          incident_type: string
          persons_involved?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          incident_date?: string
          incident_type?: string
          persons_involved?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      processing_batches: {
        Row: {
          batch_id: string
          byproduct_disposal: string | null
          byproduct_kg: number | null
          created_at: string
          created_by: string | null
          end_time: string | null
          id: string
          input_weight_kg: number | null
          intake_id: string | null
          machines_used: string | null
          notes: string | null
          output_weight_kg: number | null
          processing_type: string
          start_time: string
          status: string
          updated_at: string
          wastage_kg: number | null
          workers_count: number
          yield_pct: number | null
        }
        Insert: {
          batch_id?: string
          byproduct_disposal?: string | null
          byproduct_kg?: number | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          input_weight_kg?: number | null
          intake_id?: string | null
          machines_used?: string | null
          notes?: string | null
          output_weight_kg?: number | null
          processing_type: string
          start_time?: string
          status?: string
          updated_at?: string
          wastage_kg?: number | null
          workers_count?: number
          yield_pct?: number | null
        }
        Update: {
          batch_id?: string
          byproduct_disposal?: string | null
          byproduct_kg?: number | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          input_weight_kg?: number | null
          intake_id?: string | null
          machines_used?: string | null
          notes?: string | null
          output_weight_kg?: number | null
          processing_type?: string
          start_time?: string
          status?: string
          updated_at?: string
          wastage_kg?: number | null
          workers_count?: number
          yield_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "processing_batches_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "shrimp_intake"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          designation: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          designation?: string | null
          email: string
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      qc_inspections: {
        Row: {
          bacterial_count: number | null
          batch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          inspection_date: string
          inspector_name: string
          ph: number | null
          remarks: string | null
          status: string
          temperature_c: number | null
        }
        Insert: {
          bacterial_count?: number | null
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          inspection_date?: string
          inspector_name: string
          ph?: number | null
          remarks?: string | null
          status?: string
          temperature_c?: number | null
        }
        Update: {
          bacterial_count?: number | null
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          inspection_date?: string
          inspector_name?: string
          ph?: number | null
          remarks?: string | null
          status?: string
          temperature_c?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "qc_inspections_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "processing_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      shrimp_intake: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          intake_date: string
          lot_number: string
          moisture_pct: number | null
          price_per_kg: number
          quality_grade: string | null
          quantity_kg: number
          remarks: string | null
          species: string
          supplier_name: string
          temperature_c: number | null
          total_cost: number | null
          updated_at: string
          vehicle_number: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          intake_date?: string
          lot_number?: string
          moisture_pct?: number | null
          price_per_kg?: number
          quality_grade?: string | null
          quantity_kg: number
          remarks?: string | null
          species: string
          supplier_name: string
          temperature_c?: number | null
          total_cost?: number | null
          updated_at?: string
          vehicle_number?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          intake_date?: string
          lot_number?: string
          moisture_pct?: number | null
          price_per_kg?: number
          quality_grade?: string | null
          quantity_kg?: number
          remarks?: string | null
          species?: string
          supplier_name?: string
          temperature_c?: number | null
          total_cost?: number | null
          updated_at?: string
          vehicle_number?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitors: {
        Row: {
          check_in: string
          check_out: string | null
          created_at: string
          host_employee: string | null
          id: string
          id_number: string | null
          id_type: string | null
          purpose: string | null
          vehicle_number: string | null
          visitor_name: string
        }
        Insert: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          host_employee?: string | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          purpose?: string | null
          vehicle_number?: string | null
          visitor_name: string
        }
        Update: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          host_employee?: string | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          purpose?: string | null
          vehicle_number?: string | null
          visitor_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "security_officer"
        | "processing_supervisor"
        | "store_manager"
        | "hr_manager"
        | "accounts_officer"
        | "gate_guard"
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
      app_role: [
        "super_admin",
        "admin",
        "security_officer",
        "processing_supervisor",
        "store_manager",
        "hr_manager",
        "accounts_officer",
        "gate_guard",
      ],
    },
  },
} as const
