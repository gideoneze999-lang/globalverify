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
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          screenshot_url: string | null
          status: Database["public"]["Enums"]["deposit_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gift_orders: {
        Row: {
          admin_note: string | null
          amount_ngn: number
          created_at: string
          delivery_tier: Database["public"]["Enums"]["gift_delivery_tier"]
          id: string
          message: string | null
          product_id: string
          recipient_email: string | null
          recipient_name: string
          recipient_phone: string | null
          status: Database["public"]["Enums"]["gift_order_status"]
          tracking_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_ngn: number
          created_at?: string
          delivery_tier: Database["public"]["Enums"]["gift_delivery_tier"]
          id?: string
          message?: string | null
          product_id: string
          recipient_email?: string | null
          recipient_name: string
          recipient_phone?: string | null
          status?: Database["public"]["Enums"]["gift_order_status"]
          tracking_code?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount_ngn?: number
          created_at?: string
          delivery_tier?: Database["public"]["Enums"]["gift_delivery_tier"]
          id?: string
          message?: string | null
          product_id?: string
          recipient_email?: string | null
          recipient_name?: string
          recipient_phone?: string | null
          status?: Database["public"]["Enums"]["gift_order_status"]
          tracking_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      number_orders: {
        Row: {
          country: string
          created_at: string
          expires_at: string | null
          id: string
          phone: string | null
          price_ngn: number
          service: string
          sim5_order_id: string | null
          sms: Json | null
          status: Database["public"]["Enums"]["number_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          country: string
          created_at?: string
          expires_at?: string | null
          id?: string
          phone?: string | null
          price_ngn: number
          service: string
          sim5_order_id?: string | null
          sms?: Json | null
          status?: Database["public"]["Enums"]["number_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          phone?: string | null
          price_ngn?: number
          service?: string
          sim5_order_id?: string | null
          sms?: Json | null
          status?: Database["public"]["Enums"]["number_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_orders: {
        Row: {
          access_link: string | null
          amount_ngn: number
          created_at: string
          id: string
          product_id: string
          status: Database["public"]["Enums"]["product_order_status"]
          tracking_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_link?: string | null
          amount_ngn: number
          created_at?: string
          id?: string
          product_id: string
          status?: Database["public"]["Enums"]["product_order_status"]
          tracking_code?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_link?: string | null
          amount_ngn?: number
          created_at?: string
          id?: string
          product_id?: string
          status?: Database["public"]["Enums"]["product_order_status"]
          tracking_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          access_link: string | null
          asset_url: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          price_ngn: number
          title: string
          updated_at: string
        }
        Insert: {
          access_link?: string | null
          asset_url?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          price_ngn: number
          title: string
          updated_at?: string
        }
        Update: {
          access_link?: string | null
          asset_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          price_ngn?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          wallet_balance: number
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          wallet_balance?: number
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          meta: Json | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          meta?: Json | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          meta?: Json | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_refund_stale_gift_orders: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      deposit_status: "pending" | "approved" | "rejected"
      gift_delivery_tier: "same_day" | "next_day" | "within_week"
      gift_order_status:
        | "pending"
        | "processing"
        | "processed"
        | "delivered"
        | "cancelled"
      number_status:
        | "pending"
        | "received"
        | "cancelled"
        | "finished"
        | "timeout"
      product_order_status: "pending" | "delivered"
      transaction_type:
        | "deposit"
        | "purchase"
        | "number"
        | "refund"
        | "adjustment"
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
      app_role: ["admin", "user"],
      deposit_status: ["pending", "approved", "rejected"],
      gift_delivery_tier: ["same_day", "next_day", "within_week"],
      gift_order_status: [
        "pending",
        "processing",
        "processed",
        "delivered",
        "cancelled",
      ],
      number_status: [
        "pending",
        "received",
        "cancelled",
        "finished",
        "timeout",
      ],
      product_order_status: ["pending", "delivered"],
      transaction_type: [
        "deposit",
        "purchase",
        "number",
        "refund",
        "adjustment",
      ],
    },
  },
} as const
