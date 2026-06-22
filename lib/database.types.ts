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
      conversations: {
        Row: {
          created_at: string
          id: string
          org_agent_id: string
          org_id: string
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_agent_id: string
          org_id: string
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_agent_id?: string
          org_id?: string
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_org_agent_id_fkey"
            columns: ["org_agent_id"]
            isOneToOne: false
            referencedRelation: "org_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          id: string
          name: string
          org_id: string
          parent_id: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          org_id: string
          parent_id?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          org_id?: string
          parent_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "departments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_invocations: {
        Row: {
          created_at: string
          duration_ms: number | null
          endpoint: string | null
          error_code: string | null
          id: string
          method: string | null
          org_connection_id: string | null
          org_id: string
          provider: string
          resource_key: string | null
          status: string
          trigger_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          endpoint?: string | null
          error_code?: string | null
          id?: string
          method?: string | null
          org_connection_id?: string | null
          org_id: string
          provider: string
          resource_key?: string | null
          status: string
          trigger_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          endpoint?: string | null
          error_code?: string | null
          id?: string
          method?: string | null
          org_connection_id?: string | null
          org_id?: string
          provider?: string
          resource_key?: string | null
          status?: string
          trigger_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_invocations_org_connection_id_fkey"
            columns: ["org_connection_id"]
            isOneToOne: false
            referencedRelation: "org_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_invocations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_invocations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      org_agents: {
        Row: {
          agent_key: string
          avatar_url: string | null
          created_at: string
          description: string | null
          display_name: string
          enabled_tools: Json | null
          id: string
          org_id: string
          status: string
          system_prompt_override: string | null
        }
        Insert: {
          agent_key: string
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          enabled_tools?: Json | null
          id?: string
          org_id: string
          status?: string
          system_prompt_override?: string | null
        }
        Update: {
          agent_key?: string
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          enabled_tools?: Json | null
          id?: string
          org_id?: string
          status?: string
          system_prompt_override?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_agents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_connections: {
        Row: {
          connected_by_user_id: string | null
          created_at: string
          id: string
          nango_connection_id: string
          org_id: string
          owner_type: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          connected_by_user_id?: string | null
          created_at?: string
          id?: string
          nango_connection_id: string
          org_id: string
          owner_type?: string
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          connected_by_user_id?: string | null
          created_at?: string
          id?: string
          nango_connection_id?: string
          org_id?: string
          owner_type?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_connections_connected_by_user_id_fkey"
            columns: ["connected_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_connections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_processes: {
        Row: {
          content: string | null
          created_at: string
          department_id: string
          embedding: string | null
          id: string
          org_id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          department_id: string
          embedding?: string | null
          id?: string
          org_id: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          department_id?: string
          embedding?: string | null
          id?: string
          org_id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_processes_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_processes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_provider_credentials: {
        Row: {
          client_id: string
          client_secret: string
          created_at: string
          id: string
          org_id: string
          provider: string
          updated_at: string
        }
        Insert: {
          client_id: string
          client_secret: string
          created_at?: string
          id?: string
          org_id: string
          provider: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_secret?: string
          created_at?: string
          id?: string
          org_id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_provider_credentials_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_workflows: {
        Row: {
          config_overrides: Json | null
          created_at: string
          department_id: string | null
          description: string | null
          display_name: string
          has_output: boolean
          id: string
          org_id: string
          schedule_cron: string | null
          status: string
          workflow_key: string
        }
        Insert: {
          config_overrides?: Json | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          display_name: string
          has_output?: boolean
          id?: string
          org_id: string
          schedule_cron?: string | null
          status?: string
          workflow_key: string
        }
        Update: {
          config_overrides?: Json | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          display_name?: string
          has_output?: boolean
          id?: string
          org_id?: string
          schedule_cron?: string | null
          status?: string
          workflow_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_workflows_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_workflows_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      process_connections: {
        Row: {
          process_id: string
          provider: string
          sort_order: number
        }
        Insert: {
          process_id: string
          provider: string
          sort_order?: number
        }
        Update: {
          process_id?: string
          provider?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "process_connections_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "org_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_workflows: {
        Row: {
          process_id: string
          sort_order: number
          workflow_id: string
        }
        Insert: {
          process_id: string
          sort_order?: number
          workflow_id: string
        }
        Update: {
          process_id?: string
          sort_order?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_workflows_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "org_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_workflows_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "org_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_logs: {
        Row: {
          cost_estimate: number | null
          created_at: string
          duration_ms: number | null
          id: string
          org_id: string
          resource_key: string | null
          resource_type: string
          run_id: string | null
          status: string
          step_id: string | null
          tokens_in: number
          tokens_out: number
          user_id: string | null
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          org_id: string
          resource_key?: string | null
          resource_type?: string
          run_id?: string | null
          status?: string
          step_id?: string | null
          tokens_in?: number
          tokens_out?: number
          user_id?: string | null
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          org_id?: string
          resource_key?: string | null
          resource_type?: string
          run_id?: string | null
          status?: string
          step_id?: string | null
          tokens_in?: number
          tokens_out?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_user_id_fkey"
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
          display_name: string | null
          email: string
          id: string
          invited_at: string | null
          is_active: boolean
          org_id: string
          role: string
          supabase_auth_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          invited_at?: string | null
          is_active?: boolean
          org_id: string
          role: string
          supabase_auth_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          invited_at?: string | null
          is_active?: boolean
          org_id?: string
          role?: string
          supabase_auth_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          idempotency_key: string
          processed_at: string
          source: string
        }
        Insert: {
          idempotency_key: string
          processed_at?: string
          source?: string
        }
        Update: {
          idempotency_key?: string
          processed_at?: string
          source?: string
        }
        Relationships: []
      }
      workflow_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          input: Json | null
          org_id: string
          output: Json | null
          started_by: string | null
          status: string
          tokens_in: number
          tokens_out: number
          trigger: string
          vercel_run_id: string
          workflow_key: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json | null
          org_id: string
          output?: Json | null
          started_by?: string | null
          status?: string
          tokens_in?: number
          tokens_out?: number
          trigger?: string
          vercel_run_id: string
          workflow_key: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json | null
          org_id?: string
          output?: Json | null
          started_by?: string | null
          status?: string
          tokens_in?: number
          tokens_out?: number
          trigger?: string
          vercel_run_id?: string
          workflow_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_step_runs: {
        Row: {
          created_at: string
          error: Json | null
          id: string
          kind: string
          run_id: string
          status: string
          step_id: string
          tokens_in: number
          tokens_out: number
        }
        Insert: {
          created_at?: string
          error?: Json | null
          id?: string
          kind: string
          run_id: string
          status?: string
          step_id: string
          tokens_in?: number
          tokens_out?: number
        }
        Update: {
          created_at?: string
          error?: Json | null
          id?: string
          kind?: string
          run_id?: string
          status?: string
          step_id?: string
          tokens_in?: number
          tokens_out?: number
        }
        Relationships: [
          {
            foreignKeyName: "workflow_step_runs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      workflow_run_stats: {
        Row: {
          last_executed: string | null
          org_id: string | null
          run_count: number | null
          workflow_key: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_user_org_id: { Args: never; Returns: string }
      get_analytics_overview: {
        Args: { p_org_id: string }
        Returns: {
          avg_run_time_ms: number
          failure_rate_month: number
          total_failures_month: number
          total_runs_month: number
          total_runs_today: number
          total_runs_week: number
        }[]
      }
      get_analytics_workflow_summary: {
        Args: { p_org_id: string }
        Returns: {
          avg_duration_ms: number
          department_id: string
          department_name: string
          display_name: string
          failed_runs: number
          last_run_at: string
          total_runs: number
          workflow_key: string
        }[]
      }
      get_workflow_daily_runs: {
        Args: { p_workflow_key: string }
        Returns: {
          failed_runs: number
          run_date: string
          successful_runs: number
        }[]
      }
      get_workflow_detail_stats: {
        Args: { p_workflow_key: string }
        Returns: {
          avg_duration_ms: number
          failed_runs: number
          failure_rate: number
          latest_run_completed_at: string
          latest_run_created_at: string
          latest_run_status: string
          successful_runs: number
          total_runs: number
        }[]
      }
      get_workflows_hub: {
        Args: { p_org_id: string }
        Returns: {
          department_id: string
          department_name: string
          description: string
          display_name: string
          id: string
          last_executed: string
          run_count: number
          status: string
          workflow_key: string
        }[]
      }
      search_processes: {
        Args: {
          match_count?: number
          org_id_filter: string
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          similarity: number
          title: string
        }[]
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

