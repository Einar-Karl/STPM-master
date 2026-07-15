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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          type: Database["public"]["Enums"]["client_type"]
        }
        Insert: {
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          type?: Database["public"]["Enums"]["client_type"]
        }
        Update: {
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          type?: Database["public"]["Enums"]["client_type"]
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_bookings: {
        Row: {
          accommodation: string | null
          arrival: string | null
          client_id: string | null
          comments: string | null
          coordinator: string | null
          created_at: string
          created_by: string | null
          departure: string | null
          first_name: string | null
          group_label: string | null
          id: string
          invoice_no: string | null
          nationality: string | null
          notes: string | null
          participant_email: string | null
          participant_name: string
          participant_role: string | null
          payment_notes: string | null
          payment_status: string | null
          phone: string | null
          price: number | null
          school: string | null
          seats: number
          session_id: string
          special_needs: string | null
          status: Database["public"]["Enums"]["booking_status"]
          tour_booked: boolean | null
        }
        Insert: {
          accommodation?: string | null
          arrival?: string | null
          client_id?: string | null
          comments?: string | null
          coordinator?: string | null
          created_at?: string
          created_by?: string | null
          departure?: string | null
          first_name?: string | null
          group_label?: string | null
          id?: string
          invoice_no?: string | null
          nationality?: string | null
          notes?: string | null
          participant_email?: string | null
          participant_name: string
          participant_role?: string | null
          payment_notes?: string | null
          payment_status?: string | null
          phone?: string | null
          price?: number | null
          school?: string | null
          seats?: number
          session_id: string
          special_needs?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          tour_booked?: boolean | null
        }
        Update: {
          accommodation?: string | null
          arrival?: string | null
          client_id?: string | null
          comments?: string | null
          coordinator?: string | null
          created_at?: string
          created_by?: string | null
          departure?: string | null
          first_name?: string | null
          group_label?: string | null
          id?: string
          invoice_no?: string | null
          nationality?: string | null
          notes?: string | null
          participant_email?: string | null
          participant_name?: string
          participant_role?: string | null
          payment_notes?: string | null
          payment_status?: string | null
          phone?: string | null
          price?: number | null
          school?: string | null
          seats?: number
          session_id?: string
          special_needs?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          tour_booked?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "course_bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sessions: {
        Row: {
          capacity: number | null
          code: string | null
          course_id: string
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          lead_teacher_id: string | null
          location: string | null
          notes: string | null
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          support_teacher_id: string | null
          week_id: string | null
        }
        Insert: {
          capacity?: number | null
          code?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          lead_teacher_id?: string | null
          location?: string | null
          notes?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          support_teacher_id?: string | null
          week_id?: string | null
        }
        Update: {
          capacity?: number | null
          code?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          lead_teacher_id?: string | null
          location?: string | null
          notes?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          support_teacher_id?: string | null
          week_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sessions_lead_teacher_id_fkey"
            columns: ["lead_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sessions_support_teacher_id_fkey"
            columns: ["support_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sessions_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "course_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      course_week_days: {
        Row: {
          created_at: string
          day_date: string
          id: string
          notes: string | null
          title: string | null
          week_id: string
        }
        Insert: {
          created_at?: string
          day_date: string
          id?: string
          notes?: string | null
          title?: string | null
          week_id: string
        }
        Update: {
          created_at?: string
          day_date?: string
          id?: string
          notes?: string | null
          title?: string | null
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_week_days_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "course_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      course_weeks: {
        Row: {
          channel: Database["public"]["Enums"]["channel"]
          created_at: string
          end_date: string
          id: string
          label: string
          location: string
          notes: string | null
          start_date: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["channel"]
          created_at?: string
          end_date: string
          id?: string
          label: string
          location: string
          notes?: string | null
          start_date: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel"]
          created_at?: string
          end_date?: string
          id?: string
          label?: string
          location?: string
          notes?: string | null
          start_date?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_days: number | null
          id: string
          name: string
          price: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_days?: number | null
          id?: string
          name: string
          price?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_days?: number | null
          id?: string
          name?: string
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_bookings: {
        Row: {
          check_in: string
          check_out: string
          client_id: string | null
          course_session_id: string | null
          created_at: string
          created_by: string | null
          guest_name: string
          guests: number
          hotel_id: string
          id: string
          notes: string | null
          room_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          check_in: string
          check_out: string
          client_id?: string | null
          course_session_id?: string | null
          created_at?: string
          created_by?: string | null
          guest_name: string
          guests?: number
          hotel_id: string
          id?: string
          notes?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          check_in?: string
          check_out?: string
          client_id?: string | null
          course_session_id?: string | null
          created_at?: string
          created_by?: string | null
          guest_name?: string
          guests?: number
          hotel_id?: string
          id?: string
          notes?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "hotel_bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_course_session_id_fkey"
            columns: ["course_session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "hotel_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_rooms: {
        Row: {
          capacity: number
          created_at: string
          hotel_id: string
          id: string
          name: string
          room_type: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string
          hotel_id: string
          id?: string
          name: string
          room_type?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string
          hotel_id?: string
          id?: string
          name?: string
          room_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          address: string | null
          contact_info: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
        }
        Insert: {
          address?: string | null
          contact_info?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
        }
        Update: {
          address?: string | null
          contact_info?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["staff_role"]
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["staff_role"]
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
        }
        Relationships: []
      }
      resource_bookings: {
        Row: {
          course_session_id: string | null
          created_at: string
          created_by: string | null
          end_at: string
          id: string
          notes: string | null
          resource_id: string
          start_at: string
          title: string
        }
        Insert: {
          course_session_id?: string | null
          created_at?: string
          created_by?: string | null
          end_at: string
          id?: string
          notes?: string | null
          resource_id: string
          start_at: string
          title: string
        }
        Update: {
          course_session_id?: string | null
          created_at?: string
          created_by?: string | null
          end_at?: string
          id?: string
          notes?: string | null
          resource_id?: string
          start_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_bookings_course_session_id_fkey"
            columns: ["course_session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_bookings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["resource_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type?: Database["public"]["Enums"]["resource_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["resource_type"]
        }
        Relationships: []
      }
      sales_activities: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: string
          lead_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          lead_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_leads: {
        Row: {
          channel: Database["public"]["Enums"]["channel"]
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          last_contacted_at: string | null
          municipality: string | null
          name: string
          next_follow_up_at: string | null
          notes: string | null
          org_type: string
          phone: string | null
          stage: Database["public"]["Enums"]["sales_stage"]
          website: string | null
        }
        Insert: {
          channel?: Database["public"]["Enums"]["channel"]
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          municipality?: string | null
          name: string
          next_follow_up_at?: string | null
          notes?: string | null
          org_type?: string
          phone?: string | null
          stage?: Database["public"]["Enums"]["sales_stage"]
          website?: string | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel"]
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          municipality?: string | null
          name?: string
          next_follow_up_at?: string | null
          notes?: string | null
          org_type?: string
          phone?: string | null
          stage?: Database["public"]["Enums"]["sales_stage"]
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          active: boolean
          code: string | null
          created_at: string
          id: string
          name: string
          sort_order: number
          specializations: string | null
        }
        Insert: {
          active?: boolean
          code?: string | null
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          specializations?: string | null
        }
        Update: {
          active?: boolean
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          specializations?: string | null
        }
        Relationships: []
      }
      week_retros: {
        Row: {
          could_improve: string | null
          created_at: string
          created_by: string | null
          id: string
          rating: number | null
          week_id: string
          went_well: string | null
        }
        Insert: {
          could_improve?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          rating?: number | null
          week_id: string
          went_well?: string | null
        }
        Update: {
          could_improve?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          rating?: number | null
          week_id?: string
          went_well?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "week_retros_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "week_retros_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "course_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      channel: "innie" | "outie"
      client_type: "individual" | "company" | "group"
      resource_type: "room" | "equipment" | "vehicle" | "other"
      sales_stage:
        | "new"
        | "contacted"
        | "interested"
        | "negotiating"
        | "won"
        | "lost"
      staff_role: "staff" | "admin" | "pending"
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
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      channel: ["innie", "outie"],
      client_type: ["individual", "company", "group"],
      resource_type: ["room", "equipment", "vehicle", "other"],
      sales_stage: [
        "new",
        "contacted",
        "interested",
        "negotiating",
        "won",
        "lost",
      ],
      staff_role: ["staff", "admin", "pending"],
    },
  },
} as const
