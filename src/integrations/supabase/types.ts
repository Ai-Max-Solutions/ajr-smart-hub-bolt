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
          level: string | null
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string | null
          name: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string | null
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
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role_enum"]
          supabase_auth_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"]
          supabase_auth_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"]
          supabase_auth_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
