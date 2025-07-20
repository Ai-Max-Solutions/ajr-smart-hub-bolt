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
          expiry_date: string | null
          front_image_url: string | null
          id: string
          qualifications: Json | null
          raw_ai_response: Json | null
          status: string
          updated_at: string
          user_id: string
          verification_notes: string | null
          verified: boolean | null
        }
        Insert: {
          back_image_url?: string | null
          card_color?: string | null
          card_number: string
          card_type: string
          confidence_score?: number | null
          created_at?: string
          expiry_date?: string | null
          front_image_url?: string | null
          id?: string
          qualifications?: Json | null
          raw_ai_response?: Json | null
          status?: string
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verified?: boolean | null
        }
        Update: {
          back_image_url?: string | null
          card_color?: string | null
          card_number?: string
          card_type?: string
          confidence_score?: number | null
          created_at?: string
          expiry_date?: string | null
          front_image_url?: string | null
          id?: string
          qualifications?: Json | null
          raw_ai_response?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verified?: boolean | null
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
      notification_recipients: {
        Row: {
          dismissed: boolean | null
          id: number
          notification_id: number | null
          received_at: string | null
          user_id: string | null
        }
        Insert: {
          dismissed?: boolean | null
          id?: never
          notification_id?: number | null
          received_at?: string | null
          user_id?: string | null
        }
        Update: {
          dismissed?: boolean | null
          id?: never
          notification_id?: number | null
          received_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          creator_id: string | null
          id: number
          link: string | null
          type: string
        }
        Insert: {
          body: string
          created_at?: string | null
          creator_id?: string | null
          id?: never
          link?: string | null
          type: string
        }
        Update: {
          body?: string
          created_at?: string | null
          creator_id?: string | null
          id?: never
          link?: string | null
          type?: string
        }
        Relationships: []
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
      plot_qr_codes: {
        Row: {
          created_at: string
          id: string
          plot_id: string
          qr_code_data: string
          qr_image_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          plot_id: string
          qr_code_data: string
          qr_image_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          plot_id?: string
          qr_code_data?: string
          qr_image_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plot_qr_codes_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: true
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      plot_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          completed_date: string | null
          created_at: string
          id: string
          notes: string | null
          plot_id: string
          project_id: string
          requires_test: boolean | null
          scheduled_date: string | null
          status: string | null
          task_catalog_id: string
          test_completed: boolean | null
          test_data: Json | null
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          plot_id: string
          project_id: string
          requires_test?: boolean | null
          scheduled_date?: string | null
          status?: string | null
          task_catalog_id: string
          test_completed?: boolean | null
          test_data?: Json | null
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          plot_id?: string
          project_id?: string
          requires_test?: boolean | null
          scheduled_date?: string | null
          status?: string | null
          task_catalog_id?: string
          test_completed?: boolean | null
          test_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plot_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plot_tasks_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plot_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plot_tasks_task_catalog_id_fkey"
            columns: ["task_catalog_id"]
            isOneToOne: false
            referencedRelation: "task_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      plots: {
        Row: {
          block_id: string | null
          code: string | null
          composite_code: string | null
          created_at: string
          description: string | null
          handed_over: boolean | null
          id: string
          level: number | null
          level_id: string | null
          name: string
          plot_sequence_order: number | null
          project_id: string
          sequence_order: number | null
          status: string | null
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          block_id?: string | null
          code?: string | null
          composite_code?: string | null
          created_at?: string
          description?: string | null
          handed_over?: boolean | null
          id?: string
          level?: number | null
          level_id?: string | null
          name: string
          plot_sequence_order?: number | null
          project_id: string
          sequence_order?: number | null
          status?: string | null
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          block_id?: string | null
          code?: string | null
          composite_code?: string | null
          created_at?: string
          description?: string | null
          handed_over?: boolean | null
          id?: string
          level?: number | null
          level_id?: string | null
          name?: string
          plot_sequence_order?: number | null
          project_id?: string
          sequence_order?: number | null
          status?: string | null
          unit_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plots_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "project_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plots_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "project_levels"
            referencedColumns: ["id"]
          },
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
      project_blocks: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string
          sequence_order: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          sequence_order?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          sequence_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_blocks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_levels: {
        Row: {
          block_id: string
          code: string
          created_at: string
          description: string | null
          id: string
          level_number: number
          level_type: string | null
          name: string
          project_id: string
          sequence_order: number | null
          updated_at: string
        }
        Insert: {
          block_id: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          level_number: number
          level_type?: string | null
          name: string
          project_id: string
          sequence_order?: number | null
          updated_at?: string
        }
        Update: {
          block_id?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          level_number?: number
          level_type?: string | null
          name?: string
          project_id?: string
          sequence_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_levels_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "project_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_levels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      project_team_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_templates: {
        Row: {
          building_type: string
          created_at: string
          default_blocks: number | null
          default_levels: number | null
          default_units_per_level: number | null
          description: string | null
          id: string
          includes_basement: boolean | null
          includes_ground_floor: boolean | null
          includes_mezzanine: boolean | null
          name: string
          template_data: Json | null
          updated_at: string
        }
        Insert: {
          building_type: string
          created_at?: string
          default_blocks?: number | null
          default_levels?: number | null
          default_units_per_level?: number | null
          description?: string | null
          id?: string
          includes_basement?: boolean | null
          includes_ground_floor?: boolean | null
          includes_mezzanine?: boolean | null
          name: string
          template_data?: Json | null
          updated_at?: string
        }
        Update: {
          building_type?: string
          created_at?: string
          default_blocks?: number | null
          default_levels?: number | null
          default_units_per_level?: number | null
          description?: string | null
          id?: string
          includes_basement?: boolean | null
          includes_ground_floor?: boolean | null
          includes_mezzanine?: boolean | null
          name?: string
          template_data?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client: string
          code: string
          created_at: string
          end_date: string | null
          id: string
          is_archived: boolean
          name: string
          start_date: string
          status: Database["public"]["Enums"]["project_status_enum"]
          updated_at: string
        }
        Insert: {
          client: string
          code: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_archived?: boolean
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["project_status_enum"]
          updated_at?: string
        }
        Update: {
          client?: string
          code?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["project_status_enum"]
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
      task_catalog: {
        Row: {
          category: string
          created_at: string
          description: string | null
          estimated_hours: number | null
          id: string
          is_standard: boolean | null
          name: string
          requires_test: boolean | null
          sequence_order: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_standard?: boolean | null
          name: string
          requires_test?: boolean | null
          sequence_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_standard?: boolean | null
          name?: string
          requires_test?: boolean | null
          sequence_order?: number | null
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
      unit_work_assignments: {
        Row: {
          ai_suggested: boolean
          assigned_user_id: string
          created_at: string
          created_by: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          notes: string | null
          plot_id: string
          status: Database["public"]["Enums"]["work_assignment_status"]
          updated_at: string
          work_category_id: string
        }
        Insert: {
          ai_suggested?: boolean
          assigned_user_id: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          notes?: string | null
          plot_id: string
          status?: Database["public"]["Enums"]["work_assignment_status"]
          updated_at?: string
          work_category_id: string
        }
        Update: {
          ai_suggested?: boolean
          assigned_user_id?: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          notes?: string | null
          plot_id?: string
          status?: Database["public"]["Enums"]["work_assignment_status"]
          updated_at?: string
          work_category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_work_assignments_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_work_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_work_assignments_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_work_assignments_work_category_id_fkey"
            columns: ["work_category_id"]
            isOneToOne: false
            referencedRelation: "work_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_work_logs: {
        Row: {
          assignment_id: string
          completed_at: string | null
          completion_photos: string[] | null
          created_at: string
          hours: number
          id: string
          notes: string | null
          plot_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["work_log_status"]
          updated_at: string
          user_id: string
          voice_transcript: string | null
          work_category_id: string
        }
        Insert: {
          assignment_id: string
          completed_at?: string | null
          completion_photos?: string[] | null
          created_at?: string
          hours: number
          id?: string
          notes?: string | null
          plot_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["work_log_status"]
          updated_at?: string
          user_id: string
          voice_transcript?: string | null
          work_category_id: string
        }
        Update: {
          assignment_id?: string
          completed_at?: string | null
          completion_photos?: string[] | null
          created_at?: string
          hours?: number
          id?: string
          notes?: string | null
          plot_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["work_log_status"]
          updated_at?: string
          user_id?: string
          voice_transcript?: string | null
          work_category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_work_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "unit_work_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_work_logs_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_work_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_work_logs_work_category_id_fkey"
            columns: ["work_category_id"]
            isOneToOne: false
            referencedRelation: "work_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_job_rates: {
        Row: {
          bonus_rate: number | null
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
          bonus_rate?: number | null
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
          bonus_rate?: number | null
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
          ai_avatar_opt_out: boolean | null
          airtable_created_time: string | null
          avatar_url: string | null
          created_at: string
          currentproject: string | null
          email: string
          employmentstatus: string | null
          firstname: string | null
          fullname: string | null
          id: string
          internalnotes: string | null
          is_verified: boolean
          last_onboarding_update: string | null
          last_sign_in: string | null
          lastname: string | null
          name: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          phone: string | null
          profile_image_url: string | null
          role: Database["public"]["Enums"]["user_role_enum"]
          supabase_auth_id: string | null
          updated_at: string
        }
        Insert: {
          ai_avatar_opt_out?: boolean | null
          airtable_created_time?: string | null
          avatar_url?: string | null
          created_at?: string
          currentproject?: string | null
          email: string
          employmentstatus?: string | null
          firstname?: string | null
          fullname?: string | null
          id?: string
          internalnotes?: string | null
          is_verified?: boolean
          last_onboarding_update?: string | null
          last_sign_in?: string | null
          lastname?: string | null
          name: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"]
          supabase_auth_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_avatar_opt_out?: boolean | null
          airtable_created_time?: string | null
          avatar_url?: string | null
          created_at?: string
          currentproject?: string | null
          email?: string
          employmentstatus?: string | null
          firstname?: string | null
          fullname?: string | null
          id?: string
          internalnotes?: string | null
          is_verified?: boolean
          last_onboarding_update?: string | null
          last_sign_in?: string | null
          lastname?: string | null
          name?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          profile_image_url?: string | null
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
          sequence_order: number | null
          sub_task: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          main_category: string
          sequence_order?: number | null
          sub_task: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          main_category?: string
          sequence_order?: number | null
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
      ai_suggest_user_for_task: {
        Args: {
          p_work_category_id: string
          p_plot_id: string
          p_project_id?: string
        }
        Returns: {
          user_id: string
          user_name: string
          suggestion_score: number
          reason: string
        }[]
      }
      calculate_plot_completion: {
        Args: { p_plot_id: string }
        Returns: number
      }
      calculate_task_bonus: {
        Args: { p_assignment_id: string; p_actual_hours: number }
        Returns: Json
      }
      detect_suspicious_activity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_contractor_rams_compliance: {
        Args: { p_contractor_id: string; p_project_id?: string }
        Returns: Json
      }
      get_project_progress: {
        Args: { project_id_param: string }
        Returns: Json
      }
      predict_task_delay: {
        Args: { p_assignment_id: string }
        Returns: Json
      }
      update_plot_order: {
        Args: { plot_ids: string[]; project_id_param: string }
        Returns: undefined
      }
      update_work_category_order: {
        Args: { category_ids: string[] }
        Returns: undefined
      }
    }
    Enums: {
      hire_status_enum: "Available" | "On Hire" | "Maintenance" | "Damaged"
      project_status_enum: "Planning" | "Active" | "Building" | "Completed"
      timesheet_status_enum: "Draft" | "Submitted" | "Approved" | "Rejected"
      user_role_enum: "Operative" | "Supervisor" | "Admin" | "PM" | "Director"
      work_assignment_status:
        | "assigned"
        | "in_progress"
        | "completed"
        | "disputed"
      work_log_status: "pending" | "in_progress" | "completed" | "verified"
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
      project_status_enum: ["Planning", "Active", "Building", "Completed"],
      timesheet_status_enum: ["Draft", "Submitted", "Approved", "Rejected"],
      user_role_enum: ["Operative", "Supervisor", "Admin", "PM", "Director"],
      work_assignment_status: [
        "assigned",
        "in_progress",
        "completed",
        "disputed",
      ],
      work_log_status: ["pending", "in_progress", "completed", "verified"],
      work_status_enum: ["Available", "In Progress", "Completed", "On Hold"],
    },
  },
} as const
