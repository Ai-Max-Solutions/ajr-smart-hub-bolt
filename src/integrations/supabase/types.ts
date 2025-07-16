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
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      contractor_companies: {
        Row: {
          company_name: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      contractor_profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "contractor_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      enhanced_audit_log: {
        Row: {
          action: string
          created_at: string
          evidence_chain_hash: string | null
          gdpr_retention_category: string | null
          id: string
          ip_address: string | null
          legal_hold: boolean | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          evidence_chain_hash?: string | null
          gdpr_retention_category?: string | null
          id?: string
          ip_address?: string | null
          legal_hold?: boolean | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          evidence_chain_hash?: string | null
          gdpr_retention_category?: string | null
          id?: string
          ip_address?: string | null
          legal_hold?: boolean | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          id: string
          projectname: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          projectname: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          projectname?: string
          updated_at?: string
        }
        Relationships: []
      }
      rams_documents: {
        Row: {
          created_at: string
          document_version: string
          id: string
          is_current_version: boolean | null
          title: string
          updated_at: string
          work_types: string[] | null
        }
        Insert: {
          created_at?: string
          document_version: string
          id?: string
          is_current_version?: boolean | null
          title: string
          updated_at?: string
          work_types?: string[] | null
        }
        Update: {
          created_at?: string
          document_version?: string
          id?: string
          is_current_version?: boolean | null
          title?: string
          updated_at?: string
          work_types?: string[] | null
        }
        Relationships: []
      }
      task_plan_rams_register: {
        Row: {
          contractor_id: string | null
          created_at: string
          created_by: string | null
          date_issued: string
          date_signed: string | null
          id: string
          project_id: string | null
          project_name: string
          rams_document_id: string | null
          rams_name: string
          responsible_person: string
          signed_by: string | null
          status: string | null
          subcontractor_company: string
          updated_at: string
          version: string
          work_activity: string
          work_activity_id: string | null
        }
        Insert: {
          contractor_id?: string | null
          created_at?: string
          created_by?: string | null
          date_issued?: string
          date_signed?: string | null
          id?: string
          project_id?: string | null
          project_name: string
          rams_document_id?: string | null
          rams_name: string
          responsible_person: string
          signed_by?: string | null
          status?: string | null
          subcontractor_company: string
          updated_at?: string
          version: string
          work_activity: string
          work_activity_id?: string | null
        }
        Update: {
          contractor_id?: string | null
          created_at?: string
          created_by?: string | null
          date_issued?: string
          date_signed?: string | null
          id?: string
          project_id?: string | null
          project_name?: string
          rams_document_id?: string | null
          rams_name?: string
          responsible_person?: string
          signed_by?: string | null
          status?: string | null
          subcontractor_company?: string
          updated_at?: string
          version?: string
          work_activity?: string
          work_activity_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_plan_rams_register_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_plan_rams_register_rams_document_id_fkey"
            columns: ["rams_document_id"]
            isOneToOne: false
            referencedRelation: "rams_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_plan_rams_register_work_activity_id_fkey"
            columns: ["work_activity_id"]
            isOneToOne: false
            referencedRelation: "work_activity_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      taskplanrams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          employmentstatus: string | null
          fullname: string | null
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employmentstatus?: string | null
          fullname?: string | null
          id?: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employmentstatus?: string | null
          fullname?: string | null
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      work_activity_categories: {
        Row: {
          code: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      detect_suspicious_activity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
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
