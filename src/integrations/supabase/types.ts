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
      album_items: {
        Row: {
          album_id: string
          created_at: string
          id: string
          quote_id: string
        }
        Insert: {
          album_id: string
          created_at?: string
          id?: string
          quote_id: string
        }
        Update: {
          album_id?: string
          created_at?: string
          id?: string
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_items_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      albums: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      healing_works: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          external_link: string | null
          id: string
          is_published: boolean
          tags: string[]
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          external_link?: string | null
          id?: string
          is_published?: boolean
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          external_link?: string | null
          id?: string
          is_published?: boolean
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          body: string | null
          capsule_interval: string | null
          capsule_send_at: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          is_private: boolean
          mood: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          capsule_interval?: string | null
          capsule_send_at?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_private?: boolean
          mood?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          capsule_interval?: string | null
          capsule_send_at?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_private?: boolean
          mood?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_passcodes: {
        Row: {
          created_at: string
          pin_hash: string | null
          pin_salt: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          pin_hash?: string | null
          pin_salt?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          pin_hash?: string | null
          pin_salt?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          mood: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date?: string
          id?: string
          mood: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      podcast_progress: {
        Row: {
          completed: boolean
          episode_id: number
          favorited: boolean
          id: string
          progress_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          episode_id: number
          favorited?: boolean
          id?: string
          progress_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          episode_id?: number
          favorited?: boolean
          id?: string
          progress_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_favorites: {
        Row: {
          created_at: string
          quote_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          quote_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          quote_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_favorites_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          display_name: string | null
          id: string
          note: string | null
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_text: string | null
          status: string
          submitted_by: string
          updated_at: string
          work_title: string | null
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          display_name?: string | null
          id?: string
          note?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_text?: string | null
          status?: string
          submitted_by: string
          updated_at?: string
          work_title?: string | null
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          display_name?: string | null
          id?: string
          note?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_text?: string | null
          status?: string
          submitted_by?: string
          updated_at?: string
          work_title?: string | null
        }
        Relationships: []
      }
      time_capsule_deliveries: {
        Row: {
          created_at: string
          deliver_at: string
          delivered_at: string | null
          entry_id: string
          id: string
          interval_kind: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          deliver_at: string
          delivered_at?: string | null
          entry_id: string
          id?: string
          interval_kind?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          deliver_at?: string
          delivered_at?: string | null
          entry_id?: string
          id?: string
          interval_kind?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_capsule_deliveries_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      set_journal_pin: { Args: { _pin: string }; Returns: undefined }
      verify_journal_pin: { Args: { _pin: string }; Returns: boolean }
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
