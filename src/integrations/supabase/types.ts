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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      espacios: {
        Row: {
          codigo: string
          disponible: number | null
          id: number
          tipo_vehiculo_id: number | null
        }
        Insert: {
          codigo: string
          disponible?: number | null
          id?: number
          tipo_vehiculo_id?: number | null
        }
        Update: {
          codigo?: string
          disponible?: number | null
          id?: number
          tipo_vehiculo_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "espacios_tipo_vehiculo_id_fkey"
            columns: ["tipo_vehiculo_id"]
            isOneToOne: false
            referencedRelation: "tipos_vehiculo"
            referencedColumns: ["id"]
          },
        ]
      }
      registros: {
        Row: {
          descuento_tipo: string | null
          descuento_valor: number | null
          espacio_id: number | null
          estado: string | null
          fecha_hora_entrada: string | null
          fecha_hora_salida: string | null
          id: number
          minutos_totales: number | null
          placa: string
          tarifa_id: number | null
          tipo_vehiculo_id: number | null
          usuario_entrada_id: number | null
          usuario_salida_id: number | null
          valor_calculado: number | null
        }
        Insert: {
          descuento_tipo?: string | null
          descuento_valor?: number | null
          espacio_id?: number | null
          estado?: string | null
          fecha_hora_entrada?: string | null
          fecha_hora_salida?: string | null
          id?: number
          minutos_totales?: number | null
          placa: string
          tarifa_id?: number | null
          tipo_vehiculo_id?: number | null
          usuario_entrada_id?: number | null
          usuario_salida_id?: number | null
          valor_calculado?: number | null
        }
        Update: {
          descuento_tipo?: string | null
          descuento_valor?: number | null
          espacio_id?: number | null
          estado?: string | null
          fecha_hora_entrada?: string | null
          fecha_hora_salida?: string | null
          id?: number
          minutos_totales?: number | null
          placa?: string
          tarifa_id?: number | null
          tipo_vehiculo_id?: number | null
          usuario_entrada_id?: number | null
          usuario_salida_id?: number | null
          valor_calculado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_espacio_id_fkey"
            columns: ["espacio_id"]
            isOneToOne: false
            referencedRelation: "espacios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_tarifa_id_fkey"
            columns: ["tarifa_id"]
            isOneToOne: false
            referencedRelation: "tarifas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_tipo_vehiculo_id_fkey"
            columns: ["tipo_vehiculo_id"]
            isOneToOne: false
            referencedRelation: "tipos_vehiculo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_usuario_entrada_id_fkey"
            columns: ["usuario_entrada_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_usuario_salida_id_fkey"
            columns: ["usuario_salida_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          descripcion: string | null
          id: number
          nombre: string
        }
        Insert: {
          descripcion?: string | null
          id?: number
          nombre: string
        }
        Update: {
          descripcion?: string | null
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      tarifas: {
        Row: {
          activo: number | null
          fecha_fin: string | null
          fecha_inicio: string
          id: number
          nombre: string
          tipo_cobro: string | null
          tipo_vehiculo_id: number | null
          valor: number
        }
        Insert: {
          activo?: number | null
          fecha_fin?: string | null
          fecha_inicio: string
          id?: number
          nombre: string
          tipo_cobro?: string | null
          tipo_vehiculo_id?: number | null
          valor: number
        }
        Update: {
          activo?: number | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: number
          nombre?: string
          tipo_cobro?: string | null
          tipo_vehiculo_id?: number | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "tarifas_tipo_vehiculo_id_fkey"
            columns: ["tipo_vehiculo_id"]
            isOneToOne: false
            referencedRelation: "tipos_vehiculo"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          codigo_ticket: string
          email_cliente: string | null
          enviado_email: number | null
          fecha_emision: string | null
          id: number
          registro_id: number | null
        }
        Insert: {
          codigo_ticket: string
          email_cliente?: string | null
          enviado_email?: number | null
          fecha_emision?: string | null
          id?: number
          registro_id?: number | null
        }
        Update: {
          codigo_ticket?: string
          email_cliente?: string | null
          enviado_email?: number | null
          fecha_emision?: string | null
          id?: number
          registro_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_registro_id_fkey"
            columns: ["registro_id"]
            isOneToOne: true
            referencedRelation: "registros"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_vehiculo: {
        Row: {
          descripcion: string | null
          id: number
          nombre: string
        }
        Insert: {
          descripcion?: string | null
          id?: number
          nombre: string
        }
        Update: {
          descripcion?: string | null
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          activo: number | null
          auth_user_id: string | null
          email: string
          fecha_creacion: string | null
          id: number
          nombre: string
          password_hash: string | null
          rol_id: number | null
        }
        Insert: {
          activo?: number | null
          auth_user_id?: string | null
          email: string
          fecha_creacion?: string | null
          id?: number
          nombre: string
          password_hash?: string | null
          rol_id?: number | null
        }
        Update: {
          activo?: number | null
          auth_user_id?: string | null
          email?: string
          fecha_creacion?: string | null
          id?: number
          nombre?: string
          password_hash?: string | null
          rol_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_rol: { Args: never; Returns: number }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
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
