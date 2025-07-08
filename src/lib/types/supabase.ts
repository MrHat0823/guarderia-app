export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nombres: string
          apellidos: string
          rol: 'admin' | 'profesor' | 'portero'
          tipo_documento: string
          numero_documento: string
          telefono: string | null
          guarderia_id: string // 👈 Añade este campo
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nombres: string
          apellidos: string
          rol?: 'admin' | 'profesor' | 'portero'
          tipo_documento: string
          numero_documento: string
          telefono?: string | null
          guarderia_id: string // 👈 Añade este campo
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombres?: string
          apellidos?: string
          rol?: 'admin' | 'profesor' | 'portero'
          tipo_documento?: string
          numero_documento?: string
          telefono?: string | null
           guarderia_id?: string // 👈 Añade este campo
          created_at?: string
          updated_at?: string
        }
      }
      aulas: {
        Row: {
          id: string
          nombre_aula: string
          nivel_educativo: string
          numero_aula: string
          capacidad: number
          profesor_asignado_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre_aula: string
          nivel_educativo: string
          numero_aula: string
          capacidad: number
          profesor_asignado_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nombre_aula?: string
          nivel_educativo?: string
          numero_aula?: string
          capacidad?: number
          profesor_asignado_id?: string | null
          created_at?: string
        }
      }
      ninos: {
        Row: {
          id: string
          nombres: string
          apellidos: string
          tipo_documento: string
          numero_documento: string
          aula_id: string | null
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nombres: string
          apellidos: string
          tipo_documento: string
          numero_documento: string
          aula_id?: string | null
          activo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nombres?: string
          apellidos?: string
          tipo_documento?: string
          numero_documento?: string
          aula_id?: string | null
          activo?: boolean
          created_at?: string
        }
      }
      acudientes: {
        Row: {
          id: string
          nombres: string
          apellidos: string
          tipo_documento: string
          numero_documento: string
          telefono1: string | null
          telefono2: string | null
          email: string | null
          direccion: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombres: string
          apellidos: string
          tipo_documento: string
          numero_documento: string
          telefono1?: string | null
          telefono2?: string | null
          email?: string | null
          direccion?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nombres?: string
          apellidos?: string
          tipo_documento?: string
          numero_documento?: string
          telefono1?: string | null
          telefono2?: string | null
          email?: string | null
          direccion?: string | null
          created_at?: string
        }
      }
      nino_acudiente: {
        Row: {
          id: string
          nino_id: string
          acudiente_id: string
          created_at: string
        }
        Insert: {
          id?: string
          nino_id: string
          acudiente_id: string
          created_at?: string
        }
        Update: {
          id?: string
          nino_id?: string
          acudiente_id?: string
          created_at?: string
        }
      }
      registros_asistencia: {
        Row: {
          id: string
          fecha: string
          hora: string
          tipo: 'entrada' | 'salida'
          nino_id: string
          acudiente_id: string
          usuario_registra_id: string
          anotacion: string | null
          created_at: string
        }
        Insert: {
          id?: string
          fecha?: string
          hora?: string
          tipo: 'entrada' | 'salida'
          nino_id: string
          acudiente_id: string
          usuario_registra_id: string
          anotacion?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          fecha?: string
          hora?: string
          tipo?: 'entrada' | 'salida'
          nino_id?: string
          acudiente_id?: string
          usuario_registra_id?: string
          anotacion?: string | null
          created_at?: string
        }
      }
    }
  }
}