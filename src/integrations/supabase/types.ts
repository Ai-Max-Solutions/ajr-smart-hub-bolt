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
      contractor_rams_signatures: {
        Row: {
          contractor_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_current: boolean
          rams_document_id: string
          reading_time_seconds: number
          signature_data: string
          signed_at: string
          updated_at: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_current?: boolean
          rams_document_id: string
          reading_time_seconds?: number
          signature_data: string
          signed_at?: string
          updated_at?: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_current?: boolean
          rams_document_id?: string
          reading_time_seconds?: number
          signature_data?: string
          signed_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_rams_signatures_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_rams_signatures_rams_document_id_fkey"
            columns: ["rams_document_id"]
            isOneToOne: false
            referencedRelation: "rams_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      cscs_cards: {
        Row: {
          back_image_url: string | null
          card_color: string | null
          card_number: string
          card_type: string
          confidence_score: number | null
          created_at: string
          expiry_date: string
          front_image_url: string | null
          id: string
          qualifications: Json | null
          raw_ai_response: Json | null
          status: string
          updated_at: string
          user_id: string
          verification_notes: string | null
        }
        Insert: {
          back_image_url?: string | null
          card_color?: string | null
          card_number: string
          card_type: string
          confidence_score?: number | null
          created_at?: string
          expiry_date: string
          front_image_url?: string | null
          id?: string
          qualifications?: Json | null
          raw_ai_response?: Json | null
          status?: string
          updated_at?: string
          user_id: string
          verification_notes?: string | null
        }
        Update: {
          back_image_url?: string | null
          card_color?: string | null
          card_number?: string
          card_type?: string
          confidence_score?: number | null
          created_at?: string
          expiry_date?: string
          front_image_url?: string | null
          id?: string
          qualifications?: Json | null
          raw_ai_response?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cscs_cards_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          relationship: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          relationship: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          relationship?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_emergency_contacts_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      on_hire_items: {
        Row: {
          category: string
          created_at: string
          current_project_id: string | null
          daily_rate: number
          hire_date: string | null
          hired_by: string | null
          id: string
          name: string
          return_date: string | null
          status: Database["public"]["Enums"]["hire_status_enum"]
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          current_project_id?: string | null
          daily_rate: number
          hire_date?: string | null
          hired_by?: string | null
          id?: string
          name: string
          return_date?: string | null
          status?: Database["public"]["Enums"]["hire_status_enum"]
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          current_project_id?: string | null
          daily_rate?: number
          hire_date?: string | null
          hired_by?: string | null
          id?: string
          name?: string
          return_date?: string | null
          status?: Database["public"]["Enums"]["hire_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "on_hire_items_current_project_id_fkey"
            columns: ["current_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "on_hire_items_hired_by_fkey"
            columns: ["hired_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plots: {
        Row: {
          created_at: string
          id: string
          level: number | null
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number | null
          name: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number | null
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plots_level_backup: {
        Row: {
          id: string | null
          original_level: string | null
        }
        Insert: {
          id?: string | null
          original_level?: string | null
        }
        Update: {
          id?: string | null
          original_level?: string | null
        }
        Relationships: []
      }
      project_rams_requirements: {
        Row: {
          created_at: string
          id: string
          is_mandatory: boolean
          project_id: string
          rams_document_id: string
          required_work_types: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_mandatory?: boolean
          project_id: string
          rams_document_id: string
          required_work_types?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_mandatory?: boolean
          project_id?: string
          rams_document_id?: string
          required_work_types?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_rams_requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_rams_requirements_rams_document_id_fkey"
            columns: ["rams_document_id"]
            isOneToOne: false
            referencedRelation: "rams_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client: string
          code: string
          created_at: string
          end_date: string | null
          id: string
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          client: string
          code: string
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          client?: string
          code?: string
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      qualifications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      rams_documents: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          minimum_read_time: number
          project_id: string | null
          requires_fresh_signature: boolean
          risk_level: string
          title: string
          updated_at: string
          version: string
          work_types: string[]
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          minimum_read_time?: number
          project_id?: string | null
          requires_fresh_signature?: boolean
          risk_level: string
          title: string
          updated_at?: string
          version?: string
          work_types?: string[]
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          minimum_read_time?: number
          project_id?: string | null
          requires_fresh_signature?: boolean
          risk_level?: string
          title?: string
          updated_at?: string
          version?: string
          work_types?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "rams_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheet_entries: {
        Row: {
          created_at: string
          hours: number
          id: string
          notes: string | null
          plot_id: string
          timesheet_id: string
          updated_at: string
          work_category_id: string
        }
        Insert: {
          created_at?: string
          hours: number
          id?: string
          notes?: string | null
          plot_id: string
          timesheet_id: string
          updated_at?: string
          work_category_id: string
        }
        Update: {
          created_at?: string
          hours?: number
          id?: string
          notes?: string | null
          plot_id?: string
          timesheet_id?: string
          updated_at?: string
          work_category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_entries_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheet_entries_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "timesheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheet_entries_work_category_id_fkey"
            columns: ["work_category_id"]
            isOneToOne: false
            referencedRelation: "work_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          created_at: string
          id: string
          project_id: string
          status: Database["public"]["Enums"]["timesheet_status_enum"]
          updated_at: string
          user_id: string
          week_commencing: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["timesheet_status_enum"]
          updated_at?: string
          user_id: string
          week_commencing: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["timesheet_status_enum"]
          updated_at?: string
          user_id?: string
          week_commencing?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_job_rates: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          hourly_rate: number
          id: string
          role: Database["public"]["Enums"]["user_role_enum"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          effective_from: string
          effective_to?: string | null
          hourly_rate: number
          id?: string
          role: Database["public"]["Enums"]["user_role_enum"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          hourly_rate?: number
          id?: string
          role?: Database["public"]["Enums"]["user_role_enum"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_job_rates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_qualifications: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          obtained_date: string
          qualification_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          obtained_date: string
          qualification_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          obtained_date?: string
          qualification_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_qualifications_qualification_id_fkey"
            columns: ["qualification_id"]
            isOneToOne: false
            referencedRelation: "qualifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_qualifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_work_types: {
        Row: {
          created_at: string
          id: string
          user_id: string
          work_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          work_type: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_work_types_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          airtable_created_time: string | null
          created_at: string
          currentproject: string | null
          email: string
          employmentstatus: string | null
          firstname: string | null
          fullname: string | null
          id: string
          internalnotes: string | null
          last_sign_in: string | null
          lastname: string | null
          name: string
          onboarding_completed: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role_enum"]
          supabase_auth_id: string | null
          updated_at: string
        }
        Insert: {
          airtable_created_time?: string | null
          created_at?: string
          currentproject?: string | null
          email: string
          employmentstatus?: string | null
          firstname?: string | null
          fullname?: string | null
          id?: string
          internalnotes?: string | null
          last_sign_in?: string | null
          lastname?: string | null
          name: string
          onboarding_completed?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"]
          supabase_auth_id?: string | null
          updated_at?: string
        }
        Update: {
          airtable_created_time?: string | null
          created_at?: string
          currentproject?: string | null
          email?: string
          employmentstatus?: string | null
          firstname?: string | null
          fullname?: string | null
          id?: string
          internalnotes?: string | null
          last_sign_in?: string | null
          lastname?: string | null
          name?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"]
          supabase_auth_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_currentproject_fkey"
            columns: ["currentproject"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      work_categories: {
        Row: {
          created_at: string
          id: string
          main_category: string
          sub_task: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          main_category: string
          sub_task: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          main_category?: string
          sub_task?: string
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
      get_contractor_rams_compliance: {
        Args: { p_contractor_id: string; p_project_id?: string }
        Returns: Json
      }
    }
    Enums: {
      hire_status_enum: "Available" | "On Hire" | "Maintenance" | "Damaged"
      timesheet_status_enum: "Draft" | "Submitted" | "Approved" | "Rejected"
      user_role_enum: "Operative" | "Supervisor" | "Admin" | "PM" | "Director"
      work_status_enum: "Available" | "In Progress" | "Completed" | "On Hold"
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
      hire_status_enum: ["Available", "On Hire", "Maintenance", "Damaged"],
      timesheet_status_enum: ["Draft", "Submitted", "Approved", "Rejected"],
      user_role_enum: ["Operative", "Supervisor", "Admin", "PM", "Director"],
      work_status_enum: ["Available", "In Progress", "Completed", "On Hold"],
    },
  },
} as const
