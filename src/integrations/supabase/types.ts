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
      configuracion: {
        Row: {
          direccion: string | null
          id: number
          logo_url: string | null
          municipalidad: string
          updated_at: string
        }
        Insert: {
          direccion?: string | null
          id?: number
          logo_url?: string | null
          municipalidad?: string
          updated_at?: string
        }
        Update: {
          direccion?: string | null
          id?: number
          logo_url?: string | null
          municipalidad?: string
          updated_at?: string
        }
        Relationships: []
      }
      expedientes: {
        Row: {
          anoexp: number
          apeynom: string
          codexp: string
          codigo: number
          comentario: string | null
          created_at: string
          created_by: string | null
          estado: Database["public"]["Enums"]["estado_expediente"]
          exp_anexados: string[] | null
          fechent: string
          infraccion: string | null
          iniciado_nro: string | null
          iniciado_por: string | null
          letraexp: string
          nro_acta: string | null
          nro_juzgado: string | null
          nro_objeto: string | null
          nroexp: number
          oficina_inicio_id: string | null
          organismo: string | null
          tema: string
          tipo_objeto: string | null
          ultima_nota: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          anoexp: number
          apeynom: string
          codexp: string
          codigo: number
          comentario?: string | null
          created_at?: string
          created_by?: string | null
          estado?: Database["public"]["Enums"]["estado_expediente"]
          exp_anexados?: string[] | null
          fechent: string
          infraccion?: string | null
          iniciado_nro?: string | null
          iniciado_por?: string | null
          letraexp: string
          nro_acta?: string | null
          nro_juzgado?: string | null
          nro_objeto?: string | null
          nroexp: number
          oficina_inicio_id?: string | null
          organismo?: string | null
          tema: string
          tipo_objeto?: string | null
          ultima_nota?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          anoexp?: number
          apeynom?: string
          codexp?: string
          codigo?: number
          comentario?: string | null
          created_at?: string
          created_by?: string | null
          estado?: Database["public"]["Enums"]["estado_expediente"]
          exp_anexados?: string[] | null
          fechent?: string
          infraccion?: string | null
          iniciado_nro?: string | null
          iniciado_por?: string | null
          letraexp?: string
          nro_acta?: string | null
          nro_juzgado?: string | null
          nro_objeto?: string | null
          nroexp?: number
          oficina_inicio_id?: string | null
          organismo?: string | null
          tema?: string
          tipo_objeto?: string | null
          ultima_nota?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expedientes_oficina_inicio_id_fkey"
            columns: ["oficina_inicio_id"]
            isOneToOne: false
            referencedRelation: "oficinas"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos: {
        Row: {
          codexp: string
          created_at: string
          created_by: string | null
          estado_resultante: Database["public"]["Enums"]["estado_expediente"]
          fechaini: string
          fecsarea: string | null
          id: string
          nromov: number
          observac: string | null
          oficina_id: string
          tipo_movimiento: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Insert: {
          codexp: string
          created_at?: string
          created_by?: string | null
          estado_resultante: Database["public"]["Enums"]["estado_expediente"]
          fechaini?: string
          fecsarea?: string | null
          id?: string
          nromov: number
          observac?: string | null
          oficina_id: string
          tipo_movimiento?: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Update: {
          codexp?: string
          created_at?: string
          created_by?: string | null
          estado_resultante?: Database["public"]["Enums"]["estado_expediente"]
          fechaini?: string
          fecsarea?: string | null
          id?: string
          nromov?: number
          observac?: string | null
          oficina_id?: string
          tipo_movimiento?: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_codexp_fkey"
            columns: ["codexp"]
            isOneToOne: false
            referencedRelation: "expedientes"
            referencedColumns: ["codexp"]
          },
          {
            foreignKeyName: "movimientos_oficina_id_fkey"
            columns: ["oficina_id"]
            isOneToOne: false
            referencedRelation: "oficinas"
            referencedColumns: ["id"]
          },
        ]
      }
      oficinas: {
        Row: {
          activa: boolean
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      estado_expediente: "Pendiente" | "Demorado" | "Archivado" | "Finalizado"
      tipo_movimiento: "Normal" | "Reapertura"
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
      estado_expediente: ["Pendiente", "Demorado", "Archivado", "Finalizado"],
      tipo_movimiento: ["Normal", "Reapertura"],
    },
  },
} as const
