export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      activity_events: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_name: string;
          after_value: Json | null;
          before_value: Json | null;
          claim_id: string;
          created_at: string;
          id: string;
          label: string;
          organization_id: string;
          source: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_name: string;
          after_value?: Json | null;
          before_value?: Json | null;
          claim_id: string;
          created_at?: string;
          id?: string;
          label: string;
          organization_id: string;
          source?: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_name?: string;
          after_value?: Json | null;
          before_value?: Json | null;
          claim_id?: string;
          created_at?: string;
          id?: string;
          label?: string;
          organization_id?: string;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_events_organization_id_actor_id_fkey";
            columns: ["organization_id", "actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "activity_events_organization_id_claim_id_fkey";
            columns: ["organization_id", "claim_id"];
            isOneToOne: false;
            referencedRelation: "claims";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      claims: {
        Row: {
          assigned_agent_id: string | null;
          assistance_source: string | null;
          assistance_status: string;
          city: string;
          client_id: string;
          contract_id: string;
          duplicate_import: boolean;
          has_conflict: boolean;
          id: string;
          injury_state: string;
          location: string;
          occurred_at: string;
          organization_id: string;
          priority: string;
          reference: string;
          statement: string;
          statement_language: string;
          status: string;
          team_id: string;
          translation: string | null;
          updated_at: string;
          vehicle_drivable: boolean;
        };
        Insert: {
          assigned_agent_id?: string | null;
          assistance_source?: string | null;
          assistance_status: string;
          city: string;
          client_id: string;
          contract_id: string;
          duplicate_import?: boolean;
          has_conflict?: boolean;
          id?: string;
          injury_state: string;
          location: string;
          occurred_at: string;
          organization_id: string;
          priority: string;
          reference: string;
          statement: string;
          statement_language: string;
          status: string;
          team_id: string;
          translation?: string | null;
          updated_at?: string;
          vehicle_drivable: boolean;
        };
        Update: {
          assigned_agent_id?: string | null;
          assistance_source?: string | null;
          assistance_status?: string;
          city?: string;
          client_id?: string;
          contract_id?: string;
          duplicate_import?: boolean;
          has_conflict?: boolean;
          id?: string;
          injury_state?: string;
          location?: string;
          occurred_at?: string;
          organization_id?: string;
          priority?: string;
          reference?: string;
          statement?: string;
          statement_language?: string;
          status?: string;
          team_id?: string;
          translation?: string | null;
          updated_at?: string;
          vehicle_drivable?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "claims_organization_id_client_id_contract_id_fkey";
            columns: ["organization_id", "client_id", "contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["organization_id", "client_id", "id"];
          },
          {
            foreignKeyName: "claims_organization_id_client_id_fkey";
            columns: ["organization_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "claims_organization_id_team_id_fkey";
            columns: ["organization_id", "team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "claims_team_id_assigned_agent_id_fkey";
            columns: ["team_id", "assigned_agent_id"];
            isOneToOne: false;
            referencedRelation: "team_members";
            referencedColumns: ["team_id", "profile_id"];
          },
        ];
      };
      client_drafts: {
        Row: {
          id: string;
          payload: Json;
          profile_id: string;
          submitted_claim_id: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          payload?: Json;
          profile_id: string;
          submitted_claim_id?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          payload?: Json;
          profile_id?: string;
          submitted_claim_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_drafts_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_drafts_submitted_claim_id_fkey";
            columns: ["submitted_claim_id"];
            isOneToOne: false;
            referencedRelation: "claims";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          full_name: string;
          id: string;
          language: string;
          organization_id: string;
          phone: string;
          portal_profile_id: string | null;
        };
        Insert: {
          full_name: string;
          id: string;
          language?: string;
          organization_id: string;
          phone: string;
          portal_profile_id?: string | null;
        };
        Update: {
          full_name?: string;
          id?: string;
          language?: string;
          organization_id?: string;
          phone?: string;
          portal_profile_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clients_organization_id_portal_profile_id_fkey";
            columns: ["organization_id", "portal_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      contracts: {
        Row: {
          client_id: string;
          id: string;
          insurer: string;
          organization_id: string;
          reference: string;
          registration: string;
          valid_to: string;
          vehicle: string;
        };
        Insert: {
          client_id: string;
          id: string;
          insurer: string;
          organization_id: string;
          reference: string;
          registration: string;
          valid_to: string;
          vehicle: string;
        };
        Update: {
          client_id?: string;
          id?: string;
          insurer?: string;
          organization_id?: string;
          reference?: string;
          registration?: string;
          valid_to?: string;
          vehicle?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contracts_organization_id_client_id_fkey";
            columns: ["organization_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      documents: {
        Row: {
          claim_id: string;
          id: string;
          label: string;
          organization_id: string;
          source: string;
          status: string;
          storage_path: string | null;
          type: string;
        };
        Insert: {
          claim_id: string;
          id: string;
          label: string;
          organization_id: string;
          source: string;
          status: string;
          storage_path?: string | null;
          type: string;
        };
        Update: {
          claim_id?: string;
          id?: string;
          label?: string;
          organization_id?: string;
          source?: string;
          status?: string;
          storage_path?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_claim_id_fkey";
            columns: ["organization_id", "claim_id"];
            isOneToOne: false;
            referencedRelation: "claims";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      notes: {
        Row: {
          author_id: string;
          author_name: string;
          body: string;
          claim_id: string;
          created_at: string;
          id: string;
          organization_id: string;
        };
        Insert: {
          author_id: string;
          author_name: string;
          body: string;
          claim_id: string;
          created_at?: string;
          id?: string;
          organization_id: string;
        };
        Update: {
          author_id?: string;
          author_name?: string;
          body?: string;
          claim_id?: string;
          created_at?: string;
          id?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_organization_id_author_id_fkey";
            columns: ["organization_id", "author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "notes_organization_id_claim_id_fkey";
            columns: ["organization_id", "claim_id"];
            isOneToOne: false;
            referencedRelation: "claims";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          active: boolean;
          avatar_path: string | null;
          full_name: string;
          id: string;
          organization_id: string;
          role: string;
        };
        Insert: {
          active?: boolean;
          avatar_path?: string | null;
          full_name: string;
          id: string;
          organization_id: string;
          role: string;
        };
        Update: {
          active?: boolean;
          avatar_path?: string | null;
          full_name?: string;
          id?: string;
          organization_id?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          assigned_to: string | null;
          claim_id: string;
          completed_at: string | null;
          created_by: string | null;
          due_at: string;
          id: string;
          organization_id: string;
          title: string;
        };
        Insert: {
          assigned_to?: string | null;
          claim_id: string;
          completed_at?: string | null;
          created_by?: string | null;
          due_at: string;
          id?: string;
          organization_id: string;
          title: string;
        };
        Update: {
          assigned_to?: string | null;
          claim_id?: string;
          completed_at?: string | null;
          created_by?: string | null;
          due_at?: string;
          id?: string;
          organization_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_organization_id_assigned_to_fkey";
            columns: ["organization_id", "assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "tasks_organization_id_claim_id_fkey";
            columns: ["organization_id", "claim_id"];
            isOneToOne: false;
            referencedRelation: "claims";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "tasks_organization_id_created_by_fkey";
            columns: ["organization_id", "created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      team_members: {
        Row: {
          organization_id: string;
          profile_id: string;
          team_id: string;
        };
        Insert: {
          organization_id: string;
          profile_id: string;
          team_id: string;
        };
        Update: {
          organization_id?: string;
          profile_id?: string;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_organization_id_profile_id_fkey";
            columns: ["organization_id", "profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "team_members_organization_id_team_id_fkey";
            columns: ["organization_id", "team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          organization_id: string;
          supervisor_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          organization_id: string;
          supervisor_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          organization_id?: string;
          supervisor_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_organization_id_supervisor_id_fkey";
            columns: ["organization_id", "supervisor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      mutate_claim: {
        Args: { p_claim_id: string; p_kind: string; p_payload: Json };
        Returns: undefined;
      };
      portal_attach_document: {
        Args: { p_claim_id: string; p_document_id: string; p_path: string };
        Returns: undefined;
      };
      portal_save_draft: {
        Args: { p_id: string; p_payload: Json };
        Returns: undefined;
      };
      portal_submit_claim: {
        Args: { p_id: string; p_payload: Json };
        Returns: string;
      };
      portal_update_profile: {
        Args: { p_avatar: string; p_name: string };
        Returns: undefined;
      };
      portal_workspace: { Args: never; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
