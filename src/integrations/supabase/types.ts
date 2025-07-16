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
      activity_metrics: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          record_id: string | null
          response_time_ms: number | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          record_id?: string | null
          response_time_ms?: number | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          record_id?: string | null
          response_time_ms?: number | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "activity_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          system_prompt: string
          temperature: number | null
          type: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          system_prompt: string
          temperature?: number | null
          type: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          system_prompt?: string
          temperature?: number | null
          type?: string
        }
        Relationships: []
      }
      ai_compliance_predictions: {
        Row: {
          actual_outcome: string | null
          confidence_score: number
          created_at: string
          expires_at: string
          factors: Json
          historical_patterns: Json | null
          id: string
          notification_generated: boolean | null
          notification_id: string | null
          predicted_date: string | null
          prediction_type: string
          prevention_success: boolean | null
          project_id: string | null
          recommended_actions: Json
          risk_level: string
          user_id: string | null
          was_accurate: boolean | null
        }
        Insert: {
          actual_outcome?: string | null
          confidence_score: number
          created_at?: string
          expires_at?: string
          factors: Json
          historical_patterns?: Json | null
          id?: string
          notification_generated?: boolean | null
          notification_id?: string | null
          predicted_date?: string | null
          prediction_type: string
          prevention_success?: boolean | null
          project_id?: string | null
          recommended_actions: Json
          risk_level: string
          user_id?: string | null
          was_accurate?: boolean | null
        }
        Update: {
          actual_outcome?: string | null
          confidence_score?: number
          created_at?: string
          expires_at?: string
          factors?: Json
          historical_patterns?: Json | null
          id?: string
          notification_generated?: boolean | null
          notification_id?: string | null
          predicted_date?: string | null
          prediction_type?: string
          prevention_success?: boolean | null
          project_id?: string | null
          recommended_actions?: Json
          risk_level?: string
          user_id?: string | null
          was_accurate?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_compliance_predictions_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "smart_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_compliance_predictions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      ai_conversation_context: {
        Row: {
          context_id: string | null
          context_type: string
          conversation_id: string | null
          created_at: string | null
          extracted_entities: Json | null
          id: string
          relevance_score: number | null
        }
        Insert: {
          context_id?: string | null
          context_type: string
          conversation_id?: string | null
          created_at?: string | null
          extracted_entities?: Json | null
          id?: string
          relevance_score?: number | null
        }
        Update: {
          context_id?: string | null
          context_type?: string
          conversation_id?: string | null
          created_at?: string | null
          extracted_entities?: Json | null
          id?: string
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_context_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversation_memory: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          importance_score: number | null
          last_accessed: string | null
          memory_key: string
          memory_type: string
          memory_value: Json
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          importance_score?: number | null
          last_accessed?: string | null
          memory_key: string
          memory_type: string
          memory_value: Json
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          importance_score?: number | null
          last_accessed?: string | null
          memory_key?: string
          memory_type?: string
          memory_value?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_memory_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversation_memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_conversation_memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_conversation_memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "ai_conversation_memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_conversation_memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          agent_id: string | null
          created_at: string | null
          id: string
          status: string | null
          thread_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          thread_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          thread_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_feedback: {
        Row: {
          accuracy: number | null
          conversation_id: string | null
          correction_text: string | null
          created_at: string | null
          feedback_type: string
          feedback_value: string | null
          helpfulness: number | null
          id: string
          message_id: string | null
          processed: boolean | null
          response_quality: number | null
          sentiment_score: number | null
          user_id: string | null
        }
        Insert: {
          accuracy?: number | null
          conversation_id?: string | null
          correction_text?: string | null
          created_at?: string | null
          feedback_type: string
          feedback_value?: string | null
          helpfulness?: number | null
          id?: string
          message_id?: string | null
          processed?: boolean | null
          response_quality?: number | null
          sentiment_score?: number | null
          user_id?: string | null
        }
        Update: {
          accuracy?: number | null
          conversation_id?: string | null
          correction_text?: string | null
          created_at?: string | null
          feedback_type?: string
          feedback_value?: string | null
          helpfulness?: number | null
          id?: string
          message_id?: string | null
          processed?: boolean | null
          response_quality?: number | null
          sentiment_score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "ai_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          request_count: number | null
          user_id: string
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          request_count?: number | null
          user_id: string
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          request_count?: number | null
          user_id?: string
          window_start?: string | null
        }
        Relationships: []
      }
      analytics_predictions: {
        Row: {
          confidence: number | null
          created_at: string | null
          factors: Json | null
          id: string
          predicted_date: string | null
          prediction_type: string | null
          project_id: string | null
          recommended_actions: Json | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          factors?: Json | null
          id?: string
          predicted_date?: string | null
          prediction_type?: string | null
          project_id?: string | null
          recommended_actions?: Json | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          factors?: Json | null
          id?: string
          predicted_date?: string | null
          prediction_type?: string | null
          project_id?: string | null
          recommended_actions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_predictions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          request_count: number | null
          user_id: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "api_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "api_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "api_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "api_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      approval_queue: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          due_date: string | null
          escalation_level: number | null
          id: string
          item_id: string
          item_type: string
          metadata: Json | null
          priority: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          due_date?: string | null
          escalation_level?: number | null
          id?: string
          item_id: string
          item_type: string
          metadata?: Json | null
          priority?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          due_date?: string | null
          escalation_level?: number | null
          id?: string
          item_id?: string
          item_type?: string
          metadata?: Json | null
          priority?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "approval_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "approval_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "approval_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "approval_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      archived_data: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          archived_data: Json
          id: string
          reason: string | null
          source_id: string
          source_table: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          archived_data: Json
          id?: string
          reason?: string | null
          source_id: string
          source_table: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          archived_data?: Json
          id?: string
          reason?: string | null
          source_id?: string
          source_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "archived_data_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "archived_data_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "archived_data_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "archived_data_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "archived_data_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      Asite_Sync_Log: {
        Row: {
          airtable_created_time: string | null
          airtable_record_id: string | null
          alertsgenerated: number | null
          asiteapiversion: string | null
          autosyncenabled: boolean | null
          datavolumeprocessed: string | null
          drawingsadded: number | null
          drawingschecked: number | null
          drawingsdeleted: number | null
          drawingsupdated: number | null
          errordetails: string | null
          errorsencountered: number | null
          newdrawingsfound: number | null
          nextscheduledsync: string | null
          notificationssent: number | null
          resolutionnotes: string | null
          resolutionrequired: boolean | null
          revisionsadded: number | null
          revisionssuperseded: number | null
          serverresponse: string | null
          stakeholdersnotified: string | null
          syncdate: string | null
          syncduration: number | null
          syncfrequency: string | null
          syncmethod: string | null
          syncstatus: string | null
          synctype: string | null
          syncuid: string | null
          updatedrevisions: number | null
          warningmessages: string | null
          whalesync_postgres_id: string
        }
        Insert: {
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          alertsgenerated?: number | null
          asiteapiversion?: string | null
          autosyncenabled?: boolean | null
          datavolumeprocessed?: string | null
          drawingsadded?: number | null
          drawingschecked?: number | null
          drawingsdeleted?: number | null
          drawingsupdated?: number | null
          errordetails?: string | null
          errorsencountered?: number | null
          newdrawingsfound?: number | null
          nextscheduledsync?: string | null
          notificationssent?: number | null
          resolutionnotes?: string | null
          resolutionrequired?: boolean | null
          revisionsadded?: number | null
          revisionssuperseded?: number | null
          serverresponse?: string | null
          stakeholdersnotified?: string | null
          syncdate?: string | null
          syncduration?: number | null
          syncfrequency?: string | null
          syncmethod?: string | null
          syncstatus?: string | null
          synctype?: string | null
          syncuid?: string | null
          updatedrevisions?: number | null
          warningmessages?: string | null
          whalesync_postgres_id?: string
        }
        Update: {
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          alertsgenerated?: number | null
          asiteapiversion?: string | null
          autosyncenabled?: boolean | null
          datavolumeprocessed?: string | null
          drawingsadded?: number | null
          drawingschecked?: number | null
          drawingsdeleted?: number | null
          drawingsupdated?: number | null
          errordetails?: string | null
          errorsencountered?: number | null
          newdrawingsfound?: number | null
          nextscheduledsync?: string | null
          notificationssent?: number | null
          resolutionnotes?: string | null
          resolutionrequired?: boolean | null
          revisionsadded?: number | null
          revisionssuperseded?: number | null
          serverresponse?: string | null
          stakeholdersnotified?: string | null
          syncdate?: string | null
          syncduration?: number | null
          syncfrequency?: string | null
          syncmethod?: string | null
          syncstatus?: string | null
          synctype?: string | null
          syncuid?: string | null
          updatedrevisions?: number | null
          warningmessages?: string | null
          whalesync_postgres_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      auth_migration: {
        Row: {
          created_at: string | null
          email: string
          firebase_uid: string | null
          id: string
          metadata: Json | null
          migrated_at: string | null
          migration_status: string | null
          supabase_uid: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          firebase_uid?: string | null
          id?: string
          metadata?: Json | null
          migrated_at?: string | null
          migration_status?: string | null
          supabase_uid?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          firebase_uid?: string | null
          id?: string
          metadata?: Json | null
          migrated_at?: string | null
          migration_status?: string | null
          supabase_uid?: string | null
        }
        Relationships: []
      }
      blocks: {
        Row: {
          id: number
          level_id: number | null
          name: string | null
        }
        Insert: {
          id?: never
          level_id?: number | null
          name?: string | null
        }
        Update: {
          id?: never
          level_id?: number | null
          name?: string | null
        }
        Relationships: []
      }
      Blocks: {
        Row: {
          airtable_created_time: string | null
          airtable_record_id: string | null
          blockcode: string | null
          blockdeliveries: number | null
          blockdeliverynotes: string | null
          blockhirecost: number | null
          blockid: number | null
          blockname: string | null
          blocknotes: string | null
          blockstatus: string | null
          clientacceptancedate: string | null
          drawings: string | null
          drawings_2: string | null
          electricalconnectionstatus: string | null
          equipmentnotes: string | null
          gasconnectionstatus: string | null
          handoverdate: string | null
          handoverstatus: string | null
          healthsafetystatus: string | null
          hire: string | null
          hireequipmentonblock: number | null
          lastblockdelivery: string | null
          levels: string | null
          nextscheduledblockdelivery: string | null
          pendingblockdeliveries: number | null
          project: string | null
          qualityinspectiondate: string | null
          qualityinspectionstatus: string | null
          sewerconnectionstatus: string | null
          snaggingitems: number | null
          snaggingstatus: string | null
          totalplots: number | null
          waterconnectionstatus: string | null
          whalesync_postgres_id: string
        }
        Insert: {
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          blockcode?: string | null
          blockdeliveries?: number | null
          blockdeliverynotes?: string | null
          blockhirecost?: number | null
          blockid?: number | null
          blockname?: string | null
          blocknotes?: string | null
          blockstatus?: string | null
          clientacceptancedate?: string | null
          drawings?: string | null
          drawings_2?: string | null
          electricalconnectionstatus?: string | null
          equipmentnotes?: string | null
          gasconnectionstatus?: string | null
          handoverdate?: string | null
          handoverstatus?: string | null
          healthsafetystatus?: string | null
          hire?: string | null
          hireequipmentonblock?: number | null
          lastblockdelivery?: string | null
          levels?: string | null
          nextscheduledblockdelivery?: string | null
          pendingblockdeliveries?: number | null
          project?: string | null
          qualityinspectiondate?: string | null
          qualityinspectionstatus?: string | null
          sewerconnectionstatus?: string | null
          snaggingitems?: number | null
          snaggingstatus?: string | null
          totalplots?: number | null
          waterconnectionstatus?: string | null
          whalesync_postgres_id?: string
        }
        Update: {
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          blockcode?: string | null
          blockdeliveries?: number | null
          blockdeliverynotes?: string | null
          blockhirecost?: number | null
          blockid?: number | null
          blockname?: string | null
          blocknotes?: string | null
          blockstatus?: string | null
          clientacceptancedate?: string | null
          drawings?: string | null
          drawings_2?: string | null
          electricalconnectionstatus?: string | null
          equipmentnotes?: string | null
          gasconnectionstatus?: string | null
          handoverdate?: string | null
          handoverstatus?: string | null
          healthsafetystatus?: string | null
          hire?: string | null
          hireequipmentonblock?: number | null
          lastblockdelivery?: string | null
          levels?: string | null
          nextscheduledblockdelivery?: string | null
          pendingblockdeliveries?: number | null
          project?: string | null
          qualityinspectiondate?: string | null
          qualityinspectionstatus?: string | null
          sewerconnectionstatus?: string | null
          snaggingitems?: number | null
          snaggingstatus?: string | null
          totalplots?: number | null
          waterconnectionstatus?: string | null
          whalesync_postgres_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          mentioned_users: string[] | null
          message_metadata: Json | null
          message_type: string
          reply_to_message_id: string | null
          room_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mentioned_users?: string[] | null
          message_metadata?: Json | null
          message_type?: string
          reply_to_message_id?: string | null
          room_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mentioned_users?: string[] | null
          message_metadata?: Json | null
          message_type?: string
          reply_to_message_id?: string | null
          room_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_room_participants: {
        Row: {
          id: string
          joined_at: string
          last_read_at: string | null
          muted_until: string | null
          notification_settings: Json | null
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          muted_until?: string | null
          notification_settings?: Json | null
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          muted_until?: string | null
          notification_settings?: Json | null
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          max_participants: number | null
          name: string
          project_id: string | null
          room_settings: Json | null
          room_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          name: string
          project_id?: string | null
          room_settings?: Json | null
          room_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          name?: string
          project_id?: string | null
          room_settings?: Json | null
          room_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      collaboration_sessions: {
        Row: {
          created_at: string
          document_id: string | null
          document_type: string | null
          ended_at: string | null
          host_user_id: string
          id: string
          is_active: boolean | null
          participants: Json | null
          project_id: string | null
          session_data: Json | null
          session_name: string
          session_type: string
          started_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          document_type?: string | null
          ended_at?: string | null
          host_user_id: string
          id?: string
          is_active?: boolean | null
          participants?: Json | null
          project_id?: string | null
          session_data?: Json | null
          session_name: string
          session_type: string
          started_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          document_type?: string | null
          ended_at?: string | null
          host_user_id?: string
          id?: string
          is_active?: boolean | null
          participants?: Json | null
          project_id?: string | null
          session_data?: Json | null
          session_name?: string
          session_type?: string
          started_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      compliance_dashboard_stats: {
        Row: {
          active_task_plans: number | null
          calculated_at: string | null
          compliance_percentage: number | null
          compliant_operatives: number | null
          expired_signatures: number | null
          high_risk_work_planned: number | null
          high_risk_work_signed: number | null
          id: string
          project_id: string | null
          signatures_completed: number | null
          signatures_expiring_soon: number | null
          signatures_required: number | null
          stat_date: string
          task_plans_needing_review: number | null
          total_operatives: number | null
        }
        Insert: {
          active_task_plans?: number | null
          calculated_at?: string | null
          compliance_percentage?: number | null
          compliant_operatives?: number | null
          expired_signatures?: number | null
          high_risk_work_planned?: number | null
          high_risk_work_signed?: number | null
          id?: string
          project_id?: string | null
          signatures_completed?: number | null
          signatures_expiring_soon?: number | null
          signatures_required?: number | null
          stat_date: string
          task_plans_needing_review?: number | null
          total_operatives?: number | null
        }
        Update: {
          active_task_plans?: number | null
          calculated_at?: string | null
          compliance_percentage?: number | null
          compliant_operatives?: number | null
          expired_signatures?: number | null
          high_risk_work_planned?: number | null
          high_risk_work_signed?: number | null
          id?: string
          project_id?: string | null
          signatures_completed?: number | null
          signatures_expiring_soon?: number | null
          signatures_required?: number | null
          stat_date?: string
          task_plans_needing_review?: number | null
          total_operatives?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_dashboard_stats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      compliance_snapshots: {
        Row: {
          auto_generated: boolean | null
          compliance_data: Json
          compliance_percentage: number | null
          created_at: string
          id: string
          missing_signatures: number | null
          notes: string | null
          project_id: string | null
          signed_documents: number | null
          snapshot_date: string
          superseded_unsigned: number | null
          total_documents: number | null
        }
        Insert: {
          auto_generated?: boolean | null
          compliance_data: Json
          compliance_percentage?: number | null
          created_at?: string
          id?: string
          missing_signatures?: number | null
          notes?: string | null
          project_id?: string | null
          signed_documents?: number | null
          snapshot_date: string
          superseded_unsigned?: number | null
          total_documents?: number | null
        }
        Update: {
          auto_generated?: boolean | null
          compliance_data?: Json
          compliance_percentage?: number | null
          created_at?: string
          id?: string
          missing_signatures?: number | null
          notes?: string | null
          project_id?: string | null
          signed_documents?: number | null
          snapshot_date?: string
          superseded_unsigned?: number | null
          total_documents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      contractor_companies: {
        Row: {
          accreditations: string[] | null
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          company_name: string
          company_type: string | null
          country: string | null
          created_at: string | null
          email: string | null
          health_safety_policy_url: string | null
          id: string
          insurance_expiry: string | null
          phone: string | null
          postal_code: string | null
          preferred_work_types: string[] | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          registration_number: string | null
          status: string | null
          updated_at: string | null
          vat_number: string | null
          website: string | null
        }
        Insert: {
          accreditations?: string[] | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          company_name: string
          company_type?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          health_safety_policy_url?: string | null
          id?: string
          insurance_expiry?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_work_types?: string[] | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          registration_number?: string | null
          status?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          accreditations?: string[] | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          company_name?: string
          company_type?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          health_safety_policy_url?: string | null
          id?: string
          insurance_expiry?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_work_types?: string[] | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          registration_number?: string | null
          status?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      contractor_profiles: {
        Row: {
          assigned_work_activities: string[] | null
          auth_user_id: string
          company_id: string
          created_at: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          fors_level: string | null
          id: string
          job_role: string
          last_name: string
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          phone: string | null
          rams_signature_data: string | null
          rams_signed_at: string | null
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          updated_at: string | null
          vehicle_registration: string | null
          vehicle_type: string | null
          vehicle_weight_category: string | null
        }
        Insert: {
          assigned_work_activities?: string[] | null
          auth_user_id: string
          company_id: string
          created_at?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          fors_level?: string | null
          id?: string
          job_role: string
          last_name: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          rams_signature_data?: string | null
          rams_signed_at?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          vehicle_registration?: string | null
          vehicle_type?: string | null
          vehicle_weight_category?: string | null
        }
        Update: {
          assigned_work_activities?: string[] | null
          auth_user_id?: string
          company_id?: string
          created_at?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          fors_level?: string | null
          id?: string
          job_role?: string
          last_name?: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          rams_signature_data?: string | null
          rams_signed_at?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          vehicle_registration?: string | null
          vehicle_type?: string | null
          vehicle_weight_category?: string | null
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
      contractor_project_assignments: {
        Row: {
          assigned_by: string | null
          contractor_id: string
          created_at: string | null
          id: string
          job_role: string
          project_id: string
          rams_signature_data: string | null
          rams_signed_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          contractor_id: string
          created_at?: string | null
          id?: string
          job_role: string
          project_id: string
          rams_signature_data?: string | null
          rams_signed_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          contractor_id?: string
          created_at?: string | null
          id?: string
          job_role?: string
          project_id?: string
          rams_signature_data?: string | null
          rams_signed_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_project_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contractor_project_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contractor_project_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "contractor_project_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contractor_project_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "contractor_project_assignments_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      contractor_training_documents: {
        Row: {
          contractor_id: string
          created_at: string | null
          document_type_id: string
          document_url: string
          expiry_date: string | null
          file_name: string
          file_size: number | null
          id: string
          issue_date: string | null
          notes: string | null
          status: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          document_type_id: string
          document_url: string
          expiry_date?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          document_type_id?: string
          document_url?: string
          expiry_date?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_training_documents_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_training_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "training_document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_training_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contractor_training_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contractor_training_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "contractor_training_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contractor_training_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      contractor_work_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          contractor_id: string | null
          id: string
          is_active: boolean | null
          project_id: string | null
          work_activity_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          contractor_id?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          work_activity_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          contractor_id?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          work_activity_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_work_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contractor_work_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contractor_work_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "contractor_work_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contractor_work_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "contractor_work_assignments_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_work_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "contractor_work_assignments_work_activity_id_fkey"
            columns: ["work_activity_id"]
            isOneToOne: false
            referencedRelation: "work_activity_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_tracking: {
        Row: {
          amount: number
          approved_by: string | null
          category: string | null
          created_at: string | null
          date_incurred: string | null
          description: string | null
          id: string
          invoice_reference: string | null
          project_id: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          date_incurred?: string | null
          description?: string | null
          id?: string
          invoice_reference?: string | null
          project_id?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          date_incurred?: string | null
          description?: string | null
          id?: string
          invoice_reference?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_tracking_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cost_tracking_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cost_tracking_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "cost_tracking_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cost_tracking_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "cost_tracking_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      cscs_card_analysis: {
        Row: {
          card_color: string | null
          card_number: string | null
          card_type: string | null
          confidence_score: number | null
          created_at: string | null
          expiry_date: string | null
          id: string
          image_url: string
          qualifications: Json | null
          raw_ai_response: Json | null
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          card_color?: string | null
          card_number?: string | null
          card_type?: string | null
          confidence_score?: number | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          image_url: string
          qualifications?: Json | null
          raw_ai_response?: Json | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          card_color?: string | null
          card_number?: string | null
          card_type?: string | null
          confidence_score?: number | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string
          qualifications?: Json | null
          raw_ai_response?: Json | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      cscs_cards: {
        Row: {
          card_color: string | null
          card_number: string | null
          confidence_score: number | null
          created_at: string | null
          cscs_card_type: string
          custom_card_type: string | null
          expiry_date: string | null
          file_url: string
          id: string
          qualifications: Json | null
          raw_ai_response: Json | null
          user_id: string
        }
        Insert: {
          card_color?: string | null
          card_number?: string | null
          confidence_score?: number | null
          created_at?: string | null
          cscs_card_type: string
          custom_card_type?: string | null
          expiry_date?: string | null
          file_url: string
          id?: string
          qualifications?: Json | null
          raw_ai_response?: Json | null
          user_id: string
        }
        Update: {
          card_color?: string | null
          card_number?: string | null
          confidence_score?: number | null
          created_at?: string | null
          cscs_card_type?: string
          custom_card_type?: string | null
          expiry_date?: string | null
          file_url?: string
          id?: string
          qualifications?: Json | null
          raw_ai_response?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      delivery_bookings: {
        Row: {
          block_id: string | null
          created_at: string | null
          delivery_date: string
          id: string
          items: Json | null
          project_id: string | null
          requested_by: string | null
          requested_date: string
          special_instructions: string | null
          status: string | null
          supplier: string | null
        }
        Insert: {
          block_id?: string | null
          created_at?: string | null
          delivery_date: string
          id?: string
          items?: Json | null
          project_id?: string | null
          requested_by?: string | null
          requested_date: string
          special_instructions?: string | null
          status?: string | null
          supplier?: string | null
        }
        Update: {
          block_id?: string | null
          created_at?: string | null
          delivery_date?: string
          id?: string
          items?: Json | null
          project_id?: string | null
          requested_by?: string | null
          requested_date?: string
          special_instructions?: string | null
          status?: string | null
          supplier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_bookings_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "Blocks"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "delivery_bookings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "delivery_bookings_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "delivery_bookings_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "delivery_bookings_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "delivery_bookings_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "delivery_bookings_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      delivery_records: {
        Row: {
          actual_delivery_date: string | null
          ai_analysis: Json | null
          ai_match_confidence: number | null
          booking_id: string | null
          condition_notes: string | null
          created_at: string | null
          id: string
          items_received: Json | null
          pod_reference: string | null
          received_by: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          ai_analysis?: Json | null
          ai_match_confidence?: number | null
          booking_id?: string | null
          condition_notes?: string | null
          created_at?: string | null
          id?: string
          items_received?: Json | null
          pod_reference?: string | null
          received_by?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          ai_analysis?: Json | null
          ai_match_confidence?: number | null
          booking_id?: string | null
          condition_notes?: string | null
          created_at?: string | null
          id?: string
          items_received?: Json | null
          pod_reference?: string | null
          received_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_records_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "delivery_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_records_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "delivery_records_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "delivery_records_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "delivery_records_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "delivery_records_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      demo_completions: {
        Row: {
          assistance_needed: boolean | null
          completed_at: string | null
          demo_type: string
          id: string
          induction_id: string
          notes: string | null
          qr_code_scanned: string | null
          scan_result: Json | null
          time_taken_seconds: number | null
          understanding_confirmed: boolean | null
        }
        Insert: {
          assistance_needed?: boolean | null
          completed_at?: string | null
          demo_type: string
          id?: string
          induction_id: string
          notes?: string | null
          qr_code_scanned?: string | null
          scan_result?: Json | null
          time_taken_seconds?: number | null
          understanding_confirmed?: boolean | null
        }
        Update: {
          assistance_needed?: boolean | null
          completed_at?: string | null
          demo_type?: string
          id?: string
          induction_id?: string
          notes?: string | null
          qr_code_scanned?: string | null
          scan_result?: Json | null
          time_taken_seconds?: number | null
          understanding_confirmed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_completions_induction_id_fkey"
            columns: ["induction_id"]
            isOneToOne: false
            referencedRelation: "induction_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      document_collaboration: {
        Row: {
          action_type: string
          created_at: string
          cursor_position: Json | null
          document_id: string
          document_type: string
          id: string
          is_active: boolean | null
          last_activity: string
          selection_range: Json | null
          session_id: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          cursor_position?: Json | null
          document_id: string
          document_type: string
          id?: string
          is_active?: boolean | null
          last_activity?: string
          selection_range?: Json | null
          session_id: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          cursor_position?: Json | null
          document_id?: string
          document_type?: string
          id?: string
          is_active?: boolean | null
          last_activity?: string
          selection_range?: Json | null
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      document_controllers: {
        Row: {
          access_level: string | null
          can_approve_drawings: boolean | null
          can_delete_documents: boolean | null
          created_at: string | null
          document_categories: Json | null
          id: string
          projects_access: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_level?: string | null
          can_approve_drawings?: boolean | null
          can_delete_documents?: boolean | null
          created_at?: string | null
          document_categories?: Json | null
          id?: string
          projects_access?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_level?: string | null
          can_approve_drawings?: boolean | null
          can_delete_documents?: boolean | null
          created_at?: string | null
          document_categories?: Json | null
          id?: string
          projects_access?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_controllers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_controllers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_controllers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "document_controllers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_controllers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      document_embeddings: {
        Row: {
          content: string
          created_at: string | null
          document_id: string
          drawing_id: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          document_id: string
          drawing_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          document_id?: string
          drawing_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_embeddings_drawing_id_fkey"
            columns: ["drawing_id"]
            isOneToOne: false
            referencedRelation: "Drawings"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      document_versions: {
        Row: {
          ai_suggested_tags: string[] | null
          approval_date: string | null
          approved_by: string | null
          created_at: string
          document_id: string
          document_type: string
          file_size: number | null
          file_url: string | null
          id: string
          linked_drawings: string[] | null
          linked_rams: string[] | null
          mime_type: string | null
          project_id: string | null
          qr_code_url: string | null
          read_required: boolean | null
          revision_code: string | null
          scope_levels: string[] | null
          scope_plots: string[] | null
          status: string
          superseded_by: string | null
          superseded_date: string | null
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by: string | null
          version_number: number
          watermark_applied: boolean | null
        }
        Insert: {
          ai_suggested_tags?: string[] | null
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string
          document_id: string
          document_type: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          linked_drawings?: string[] | null
          linked_rams?: string[] | null
          mime_type?: string | null
          project_id?: string | null
          qr_code_url?: string | null
          read_required?: boolean | null
          revision_code?: string | null
          scope_levels?: string[] | null
          scope_plots?: string[] | null
          status?: string
          superseded_by?: string | null
          superseded_date?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          version_number: number
          watermark_applied?: boolean | null
        }
        Update: {
          ai_suggested_tags?: string[] | null
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string
          document_id?: string
          document_type?: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          linked_drawings?: string[] | null
          linked_rams?: string[] | null
          mime_type?: string | null
          project_id?: string | null
          qr_code_url?: string | null
          read_required?: boolean | null
          revision_code?: string | null
          scope_levels?: string[] | null
          scope_plots?: string[] | null
          status?: string
          superseded_by?: string | null
          superseded_date?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          version_number?: number
          watermark_applied?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_versions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_versions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "document_versions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_versions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "document_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "document_versions_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          created_by: string | null
          document_type: string
          file_url: string | null
          id: string
          project_id: string | null
          read_required: boolean | null
          status: string | null
          title: string
          version: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          document_type: string
          file_url?: string | null
          id?: string
          project_id?: string | null
          read_required?: boolean | null
          status?: string | null
          title: string
          version?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          document_type?: string
          file_url?: string | null
          id?: string
          project_id?: string | null
          read_required?: boolean | null
          status?: string | null
          title?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      Drawing_Categories: {
        Row: {
          airtable_created_time: string | null
          airtable_record_id: string | null
          categorycode: string | null
          categorycolor: string | null
          categoryname: string | null
          categoryuid: string | null
          defaultfileformat: string | null
          defaultreviewperiod: number | null
          description: string | null
          displayicon: string | null
          isactive: boolean | null
          notificationrequired: boolean | null
          parentcategory: string | null
          requiresapproval: boolean | null
          sortorder: number | null
          subcategories: string | null
          tradegroup: string | null
          whalesync_postgres_id: string
        }
        Insert: {
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          categorycode?: string | null
          categorycolor?: string | null
          categoryname?: string | null
          categoryuid?: string | null
          defaultfileformat?: string | null
          defaultreviewperiod?: number | null
          description?: string | null
          displayicon?: string | null
          isactive?: boolean | null
          notificationrequired?: boolean | null
          parentcategory?: string | null
          requiresapproval?: boolean | null
          sortorder?: number | null
          subcategories?: string | null
          tradegroup?: string | null
          whalesync_postgres_id?: string
        }
        Update: {
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          categorycode?: string | null
          categorycolor?: string | null
          categoryname?: string | null
          categoryuid?: string | null
          defaultfileformat?: string | null
          defaultreviewperiod?: number | null
          description?: string | null
          displayicon?: string | null
          isactive?: boolean | null
          notificationrequired?: boolean | null
          parentcategory?: string | null
          requiresapproval?: boolean | null
          sortorder?: number | null
          subcategories?: string | null
          tradegroup?: string | null
          whalesync_postgres_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drawing_categories_parentcategory_foreign"
            columns: ["parentcategory"]
            isOneToOne: false
            referencedRelation: "Drawing_Categories"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "drawing_categories_subcategories_foreign"
            columns: ["subcategories"]
            isOneToOne: false
            referencedRelation: "Drawing_Categories"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      drawing_revisions: {
        Row: {
          drawing_id: number
          id: number
          revision_number: number
        }
        Insert: {
          drawing_id: number
          id?: never
          revision_number: number
        }
        Update: {
          drawing_id?: number
          id?: never
          revision_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_drawing"
            columns: ["drawing_id"]
            isOneToOne: false
            referencedRelation: "drawings"
            referencedColumns: ["id"]
          },
        ]
      }
      Drawing_Revisions: {
        Row: {
          accesscount: number | null
          airtable_created_time: string | null
          airtable_record_id: string | null
          approvaldate: string | null
          approvalstatus: string | null
          approvedby: string | null
          asitedocumentid: string | null
          asiterevisionurl: string | null
          changedescription: string | null
          changeimpact: string | null
          distributionlist: string | null
          downloadcount: number | null
          downloadurl: string | null
          drawing: string | null
          drawingscale: string | null
          fileformat: string | null
          filesize: string | null
          iscurrent: boolean | null
          islatestavailable: boolean | null
          issuedate: string | null
          issuedby: string | null
          issuereason: string | null
          lastaccesseddate: string | null
          orientation: string | null
          papersize: string | null
          qualityissues: string | null
          revisioncode: string | null
          revisionnotes: string | null
          revisionstatus: string | null
          revisionuid: string | null
          supersededdate: string | null
          technicalnotes: string | null
          whalesync_postgres_id: string
        }
        Insert: {
          accesscount?: number | null
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          approvaldate?: string | null
          approvalstatus?: string | null
          approvedby?: string | null
          asitedocumentid?: string | null
          asiterevisionurl?: string | null
          changedescription?: string | null
          changeimpact?: string | null
          distributionlist?: string | null
          downloadcount?: number | null
          downloadurl?: string | null
          drawing?: string | null
          drawingscale?: string | null
          fileformat?: string | null
          filesize?: string | null
          iscurrent?: boolean | null
          islatestavailable?: boolean | null
          issuedate?: string | null
          issuedby?: string | null
          issuereason?: string | null
          lastaccesseddate?: string | null
          orientation?: string | null
          papersize?: string | null
          qualityissues?: string | null
          revisioncode?: string | null
          revisionnotes?: string | null
          revisionstatus?: string | null
          revisionuid?: string | null
          supersededdate?: string | null
          technicalnotes?: string | null
          whalesync_postgres_id?: string
        }
        Update: {
          accesscount?: number | null
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          approvaldate?: string | null
          approvalstatus?: string | null
          approvedby?: string | null
          asitedocumentid?: string | null
          asiterevisionurl?: string | null
          changedescription?: string | null
          changeimpact?: string | null
          distributionlist?: string | null
          downloadcount?: number | null
          downloadurl?: string | null
          drawing?: string | null
          drawingscale?: string | null
          fileformat?: string | null
          filesize?: string | null
          iscurrent?: boolean | null
          islatestavailable?: boolean | null
          issuedate?: string | null
          issuedby?: string | null
          issuereason?: string | null
          lastaccesseddate?: string | null
          orientation?: string | null
          papersize?: string | null
          qualityissues?: string | null
          revisioncode?: string | null
          revisionnotes?: string | null
          revisionstatus?: string | null
          revisionuid?: string | null
          supersededdate?: string | null
          technicalnotes?: string | null
          whalesync_postgres_id?: string
        }
        Relationships: []
      }
      drawings: {
        Row: {
          created_at: string | null
          id: number
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          title: string
        }
        Update: {
          created_at?: string | null
          id?: never
          title?: string
        }
        Relationships: []
      }
      Drawings: {
        Row: {
          accesscount: number | null
          actualissuedate: string | null
          ai_processed: boolean | null
          airtable_created_time: string | null
          airtable_record_id: string | null
          approvedby: string | null
          asitedirectdownloadurl: string | null
          asitedocumentid: string | null
          asitefolderpath: string | null
          asiteurl: string | null
          block: string | null
          changedescription: string | null
          comments: string | null
          currentrevision: string | null
          drawing_revisions: string | null
          drawingcomplexity: string | null
          drawingdescription: string | null
          drawingnumber: string | null
          drawingstatus: string | null
          drawingtype: string | null
          drawinguid: string | null
          embedding_count: number | null
          fileformat: string | null
          filepath: string | null
          filesize: string | null
          internalnotes: string | null
          issuedby: string | null
          issuesource: string | null
          lastaccesseddate: string | null
          lastupdateddate: string | null
          latestrevisionavailable: string | null
          level: string | null
          nextreviewdate: string | null
          plannedissuedate: string | null
          plotscovered: string | null
          project: string | null
          qualityrating: string | null
          revisionstatus: string | null
          sitefeedback: string | null
          trade: string | null
          whalesync_postgres_id: string
        }
        Insert: {
          accesscount?: number | null
          actualissuedate?: string | null
          ai_processed?: boolean | null
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          approvedby?: string | null
          asitedirectdownloadurl?: string | null
          asitedocumentid?: string | null
          asitefolderpath?: string | null
          asiteurl?: string | null
          block?: string | null
          changedescription?: string | null
          comments?: string | null
          currentrevision?: string | null
          drawing_revisions?: string | null
          drawingcomplexity?: string | null
          drawingdescription?: string | null
          drawingnumber?: string | null
          drawingstatus?: string | null
          drawingtype?: string | null
          drawinguid?: string | null
          embedding_count?: number | null
          fileformat?: string | null
          filepath?: string | null
          filesize?: string | null
          internalnotes?: string | null
          issuedby?: string | null
          issuesource?: string | null
          lastaccesseddate?: string | null
          lastupdateddate?: string | null
          latestrevisionavailable?: string | null
          level?: string | null
          nextreviewdate?: string | null
          plannedissuedate?: string | null
          plotscovered?: string | null
          project?: string | null
          qualityrating?: string | null
          revisionstatus?: string | null
          sitefeedback?: string | null
          trade?: string | null
          whalesync_postgres_id?: string
        }
        Update: {
          accesscount?: number | null
          actualissuedate?: string | null
          ai_processed?: boolean | null
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          approvedby?: string | null
          asitedirectdownloadurl?: string | null
          asitedocumentid?: string | null
          asitefolderpath?: string | null
          asiteurl?: string | null
          block?: string | null
          changedescription?: string | null
          comments?: string | null
          currentrevision?: string | null
          drawing_revisions?: string | null
          drawingcomplexity?: string | null
          drawingdescription?: string | null
          drawingnumber?: string | null
          drawingstatus?: string | null
          drawingtype?: string | null
          drawinguid?: string | null
          embedding_count?: number | null
          fileformat?: string | null
          filepath?: string | null
          filesize?: string | null
          internalnotes?: string | null
          issuedby?: string | null
          issuesource?: string | null
          lastaccesseddate?: string | null
          lastupdateddate?: string | null
          latestrevisionavailable?: string | null
          level?: string | null
          nextreviewdate?: string | null
          plannedissuedate?: string | null
          plotscovered?: string | null
          project?: string | null
          qualityrating?: string | null
          revisionstatus?: string | null
          sitefeedback?: string | null
          trade?: string | null
          whalesync_postgres_id?: string
        }
        Relationships: []
      }
      enhanced_audit_log: {
        Row: {
          action: string
          anonymized_at: string | null
          created_at: string | null
          evidence_chain_hash: string | null
          gdpr_retention_category: string | null
          id: string
          ip_address: unknown | null
          legal_hold: boolean | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          session_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          anonymized_at?: string | null
          created_at?: string | null
          evidence_chain_hash?: string | null
          gdpr_retention_category?: string | null
          id?: string
          ip_address?: unknown | null
          legal_hold?: boolean | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          session_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          anonymized_at?: string | null
          created_at?: string | null
          evidence_chain_hash?: string | null
          gdpr_retention_category?: string | null
          id?: string
          ip_address?: unknown | null
          legal_hold?: boolean | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          session_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enhanced_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "enhanced_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "enhanced_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "enhanced_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "enhanced_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      equipment_tracking: {
        Row: {
          assigned_to: string | null
          condition: string | null
          created_at: string | null
          equipment_type: string
          id: string
          last_inspection: string | null
          next_inspection_due: string | null
          notes: string | null
          project_id: string | null
          serial_number: string | null
        }
        Insert: {
          assigned_to?: string | null
          condition?: string | null
          created_at?: string | null
          equipment_type: string
          id?: string
          last_inspection?: string | null
          next_inspection_due?: string | null
          notes?: string | null
          project_id?: string | null
          serial_number?: string | null
        }
        Update: {
          assigned_to?: string | null
          condition?: string | null
          created_at?: string | null
          equipment_type?: string
          id?: string
          last_inspection?: string | null
          next_inspection_due?: string | null
          notes?: string | null
          project_id?: string | null
          serial_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_tracking_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "equipment_tracking_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "equipment_tracking_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "equipment_tracking_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "equipment_tracking_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "equipment_tracking_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      evidence_chain_records: {
        Row: {
          action_type: string
          chain_sequence: number
          created_at: string
          created_by: string | null
          device_info: Json | null
          document_id: string | null
          document_revision: string | null
          document_type: string
          document_version: string
          evidence_hash: string
          gps_location: unknown | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          operative_id: string | null
          plot_id: string | null
          project_id: string | null
          signature_id: string | null
        }
        Insert: {
          action_type: string
          chain_sequence?: number
          created_at?: string
          created_by?: string | null
          device_info?: Json | null
          document_id?: string | null
          document_revision?: string | null
          document_type: string
          document_version: string
          evidence_hash: string
          gps_location?: unknown | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          operative_id?: string | null
          plot_id?: string | null
          project_id?: string | null
          signature_id?: string | null
        }
        Update: {
          action_type?: string
          chain_sequence?: number
          created_at?: string
          created_by?: string | null
          device_info?: Json | null
          document_id?: string | null
          document_revision?: string | null
          document_type?: string
          document_version?: string
          evidence_hash?: string
          gps_location?: unknown | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          operative_id?: string | null
          plot_id?: string | null
          project_id?: string | null
          signature_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_chain_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "evidence_chain_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "evidence_chain_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "evidence_chain_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "evidence_chain_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "evidence_chain_records_operative_id_fkey"
            columns: ["operative_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "evidence_chain_records_operative_id_fkey"
            columns: ["operative_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "evidence_chain_records_operative_id_fkey"
            columns: ["operative_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "evidence_chain_records_operative_id_fkey"
            columns: ["operative_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "evidence_chain_records_operative_id_fkey"
            columns: ["operative_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "evidence_chain_records_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "Plots"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "evidence_chain_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      evidence_exports: {
        Row: {
          created_at: string
          expires_at: string | null
          export_format: string
          export_status: string | null
          export_type: string
          exported_by: string | null
          file_size: number | null
          file_url: string | null
          filters_applied: Json | null
          id: string
          record_count: number | null
          scope_data: Json
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          export_format: string
          export_status?: string | null
          export_type: string
          exported_by?: string | null
          file_size?: number | null
          file_url?: string | null
          filters_applied?: Json | null
          id?: string
          record_count?: number | null
          scope_data: Json
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          export_format?: string
          export_status?: string | null
          export_type?: string
          exported_by?: string | null
          file_size?: number | null
          file_url?: string | null
          filters_applied?: Json | null
          id?: string
          record_count?: number | null
          scope_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "evidence_exports_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "evidence_exports_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "evidence_exports_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "evidence_exports_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "evidence_exports_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      gdpr_compliance: {
        Row: {
          affected_tables: string[] | null
          completed_at: string | null
          data_subject_id: string | null
          dpo_notes: string | null
          id: string
          legal_basis: string | null
          request_type: string
          requested_at: string | null
          requester_email: string | null
          response_data: Json | null
          retention_override_reason: string | null
          status: string | null
        }
        Insert: {
          affected_tables?: string[] | null
          completed_at?: string | null
          data_subject_id?: string | null
          dpo_notes?: string | null
          id?: string
          legal_basis?: string | null
          request_type: string
          requested_at?: string | null
          requester_email?: string | null
          response_data?: Json | null
          retention_override_reason?: string | null
          status?: string | null
        }
        Update: {
          affected_tables?: string[] | null
          completed_at?: string | null
          data_subject_id?: string | null
          dpo_notes?: string | null
          id?: string
          legal_basis?: string | null
          request_type?: string
          requested_at?: string | null
          requester_email?: string | null
          response_data?: Json | null
          retention_override_reason?: string | null
          status?: string | null
        }
        Relationships: []
      }
      Hire: {
        Row: {
          accessrequirements: string | null
          actualcollectiondate: string | null
          actualdeliverydate: string | null
          airtable_created_time: string | null
          airtable_record_id: string | null
          approvedby: string | null
          automationstatus: string | null
          block: string | null
          bookeddate: string | null
          collectioncharge: number | null
          conditiononcollection: string | null
          conditionondelivery: string | null
          dailyhirerate: number | null
          damagecharges: number | null
          damagenotes: string | null
          deliveryaddress: string | null
          deliverycharge: number | null
          deliverycontact: string | null
          deliveryphone: string | null
          equipmentdescription: string | null
          equipmenttype: string | null
          hireduration: number | null
          hirenotes: string | null
          hirereference: string | null
          hirestatus: string | null
          hireuid: string | null
          internalnotes: string | null
          invoicenumber: string | null
          jobs: string | null
          lastautomationcall: string | null
          nextautomationcall: string | null
          paymentstatus: string | null
          plannedcollectiondate: string | null
          project: string | null
          requestedby: string | null
          requesteddate: string | null
          requesteddeliverydate: string | null
          securitydeposit: number | null
          sitecontact: string | null
          sitephone: string | null
          specialinstructions: string | null
          supplier: string | null
          supplieremail: string | null
          supplierphone: string | null
          supplierreference: string | null
          totalhirecost: number | null
          weeklyhirerate: number | null
          whalesync_postgres_id: string
        }
        Insert: {
          accessrequirements?: string | null
          actualcollectiondate?: string | null
          actualdeliverydate?: string | null
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          approvedby?: string | null
          automationstatus?: string | null
          block?: string | null
          bookeddate?: string | null
          collectioncharge?: number | null
          conditiononcollection?: string | null
          conditionondelivery?: string | null
          dailyhirerate?: number | null
          damagecharges?: number | null
          damagenotes?: string | null
          deliveryaddress?: string | null
          deliverycharge?: number | null
          deliverycontact?: string | null
          deliveryphone?: string | null
          equipmentdescription?: string | null
          equipmenttype?: string | null
          hireduration?: number | null
          hirenotes?: string | null
          hirereference?: string | null
          hirestatus?: string | null
          hireuid?: string | null
          internalnotes?: string | null
          invoicenumber?: string | null
          jobs?: string | null
          lastautomationcall?: string | null
          nextautomationcall?: string | null
          paymentstatus?: string | null
          plannedcollectiondate?: string | null
          project?: string | null
          requestedby?: string | null
          requesteddate?: string | null
          requesteddeliverydate?: string | null
          securitydeposit?: number | null
          sitecontact?: string | null
          sitephone?: string | null
          specialinstructions?: string | null
          supplier?: string | null
          supplieremail?: string | null
          supplierphone?: string | null
          supplierreference?: string | null
          totalhirecost?: number | null
          weeklyhirerate?: number | null
          whalesync_postgres_id?: string
        }
        Update: {
          accessrequirements?: string | null
          actualcollectiondate?: string | null
          actualdeliverydate?: string | null
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          approvedby?: string | null
          automationstatus?: string | null
          block?: string | null
          bookeddate?: string | null
          collectioncharge?: number | null
          conditiononcollection?: string | null
          conditionondelivery?: string | null
          dailyhirerate?: number | null
          damagecharges?: number | null
          damagenotes?: string | null
          deliveryaddress?: string | null
          deliverycharge?: number | null
          deliverycontact?: string | null
          deliveryphone?: string | null
          equipmentdescription?: string | null
          equipmenttype?: string | null
          hireduration?: number | null
          hirenotes?: string | null
          hirereference?: string | null
          hirestatus?: string | null
          hireuid?: string | null
          internalnotes?: string | null
          invoicenumber?: string | null
          jobs?: string | null
          lastautomationcall?: string | null
          nextautomationcall?: string | null
          paymentstatus?: string | null
          plannedcollectiondate?: string | null
          project?: string | null
          requestedby?: string | null
          requesteddate?: string | null
          requesteddeliverydate?: string | null
          securitydeposit?: number | null
          sitecontact?: string | null
          sitephone?: string | null
          specialinstructions?: string | null
          supplier?: string | null
          supplieremail?: string | null
          supplierphone?: string | null
          supplierreference?: string | null
          totalhirecost?: number | null
          weeklyhirerate?: number | null
          whalesync_postgres_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hire_jobs_foreign"
            columns: ["jobs"]
            isOneToOne: false
            referencedRelation: "Jobs"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      incident_reports: {
        Row: {
          corrective_actions: string | null
          created_at: string | null
          description: string
          id: string
          incident_type: string | null
          investigation_status: string | null
          location_details: string | null
          project_id: string | null
          reported_by: string | null
          severity: string | null
          witnesses: Json | null
        }
        Insert: {
          corrective_actions?: string | null
          created_at?: string | null
          description: string
          id?: string
          incident_type?: string | null
          investigation_status?: string | null
          location_details?: string | null
          project_id?: string | null
          reported_by?: string | null
          severity?: string | null
          witnesses?: Json | null
        }
        Update: {
          corrective_actions?: string | null
          created_at?: string | null
          description?: string
          id?: string
          incident_type?: string | null
          investigation_status?: string | null
          location_details?: string | null
          project_id?: string | null
          reported_by?: string | null
          severity?: string | null
          witnesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "incident_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "incident_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "incident_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "incident_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "incident_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      induction_materials: {
        Row: {
          content_url: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          language: string | null
          material_type: string
          metadata: Json | null
          project_id: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          material_type: string
          metadata?: Json | null
          project_id?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          material_type?: string
          metadata?: Json | null
          project_id?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      induction_progress: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          current_step: number | null
          device_info: Json | null
          id: string
          induction_type: string
          language_preference: string | null
          location: string | null
          project_id: string | null
          started_at: string | null
          status: string
          supervisor_id: string | null
          total_steps: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_step?: number | null
          device_info?: Json | null
          id?: string
          induction_type?: string
          language_preference?: string | null
          location?: string | null
          project_id?: string | null
          started_at?: string | null
          status?: string
          supervisor_id?: string | null
          total_steps?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_step?: number | null
          device_info?: Json | null
          id?: string
          induction_type?: string
          language_preference?: string | null
          location?: string | null
          project_id?: string | null
          started_at?: string | null
          status?: string
          supervisor_id?: string | null
          total_steps?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      Job_Templates: {
        Row: {
          airtable_created_time: string | null
          airtable_record_id: string | null
          baserate: number | null
          category: string | null
          estimatedhours: number | null
          fixstage: string | null
          jobs: string | null
          materialsincluded: boolean | null
          skilllevel: string | null
          taskcode: string | null
          taskdescription: string | null
          templateuid: string | null
          unit: string | null
          user_job_rates: string | null
          userjobrate: string | null
          whalesync_postgres_id: string
        }
        Insert: {
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          baserate?: number | null
          category?: string | null
          estimatedhours?: number | null
          fixstage?: string | null
          jobs?: string | null
          materialsincluded?: boolean | null
          skilllevel?: string | null
          taskcode?: string | null
          taskdescription?: string | null
          templateuid?: string | null
          unit?: string | null
          user_job_rates?: string | null
          userjobrate?: string | null
          whalesync_postgres_id?: string
        }
        Update: {
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          baserate?: number | null
          category?: string | null
          estimatedhours?: number | null
          fixstage?: string | null
          jobs?: string | null
          materialsincluded?: boolean | null
          skilllevel?: string | null
          taskcode?: string | null
          taskdescription?: string | null
          templateuid?: string | null
          unit?: string | null
          user_job_rates?: string | null
          userjobrate?: string | null
          whalesync_postgres_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_templates_category_foreign"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "WorkCategories"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "job_templates_user_job_rates_foreign"
            columns: ["user_job_rates"]
            isOneToOne: false
            referencedRelation: "User_Job_Rates"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      job_tracker: {
        Row: {
          agreed_rate: number
          approved_at: string | null
          approved_by: string | null
          assigned_user_id: string
          calculated_total: number | null
          created_at: string
          end_time: string | null
          hours_worked: number | null
          id: string
          issues_encountered: string | null
          job_type_id: string
          materials_used: Json | null
          override_at: string | null
          override_by: string | null
          override_reason: string | null
          override_total: number | null
          photos: string[] | null
          plot_id: string
          project_id: string
          quantity_completed: number | null
          rams_signed_id: string | null
          rate_type: string
          rejection_reason: string | null
          safety_checks_completed: boolean | null
          start_time: string | null
          status: string
          submitted_at: string
          unit_type: string | null
          updated_at: string
          work_date: string
          work_description: string
        }
        Insert: {
          agreed_rate: number
          approved_at?: string | null
          approved_by?: string | null
          assigned_user_id: string
          calculated_total?: number | null
          created_at?: string
          end_time?: string | null
          hours_worked?: number | null
          id?: string
          issues_encountered?: string | null
          job_type_id: string
          materials_used?: Json | null
          override_at?: string | null
          override_by?: string | null
          override_reason?: string | null
          override_total?: number | null
          photos?: string[] | null
          plot_id: string
          project_id: string
          quantity_completed?: number | null
          rams_signed_id?: string | null
          rate_type: string
          rejection_reason?: string | null
          safety_checks_completed?: boolean | null
          start_time?: string | null
          status?: string
          submitted_at?: string
          unit_type?: string | null
          updated_at?: string
          work_date?: string
          work_description: string
        }
        Update: {
          agreed_rate?: number
          approved_at?: string | null
          approved_by?: string | null
          assigned_user_id?: string
          calculated_total?: number | null
          created_at?: string
          end_time?: string | null
          hours_worked?: number | null
          id?: string
          issues_encountered?: string | null
          job_type_id?: string
          materials_used?: Json | null
          override_at?: string | null
          override_by?: string | null
          override_reason?: string | null
          override_total?: number | null
          photos?: string[] | null
          plot_id?: string
          project_id?: string
          quantity_completed?: number | null
          rams_signed_id?: string | null
          rate_type?: string
          rejection_reason?: string | null
          safety_checks_completed?: boolean | null
          start_time?: string | null
          status?: string
          submitted_at?: string
          unit_type?: string | null
          updated_at?: string
          work_date?: string
          work_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_tracker_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_tracker_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_tracker_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "job_tracker_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_tracker_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "job_tracker_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_tracker_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_tracker_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "job_tracker_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_tracker_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "job_tracker_job_type_id_fkey"
            columns: ["job_type_id"]
            isOneToOne: false
            referencedRelation: "job_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_tracker_override_by_fkey"
            columns: ["override_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_tracker_override_by_fkey"
            columns: ["override_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_tracker_override_by_fkey"
            columns: ["override_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "job_tracker_override_by_fkey"
            columns: ["override_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_tracker_override_by_fkey"
            columns: ["override_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "job_tracker_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "Plots"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "job_tracker_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      job_tracker_duplicates: {
        Row: {
          detected_at: string
          duplicate_job_id: string
          id: string
          notes: string | null
          original_job_id: string
          resolution_action: string | null
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          detected_at?: string
          duplicate_job_id: string
          id?: string
          notes?: string | null
          original_job_id: string
          resolution_action?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          detected_at?: string
          duplicate_job_id?: string
          id?: string
          notes?: string | null
          original_job_id?: string
          resolution_action?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_tracker_duplicates_duplicate_job_id_fkey"
            columns: ["duplicate_job_id"]
            isOneToOne: false
            referencedRelation: "job_tracker"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_tracker_duplicates_original_job_id_fkey"
            columns: ["original_job_id"]
            isOneToOne: false
            referencedRelation: "job_tracker"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_tracker_duplicates_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_tracker_duplicates_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_tracker_duplicates_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "job_tracker_duplicates_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_tracker_duplicates_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      job_types: {
        Row: {
          code: string
          created_at: string
          default_unit_price: number | null
          default_unit_type: string | null
          description: string | null
          estimated_duration_hours: number | null
          id: string
          is_active: boolean | null
          name: string
          pricing_model: string
          required_rams_template_id: string | null
          requires_certification: string[] | null
          updated_at: string
          work_category_id: string
        }
        Insert: {
          code: string
          created_at?: string
          default_unit_price?: number | null
          default_unit_type?: string | null
          description?: string | null
          estimated_duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          pricing_model: string
          required_rams_template_id?: string | null
          requires_certification?: string[] | null
          updated_at?: string
          work_category_id: string
        }
        Update: {
          code?: string
          created_at?: string
          default_unit_price?: number | null
          default_unit_type?: string | null
          description?: string | null
          estimated_duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          pricing_model?: string
          required_rams_template_id?: string | null
          requires_certification?: string[] | null
          updated_at?: string
          work_category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_types_work_category_id_fkey"
            columns: ["work_category_id"]
            isOneToOne: false
            referencedRelation: "work_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      Jobs: {
        Row: {
          jobname: string | null
          whalesync_postgres_id: string
        }
        Insert: {
          jobname?: string | null
          whalesync_postgres_id?: string
        }
        Update: {
          jobname?: string | null
          whalesync_postgres_id?: string
        }
        Relationships: []
      }
      learning_analytics: {
        Row: {
          ai_feedback: Json | null
          completion_time_minutes: number | null
          created_at: string | null
          difficulty_areas: string[] | null
          id: string
          induction_id: string
          language_used: string | null
          learning_style: string | null
          quiz_score: number | null
          recommendations: Json | null
          retry_count: number | null
          user_id: string
        }
        Insert: {
          ai_feedback?: Json | null
          completion_time_minutes?: number | null
          created_at?: string | null
          difficulty_areas?: string[] | null
          id?: string
          induction_id: string
          language_used?: string | null
          learning_style?: string | null
          quiz_score?: number | null
          recommendations?: Json | null
          retry_count?: number | null
          user_id: string
        }
        Update: {
          ai_feedback?: Json | null
          completion_time_minutes?: number | null
          created_at?: string | null
          difficulty_areas?: string[] | null
          id?: string
          induction_id?: string
          language_used?: string | null
          learning_style?: string | null
          quiz_score?: number | null
          recommendations?: Json | null
          retry_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_analytics_induction_id_fkey"
            columns: ["induction_id"]
            isOneToOne: false
            referencedRelation: "induction_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          block_id: number | null
          id: number
          name: string | null
        }
        Insert: {
          block_id?: number | null
          id?: never
          name?: string | null
        }
        Update: {
          block_id?: number | null
          id?: never
          name?: string | null
        }
        Relationships: []
      }
      Levels: {
        Row: {
          accessequipment: string | null
          actualenddate: string | null
          actualstartdate: string | null
          airtable_created_time: string | null
          airtable_record_id: string | null
          block: string | null
          block_level_id: string | null
          drawings: string | null
          drawings_2: string | null
          electricaldistribution: string | null
          electricalfirstfixcomplete: boolean | null
          electricalsecondfixcomplete: boolean | null
          equipmentnotes: string | null
          firstfixprogress: number | null
          flooringcomplete: boolean | null
          gasdistribution: string | null
          handoverdate: string | null
          healthsafetyinspection: string | null
          healthsafetystatus: string | null
          heatingfirstfixcomplete: boolean | null
          heatingmainsdistribution: string | null
          heatingsecondfixcomplete: boolean | null
          hireequipmentonlevel: number | null
          lastleveldelivery: string | null
          leveldeliveries: number | null
          leveldeliverynotes: string | null
          levelhirecost: number | null
          levelid: number | null
          levelname: string | null
          levelnotes: string | null
          levelnumber: number | null
          levelstatus: string | null
          leveluid: string | null
          mainwaterriser: string | null
          nextscheduledleveldelivery: string | null
          pendingleveldeliveries: number | null
          plannedenddate: string | null
          plannedstartdate: string | null
          plasteringcomplete: boolean | null
          plots: string | null
          plotsonlevel: number | null
          plumbingfirstfixcomplete: boolean | null
          plumbingsecondfixcomplete: boolean | null
          qualitycheckdate: string | null
          qualitycheckstatus: string | null
          readyforhandover: boolean | null
          secondfixprogress: number | null
          snaggingitems: number | null
          wastestackinstallation: string | null
          whalesync_postgres_id: string
        }
        Insert: {
          accessequipment?: string | null
          actualenddate?: string | null
          actualstartdate?: string | null
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          block?: string | null
          block_level_id?: string | null
          drawings?: string | null
          drawings_2?: string | null
          electricaldistribution?: string | null
          electricalfirstfixcomplete?: boolean | null
          electricalsecondfixcomplete?: boolean | null
          equipmentnotes?: string | null
          firstfixprogress?: number | null
          flooringcomplete?: boolean | null
          gasdistribution?: string | null
          handoverdate?: string | null
          healthsafetyinspection?: string | null
          healthsafetystatus?: string | null
          heatingfirstfixcomplete?: boolean | null
          heatingmainsdistribution?: string | null
          heatingsecondfixcomplete?: boolean | null
          hireequipmentonlevel?: number | null
          lastleveldelivery?: string | null
          leveldeliveries?: number | null
          leveldeliverynotes?: string | null
          levelhirecost?: number | null
          levelid?: number | null
          levelname?: string | null
          levelnotes?: string | null
          levelnumber?: number | null
          levelstatus?: string | null
          leveluid?: string | null
          mainwaterriser?: string | null
          nextscheduledleveldelivery?: string | null
          pendingleveldeliveries?: number | null
          plannedenddate?: string | null
          plannedstartdate?: string | null
          plasteringcomplete?: boolean | null
          plots?: string | null
          plotsonlevel?: number | null
          plumbingfirstfixcomplete?: boolean | null
          plumbingsecondfixcomplete?: boolean | null
          qualitycheckdate?: string | null
          qualitycheckstatus?: string | null
          readyforhandover?: boolean | null
          secondfixprogress?: number | null
          snaggingitems?: number | null
          wastestackinstallation?: string | null
          whalesync_postgres_id?: string
        }
        Update: {
          accessequipment?: string | null
          actualenddate?: string | null
          actualstartdate?: string | null
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          block?: string | null
          block_level_id?: string | null
          drawings?: string | null
          drawings_2?: string | null
          electricaldistribution?: string | null
          electricalfirstfixcomplete?: boolean | null
          electricalsecondfixcomplete?: boolean | null
          equipmentnotes?: string | null
          firstfixprogress?: number | null
          flooringcomplete?: boolean | null
          gasdistribution?: string | null
          handoverdate?: string | null
          healthsafetyinspection?: string | null
          healthsafetystatus?: string | null
          heatingfirstfixcomplete?: boolean | null
          heatingmainsdistribution?: string | null
          heatingsecondfixcomplete?: boolean | null
          hireequipmentonlevel?: number | null
          lastleveldelivery?: string | null
          leveldeliveries?: number | null
          leveldeliverynotes?: string | null
          levelhirecost?: number | null
          levelid?: number | null
          levelname?: string | null
          levelnotes?: string | null
          levelnumber?: number | null
          levelstatus?: string | null
          leveluid?: string | null
          mainwaterriser?: string | null
          nextscheduledleveldelivery?: string | null
          pendingleveldeliveries?: number | null
          plannedenddate?: string | null
          plannedstartdate?: string | null
          plasteringcomplete?: boolean | null
          plots?: string | null
          plotsonlevel?: number | null
          plumbingfirstfixcomplete?: boolean | null
          plumbingsecondfixcomplete?: boolean | null
          qualitycheckdate?: string | null
          qualitycheckstatus?: string | null
          readyforhandover?: boolean | null
          secondfixprogress?: number | null
          snaggingitems?: number | null
          wastestackinstallation?: string | null
          whalesync_postgres_id?: string
        }
        Relationships: []
      }
      live_activity_feed: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_system_generated: boolean | null
          metadata: Json | null
          priority: string | null
          project_id: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_system_generated?: boolean | null
          metadata?: Json | null
          priority?: string | null
          project_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_system_generated?: boolean | null
          metadata?: Json | null
          priority?: string | null
          project_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      location_tracking: {
        Row: {
          accuracy_meters: number | null
          activity: string | null
          block_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          project_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          accuracy_meters?: number | null
          activity?: string | null
          block_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          project_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          accuracy_meters?: number | null
          activity?: string | null
          block_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          project_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_tracking_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "Blocks"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "location_tracking_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "location_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "location_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "location_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "location_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "location_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          message_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      migration_incentives: {
        Row: {
          claimed: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          incentive_type: string | null
          user_id: string | null
          value: number | null
        }
        Insert: {
          claimed?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          incentive_type?: string | null
          user_id?: string | null
          value?: number | null
        }
        Update: {
          claimed?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          incentive_type?: string | null
          user_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "migration_incentives_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "migration_incentives_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "migration_incentives_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "migration_incentives_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "migration_incentives_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      notification_analytics: {
        Row: {
          actual_engagement_score: number | null
          ai_prediction_accuracy: number | null
          created_at: string
          delivery_time_ms: number | null
          device_type: string | null
          failed_channels: string[] | null
          final_delivery_channel: string | null
          id: string
          interaction_count: number | null
          location_context: string | null
          notification_id: string | null
          predicted_engagement_score: number | null
          successful_channels: string[] | null
          time_of_day: string | null
          time_to_action_seconds: number | null
          time_to_read_seconds: number | null
          user_id: string | null
        }
        Insert: {
          actual_engagement_score?: number | null
          ai_prediction_accuracy?: number | null
          created_at?: string
          delivery_time_ms?: number | null
          device_type?: string | null
          failed_channels?: string[] | null
          final_delivery_channel?: string | null
          id?: string
          interaction_count?: number | null
          location_context?: string | null
          notification_id?: string | null
          predicted_engagement_score?: number | null
          successful_channels?: string[] | null
          time_of_day?: string | null
          time_to_action_seconds?: number | null
          time_to_read_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          actual_engagement_score?: number | null
          ai_prediction_accuracy?: number | null
          created_at?: string
          delivery_time_ms?: number | null
          device_type?: string | null
          failed_channels?: string[] | null
          final_delivery_channel?: string | null
          id?: string
          interaction_count?: number | null
          location_context?: string | null
          notification_id?: string | null
          predicted_engagement_score?: number | null
          successful_channels?: string[] | null
          time_of_day?: string | null
          time_to_action_seconds?: number | null
          time_to_read_seconds?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_analytics_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "smart_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_escalation_rules: {
        Row: {
          applicable_roles: string[]
          auto_escalate_unacknowledged: boolean | null
          auto_escalate_unread: boolean | null
          compliance_risk_threshold: number | null
          created_at: string
          escalation_chain: Json
          id: string
          is_active: boolean | null
          max_escalation_level: number | null
          name: string
          notification_type: string
          priority: string
          project_ids: string[] | null
          updated_at: string
        }
        Insert: {
          applicable_roles: string[]
          auto_escalate_unacknowledged?: boolean | null
          auto_escalate_unread?: boolean | null
          compliance_risk_threshold?: number | null
          created_at?: string
          escalation_chain: Json
          id?: string
          is_active?: boolean | null
          max_escalation_level?: number | null
          name: string
          notification_type: string
          priority: string
          project_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          applicable_roles?: string[]
          auto_escalate_unacknowledged?: boolean | null
          auto_escalate_unread?: boolean | null
          compliance_risk_threshold?: number | null
          created_at?: string
          escalation_chain?: Json
          id?: string
          is_active?: boolean | null
          max_escalation_level?: number | null
          name?: string
          notification_type?: string
          priority?: string
          project_ids?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          min_priority_email: string | null
          min_priority_push: string | null
          min_priority_sms: string | null
          project_specific: Json | null
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          role_overrides: Json | null
          sms_enabled: boolean | null
          updated_at: string
          user_id: string | null
          voice_enabled: boolean | null
          weekend_notifications: boolean | null
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          min_priority_email?: string | null
          min_priority_push?: string | null
          min_priority_sms?: string | null
          project_specific?: Json | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          role_overrides?: Json | null
          sms_enabled?: boolean | null
          updated_at?: string
          user_id?: string | null
          voice_enabled?: boolean | null
          weekend_notifications?: boolean | null
        }
        Update: {
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          min_priority_email?: string | null
          min_priority_push?: string | null
          min_priority_sms?: string | null
          project_specific?: Json | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          role_overrides?: Json | null
          sms_enabled?: boolean | null
          updated_at?: string
          user_id?: string | null
          voice_enabled?: boolean | null
          weekend_notifications?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          data: Json | null
          id: string
          message: string
          metadata: Json | null
          priority: string | null
          read: boolean | null
          read_at: string | null
          recipient_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          recipient_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          recipient_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      offline_prompt_cache: {
        Row: {
          cached_input: string
          cached_output: string
          created_at: string | null
          device_fingerprint: string | null
          id: string
          is_synced: boolean | null
          synced_at: string | null
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          cached_input: string
          cached_output: string
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          is_synced?: boolean | null
          synced_at?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          cached_input?: string
          cached_output?: string
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          is_synced?: boolean | null
          synced_at?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offline_prompt_cache_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "smart_prompt_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offline_prompt_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "offline_prompt_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "offline_prompt_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "offline_prompt_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "offline_prompt_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      on_hire: {
        Row: {
          actual_end_date: string | null
          created_at: string | null
          expected_end_date: string | null
          hire_start_date: string
          id: string
          item_name: string
          notes: string | null
          project_id: string | null
          requested_by: string | null
          status: string | null
          supplier_name: string
          weekly_cost: number | null
        }
        Insert: {
          actual_end_date?: string | null
          created_at?: string | null
          expected_end_date?: string | null
          hire_start_date: string
          id?: string
          item_name: string
          notes?: string | null
          project_id?: string | null
          requested_by?: string | null
          status?: string | null
          supplier_name: string
          weekly_cost?: number | null
        }
        Update: {
          actual_end_date?: string | null
          created_at?: string | null
          expected_end_date?: string | null
          hire_start_date?: string
          id?: string
          item_name?: string
          notes?: string | null
          project_id?: string | null
          requested_by?: string | null
          status?: string | null
          supplier_name?: string
          weekly_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "on_hire_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "on_hire_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "on_hire_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "on_hire_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "on_hire_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "on_hire_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      performance_benchmarks: {
        Row: {
          avg_completion_time: unknown | null
          best_completion_time: unknown | null
          id: string
          job_template_id: string | null
          last_updated: string | null
          plot_type_id: string | null
          quality_score: number | null
          sample_size: number | null
        }
        Insert: {
          avg_completion_time?: unknown | null
          best_completion_time?: unknown | null
          id?: string
          job_template_id?: string | null
          last_updated?: string | null
          plot_type_id?: string | null
          quality_score?: number | null
          sample_size?: number | null
        }
        Update: {
          avg_completion_time?: unknown | null
          best_completion_time?: unknown | null
          id?: string
          job_template_id?: string | null
          last_updated?: string | null
          plot_type_id?: string | null
          quality_score?: number | null
          sample_size?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_benchmarks_job_template_id_fkey"
            columns: ["job_template_id"]
            isOneToOne: false
            referencedRelation: "Job_Templates"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "performance_benchmarks_plot_type_id_fkey"
            columns: ["plot_type_id"]
            isOneToOne: false
            referencedRelation: "Plot_Types"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          created_at: string | null
          execution_time_ms: number | null
          id: string
          metric_type: string
          operation: string | null
          query_hash: string | null
          row_count: number | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          metric_type: string
          operation?: string | null
          query_hash?: string | null
          row_count?: number | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          metric_type?: string
          operation?: string | null
          query_hash?: string | null
          row_count?: number | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      Plot_Assignments: {
        Row: {
          actual_completion: string | null
          assigned_date: string | null
          expected_completion: string | null
          id: string
          notes: string | null
          plot_id: string | null
          status: string | null
          user_id: string | null
          work_type: string | null
        }
        Insert: {
          actual_completion?: string | null
          assigned_date?: string | null
          expected_completion?: string | null
          id?: string
          notes?: string | null
          plot_id?: string | null
          status?: string | null
          user_id?: string | null
          work_type?: string | null
        }
        Update: {
          actual_completion?: string | null
          assigned_date?: string | null
          expected_completion?: string | null
          id?: string
          notes?: string | null
          plot_id?: string | null
          status?: string | null
          user_id?: string | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Plot_Assignments_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "Plots"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "Plot_Assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "Plot_Assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "Plot_Assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "Plot_Assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "Plot_Assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      plot_job_status: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          id: string
          job_type_id: string
          lock_reason: string | null
          locked_at: string | null
          locked_by: string | null
          plot_id: string
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          id?: string
          job_type_id: string
          lock_reason?: string | null
          locked_at?: string | null
          locked_by?: string | null
          plot_id: string
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          id?: string
          job_type_id?: string
          lock_reason?: string | null
          locked_at?: string | null
          locked_by?: string | null
          plot_id?: string
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plot_job_status_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "plot_job_status_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "plot_job_status_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "plot_job_status_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "plot_job_status_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "plot_job_status_job_type_id_fkey"
            columns: ["job_type_id"]
            isOneToOne: false
            referencedRelation: "job_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plot_job_status_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "plot_job_status_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "plot_job_status_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "plot_job_status_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "plot_job_status_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "plot_job_status_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "Plots"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "plot_job_status_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      Plot_Status_History: {
        Row: {
          change_reason: string | null
          changed_at: string | null
          changed_by: string | null
          id: string
          new_status: string | null
          old_status: string | null
          plot_id: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_status?: string | null
          old_status?: string | null
          plot_id?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_status?: string | null
          old_status?: string | null
          plot_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Plot_Status_History_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "Plot_Status_History_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "Plot_Status_History_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "Plot_Status_History_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "Plot_Status_History_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "Plot_Status_History_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "Plots"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      Plot_Types: {
        Row: {
          airtable_created_time: string | null
          airtable_record_id: string | null
          description: string | null
          plots: string | null
          plottypeuid: string | null
          pricingmultiplier: number | null
          typename: string | null
          typicalfloorarea: number | null
          user_job_rates: string | null
          whalesync_postgres_id: string
        }
        Insert: {
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          description?: string | null
          plots?: string | null
          plottypeuid?: string | null
          pricingmultiplier?: number | null
          typename?: string | null
          typicalfloorarea?: number | null
          user_job_rates?: string | null
          whalesync_postgres_id?: string
        }
        Update: {
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          description?: string | null
          plots?: string | null
          plottypeuid?: string | null
          pricingmultiplier?: number | null
          typename?: string | null
          typicalfloorarea?: number | null
          user_job_rates?: string | null
          whalesync_postgres_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plot_types_plots_foreign"
            columns: ["plots"]
            isOneToOne: false
            referencedRelation: "Plots"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "plot_types_user_job_rates_foreign"
            columns: ["user_job_rates"]
            isOneToOne: false
            referencedRelation: "User_Job_Rates"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      Plots: {
        Row: {
          accessnotes: string | null
          actualfirstfixstart: string | null
          actualhandoverdate: string | null
          actualsecondfixstart: string | null
          airtable_created_time: string | null
          airtable_record_id: string | null
          clientspecifications: string | null
          completion_percentage: number | null
          customercontact: string | null
          customername: string | null
          customersatisfaction: string | null
          drawings: string | null
          drawings_2: string | null
          electricalfirstfixstatus: string | null
          electricalsecondfixstatus: string | null
          equipmentonplot: number | null
          equipmentrequired: string[] | null
          final_fix_completed_date: string | null
          first_fix_completed_date: string | null
          floorarea: number | null
          gasfirstfixstatus: string | null
          gassecondfixstatus: string | null
          handoverpackagecomplete: boolean | null
          hasbalcony: boolean | null
          hasgarden: boolean | null
          healthsafetycompliance: string | null
          heatingfirstfixstatus: string | null
          heatingsecondfixstatus: string | null
          imported_table: string | null
          jobs: string | null
          lastplotdelivery: string | null
          level: string | null
          level_lookup: string | null
          materialsonsite: string | null
          nextscheduledplotdelivery: string | null
          numberofbathrooms: number | null
          numberofbedrooms: number | null
          pendingplotdeliveries: number | null
          plannedfirstfixstart: string | null
          plannedhandoverdate: string | null
          plannedsecondfixstart: string | null
          plotdeliveries: number | null
          plotdeliverynotes: string | null
          plothirecost: number | null
          plotid: string | null
          plotinspectiondate: string | null
          plotinspectionstatus: string | null
          plotnotes: string | null
          plotnumber: string | null
          plotstatus: string | null
          plottype: string | null
          plotuid: string | null
          plumbingfirstfixstatus: string | null
          plumbingsecondfixstatus: string | null
          prehandoverinspection: string | null
          second_fix_completed_date: string | null
          snaggingitems: number | null
          snaggingnotes: string | null
          snaggingstatus: string | null
          specialrequirements: string | null
          warrantystartdate: string | null
          whalesync_postgres_id: string
        }
        Insert: {
          accessnotes?: string | null
          actualfirstfixstart?: string | null
          actualhandoverdate?: string | null
          actualsecondfixstart?: string | null
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          clientspecifications?: string | null
          completion_percentage?: number | null
          customercontact?: string | null
          customername?: string | null
          customersatisfaction?: string | null
          drawings?: string | null
          drawings_2?: string | null
          electricalfirstfixstatus?: string | null
          electricalsecondfixstatus?: string | null
          equipmentonplot?: number | null
          equipmentrequired?: string[] | null
          final_fix_completed_date?: string | null
          first_fix_completed_date?: string | null
          floorarea?: number | null
          gasfirstfixstatus?: string | null
          gassecondfixstatus?: string | null
          handoverpackagecomplete?: boolean | null
          hasbalcony?: boolean | null
          hasgarden?: boolean | null
          healthsafetycompliance?: string | null
          heatingfirstfixstatus?: string | null
          heatingsecondfixstatus?: string | null
          imported_table?: string | null
          jobs?: string | null
          lastplotdelivery?: string | null
          level?: string | null
          level_lookup?: string | null
          materialsonsite?: string | null
          nextscheduledplotdelivery?: string | null
          numberofbathrooms?: number | null
          numberofbedrooms?: number | null
          pendingplotdeliveries?: number | null
          plannedfirstfixstart?: string | null
          plannedhandoverdate?: string | null
          plannedsecondfixstart?: string | null
          plotdeliveries?: number | null
          plotdeliverynotes?: string | null
          plothirecost?: number | null
          plotid?: string | null
          plotinspectiondate?: string | null
          plotinspectionstatus?: string | null
          plotnotes?: string | null
          plotnumber?: string | null
          plotstatus?: string | null
          plottype?: string | null
          plotuid?: string | null
          plumbingfirstfixstatus?: string | null
          plumbingsecondfixstatus?: string | null
          prehandoverinspection?: string | null
          second_fix_completed_date?: string | null
          snaggingitems?: number | null
          snaggingnotes?: string | null
          snaggingstatus?: string | null
          specialrequirements?: string | null
          warrantystartdate?: string | null
          whalesync_postgres_id?: string
        }
        Update: {
          accessnotes?: string | null
          actualfirstfixstart?: string | null
          actualhandoverdate?: string | null
          actualsecondfixstart?: string | null
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          clientspecifications?: string | null
          completion_percentage?: number | null
          customercontact?: string | null
          customername?: string | null
          customersatisfaction?: string | null
          drawings?: string | null
          drawings_2?: string | null
          electricalfirstfixstatus?: string | null
          electricalsecondfixstatus?: string | null
          equipmentonplot?: number | null
          equipmentrequired?: string[] | null
          final_fix_completed_date?: string | null
          first_fix_completed_date?: string | null
          floorarea?: number | null
          gasfirstfixstatus?: string | null
          gassecondfixstatus?: string | null
          handoverpackagecomplete?: boolean | null
          hasbalcony?: boolean | null
          hasgarden?: boolean | null
          healthsafetycompliance?: string | null
          heatingfirstfixstatus?: string | null
          heatingsecondfixstatus?: string | null
          imported_table?: string | null
          jobs?: string | null
          lastplotdelivery?: string | null
          level?: string | null
          level_lookup?: string | null
          materialsonsite?: string | null
          nextscheduledplotdelivery?: string | null
          numberofbathrooms?: number | null
          numberofbedrooms?: number | null
          pendingplotdeliveries?: number | null
          plannedfirstfixstart?: string | null
          plannedhandoverdate?: string | null
          plannedsecondfixstart?: string | null
          plotdeliveries?: number | null
          plotdeliverynotes?: string | null
          plothirecost?: number | null
          plotid?: string | null
          plotinspectiondate?: string | null
          plotinspectionstatus?: string | null
          plotnotes?: string | null
          plotnumber?: string | null
          plotstatus?: string | null
          plottype?: string | null
          plotuid?: string | null
          plumbingfirstfixstatus?: string | null
          plumbingsecondfixstatus?: string | null
          prehandoverinspection?: string | null
          second_fix_completed_date?: string | null
          snaggingitems?: number | null
          snaggingnotes?: string | null
          snaggingstatus?: string | null
          specialrequirements?: string | null
          warrantystartdate?: string | null
          whalesync_postgres_id?: string
        }
        Relationships: []
      }
      pod_approvals: {
        Row: {
          action: string
          approver_id: string
          comments: string | null
          created_at: string | null
          id: string
          pod_id: string
        }
        Insert: {
          action: string
          approver_id: string
          comments?: string | null
          created_at?: string | null
          id?: string
          pod_id: string
        }
        Update: {
          action?: string
          approver_id?: string
          comments?: string | null
          created_at?: string | null
          id?: string
          pod_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pod_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pod_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pod_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "pod_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pod_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "pod_approvals_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_register"
            referencedColumns: ["id"]
          },
        ]
      }
      pod_register: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          condition_on_arrival: string | null
          created_at: string | null
          damage_notes: string | null
          delivery_method: string | null
          description: string
          discrepancy_value: number | null
          hire_item_id: string | null
          id: string
          linked_hire_id: string | null
          metadata: Json | null
          order_reference: string | null
          plot_id: string | null
          plot_location: string | null
          pod_category: string
          pod_photo_url: string | null
          pod_type: string
          project_id: string
          quantity_expected: number | null
          quantity_received: number | null
          signed_by: string | null
          signed_by_name: string | null
          status: string | null
          supplier_contact: string | null
          supplier_id: string | null
          supplier_name: string | null
          uploaded_by: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          condition_on_arrival?: string | null
          created_at?: string | null
          damage_notes?: string | null
          delivery_method?: string | null
          description: string
          discrepancy_value?: number | null
          hire_item_id?: string | null
          id?: string
          linked_hire_id?: string | null
          metadata?: Json | null
          order_reference?: string | null
          plot_id?: string | null
          plot_location?: string | null
          pod_category: string
          pod_photo_url?: string | null
          pod_type: string
          project_id: string
          quantity_expected?: number | null
          quantity_received?: number | null
          signed_by?: string | null
          signed_by_name?: string | null
          status?: string | null
          supplier_contact?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          uploaded_by: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          condition_on_arrival?: string | null
          created_at?: string | null
          damage_notes?: string | null
          delivery_method?: string | null
          description?: string
          discrepancy_value?: number | null
          hire_item_id?: string | null
          id?: string
          linked_hire_id?: string | null
          metadata?: Json | null
          order_reference?: string | null
          plot_id?: string | null
          plot_location?: string | null
          pod_category?: string
          pod_photo_url?: string | null
          pod_type?: string
          project_id?: string
          quantity_expected?: number | null
          quantity_received?: number | null
          signed_by?: string | null
          signed_by_name?: string | null
          status?: string | null
          supplier_contact?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "pod_register_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pod_register_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pod_register_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "pod_register_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pod_register_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "pod_register_linked_hire_id_fkey"
            columns: ["linked_hire_id"]
            isOneToOne: false
            referencedRelation: "on_hire"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_register_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "Plots"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "pod_register_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "pod_register_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pod_register_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pod_register_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "pod_register_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pod_register_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "pod_register_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_register_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pod_register_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pod_register_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "pod_register_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pod_register_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      pod_signatures: {
        Row: {
          created_at: string
          device_info: Json | null
          id: string
          invalidated_at: string | null
          invalidation_reason: string | null
          ip_address: unknown | null
          is_valid: boolean
          location_lat: number | null
          location_lng: number | null
          pod_id: string
          signature_context: Json | null
          signature_data: string
          signature_type: string
          signed_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          id?: string
          invalidated_at?: string | null
          invalidation_reason?: string | null
          ip_address?: unknown | null
          is_valid?: boolean
          location_lat?: number | null
          location_lng?: number | null
          pod_id: string
          signature_context?: Json | null
          signature_data: string
          signature_type: string
          signed_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          id?: string
          invalidated_at?: string | null
          invalidation_reason?: string | null
          ip_address?: unknown | null
          is_valid?: boolean
          location_lat?: number | null
          location_lng?: number | null
          pod_id?: string
          signature_context?: Json | null
          signature_data?: string
          signature_type?: string
          signed_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pod_signatures_pod_id"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_register"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pod_signatures_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_pod_signatures_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_pod_signatures_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "fk_pod_signatures_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_pod_signatures_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      post_demo_quiz: {
        Row: {
          ai_explanation: string | null
          correct_answer: string | null
          created_at: string | null
          difficulty_level: string | null
          id: string
          induction_id: string
          is_correct: boolean | null
          question_id: string
          question_text: string
          time_taken_seconds: number | null
          user_answer: string | null
        }
        Insert: {
          ai_explanation?: string | null
          correct_answer?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          id?: string
          induction_id: string
          is_correct?: boolean | null
          question_id: string
          question_text: string
          time_taken_seconds?: number | null
          user_answer?: string | null
        }
        Update: {
          ai_explanation?: string | null
          correct_answer?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          id?: string
          induction_id?: string
          is_correct?: boolean | null
          question_id?: string
          question_text?: string
          time_taken_seconds?: number | null
          user_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_demo_quiz_induction_id_fkey"
            columns: ["induction_id"]
            isOneToOne: false
            referencedRelation: "induction_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      proactive_suggestions: {
        Row: {
          action_data: Json | null
          action_type: string | null
          clicked_at: string | null
          confidence_score: number | null
          content: string
          created_at: string | null
          dismissed_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          priority_score: number | null
          shown_at: string | null
          suggestion_type: string
          title: string
          triggered_by: Json | null
          user_id: string | null
        }
        Insert: {
          action_data?: Json | null
          action_type?: string | null
          clicked_at?: string | null
          confidence_score?: number | null
          content: string
          created_at?: string | null
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          priority_score?: number | null
          shown_at?: string | null
          suggestion_type: string
          title: string
          triggered_by?: Json | null
          user_id?: string | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string | null
          clicked_at?: string | null
          confidence_score?: number | null
          content?: string
          created_at?: string | null
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          priority_score?: number | null
          shown_at?: string | null
          suggestion_type?: string
          title?: string
          triggered_by?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proactive_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "proactive_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "proactive_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "proactive_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "proactive_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      profiles: {
        Row: {
          airtable_last_sync: string | null
          airtable_record_id: string | null
          airtable_sync_status: string | null
          avatarURL: string | null
          created_at: string
          id: string
          name: string | null
          surname: string | null
          system_role: string | null
          username: string | null
          whalesync_user_id: string | null
        }
        Insert: {
          airtable_last_sync?: string | null
          airtable_record_id?: string | null
          airtable_sync_status?: string | null
          avatarURL?: string | null
          created_at?: string
          id?: string
          name?: string | null
          surname?: string | null
          system_role?: string | null
          username?: string | null
          whalesync_user_id?: string | null
        }
        Update: {
          airtable_last_sync?: string | null
          airtable_record_id?: string | null
          airtable_sync_status?: string | null
          avatarURL?: string | null
          created_at?: string
          id?: string
          name?: string | null
          surname?: string | null
          system_role?: string | null
          username?: string | null
          whalesync_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_whalesync_user_id_fkey"
            columns: ["whalesync_user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_whalesync_user_id_fkey"
            columns: ["whalesync_user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_whalesync_user_id_fkey"
            columns: ["whalesync_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "profiles_whalesync_user_id_fkey"
            columns: ["whalesync_user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_whalesync_user_id_fkey"
            columns: ["whalesync_user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      project_assignments: {
        Row: {
          ai_suggested: boolean | null
          assigned_by: string
          availability_score: number | null
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          project_id: string
          role: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
          workload_percentage: number | null
        }
        Insert: {
          ai_suggested?: boolean | null
          assigned_by: string
          availability_score?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          project_id: string
          role: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
          workload_percentage?: number | null
        }
        Update: {
          ai_suggested?: boolean | null
          assigned_by?: string
          availability_score?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          role?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
          workload_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "project_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "project_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "project_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      project_team: {
        Row: {
          active: boolean | null
          created_at: string | null
          end_date: string | null
          id: string
          project_id: string | null
          role: string | null
          start_date: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          project_id?: string | null
          role?: string | null
          start_date?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          project_id?: string | null
          role?: string | null
          start_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_team_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "project_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "project_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      project_teams: {
        Row: {
          assigned_by: string | null
          assigned_date: string
          created_at: string
          id: string
          notes: string | null
          project_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          assigned_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_teams_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_teams_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_teams_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "project_teams_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_teams_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "project_teams_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "project_teams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_teams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_teams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "project_teams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_teams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      Projects: {
        Row: {
          activehireitems: number | null
          actualenddate: string | null
          airtable_created_time: string | null
          airtable_record_id: string | null
          blocks: string | null
          budgetremaining: number | null
          budgetspent: number | null
          clientname: string | null
          completeddeliveries: number | null
          deliverynotes: string | null
          drawings: string | null
          drawings_2: string | null
          healthsafetystatus: string | null
          hire: string | null
          hireenddate: string | null
          hirenotes: string | null
          hirestartdate: string | null
          lastdeliverydate: string | null
          lastinvoicedate: string | null
          nextscheduleddelivery: string | null
          outstandingpods: number | null
          overduehirereturns: number | null
          paymentstatus: string | null
          pendingdeliveries: number | null
          plannedenddate: string | null
          profitmargin: number | null
          Project_Description: string | null
          project_manager_id: string | null
          projectmanager: string | null
          projectname: string | null
          projectnotes: string | null
          projectuid: string | null
          projectvalue: number | null
          siteaddress: string | null
          sitecontact: string | null
          sitephone: string | null
          startdate: string | null
          status: string | null
          totaldeliverybookings: number | null
          totalhirecost: number | null
          totalplots: number | null
          users: string | null
          whalesync_postgres_id: string
        }
        Insert: {
          activehireitems?: number | null
          actualenddate?: string | null
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          blocks?: string | null
          budgetremaining?: number | null
          budgetspent?: number | null
          clientname?: string | null
          completeddeliveries?: number | null
          deliverynotes?: string | null
          drawings?: string | null
          drawings_2?: string | null
          healthsafetystatus?: string | null
          hire?: string | null
          hireenddate?: string | null
          hirenotes?: string | null
          hirestartdate?: string | null
          lastdeliverydate?: string | null
          lastinvoicedate?: string | null
          nextscheduleddelivery?: string | null
          outstandingpods?: number | null
          overduehirereturns?: number | null
          paymentstatus?: string | null
          pendingdeliveries?: number | null
          plannedenddate?: string | null
          profitmargin?: number | null
          Project_Description?: string | null
          project_manager_id?: string | null
          projectmanager?: string | null
          projectname?: string | null
          projectnotes?: string | null
          projectuid?: string | null
          projectvalue?: number | null
          siteaddress?: string | null
          sitecontact?: string | null
          sitephone?: string | null
          startdate?: string | null
          status?: string | null
          totaldeliverybookings?: number | null
          totalhirecost?: number | null
          totalplots?: number | null
          users?: string | null
          whalesync_postgres_id?: string
        }
        Update: {
          activehireitems?: number | null
          actualenddate?: string | null
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          blocks?: string | null
          budgetremaining?: number | null
          budgetspent?: number | null
          clientname?: string | null
          completeddeliveries?: number | null
          deliverynotes?: string | null
          drawings?: string | null
          drawings_2?: string | null
          healthsafetystatus?: string | null
          hire?: string | null
          hireenddate?: string | null
          hirenotes?: string | null
          hirestartdate?: string | null
          lastdeliverydate?: string | null
          lastinvoicedate?: string | null
          nextscheduleddelivery?: string | null
          outstandingpods?: number | null
          overduehirereturns?: number | null
          paymentstatus?: string | null
          pendingdeliveries?: number | null
          plannedenddate?: string | null
          profitmargin?: number | null
          Project_Description?: string | null
          project_manager_id?: string | null
          projectmanager?: string | null
          projectname?: string | null
          projectnotes?: string | null
          projectuid?: string | null
          projectvalue?: number | null
          siteaddress?: string | null
          sitecontact?: string | null
          sitephone?: string | null
          startdate?: string | null
          status?: string | null
          totaldeliverybookings?: number | null
          totalhirecost?: number | null
          totalplots?: number | null
          users?: string | null
          whalesync_postgres_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Projects_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "Projects_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "Projects_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "Projects_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "Projects_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "projects_users_foreign"
            columns: ["users"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_users_foreign"
            columns: ["users"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_users_foreign"
            columns: ["users"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "projects_users_foreign"
            columns: ["users"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_users_foreign"
            columns: ["users"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      push_notification_subscriptions: {
        Row: {
          auth_key: string
          browser_info: Json | null
          created_at: string
          device_type: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh_key: string
          user_id: string
        }
        Insert: {
          auth_key: string
          browser_info?: Json | null
          created_at?: string
          device_type?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh_key: string
          user_id: string
        }
        Update: {
          auth_key?: string
          browser_info?: Json | null
          created_at?: string
          device_type?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh_key?: string
          user_id?: string
        }
        Relationships: []
      }
      qr_posters: {
        Row: {
          created_at: string
          created_by: string | null
          document_versions: string[]
          id: string
          last_scan_at: string | null
          last_updated: string
          location_name: string
          needs_reprint: boolean | null
          poster_type: string
          poster_url: string | null
          project_id: string | null
          qr_data: Json
          scan_count: number | null
          scope_description: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_versions: string[]
          id?: string
          last_scan_at?: string | null
          last_updated?: string
          location_name: string
          needs_reprint?: boolean | null
          poster_type: string
          poster_url?: string | null
          project_id?: string | null
          qr_data: Json
          scan_count?: number | null
          scope_description?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_versions?: string[]
          id?: string
          last_scan_at?: string | null
          last_updated?: string
          location_name?: string
          needs_reprint?: boolean | null
          poster_type?: string
          poster_url?: string | null
          project_id?: string | null
          qr_data?: Json
          scan_count?: number | null
          scope_description?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_posters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qr_posters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qr_posters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "qr_posters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qr_posters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "qr_posters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      qr_scan_logs: {
        Row: {
          created_at: string
          document_version_id: string | null
          id: string
          poster_location: string | null
          redirect_to_version: string | null
          scan_device_info: Json | null
          scan_location: unknown | null
          scan_result: string
          scanned_by: string | null
        }
        Insert: {
          created_at?: string
          document_version_id?: string | null
          id?: string
          poster_location?: string | null
          redirect_to_version?: string | null
          scan_device_info?: Json | null
          scan_location?: unknown | null
          scan_result: string
          scanned_by?: string | null
        }
        Update: {
          created_at?: string
          document_version_id?: string | null
          id?: string
          poster_location?: string | null
          redirect_to_version?: string | null
          scan_device_info?: Json | null
          scan_location?: unknown | null
          scan_result?: string
          scanned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_scan_logs_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_scan_logs_redirect_to_version_fkey"
            columns: ["redirect_to_version"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_scan_logs_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qr_scan_logs_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qr_scan_logs_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "qr_scan_logs_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qr_scan_logs_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      qualification_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      qualification_reminders: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          created_at: string | null
          id: string
          qualification_id: string | null
          reminder_type: string
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          created_at?: string | null
          id?: string
          qualification_id?: string | null
          reminder_type: string
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          created_at?: string | null
          id?: string
          qualification_id?: string | null
          reminder_type?: string
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualification_reminders_qualification_id_fkey"
            columns: ["qualification_id"]
            isOneToOne: false
            referencedRelation: "qualification_status_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualification_reminders_qualification_id_fkey"
            columns: ["qualification_id"]
            isOneToOne: false
            referencedRelation: "qualifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualification_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qualification_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qualification_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "qualification_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qualification_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      qualification_types: {
        Row: {
          category_id: string | null
          code: string | null
          created_at: string | null
          default_validity_months: number | null
          default_validity_years: number | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_mandatory: boolean | null
          issuing_bodies: string[] | null
          levels: string[] | null
          mandatory_for_roles: string[] | null
          name: string
          renewal_notice_days: number | null
          short_name: string | null
        }
        Insert: {
          category_id?: string | null
          code?: string | null
          created_at?: string | null
          default_validity_months?: number | null
          default_validity_years?: number | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_mandatory?: boolean | null
          issuing_bodies?: string[] | null
          levels?: string[] | null
          mandatory_for_roles?: string[] | null
          name: string
          renewal_notice_days?: number | null
          short_name?: string | null
        }
        Update: {
          category_id?: string | null
          code?: string | null
          created_at?: string | null
          default_validity_months?: number | null
          default_validity_years?: number | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_mandatory?: boolean | null
          issuing_bodies?: string[] | null
          levels?: string[] | null
          mandatory_for_roles?: string[] | null
          name?: string
          renewal_notice_days?: number | null
          short_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualification_types_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "qualification_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      qualifications: {
        Row: {
          category: string | null
          category_id: string | null
          certificate_number: string | null
          created_at: string | null
          document_size_kb: number | null
          document_type: string | null
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_body: string | null
          level: string | null
          notes: string | null
          photo_url: string | null
          qualification_type: string
          qualification_type_id: string | null
          reminder_14_days: boolean | null
          reminder_30_days: boolean | null
          reminder_7_days: boolean | null
          reminder_sent: boolean | null
          renewal_cost: number | null
          status: string | null
          subcategory: string | null
          training_provider: string | null
          updated_at: string | null
          user_id: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          certificate_number?: string | null
          created_at?: string | null
          document_size_kb?: number | null
          document_type?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_body?: string | null
          level?: string | null
          notes?: string | null
          photo_url?: string | null
          qualification_type: string
          qualification_type_id?: string | null
          reminder_14_days?: boolean | null
          reminder_30_days?: boolean | null
          reminder_7_days?: boolean | null
          reminder_sent?: boolean | null
          renewal_cost?: number | null
          status?: string | null
          subcategory?: string | null
          training_provider?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          category?: string | null
          category_id?: string | null
          certificate_number?: string | null
          created_at?: string | null
          document_size_kb?: number | null
          document_type?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_body?: string | null
          level?: string | null
          notes?: string | null
          photo_url?: string | null
          qualification_type?: string
          qualification_type_id?: string | null
          reminder_14_days?: boolean | null
          reminder_30_days?: boolean | null
          reminder_7_days?: boolean | null
          reminder_sent?: boolean | null
          renewal_cost?: number | null
          status?: string | null
          subcategory?: string | null
          training_provider?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualifications_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "qualification_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualifications_qualification_type_id_fkey"
            columns: ["qualification_type_id"]
            isOneToOne: false
            referencedRelation: "qualification_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qualifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qualifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "qualifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qualifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "qualifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qualifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qualifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "qualifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qualifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      rams_documents: {
        Row: {
          ai_extracted_content: string | null
          approval_date: string | null
          approved_by: string | null
          created_at: string
          document_id: string
          document_type: string
          document_version: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_current_version: boolean | null
          level_id: string | null
          mime_type: string | null
          plot_id: string | null
          project_id: string | null
          read_required: boolean
          status: string
          superseded_by: string | null
          superseded_date: string | null
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by: string
          version_notes: string | null
          version_number: number
        }
        Insert: {
          ai_extracted_content?: string | null
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string
          document_id: string
          document_type?: string
          document_version?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_current_version?: boolean | null
          level_id?: string | null
          mime_type?: string | null
          plot_id?: string | null
          project_id?: string | null
          read_required?: boolean
          status?: string
          superseded_by?: string | null
          superseded_date?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by: string
          version_notes?: string | null
          version_number?: number
        }
        Update: {
          ai_extracted_content?: string | null
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string
          document_id?: string
          document_type?: string
          document_version?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_current_version?: boolean | null
          level_id?: string | null
          mime_type?: string | null
          plot_id?: string | null
          project_id?: string | null
          read_required?: boolean
          status?: string
          superseded_by?: string | null
          superseded_date?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by?: string
          version_notes?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "rams_documents_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rams_documents_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rams_documents_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "rams_documents_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rams_documents_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "rams_documents_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "Levels"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "rams_documents_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "Plots"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "rams_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "rams_documents_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "rams_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rams_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rams_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rams_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "rams_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rams_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      rams_signatures: {
        Row: {
          contractor_id: string | null
          device_info: Json | null
          document_version: string
          id: string
          invalidated_at: string | null
          invalidated_reason: string | null
          ip_address: unknown | null
          is_valid: boolean | null
          rams_document_id: string | null
          reading_time_seconds: number | null
          register_entry_id: string | null
          signature_data: string
          signed_at: string | null
        }
        Insert: {
          contractor_id?: string | null
          device_info?: Json | null
          document_version: string
          id?: string
          invalidated_at?: string | null
          invalidated_reason?: string | null
          ip_address?: unknown | null
          is_valid?: boolean | null
          rams_document_id?: string | null
          reading_time_seconds?: number | null
          register_entry_id?: string | null
          signature_data: string
          signed_at?: string | null
        }
        Update: {
          contractor_id?: string | null
          device_info?: Json | null
          document_version?: string
          id?: string
          invalidated_at?: string | null
          invalidated_reason?: string | null
          ip_address?: unknown | null
          is_valid?: boolean | null
          rams_document_id?: string | null
          reading_time_seconds?: number | null
          register_entry_id?: string | null
          signature_data?: string
          signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rams_signatures_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rams_signatures_rams_document_id_fkey"
            columns: ["rams_document_id"]
            isOneToOne: false
            referencedRelation: "rams_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rams_signatures_register_entry_id_fkey"
            columns: ["register_entry_id"]
            isOneToOne: false
            referencedRelation: "task_plan_rams_register"
            referencedColumns: ["id"]
          },
        ]
      }
      real_time_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          email_sent: boolean | null
          expires_at: string | null
          id: string
          message: string
          metadata: Json | null
          priority: string
          push_sent: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          email_sent?: boolean | null
          expires_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string
          push_sent?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          email_sent?: boolean | null
          expires_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string
          push_sent?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      role_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          invited_role: string
          project_id: string | null
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          invited_role: string
          project_id?: string | null
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          invited_role?: string
          project_id?: string | null
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "role_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "role_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "role_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "role_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "role_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "role_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      role_requests: {
        Row: {
          created_at: string | null
          id: string
          justification: string | null
          requested_role: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          justification?: string | null
          requested_role: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          justification?: string | null
          requested_role?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "role_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "role_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "role_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "role_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "role_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "role_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "role_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "role_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "role_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      shared_workspaces: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          members: Json | null
          name: string
          owner_id: string
          permissions: Json | null
          project_id: string | null
          updated_at: string
          workspace_data: Json | null
          workspace_type: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          members?: Json | null
          name: string
          owner_id: string
          permissions?: Json | null
          project_id?: string | null
          updated_at?: string
          workspace_data?: Json | null
          workspace_type: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          members?: Json | null
          name?: string
          owner_id?: string
          permissions?: Json | null
          project_id?: string | null
          updated_at?: string
          workspace_data?: Json | null
          workspace_type?: string
        }
        Relationships: []
      }
      signatures: {
        Row: {
          created_at: string
          document_title: string
          document_version: string | null
          id: string
          operative_id: string | null
          operative_name: string
          plot_id: string | null
          plot_location: string | null
          plot_name: string | null
          pod_id: string | null
          project_id: string | null
          project_name: string | null
          signature_category: string | null
          signature_data: string
          signature_method: string
          signature_type: string
          signed_at: string
          status: string
          updated_at: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_title: string
          document_version?: string | null
          id?: string
          operative_id?: string | null
          operative_name: string
          plot_id?: string | null
          plot_location?: string | null
          plot_name?: string | null
          pod_id?: string | null
          project_id?: string | null
          project_name?: string | null
          signature_category?: string | null
          signature_data: string
          signature_method?: string
          signature_type: string
          signed_at?: string
          status?: string
          updated_at?: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_title?: string
          document_version?: string | null
          id?: string
          operative_id?: string | null
          operative_name?: string
          plot_id?: string | null
          plot_location?: string | null
          plot_name?: string | null
          pod_id?: string | null
          project_id?: string | null
          project_name?: string | null
          signature_category?: string | null
          signature_data?: string
          signature_method?: string
          signature_type?: string
          signed_at?: string
          status?: string
          updated_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_signatures_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      site_notices: {
        Row: {
          attachments: Json | null
          auto_archive: boolean | null
          content: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          notice_category: string | null
          notice_type: string
          priority: string | null
          project_id: string | null
          requires_signature: boolean | null
          status: string | null
          title: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          attachments?: Json | null
          auto_archive?: boolean | null
          content: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          notice_category?: string | null
          notice_type: string
          priority?: string | null
          project_id?: string | null
          requires_signature?: boolean | null
          status?: string | null
          title: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          attachments?: Json | null
          auto_archive?: boolean | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          notice_category?: string | null
          notice_type?: string
          priority?: string | null
          project_id?: string | null
          requires_signature?: boolean | null
          status?: string | null
          title?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_notices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "site_notices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "site_notices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "site_notices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "site_notices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "site_notices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      smart_notifications: {
        Row: {
          acknowledged_at: string | null
          action_taken: string | null
          action_taken_at: string | null
          ai_confidence: number | null
          audit_trail: Json | null
          auto_escalate_after: unknown | null
          category: string
          compliance_deadline: string | null
          context_data: Json | null
          created_at: string
          delivery_channels: Json
          delivery_status: Json
          expires_at: string | null
          fallback_attempted: boolean | null
          geo_trigger_location: unknown | null
          geo_trigger_radius: number | null
          id: string
          is_acknowledged: boolean | null
          is_ai_generated: boolean | null
          is_gdpr_sensitive: boolean | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          predicted_compliance_risk: number | null
          priority: string
          project_id: string | null
          read_at: string | null
          recipient_role: string
          signature_vault_ref: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          action_taken?: string | null
          action_taken_at?: string | null
          ai_confidence?: number | null
          audit_trail?: Json | null
          auto_escalate_after?: unknown | null
          category: string
          compliance_deadline?: string | null
          context_data?: Json | null
          created_at?: string
          delivery_channels?: Json
          delivery_status?: Json
          expires_at?: string | null
          fallback_attempted?: boolean | null
          geo_trigger_location?: unknown | null
          geo_trigger_radius?: number | null
          id?: string
          is_acknowledged?: boolean | null
          is_ai_generated?: boolean | null
          is_gdpr_sensitive?: boolean | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          predicted_compliance_risk?: number | null
          priority?: string
          project_id?: string | null
          read_at?: string | null
          recipient_role: string
          signature_vault_ref?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          action_taken?: string | null
          action_taken_at?: string | null
          ai_confidence?: number | null
          audit_trail?: Json | null
          auto_escalate_after?: unknown | null
          category?: string
          compliance_deadline?: string | null
          context_data?: Json | null
          created_at?: string
          delivery_channels?: Json
          delivery_status?: Json
          expires_at?: string | null
          fallback_attempted?: boolean | null
          geo_trigger_location?: unknown | null
          geo_trigger_radius?: number | null
          id?: string
          is_acknowledged?: boolean | null
          is_ai_generated?: boolean | null
          is_gdpr_sensitive?: boolean | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          predicted_compliance_risk?: number | null
          priority?: string
          project_id?: string | null
          read_at?: string | null
          recipient_role?: string
          signature_vault_ref?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      smart_predictions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          factors: Json | null
          id: string
          predicted_value: Json | null
          prediction_date: string
          prediction_type: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          factors?: Json | null
          id?: string
          predicted_value?: Json | null
          prediction_date: string
          prediction_type: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          factors?: Json | null
          id?: string
          predicted_value?: Json | null
          prediction_date?: string
          prediction_type?: string
        }
        Relationships: []
      }
      smart_prompt_refinements: {
        Row: {
          approved_by: string | null
          created_at: string | null
          id: string
          improvement_reason: string | null
          is_active: boolean | null
          original_prompt: string
          performance_gain: number | null
          refined_prompt: string
          template_id: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          id?: string
          improvement_reason?: string | null
          is_active?: boolean | null
          original_prompt: string
          performance_gain?: number | null
          refined_prompt: string
          template_id?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          id?: string
          improvement_reason?: string | null
          is_active?: boolean | null
          original_prompt?: string
          performance_gain?: number | null
          refined_prompt?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_prompt_refinements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_prompt_refinements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_prompt_refinements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "smart_prompt_refinements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_prompt_refinements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "smart_prompt_refinements_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "smart_prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_prompt_templates: {
        Row: {
          avg_rating: number | null
          category: string
          context_fields: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_tokens: number | null
          example_input: string | null
          id: string
          is_active: boolean | null
          output_format: string | null
          priority: number | null
          requires_context: boolean | null
          role_scopes: string[]
          success_rate: number | null
          system_prompt: string
          title: string
          updated_at: string | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          avg_rating?: number | null
          category?: string
          context_fields?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_tokens?: number | null
          example_input?: string | null
          id?: string
          is_active?: boolean | null
          output_format?: string | null
          priority?: number | null
          requires_context?: boolean | null
          role_scopes: string[]
          success_rate?: number | null
          system_prompt: string
          title: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          avg_rating?: number | null
          category?: string
          context_fields?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_tokens?: number | null
          example_input?: string | null
          id?: string
          is_active?: boolean | null
          output_format?: string | null
          priority?: number | null
          requires_context?: boolean | null
          role_scopes?: string[]
          success_rate?: number | null
          system_prompt?: string
          title?: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_prompt_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_prompt_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_prompt_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "smart_prompt_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_prompt_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      smart_prompt_usage: {
        Row: {
          context_used: Json | null
          executed_at: string | null
          execution_time_ms: number | null
          id: string
          input_text: string | null
          mobile_device: boolean | null
          offline_mode: boolean | null
          output_text: string | null
          refinement_count: number | null
          template_id: string | null
          tokens_used: number | null
          user_feedback: string | null
          user_id: string | null
          user_rating: number | null
          voice_input: boolean | null
          was_refined: boolean | null
        }
        Insert: {
          context_used?: Json | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          input_text?: string | null
          mobile_device?: boolean | null
          offline_mode?: boolean | null
          output_text?: string | null
          refinement_count?: number | null
          template_id?: string | null
          tokens_used?: number | null
          user_feedback?: string | null
          user_id?: string | null
          user_rating?: number | null
          voice_input?: boolean | null
          was_refined?: boolean | null
        }
        Update: {
          context_used?: Json | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          input_text?: string | null
          mobile_device?: boolean | null
          offline_mode?: boolean | null
          output_text?: string | null
          refinement_count?: number | null
          template_id?: string | null
          tokens_used?: number | null
          user_feedback?: string | null
          user_id?: string | null
          user_rating?: number | null
          voice_input?: boolean | null
          was_refined?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_prompt_usage_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "smart_prompt_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_prompt_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_prompt_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_prompt_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "smart_prompt_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_prompt_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      smart_revision_alerts: {
        Row: {
          ai_generated: boolean | null
          alert_message: string | null
          alert_type: string
          created_at: string
          document_version_id: string | null
          id: string
          notification_sent: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          target_users: string[] | null
          urgency_level: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          alert_message?: string | null
          alert_type: string
          created_at?: string
          document_version_id?: string | null
          id?: string
          notification_sent?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          target_users?: string[] | null
          urgency_level?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          alert_message?: string | null
          alert_type?: string
          created_at?: string
          document_version_id?: string | null
          id?: string
          notification_sent?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          target_users?: string[] | null
          urgency_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_revision_alerts_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_revision_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_revision_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_revision_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "smart_revision_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_revision_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      smart_schedules: {
        Row: {
          auto_scheduled: boolean | null
          created_at: string | null
          dependencies: Json | null
          id: string
          plot_id: string | null
          priority: number | null
          project_id: string | null
          scheduled_date: string
          scheduled_end: string | null
          scheduled_start: string | null
          user_id: string | null
          weather_dependent: boolean | null
        }
        Insert: {
          auto_scheduled?: boolean | null
          created_at?: string | null
          dependencies?: Json | null
          id?: string
          plot_id?: string | null
          priority?: number | null
          project_id?: string | null
          scheduled_date: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          user_id?: string | null
          weather_dependent?: boolean | null
        }
        Update: {
          auto_scheduled?: boolean | null
          created_at?: string | null
          dependencies?: Json | null
          id?: string
          plot_id?: string | null
          priority?: number | null
          project_id?: string | null
          scheduled_date?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          user_id?: string | null
          weather_dependent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_schedules_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "Plots"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "smart_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "smart_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "smart_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      soft_delete_registry: {
        Row: {
          archived_data: Json
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          evidence_chain_reference: string | null
          gdpr_deletion_eligible: boolean | null
          id: string
          legal_hold: boolean | null
          record_id: string
          retention_period: unknown | null
          table_name: string
        }
        Insert: {
          archived_data: Json
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          evidence_chain_reference?: string | null
          gdpr_deletion_eligible?: boolean | null
          id?: string
          legal_hold?: boolean | null
          record_id: string
          retention_period?: unknown | null
          table_name: string
        }
        Update: {
          archived_data?: Json
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          evidence_chain_reference?: string | null
          gdpr_deletion_eligible?: boolean | null
          id?: string
          legal_hold?: boolean | null
          record_id?: string
          retention_period?: unknown | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "soft_delete_registry_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "soft_delete_registry_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "soft_delete_registry_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "soft_delete_registry_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "soft_delete_registry_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      suppliers: {
        Row: {
          average_overdue_days: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          name: string
          on_time_percentage: number | null
          performance_rating: number | null
          total_orders: number | null
        }
        Insert: {
          average_overdue_days?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name: string
          on_time_percentage?: number | null
          performance_rating?: number | null
          total_orders?: number | null
        }
        Update: {
          average_overdue_days?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name?: string
          on_time_percentage?: number | null
          performance_rating?: number | null
          total_orders?: number | null
        }
        Relationships: []
      }
      task_plan_rams_register: {
        Row: {
          contractor_id: string | null
          created_at: string | null
          created_by: string | null
          date_issued: string | null
          date_signed: string | null
          id: string
          project_id: string | null
          project_name: string
          rams_document_id: string | null
          rams_name: string
          responsible_person: string
          signature_data: string | null
          signed_by: string | null
          status: string | null
          subcontractor_company: string
          updated_at: string | null
          version: string
          work_activity: string
          work_activity_id: string | null
        }
        Insert: {
          contractor_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date_issued?: string | null
          date_signed?: string | null
          id?: string
          project_id?: string | null
          project_name: string
          rams_document_id?: string | null
          rams_name: string
          responsible_person: string
          signature_data?: string | null
          signed_by?: string | null
          status?: string | null
          subcontractor_company: string
          updated_at?: string | null
          version: string
          work_activity: string
          work_activity_id?: string | null
        }
        Update: {
          contractor_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date_issued?: string | null
          date_signed?: string | null
          id?: string
          project_id?: string | null
          project_name?: string
          rams_document_id?: string | null
          rams_name?: string
          responsible_person?: string
          signature_data?: string | null
          signed_by?: string | null
          status?: string | null
          subcontractor_company?: string
          updated_at?: string | null
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
            foreignKeyName: "task_plan_rams_register_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plan_rams_register_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plan_rams_register_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "task_plan_rams_register_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plan_rams_register_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "task_plan_rams_register_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
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
      task_plan_sections: {
        Row: {
          acknowledgment_text: string | null
          content: string | null
          created_at: string | null
          id: string
          requires_acknowledgment: boolean | null
          section_number: number
          task_plan_id: string
          title: string
        }
        Insert: {
          acknowledgment_text?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          requires_acknowledgment?: boolean | null
          section_number: number
          task_plan_id: string
          title: string
        }
        Update: {
          acknowledgment_text?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          requires_acknowledgment?: boolean | null
          section_number?: number
          task_plan_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_plan_sections_task_plan_id_fkey"
            columns: ["task_plan_id"]
            isOneToOne: false
            referencedRelation: "task_plan_usage_stats"
            referencedColumns: ["task_plan_id"]
          },
          {
            foreignKeyName: "task_plan_sections_task_plan_id_fkey"
            columns: ["task_plan_id"]
            isOneToOne: false
            referencedRelation: "task_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      task_plan_signatures: {
        Row: {
          additional_notes: string | null
          briefed_by: string | null
          briefing_attended: boolean | null
          briefing_date: string | null
          confirmed_understanding: boolean | null
          created_at: string | null
          device_info: Json | null
          id: string
          invalidated_at: string | null
          invalidation_reason: string | null
          ip_address: unknown | null
          is_active: boolean | null
          location_accuracy_meters: number | null
          location_lat: number | null
          location_lng: number | null
          pages_viewed: number[] | null
          project_id: string | null
          questions_asked: string | null
          signature_data: string | null
          signature_hash: string | null
          signature_type: string | null
          signed_at: string
          task_plan_id: string
          user_agent: string | null
          user_id: string
          valid_until: string | null
          viewed_duration_seconds: number | null
        }
        Insert: {
          additional_notes?: string | null
          briefed_by?: string | null
          briefing_attended?: boolean | null
          briefing_date?: string | null
          confirmed_understanding?: boolean | null
          created_at?: string | null
          device_info?: Json | null
          id?: string
          invalidated_at?: string | null
          invalidation_reason?: string | null
          ip_address?: unknown | null
          is_active?: boolean | null
          location_accuracy_meters?: number | null
          location_lat?: number | null
          location_lng?: number | null
          pages_viewed?: number[] | null
          project_id?: string | null
          questions_asked?: string | null
          signature_data?: string | null
          signature_hash?: string | null
          signature_type?: string | null
          signed_at?: string
          task_plan_id: string
          user_agent?: string | null
          user_id: string
          valid_until?: string | null
          viewed_duration_seconds?: number | null
        }
        Update: {
          additional_notes?: string | null
          briefed_by?: string | null
          briefing_attended?: boolean | null
          briefing_date?: string | null
          confirmed_understanding?: boolean | null
          created_at?: string | null
          device_info?: Json | null
          id?: string
          invalidated_at?: string | null
          invalidation_reason?: string | null
          ip_address?: unknown | null
          is_active?: boolean | null
          location_accuracy_meters?: number | null
          location_lat?: number | null
          location_lng?: number | null
          pages_viewed?: number[] | null
          project_id?: string | null
          questions_asked?: string | null
          signature_data?: string | null
          signature_hash?: string | null
          signature_type?: string | null
          signed_at?: string
          task_plan_id?: string
          user_agent?: string | null
          user_id?: string
          valid_until?: string | null
          viewed_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "task_plan_signatures_briefed_by_fkey"
            columns: ["briefed_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plan_signatures_briefed_by_fkey"
            columns: ["briefed_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plan_signatures_briefed_by_fkey"
            columns: ["briefed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "task_plan_signatures_briefed_by_fkey"
            columns: ["briefed_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plan_signatures_briefed_by_fkey"
            columns: ["briefed_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "task_plan_signatures_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "task_plan_signatures_task_plan_id_fkey"
            columns: ["task_plan_id"]
            isOneToOne: false
            referencedRelation: "task_plan_usage_stats"
            referencedColumns: ["task_plan_id"]
          },
          {
            foreignKeyName: "task_plan_signatures_task_plan_id_fkey"
            columns: ["task_plan_id"]
            isOneToOne: false
            referencedRelation: "task_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_plan_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plan_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plan_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "task_plan_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plan_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      task_plan_templates: {
        Row: {
          ai_risk_factors: string[] | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          linked_qualifications: string[] | null
          required_signatures: string[] | null
          risk_level: string | null
          template_content: Json | null
          template_name: string
          template_type: string
          trade_category: string | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          ai_risk_factors?: string[] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          linked_qualifications?: string[] | null
          required_signatures?: string[] | null
          risk_level?: string | null
          template_content?: Json | null
          template_name: string
          template_type: string
          trade_category?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          ai_risk_factors?: string[] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          linked_qualifications?: string[] | null
          required_signatures?: string[] | null
          risk_level?: string | null
          template_content?: Json | null
          template_name?: string
          template_type?: string
          trade_category?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "task_plan_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plan_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plan_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "task_plan_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plan_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      task_plans: {
        Row: {
          applicable_projects: string[] | null
          approval_date: string | null
          approved_by: string | null
          briefing_frequency: string | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          effective_date: string
          expires_date: string | null
          file_size_kb: number | null
          file_url: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          page_count: number | null
          ppe_requirements: string[] | null
          project_id: string | null
          reference_number: string | null
          requires_briefing: boolean | null
          review_date: string | null
          risk_rating: string | null
          sharepoint_id: string | null
          sharepoint_path: string | null
          status: string | null
          superseded_by: string | null
          title: string
          tools_required: string[] | null
          updated_at: string | null
          version: string
          weather_restrictions: string[] | null
        }
        Insert: {
          applicable_projects?: string[] | null
          approval_date?: string | null
          approved_by?: string | null
          briefing_frequency?: string | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          effective_date?: string
          expires_date?: string | null
          file_size_kb?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          page_count?: number | null
          ppe_requirements?: string[] | null
          project_id?: string | null
          reference_number?: string | null
          requires_briefing?: boolean | null
          review_date?: string | null
          risk_rating?: string | null
          sharepoint_id?: string | null
          sharepoint_path?: string | null
          status?: string | null
          superseded_by?: string | null
          title: string
          tools_required?: string[] | null
          updated_at?: string | null
          version?: string
          weather_restrictions?: string[] | null
        }
        Update: {
          applicable_projects?: string[] | null
          approval_date?: string | null
          approved_by?: string | null
          briefing_frequency?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          effective_date?: string
          expires_date?: string | null
          file_size_kb?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          page_count?: number | null
          ppe_requirements?: string[] | null
          project_id?: string | null
          reference_number?: string | null
          requires_briefing?: boolean | null
          review_date?: string | null
          risk_rating?: string | null
          sharepoint_id?: string | null
          sharepoint_path?: string | null
          status?: string | null
          superseded_by?: string | null
          title?: string
          tools_required?: string[] | null
          updated_at?: string | null
          version?: string
          weather_restrictions?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "task_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "task_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "task_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "task_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "task_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "task_plans_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "task_plan_usage_stats"
            referencedColumns: ["task_plan_id"]
          },
          {
            foreignKeyName: "task_plans_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "task_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheet_entries: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string | null
          fix_stage: string | null
          hours_worked: number
          id: string
          job_template_id: string | null
          plot_id: string | null
          rate: number | null
          status: string | null
          timesheet_id: string | null
          work_date: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          fix_stage?: string | null
          hours_worked: number
          id?: string
          job_template_id?: string | null
          plot_id?: string | null
          rate?: number | null
          status?: string | null
          timesheet_id?: string | null
          work_date: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          fix_stage?: string | null
          hours_worked?: number
          id?: string
          job_template_id?: string | null
          plot_id?: string | null
          rate?: number | null
          status?: string | null
          timesheet_id?: string | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_entries_job_template_id_fkey"
            columns: ["job_template_id"]
            isOneToOne: false
            referencedRelation: "Job_Templates"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "timesheet_entries_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "Plots"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "timesheet_entries_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "timesheets"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          status: string | null
          submitted_at: string | null
          total_amount: number | null
          total_hours: number | null
          updated_at: string | null
          user_id: string | null
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          submitted_at?: string | null
          total_amount?: number | null
          total_hours?: number | null
          updated_at?: string | null
          user_id?: string | null
          week_end_date: string
          week_start_date: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          submitted_at?: string | null
          total_amount?: number | null
          total_hours?: number | null
          updated_at?: string | null
          user_id?: string | null
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "timesheets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "timesheets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "timesheets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "timesheets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "timesheets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "timesheets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "timesheets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "timesheets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "timesheets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      toolbox_talk_attendance: {
        Row: {
          arrival_time: string | null
          attended: boolean | null
          concerns_raised: string[] | null
          confirmed_understanding: boolean | null
          created_at: string | null
          id: string
          questions_asked: string[] | null
          signature: string | null
          signed_at: string | null
          toolbox_talk_id: string
          user_id: string
        }
        Insert: {
          arrival_time?: string | null
          attended?: boolean | null
          concerns_raised?: string[] | null
          confirmed_understanding?: boolean | null
          created_at?: string | null
          id?: string
          questions_asked?: string[] | null
          signature?: string | null
          signed_at?: string | null
          toolbox_talk_id: string
          user_id: string
        }
        Update: {
          arrival_time?: string | null
          attended?: boolean | null
          concerns_raised?: string[] | null
          confirmed_understanding?: boolean | null
          created_at?: string | null
          id?: string
          questions_asked?: string[] | null
          signature?: string | null
          signed_at?: string | null
          toolbox_talk_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "toolbox_talk_attendance_toolbox_talk_id_fkey"
            columns: ["toolbox_talk_id"]
            isOneToOne: false
            referencedRelation: "toolbox_talks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toolbox_talk_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "toolbox_talk_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "toolbox_talk_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "toolbox_talk_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "toolbox_talk_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      toolbox_talks: {
        Row: {
          actions_required: string[] | null
          actual_attendees: number | null
          conducted_by: string
          created_at: string | null
          date: string
          duration_minutes: number | null
          hazards_discussed: string[] | null
          id: string
          location: string | null
          notes: string | null
          photos: string[] | null
          planned_attendees: number | null
          project_id: string | null
          safety_measures: string[] | null
          task_plans_reviewed: string[] | null
          time: string
          title: string
          topics_covered: string[] | null
          weather_conditions: string | null
          weather_impact: string | null
        }
        Insert: {
          actions_required?: string[] | null
          actual_attendees?: number | null
          conducted_by: string
          created_at?: string | null
          date: string
          duration_minutes?: number | null
          hazards_discussed?: string[] | null
          id?: string
          location?: string | null
          notes?: string | null
          photos?: string[] | null
          planned_attendees?: number | null
          project_id?: string | null
          safety_measures?: string[] | null
          task_plans_reviewed?: string[] | null
          time: string
          title: string
          topics_covered?: string[] | null
          weather_conditions?: string | null
          weather_impact?: string | null
        }
        Update: {
          actions_required?: string[] | null
          actual_attendees?: number | null
          conducted_by?: string
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          hazards_discussed?: string[] | null
          id?: string
          location?: string | null
          notes?: string | null
          photos?: string[] | null
          planned_attendees?: number | null
          project_id?: string | null
          safety_measures?: string[] | null
          task_plans_reviewed?: string[] | null
          time?: string
          title?: string
          topics_covered?: string[] | null
          weather_conditions?: string | null
          weather_impact?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "toolbox_talks_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "toolbox_talks_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "toolbox_talks_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "toolbox_talks_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "toolbox_talks_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "toolbox_talks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      trade_terminology: {
        Row: {
          context_usage: string[] | null
          created_at: string | null
          definition: string
          difficulty_level: string | null
          id: string
          related_terms: string[] | null
          synonyms: string[] | null
          term: string
          trade_category: string
          updated_at: string | null
          usage_frequency: number | null
        }
        Insert: {
          context_usage?: string[] | null
          created_at?: string | null
          definition: string
          difficulty_level?: string | null
          id?: string
          related_terms?: string[] | null
          synonyms?: string[] | null
          term: string
          trade_category: string
          updated_at?: string | null
          usage_frequency?: number | null
        }
        Update: {
          context_usage?: string[] | null
          created_at?: string | null
          definition?: string
          difficulty_level?: string | null
          id?: string
          related_terms?: string[] | null
          synonyms?: string[] | null
          term?: string
          trade_category?: string
          updated_at?: string | null
          usage_frequency?: number | null
        }
        Relationships: []
      }
      training_document_types: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          is_mandatory: boolean | null
          name: string
          requires_expiry: boolean | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_mandatory?: boolean | null
          name: string
          requires_expiry?: boolean | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_mandatory?: boolean | null
          name?: string
          requires_expiry?: boolean | null
        }
        Relationships: []
      }
      trusted_domains: {
        Row: {
          created_at: string | null
          default_role: string
          domain: string
          id: string
        }
        Insert: {
          created_at?: string | null
          default_role: string
          domain: string
          id?: string
        }
        Update: {
          created_at?: string | null
          default_role?: string
          domain?: string
          id?: string
        }
        Relationships: []
      }
      user_ai_preferences: {
        Row: {
          created_at: string | null
          greeting_style: string | null
          id: string
          language_preference: string | null
          morning_summary: boolean | null
          notification_frequency: string | null
          preferred_tone: string | null
          proactive_suggestions: boolean | null
          response_length: string | null
          trade_terminology_level: string | null
          updated_at: string | null
          user_id: string | null
          voice_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          greeting_style?: string | null
          id?: string
          language_preference?: string | null
          morning_summary?: boolean | null
          notification_frequency?: string | null
          preferred_tone?: string | null
          proactive_suggestions?: boolean | null
          response_length?: string | null
          trade_terminology_level?: string | null
          updated_at?: string | null
          user_id?: string | null
          voice_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          greeting_style?: string | null
          id?: string
          language_preference?: string | null
          morning_summary?: boolean | null
          notification_frequency?: string | null
          preferred_tone?: string | null
          proactive_suggestions?: boolean | null
          response_length?: string | null
          trade_terminology_level?: string | null
          updated_at?: string | null
          user_id?: string | null
          voice_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_ai_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_ai_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "user_ai_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_ai_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      user_context_cache: {
        Row: {
          cache_key: string
          context_data: Json
          context_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          cache_key: string
          context_data: Json
          context_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          cache_key?: string
          context_data?: Json
          context_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_context_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_context_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_context_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "user_context_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_context_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      user_job_assignments: {
        Row: {
          assigned_by: string
          assigned_date: string
          created_at: string
          id: string
          is_active: boolean | null
          job_type_id: string
          notes: string | null
          plot_id: string | null
          project_id: string
          user_id: string
        }
        Insert: {
          assigned_by: string
          assigned_date?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          job_type_id: string
          notes?: string | null
          plot_id?: string | null
          project_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string
          assigned_date?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          job_type_id?: string
          notes?: string | null
          plot_id?: string | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_job_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_job_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_job_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "user_job_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_job_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "user_job_assignments_job_type_id_fkey"
            columns: ["job_type_id"]
            isOneToOne: false
            referencedRelation: "job_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_job_assignments_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "Plots"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "user_job_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "user_job_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_job_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_job_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "user_job_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_job_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      User_Job_Rates: {
        Row: {
          airtable_created_time: string | null
          airtable_record_id: string | null
          approvedby: string | null
          calloutminimum: number | null
          createddate: string | null
          effectivedate: string | null
          estimatedunits: number | null
          expirydate: string | null
          internalnotes: string | null
          jobs: string | null
          jobtemplate: string | null
          lastuseddate: string | null
          materialsincluded: boolean | null
          minimumpayment: number | null
          modifieddate: string | null
          negotiatedby: string | null
          paymenttype: string | null
          plottype: string | null
          rate: number | null
          rateid: string | null
          ratenotes: string | null
          ratestatus: string | null
          rateuid: string | null
          reviewdate: string | null
          specialconditions: string | null
          totalvalueapplied: number | null
          traveltimeincluded: boolean | null
          usagecount: number | null
          user: string | null
          whalesync_postgres_id: string
        }
        Insert: {
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          approvedby?: string | null
          calloutminimum?: number | null
          createddate?: string | null
          effectivedate?: string | null
          estimatedunits?: number | null
          expirydate?: string | null
          internalnotes?: string | null
          jobs?: string | null
          jobtemplate?: string | null
          lastuseddate?: string | null
          materialsincluded?: boolean | null
          minimumpayment?: number | null
          modifieddate?: string | null
          negotiatedby?: string | null
          paymenttype?: string | null
          plottype?: string | null
          rate?: number | null
          rateid?: string | null
          ratenotes?: string | null
          ratestatus?: string | null
          rateuid?: string | null
          reviewdate?: string | null
          specialconditions?: string | null
          totalvalueapplied?: number | null
          traveltimeincluded?: boolean | null
          usagecount?: number | null
          user?: string | null
          whalesync_postgres_id?: string
        }
        Update: {
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          approvedby?: string | null
          calloutminimum?: number | null
          createddate?: string | null
          effectivedate?: string | null
          estimatedunits?: number | null
          expirydate?: string | null
          internalnotes?: string | null
          jobs?: string | null
          jobtemplate?: string | null
          lastuseddate?: string | null
          materialsincluded?: boolean | null
          minimumpayment?: number | null
          modifieddate?: string | null
          negotiatedby?: string | null
          paymenttype?: string | null
          plottype?: string | null
          rate?: number | null
          rateid?: string | null
          ratenotes?: string | null
          ratestatus?: string | null
          rateuid?: string | null
          reviewdate?: string | null
          specialconditions?: string | null
          totalvalueapplied?: number | null
          traveltimeincluded?: boolean | null
          usagecount?: number | null
          user?: string | null
          whalesync_postgres_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_job_rates_jobtemplate_foreign"
            columns: ["jobtemplate"]
            isOneToOne: false
            referencedRelation: "Job_Templates"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "user_job_rates_plottype_foreign"
            columns: ["plottype"]
            isOneToOne: false
            referencedRelation: "Plot_Types"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "user_job_rates_user_foreign"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_job_rates_user_foreign"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_job_rates_user_foreign"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "user_job_rates_user_foreign"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_job_rates_user_foreign"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      user_patterns: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          frequency_score: number | null
          id: string
          is_active: boolean | null
          last_occurrence: string | null
          next_predicted: string | null
          pattern_data: Json
          pattern_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          frequency_score?: number | null
          id?: string
          is_active?: boolean | null
          last_occurrence?: string | null
          next_predicted?: string | null
          pattern_data: Json
          pattern_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          frequency_score?: number | null
          id?: string
          is_active?: boolean | null
          last_occurrence?: string | null
          next_predicted?: string | null
          pattern_data?: Json
          pattern_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "user_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      user_presence: {
        Row: {
          current_location: string | null
          custom_status: string | null
          device_info: Json | null
          id: string
          last_seen: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_location?: string | null
          custom_status?: string | null
          device_info?: Json | null
          id?: string
          last_seen?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_location?: string | null
          custom_status?: string | null
          device_info?: Json | null
          id?: string
          last_seen?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_rate_cards: {
        Row: {
          approved_by: string | null
          base_rate: number
          created_at: string
          effective_from: string
          effective_until: string | null
          id: string
          is_active: boolean | null
          job_type_id: string
          notes: string | null
          overtime_multiplier: number | null
          project_id: string | null
          rate_type: string
          unit_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          base_rate: number
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          job_type_id: string
          notes?: string | null
          overtime_multiplier?: number | null
          project_id?: string | null
          rate_type: string
          unit_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          base_rate?: number
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          job_type_id?: string
          notes?: string | null
          overtime_multiplier?: number | null
          project_id?: string | null
          rate_type?: string
          unit_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rate_cards_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_rate_cards_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_rate_cards_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "user_rate_cards_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_rate_cards_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "user_rate_cards_job_type_id_fkey"
            columns: ["job_type_id"]
            isOneToOne: false
            referencedRelation: "job_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_rate_cards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "user_rate_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_rate_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_rate_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "user_rate_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_rate_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      user_type_settings: {
        Row: {
          auto_deactivate_days: number | null
          can_self_register: boolean | null
          created_at: string | null
          description: string | null
          id: string
          is_temporary: boolean | null
          notification_days_before: number | null
          requires_reactivation: boolean | null
          user_type: string
        }
        Insert: {
          auto_deactivate_days?: number | null
          can_self_register?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_temporary?: boolean | null
          notification_days_before?: number | null
          requires_reactivation?: boolean | null
          user_type: string
        }
        Update: {
          auto_deactivate_days?: number | null
          can_self_register?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_temporary?: boolean | null
          notification_days_before?: number | null
          requires_reactivation?: boolean | null
          user_type?: string
        }
        Relationships: []
      }
      Users: {
        Row: {
          accidenthistory: string | null
          address: string | null
          ai_queries_count: number | null
          airtable_created_time: string | null
          airtable_record_id: string | null
          auth_provider: string | null
          availablefromdate: string | null
          avatar_url: string | null
          avg_weekly_hours: number | null
          basehourlyrate: number | null
          calloutrate: number | null
          clientfeedback: string | null
          contracttype: string | null
          cscs_last_validated: string | null
          cscs_required: boolean
          cscs_upload_required: boolean | null
          cscs_uploaded_at: string | null
          cscs_validation_status: string | null
          cscscardnumber: string | null
          cscsexpirydate: string | null
          currentproject: string | null
          deactivation_date: string | null
          deactivation_warning_sent: boolean | null
          electricalexpirydate: string | null
          electricalqualification: string | null
          email: string | null
          emergencycontact: string | null
          emergencyphone: string | null
          employeenumber: string | null
          employmentstatus: string | null
          equipmentassigned: string | null
          experiencelevel: string | null
          firebase_uid: string | null
          firstname: string | null
          fullname: string | null
          gassafeexpirydate: string | null
          gassafenumber: string | null
          healthsafetyexpirydate: string | null
          healthsafetytraining: string | null
          hiringmanager: string | null
          holidayentitlement: number | null
          internalnotes: string | null
          jobs: string | null
          last_ai_interaction: string | null
          last_reactivation_date: string | null
          last_sign_in: string | null
          lastname: string | null
          lastperformancereview: string | null
          maxhoursperweek: number | null
          medicalrestrictions: string | null
          onboarding_completed: boolean | null
          othercertifications: string | null
          overtimerate: number | null
          performance_rating: number | null
          performancerating: string | null
          personaltoolsprovided: boolean | null
          phone: string | null
          preferredworkdays: string[] | null
          primaryskill: string | null
          reactivated_count: number | null
          regionalpreference: string | null
          reportingmanager: string | null
          role: string | null
          skills: string[] | null
          standarddayrate: number | null
          startdate: string | null
          supabase_auth_id: string | null
          system_role: string | null
          total_plots_completed: number | null
          trainingcompleted: string | null
          trainingrequired: string | null
          uniformsize: string | null
          user_job_rates: string | null
          userid: string | null
          userjobrate: string | null
          useruid: string | null
          vanprovided: boolean | null
          weekendrate: number | null
          whalesync_postgres_id: string
          workinghours: string | null
        }
        Insert: {
          accidenthistory?: string | null
          address?: string | null
          ai_queries_count?: number | null
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          auth_provider?: string | null
          availablefromdate?: string | null
          avatar_url?: string | null
          avg_weekly_hours?: number | null
          basehourlyrate?: number | null
          calloutrate?: number | null
          clientfeedback?: string | null
          contracttype?: string | null
          cscs_last_validated?: string | null
          cscs_required?: boolean
          cscs_upload_required?: boolean | null
          cscs_uploaded_at?: string | null
          cscs_validation_status?: string | null
          cscscardnumber?: string | null
          cscsexpirydate?: string | null
          currentproject?: string | null
          deactivation_date?: string | null
          deactivation_warning_sent?: boolean | null
          electricalexpirydate?: string | null
          electricalqualification?: string | null
          email?: string | null
          emergencycontact?: string | null
          emergencyphone?: string | null
          employeenumber?: string | null
          employmentstatus?: string | null
          equipmentassigned?: string | null
          experiencelevel?: string | null
          firebase_uid?: string | null
          firstname?: string | null
          fullname?: string | null
          gassafeexpirydate?: string | null
          gassafenumber?: string | null
          healthsafetyexpirydate?: string | null
          healthsafetytraining?: string | null
          hiringmanager?: string | null
          holidayentitlement?: number | null
          internalnotes?: string | null
          jobs?: string | null
          last_ai_interaction?: string | null
          last_reactivation_date?: string | null
          last_sign_in?: string | null
          lastname?: string | null
          lastperformancereview?: string | null
          maxhoursperweek?: number | null
          medicalrestrictions?: string | null
          onboarding_completed?: boolean | null
          othercertifications?: string | null
          overtimerate?: number | null
          performance_rating?: number | null
          performancerating?: string | null
          personaltoolsprovided?: boolean | null
          phone?: string | null
          preferredworkdays?: string[] | null
          primaryskill?: string | null
          reactivated_count?: number | null
          regionalpreference?: string | null
          reportingmanager?: string | null
          role?: string | null
          skills?: string[] | null
          standarddayrate?: number | null
          startdate?: string | null
          supabase_auth_id?: string | null
          system_role?: string | null
          total_plots_completed?: number | null
          trainingcompleted?: string | null
          trainingrequired?: string | null
          uniformsize?: string | null
          user_job_rates?: string | null
          userid?: string | null
          userjobrate?: string | null
          useruid?: string | null
          vanprovided?: boolean | null
          weekendrate?: number | null
          whalesync_postgres_id?: string
          workinghours?: string | null
        }
        Update: {
          accidenthistory?: string | null
          address?: string | null
          ai_queries_count?: number | null
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          auth_provider?: string | null
          availablefromdate?: string | null
          avatar_url?: string | null
          avg_weekly_hours?: number | null
          basehourlyrate?: number | null
          calloutrate?: number | null
          clientfeedback?: string | null
          contracttype?: string | null
          cscs_last_validated?: string | null
          cscs_required?: boolean
          cscs_upload_required?: boolean | null
          cscs_uploaded_at?: string | null
          cscs_validation_status?: string | null
          cscscardnumber?: string | null
          cscsexpirydate?: string | null
          currentproject?: string | null
          deactivation_date?: string | null
          deactivation_warning_sent?: boolean | null
          electricalexpirydate?: string | null
          electricalqualification?: string | null
          email?: string | null
          emergencycontact?: string | null
          emergencyphone?: string | null
          employeenumber?: string | null
          employmentstatus?: string | null
          equipmentassigned?: string | null
          experiencelevel?: string | null
          firebase_uid?: string | null
          firstname?: string | null
          fullname?: string | null
          gassafeexpirydate?: string | null
          gassafenumber?: string | null
          healthsafetyexpirydate?: string | null
          healthsafetytraining?: string | null
          hiringmanager?: string | null
          holidayentitlement?: number | null
          internalnotes?: string | null
          jobs?: string | null
          last_ai_interaction?: string | null
          last_reactivation_date?: string | null
          last_sign_in?: string | null
          lastname?: string | null
          lastperformancereview?: string | null
          maxhoursperweek?: number | null
          medicalrestrictions?: string | null
          onboarding_completed?: boolean | null
          othercertifications?: string | null
          overtimerate?: number | null
          performance_rating?: number | null
          performancerating?: string | null
          personaltoolsprovided?: boolean | null
          phone?: string | null
          preferredworkdays?: string[] | null
          primaryskill?: string | null
          reactivated_count?: number | null
          regionalpreference?: string | null
          reportingmanager?: string | null
          role?: string | null
          skills?: string[] | null
          standarddayrate?: number | null
          startdate?: string | null
          supabase_auth_id?: string | null
          system_role?: string | null
          total_plots_completed?: number | null
          trainingcompleted?: string | null
          trainingrequired?: string | null
          uniformsize?: string | null
          user_job_rates?: string | null
          userid?: string | null
          userjobrate?: string | null
          useruid?: string | null
          vanprovided?: boolean | null
          weekendrate?: number | null
          whalesync_postgres_id?: string
          workinghours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_currentproject_foreign"
            columns: ["currentproject"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "users_jobs_foreign"
            columns: ["jobs"]
            isOneToOne: false
            referencedRelation: "Jobs"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "users_user_job_rates_foreign"
            columns: ["user_job_rates"]
            isOneToOne: false
            referencedRelation: "User_Job_Rates"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      video_call_sessions: {
        Row: {
          actual_start: string | null
          call_type: string
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          host_user_id: string
          id: string
          meeting_notes: string | null
          metadata: Json | null
          participants: Json | null
          project_id: string | null
          recording_enabled: boolean | null
          recording_url: string | null
          room_id: string
          scheduled_start: string | null
          session_name: string
          status: string
          updated_at: string
        }
        Insert: {
          actual_start?: string | null
          call_type?: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          host_user_id: string
          id?: string
          meeting_notes?: string | null
          metadata?: Json | null
          participants?: Json | null
          project_id?: string | null
          recording_enabled?: boolean | null
          recording_url?: string | null
          room_id: string
          scheduled_start?: string | null
          session_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          actual_start?: string | null
          call_type?: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          host_user_id?: string
          id?: string
          meeting_notes?: string | null
          metadata?: Json | null
          participants?: Json | null
          project_id?: string | null
          recording_enabled?: boolean | null
          recording_url?: string | null
          room_id?: string
          scheduled_start?: string | null
          session_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      voice_commands: {
        Row: {
          command_phrase: string
          confidence_threshold: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          role_scopes: string[]
          template_id: string | null
        }
        Insert: {
          command_phrase: string
          confidence_threshold?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role_scopes: string[]
          template_id?: string | null
        }
        Update: {
          command_phrase?: string
          confidence_threshold?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role_scopes?: string[]
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_commands_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "smart_prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_interaction_logs: {
        Row: {
          action_successful: boolean | null
          background_noise_level: string | null
          command_text: string
          confidence_score: number | null
          created_at: string
          device_info: Json | null
          error_message: string | null
          id: string
          intent_detected: string | null
          location_context: string | null
          notification_id: string | null
          user_id: string | null
        }
        Insert: {
          action_successful?: boolean | null
          background_noise_level?: string | null
          command_text: string
          confidence_score?: number | null
          created_at?: string
          device_info?: Json | null
          error_message?: string | null
          id?: string
          intent_detected?: string | null
          location_context?: string | null
          notification_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_successful?: boolean | null
          background_noise_level?: string | null
          command_text?: string
          confidence_score?: number | null
          created_at?: string
          device_info?: Json | null
          error_message?: string | null
          id?: string
          intent_detected?: string | null
          location_context?: string | null
          notification_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_interaction_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "smart_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      work_activity_categories: {
        Row: {
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      work_categories: {
        Row: {
          code: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_template: boolean | null
          name: string
          project_id: string | null
          requires_rams: boolean | null
          safety_requirements: string[] | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_template?: boolean | null
          name: string
          project_id?: string | null
          requires_rams?: boolean | null
          safety_requirements?: string[] | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_template?: boolean | null
          name?: string
          project_id?: string | null
          requires_rams?: boolean | null
          safety_requirements?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      work_packages: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          completion_percentage: number | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          estimated_hours: number | null
          id: string
          level_id: string | null
          linked_drawings: string[] | null
          name: string
          plot_id: string | null
          priority: string
          project_id: string
          rams_documents: string[] | null
          safety_notes: string | null
          start_date: string | null
          status: string
          updated_at: string
          work_type: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          completion_percentage?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          id?: string
          level_id?: string | null
          linked_drawings?: string[] | null
          name: string
          plot_id?: string | null
          priority?: string
          project_id: string
          rams_documents?: string[] | null
          safety_notes?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          work_type: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          completion_percentage?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          id?: string
          level_id?: string | null
          linked_drawings?: string[] | null
          name?: string
          plot_id?: string | null
          priority?: string
          project_id?: string
          rams_documents?: string[] | null
          safety_notes?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_packages_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_packages_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_packages_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "work_packages_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_packages_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "work_packages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_packages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_packages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "work_packages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_packages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "work_packages_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "Levels"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "work_packages_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "Plots"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "work_packages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      work_tracking_history: {
        Row: {
          action: string | null
          id: string
          job_template_id: string | null
          metadata: Json | null
          notes: string | null
          plot_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          id?: string
          job_template_id?: string | null
          metadata?: Json | null
          notes?: string | null
          plot_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          id?: string
          job_template_id?: string | null
          metadata?: Json | null
          notes?: string | null
          plot_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_tracking_history_job_template_id_fkey"
            columns: ["job_template_id"]
            isOneToOne: false
            referencedRelation: "Job_Templates"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "work_tracking_history_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "Plots"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "work_tracking_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_tracking_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_tracking_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "work_tracking_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_tracking_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      Work_Tracking_History: {
        Row: {
          created_at: string | null
          hours_worked: number | null
          id: string
          issues_encountered: string | null
          materials_used: Json | null
          photos: string[] | null
          plot_id: string | null
          user_id: string | null
          work_date: string | null
          work_description: string | null
          work_type: string | null
        }
        Insert: {
          created_at?: string | null
          hours_worked?: number | null
          id?: string
          issues_encountered?: string | null
          materials_used?: Json | null
          photos?: string[] | null
          plot_id?: string | null
          user_id?: string | null
          work_date?: string | null
          work_description?: string | null
          work_type?: string | null
        }
        Update: {
          created_at?: string | null
          hours_worked?: number | null
          id?: string
          issues_encountered?: string | null
          materials_used?: Json | null
          photos?: string[] | null
          plot_id?: string | null
          user_id?: string | null
          work_date?: string | null
          work_description?: string | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Work_Tracking_History_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "Plots"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "Work_Tracking_History_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "Work_Tracking_History_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "Work_Tracking_History_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "Work_Tracking_History_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "Work_Tracking_History_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      work_type_task_plans: {
        Row: {
          created_at: string | null
          is_mandatory: boolean | null
          sequence_order: number | null
          special_instructions: string | null
          task_plan_id: string
          work_type_id: string
        }
        Insert: {
          created_at?: string | null
          is_mandatory?: boolean | null
          sequence_order?: number | null
          special_instructions?: string | null
          task_plan_id: string
          work_type_id: string
        }
        Update: {
          created_at?: string | null
          is_mandatory?: boolean | null
          sequence_order?: number | null
          special_instructions?: string | null
          task_plan_id?: string
          work_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_type_task_plans_task_plan_id_fkey"
            columns: ["task_plan_id"]
            isOneToOne: false
            referencedRelation: "task_plan_usage_stats"
            referencedColumns: ["task_plan_id"]
          },
          {
            foreignKeyName: "work_type_task_plans_task_plan_id_fkey"
            columns: ["task_plan_id"]
            isOneToOne: false
            referencedRelation: "task_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_type_task_plans_work_type_id_fkey"
            columns: ["work_type_id"]
            isOneToOne: false
            referencedRelation: "work_types"
            referencedColumns: ["id"]
          },
        ]
      }
      work_types: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          min_experience_years: number | null
          name: string
          requires_supervision: boolean | null
          risk_level: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          min_experience_years?: number | null
          name: string
          requires_supervision?: boolean | null
          risk_level?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          min_experience_years?: number | null
          name?: string
          requires_supervision?: boolean | null
          risk_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      WorkCategories: {
        Row: {
          airtable_created_time: string | null
          airtable_record_id: string | null
          categorycode: string | null
          categoryid: string | null
          categoryname: string | null
          categorytype: string | null
          description: string | null
          job_templates: string | null
          jobs: string | null
          safetycategory: string | null
          whalesync_postgres_id: string
        }
        Insert: {
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          categorycode?: string | null
          categoryid?: string | null
          categoryname?: string | null
          categorytype?: string | null
          description?: string | null
          job_templates?: string | null
          jobs?: string | null
          safetycategory?: string | null
          whalesync_postgres_id?: string
        }
        Update: {
          airtable_created_time?: string | null
          airtable_record_id?: string | null
          categorycode?: string | null
          categoryid?: string | null
          categoryname?: string | null
          categorytype?: string | null
          description?: string | null
          job_templates?: string | null
          jobs?: string | null
          safetycategory?: string | null
          whalesync_postgres_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workcategories_jobs_foreign"
            columns: ["jobs"]
            isOneToOne: false
            referencedRelation: "Jobs"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
    }
    Views: {
      mandatory_qualification_compliance: {
        Row: {
          expiring_count: number | null
          fullname: string | null
          is_compliant: boolean | null
          mandatory_required: number | null
          missing_qualifications: string[] | null
          non_compliant_count: number | null
          role: string | null
          user_id: string | null
          valid_count: number | null
        }
        Relationships: []
      }
      migration_status: {
        Row: {
          migrated_users: number | null
          migration_percentage: number | null
          new_users: number | null
          pending_migration: number | null
          total_users: number | null
        }
        Relationships: []
      }
      onboarding_completion_stats: {
        Row: {
          has_cscs: number | null
          has_emergency_contact: number | null
          has_skills: number | null
          has_uniform_size: number | null
          role: string | null
          site_ready_percentage: number | null
          total_users: number | null
        }
        Relationships: []
      }
      qualification_status_view: {
        Row: {
          category_color: string | null
          category_icon: string | null
          category_id: string | null
          category_name: string | null
          certificate_number: string | null
          created_at: string | null
          days_until_expiry: number | null
          default_validity_years: number | null
          document_size_kb: number | null
          document_type: string | null
          document_url: string | null
          expiry_date: string | null
          expiry_status: string | null
          id: string | null
          is_mandatory: boolean | null
          issue_date: string | null
          issuing_body: string | null
          notes: string | null
          qualification_code: string | null
          qualification_name: string | null
          qualification_type: string | null
          qualification_type_id: string | null
          reminder_sent: boolean | null
          status: string | null
          status_color: string | null
          updated_at: string | null
          user_email: string | null
          user_fullname: string | null
          user_id: string | null
          user_role: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualifications_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "qualification_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualifications_qualification_type_id_fkey"
            columns: ["qualification_type_id"]
            isOneToOne: false
            referencedRelation: "qualification_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qualifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qualifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "qualifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qualifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "qualifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "mandatory_qualification_compliance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qualifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "task_plan_compliance_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qualifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_extended"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "qualifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_qualification_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qualifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      signup_monitoring: {
        Row: {
          complete_profiles: number | null
          completion_percentage: number | null
          missing_names: number | null
          signup_date: string | null
          total_signups: number | null
        }
        Relationships: []
      }
      task_plan_compliance_summary: {
        Row: {
          expired_count: number | null
          expiring_soon_count: number | null
          fullname: string | null
          is_compliant: boolean | null
          last_signature_date: string | null
          mandatory_plans_count: number | null
          project_id: string | null
          projectname: string | null
          role: string | null
          signed_mandatory_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_currentproject_foreign"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      task_plan_usage_stats: {
        Row: {
          active_signatures: number | null
          avg_view_duration: number | null
          first_signed: string | null
          last_signed: string | null
          projects_used: number | null
          reference_number: string | null
          risk_rating: string | null
          status: string | null
          task_plan_id: string | null
          title: string | null
          total_signatures: number | null
          version: string | null
          work_types_linked: number | null
        }
        Relationships: []
      }
      user_deactivation_overview: {
        Row: {
          active_users: number | null
          auto_deactivate_days: number | null
          expiring_soon: number | null
          temporary_users: number | null
          user_type: string | null
          warnings_sent: number | null
        }
        Relationships: []
      }
      user_profiles_extended: {
        Row: {
          accidenthistory: string | null
          address: string | null
          ai_queries_count: number | null
          airtable_created_time: string | null
          airtable_record_id: string | null
          auth_provider: string | null
          availablefromdate: string | null
          avg_weekly_hours: number | null
          basehourlyrate: number | null
          calloutrate: number | null
          clientfeedback: string | null
          contracttype: string | null
          cscscardnumber: string | null
          cscsexpirydate: string | null
          current_project_name: string | null
          currentproject: string | null
          days_until_cscs_expiry: number | null
          electricalexpirydate: string | null
          electricalqualification: string | null
          email: string | null
          emergencycontact: string | null
          emergencyphone: string | null
          employeenumber: string | null
          employmentstatus: string | null
          equipmentassigned: string | null
          experiencelevel: string | null
          firebase_uid: string | null
          firstname: string | null
          fullname: string | null
          gassafeexpirydate: string | null
          gassafenumber: string | null
          has_expiring_certs: boolean | null
          healthsafetyexpirydate: string | null
          healthsafetytraining: string | null
          hiringmanager: string | null
          holidayentitlement: number | null
          internalnotes: string | null
          jobs: string | null
          last_ai_interaction: string | null
          last_sign_in: string | null
          lastname: string | null
          lastperformancereview: string | null
          maxhoursperweek: number | null
          medicalrestrictions: string | null
          othercertifications: string | null
          overtimerate: number | null
          performance_rating: number | null
          performancerating: string | null
          personaltoolsprovided: boolean | null
          phone: string | null
          preferredworkdays: string[] | null
          primaryskill: string | null
          regionalpreference: string | null
          reportingmanager: string | null
          role: string | null
          skills: string[] | null
          standarddayrate: number | null
          startdate: string | null
          supabase_auth_id: string | null
          system_role: string | null
          total_plots_completed: number | null
          trainingcompleted: string | null
          trainingrequired: string | null
          uniformsize: string | null
          user_job_rates: string | null
          userid: string | null
          userjobrate: string | null
          useruid: string | null
          vanprovided: boolean | null
          weekendrate: number | null
          whalesync_postgres_id: string | null
          workinghours: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_currentproject_foreign"
            columns: ["currentproject"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "users_jobs_foreign"
            columns: ["jobs"]
            isOneToOne: false
            referencedRelation: "Jobs"
            referencedColumns: ["whalesync_postgres_id"]
          },
          {
            foreignKeyName: "users_user_job_rates_foreign"
            columns: ["user_job_rates"]
            isOneToOne: false
            referencedRelation: "User_Job_Rates"
            referencedColumns: ["whalesync_postgres_id"]
          },
        ]
      }
      user_qualification_summary: {
        Row: {
          critical_count: number | null
          expired_count: number | null
          expiring_soon_list: string[] | null
          fullname: string | null
          next_expiry_date: string | null
          role: string | null
          total_qualifications: number | null
          user_id: string | null
          valid_count: number | null
          warning_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_role_request: {
        Args: { p_request_id: string; p_notes?: string }
        Returns: boolean
      }
      archive_old_timesheets: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      authenticate_user: {
        Args: { p_email: string; p_auth_provider: string; p_auth_id: string }
        Returns: Json
      }
      auto_archive_expired_dabs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      auto_refresh_materialized_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      batch_send_notifications: {
        Args: {
          p_type: string
          p_user_ids: string[]
          p_title: string
          p_message: string
          p_metadata?: Json
        }
        Returns: number
      }
      bulk_assign_task_plans: {
        Args: {
          p_work_type_id: string
          p_task_plan_ids: string[]
          p_mandatory?: boolean
        }
        Returns: Json
      }
      bulk_extend_users: {
        Args: {
          p_user_ids: string[]
          p_extension_days?: number
          p_notes?: string
        }
        Returns: Json
      }
      cache_prompt_offline: {
        Args: {
          p_template_id: string
          p_input: string
          p_output: string
          p_device_fingerprint?: string
        }
        Returns: boolean
      }
      cache_user_context: {
        Args: {
          p_user_id: string
          p_context_type: string
          p_context_data: Json
        }
        Returns: undefined
      }
      calculate_approval_priority: {
        Args: { p_item_type: string; p_item_id: string }
        Returns: number
      }
      can_request_role_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      can_submit_timesheet: {
        Args: {
          p_user_id: string
          p_work_type_id: string
          p_project_id: string
        }
        Returns: Json
      }
      check_ai_rate_limit: {
        Args: {
          p_user_id: string
          p_endpoint: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_can_skip_onboarding: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_contractor_compliance: {
        Args: { p_contractor_id: string; p_project_id?: string }
        Returns: Json
      }
      check_enhanced_rate_limit: {
        Args: {
          p_user_id: string
          p_endpoint: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_index_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          tablename: string
          indexname: string
          index_size: string
          usage_count: number
          recommendation: string
        }[]
      }
      check_plot_availability: {
        Args: { p_plot_id: string; p_work_date: string; p_fix_stage: string }
        Returns: boolean
      }
      check_qualification_compliance: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      check_user_compliance: {
        Args: {
          p_user_id: string
          p_work_type_id: string
          p_project_id?: string
        }
        Returns: Json
      }
      check_user_cscs_status: {
        Args: { p_user_id: string }
        Returns: Json
      }
      check_user_profile_exists: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      cleanup_inactive_collaborations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_notifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      complete_induction_step: {
        Args: {
          p_induction_id: string
          p_step_number: number
          p_step_data?: Json
        }
        Returns: boolean
      }
      complete_onboarding: {
        Args:
          | Record<PropertyKey, never>
          | {
              p_first_name: string
              p_last_name: string
              p_department?: string
              p_skills?: string[]
            }
        Returns: Json
      }
      complete_onboarding_enhanced: {
        Args: {
          p_first_name: string
          p_last_name: string
          p_phone: string
          p_emergency_contact: string
          p_emergency_phone: string
          p_cscs_number?: string
          p_cscs_expiry?: string
          p_primary_skill?: string
          p_experience_level?: string
          p_skills?: string[]
          p_preferred_work_days?: string[]
          p_max_hours_per_week?: number
          p_can_drive?: boolean
          p_has_own_tools?: boolean
          p_uniform_size?: string
          p_has_gas_safe?: boolean
          p_gas_safe_number?: string
          p_has_electrical?: boolean
          p_has_first_aid?: boolean
        }
        Returns: Json
      }
      complete_task_plan_signing: {
        Args: {
          p_task_plan_id: string
          p_signature_data: string
          p_project_id: string
          p_location_lat: number
          p_location_lng: number
          p_device_info: Json
          p_viewed_duration_seconds: number
          p_pages_viewed: number[]
          p_section_acknowledgments?: Json
          p_questions_asked?: string
          p_additional_notes?: string
        }
        Returns: Json
      }
      complete_user_migration: {
        Args: { p_email: string }
        Returns: undefined
      }
      complete_user_profile: {
        Args: {
          p_first_name?: string
          p_last_name?: string
          p_user_id?: string
        }
        Returns: Json
      }
      convert_to_temporary_user: {
        Args: { p_user_id: string; p_days?: number; p_reason?: string }
        Returns: Json
      }
      create_chat_room: {
        Args: {
          p_name: string
          p_description?: string
          p_room_type?: string
          p_project_id?: string
          p_participant_ids?: string[]
        }
        Returns: Json
      }
      create_toolbox_talk: {
        Args: {
          p_title: string
          p_date: string
          p_time: string
          p_location: string
          p_project_id: string
          p_topics: string[]
          p_task_plans: string[]
          p_hazards: string[]
          p_attendee_ids: string[]
        }
        Returns: Json
      }
      daily_qualification_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      daily_task_plan_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      daily_user_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      debug_last_auth_metadata: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      debug_user_metadata: {
        Args: { p_email: string }
        Returns: Json
      }
      detect_suspicious_activity: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      execute_smart_prompt: {
        Args: {
          p_template_id: string
          p_input_text: string
          p_context?: Json
          p_mobile_device?: boolean
          p_voice_input?: boolean
        }
        Returns: Json
      }
      generate_personalized_prompt: {
        Args: { p_user_id: string; p_base_role: string }
        Returns: string
      }
      get_admin_pending_actions: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_type: string
          action_id: string
          user_name: string
          user_email: string
          details: string
          created_at: string
          priority: string
        }[]
      }
      get_ai_conversation_context: {
        Args: { p_conversation_id: string }
        Returns: Json
      }
      get_app_init_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_compliance_dashboard: {
        Args: { p_project_id?: string; p_date?: string }
        Returns: Json
      }
      get_comprehensive_report: {
        Args: {
          p_start_date?: string
          p_end_date?: string
          p_project_id?: string
        }
        Returns: Json
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          firstname: string
          lastname: string
          fullname: string
          role: string
          currentproject: string
          employmentstatus: string
          skills: string[]
        }[]
      }
      get_deactivation_timeline: {
        Args: { p_start_date?: string; p_days_ahead?: number }
        Returns: {
          event_date: string
          event_type: string
          user_name: string
          user_role: string
          description: string
          severity: string
          action_required: boolean
        }[]
      }
      get_evidence_chain_report: {
        Args: {
          p_project_id?: string
          p_operative_id?: string
          p_plot_id?: string
          p_date_from?: string
          p_date_to?: string
        }
        Returns: {
          record_id: string
          project_name: string
          operative_name: string
          plot_number: string
          document_type: string
          document_version: string
          action_type: string
          created_at: string
          evidence_hash: string
          device_info: Json
        }[]
      }
      get_expiring_users: {
        Args: { p_days_ahead?: number }
        Returns: {
          user_id: string
          fullname: string
          email: string
          role: string
          deactivation_date: string
          days_remaining: number
          warning_sent: boolean
          current_project: string
        }[]
      }
      get_my_auth_metadata: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_my_task_plan_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_onboarding_options: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_onboarding_progress: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_pod_summary: {
        Args: { p_project_id: string }
        Returns: Json
      }
      get_qualification_statistics: {
        Args: { p_project_id?: string }
        Returns: Json
      }
      get_required_task_plans: {
        Args: {
          p_user_id: string
          p_work_type_id: string
          p_project_id?: string
        }
        Returns: {
          task_plan_id: string
          title: string
          reference_number: string
          version: string
          risk_rating: string
          requires_briefing: boolean
          file_url: string
          is_mandatory: boolean
          signature_status: string
          last_signed_date: string
          valid_until: string
          needs_renewal: boolean
        }[]
      }
      get_role_distribution: {
        Args: Record<PropertyKey, never>
        Returns: {
          role: string
          user_count: number
          percentage: number
        }[]
      }
      get_role_smart_prompts: {
        Args: { p_role: string }
        Returns: {
          id: string
          title: string
          description: string
          category: string
          priority: number
          usage_count: number
          avg_rating: number
          requires_context: boolean
          context_fields: Json
        }[]
      }
      get_task_plan_analytics: {
        Args: { p_start_date?: string; p_end_date?: string }
        Returns: Json
      }
      get_task_plan_signing_data: {
        Args: { p_task_plan_id: string }
        Returns: Json
      }
      get_task_plan_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_ai_context: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_management_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_profile: {
        Args: { p_auth_id: string }
        Returns: {
          user_id: string
          full_name: string
          email: string
          role: string
          current_project_id: string
          current_project_name: string
          permissions: Json
        }[]
      }
      get_user_qualifications: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      get_user_system_role: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_timesheet_summary: {
        Args: { p_user_id: string; p_start_date?: string; p_end_date?: string }
        Returns: {
          week_start: string
          total_hours: number
          status: string
          entries_count: number
          unique_plots: number
        }[]
      }
      get_users_missing_names: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          role: string
          created_date: string
          days_since_creation: number
        }[]
      }
      grant_migration_incentive: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      is_document_controller: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: boolean
      }
      log_evidence_chain_event: {
        Args:
          | {
              p_project_id: string
              p_operative_id: string
              p_document_id: string
              p_document_type: string
              p_document_version: string
              p_action_type: string
              p_plot_id?: string
              p_document_revision?: string
              p_signature_id?: string
              p_device_info?: Json
              p_metadata?: Json
            }
          | {
              p_table_name: string
              p_record_id: string
              p_action: string
              p_data: Json
              p_user_id?: string
            }
        Returns: string
      }
      make_user_permanent: {
        Args: { p_user_id: string; p_new_role?: string; p_notes?: string }
        Returns: Json
      }
      migrate_firebase_user_to_supabase: {
        Args: {
          p_firebase_uid: string
          p_email: string
          p_user_metadata?: Json
        }
        Returns: string
      }
      migrate_user_qualifications: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      migrate_user_to_supabase: {
        Args: {
          p_email: string
          p_firebase_uid: string
          p_new_password: string
        }
        Returns: Json
      }
      notify_expiring_signatures: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      optimize_database_performance: {
        Args: Record<PropertyKey, never>
        Returns: {
          optimization_type: string
          details: string
          impact: string
        }[]
      }
      perform_database_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: {
          action: string
          details: string
        }[]
      }
      post_signup_setup: {
        Args: {
          p_first_name: string
          p_last_name: string
          p_preferred_role?: string
        }
        Returns: Json
      }
      predict_project_risks: {
        Args: { p_project_id: string }
        Returns: Json
      }
      prepare_user_for_migration: {
        Args: { p_email: string }
        Returns: Json
      }
      process_user_deactivations: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      quick_complete_profile: {
        Args: { p_email: string; p_first_name: string; p_last_name: string }
        Returns: Json
      }
      quick_create_task_plan: {
        Args: {
          p_title: string
          p_category: string
          p_risk_rating: string
          p_file_url: string
          p_work_type_ids?: string[]
        }
        Returns: Json
      }
      reactivate_user: {
        Args:
          | Record<PropertyKey, never>
          | { p_user_id: string; p_extension_days?: number; p_notes?: string }
        Returns: Json
      }
      request_role_upgrade: {
        Args: { p_requested_role: string; p_justification: string }
        Returns: string
      }
      sanitize_ai_input: {
        Args: { input_text: string }
        Returns: string
      }
      sanitize_user_input: {
        Args: { input_text: string }
        Returns: string
      }
      save_cscs_card_from_onboarding: {
        Args: {
          p_user_id: string
          p_card_number: string
          p_expiry_date: string
          p_card_type: string
          p_front_image_url?: string
          p_back_image_url?: string
        }
        Returns: string
      }
      search_documents: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          document_id: string
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      secure_document_search: {
        Args: {
          query_text: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      send_qualification_expiry_notifications: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      send_real_time_notification: {
        Args: {
          p_user_ids: string[]
          p_title: string
          p_message: string
          p_type?: string
          p_priority?: string
          p_action_url?: string
          p_metadata?: Json
        }
        Returns: number
      }
      send_role_invitation: {
        Args: { p_email: string; p_role: string; p_project_id?: string }
        Returns: string
      }
      sign_task_plan: {
        Args: {
          p_task_plan_id: string
          p_signature_data?: string
          p_project_id?: string
          p_location_lat?: number
          p_location_lng?: number
          p_device_info?: Json
          p_questions_asked?: string
          p_notes?: string
        }
        Returns: Json
      }
      start_induction: {
        Args: {
          p_user_id: string
          p_project_id?: string
          p_supervisor_id?: string
          p_language?: string
          p_device_info?: Json
        }
        Returns: string
      }
      supersede_document_version: {
        Args: {
          p_old_version_id: string
          p_new_version_id: string
          p_superseded_by: string
        }
        Returns: boolean
      }
      update_user_cscs_status: {
        Args: {
          p_user_id: string
          p_card_number: string
          p_expiry_date: string
        }
        Returns: boolean
      }
      update_user_names: {
        Args: { p_first_name?: string; p_last_name?: string }
        Returns: Json
      }
      update_user_presence: {
        Args: {
          p_status?: string
          p_location?: string
          p_custom_status?: string
        }
        Returns: boolean
      }
      upsert_qualification: {
        Args:
          | {
              p_qualification_type: string
              p_certificate_number?: string
              p_issue_date?: string
              p_expiry_date?: string
              p_issuing_body?: string
              p_document_url?: string
              p_photo_url?: string
              p_level?: string
              p_notes?: string
            }
          | {
              p_qualification_type_id: string
              p_certificate_number?: string
              p_issue_date?: string
              p_expiry_date?: string
              p_issuing_body?: string
              p_document_url?: string
              p_notes?: string
              p_qualification_id?: string
            }
        Returns: Json
      }
      user_has_elevated_permissions: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      user_is_document_controller: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      validate_cscs_card: {
        Args:
          | Record<PropertyKey, never>
          | { p_card_number: string; p_expiry_date: string }
        Returns: Json
      }
      validate_qr_document: {
        Args: {
          p_document_id: string
          p_scanned_by: string
          p_device_info?: Json
        }
        Returns: Json
      }
      warm_cache_for_user: {
        Args: { p_user_id: string }
        Returns: undefined
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
