// src/lib/types/index.ts

export type UserRole = 'coordinador' | 'admin' | 'profesor' | 'portero'
export type AttendanceType = 'entrada' | 'salida'
export type TipoParentesco =
  | 'Madre'
  | 'Padre'
  | 'Hermano'
  | 'Hermana'
  | 'Tío'
  | 'Tía'
  | 'Abuelo'
  | 'Abuela'
  | 'Tutor Legal'
  | 'Otro'

export interface User {
  id: string
  nombres: string
  apellidos: string
  rol: UserRole
  tipo_documento: string
  numero_documento: string
  telefono?: string
  password?: string
  guarderia_id: string | null
  guarderia?: Guarderia
  created_at: string
  updated_at: string
}

export interface Guarderia {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
  created_at: string
}

export interface Aula {
  id: string
  nombre_aula: string
  nivel_educativo: string
  numero_aula: string
  capacidad: number
  profesor_asignado_id?: string
  guarderia_id?: string
  created_at: string
  profesor?: User
  guarderia?: Guarderia
}

export interface Nino {
  id: string
  nombres: string
  apellidos: string
  tipo_documento: string
  numero_documento: string
  aula_id?: string
  activo: boolean
  guarderia_id: string
  created_at: string
  aula?: Aula
}

export interface Acudiente {
  id: string
  nombres: string
  apellidos: string
  tipo_documento: string
  numero_documento: string
  telefono1?: string
  telefono2?: string
  email?: string
  direccion?: string
  created_at: string
  guarderia_id: string
  ninos?: Nino[]
}

export interface NinoAcudiente {
  id: string
  nino_id: string
  acudiente_id: string
  parentesco: TipoParentesco
  created_at: string
  nino?: Nino
  acudiente?: Acudiente
}

/** ✅ NUEVO: Representa a los terceros */
export interface Tercero {
  id: string
  nombres: string
  apellidos: string
  tipo_documento: string
  numero_documento: string
  telefono?: string
  email?: string
  direccion?: string
  parentesco?: string
  foto_id_frente?: string
  foto_id_reverso?: string
  guarderia_id: string
  aula_id?: string
  created_at: string
}

export interface AttendanceRecord {
  id: string
  fecha: string
  hora: string
  tipo: AttendanceType
  nino_id: string
  acudiente_id?: string
  tercero_id?: string
  usuario_registra_id: string
  guarderia_id?: string
  aula_id?: string
  anotacion?: string
  // Campos de observaciones para entrada
  fiebre?: boolean
  mordidas?: boolean
  aruñado?: boolean
  golpes?: boolean
  otro?: boolean
  otro_texto?: string
  // Campos de observaciones para salida
  fiebre_salida?: boolean
  mordidas_salida?: boolean
  aruñado_salida?: boolean
  golpes_salida?: boolean
  created_at: string
  nino?: Nino
  acudiente?: Acudiente
  tercero?: Tercero
  usuario_registra?: User
}

export interface AttendanceStats {
  totalNinos: number
  ninosActivos: number
  asistenciaHoy: number
  totalEntradas: number
  totalSalidas: number
  inasistencia: number
}

export interface DaycareConfig {
  id: string
  nombre_guarderia: string
  telefono_guarderia?: string
  direccion_guarderia?: string
  created_at: string
  updated_at: string
}

/** Tipo especial para respuesta de Supabase */
export interface NinoConAulaNombre extends Nino {
  aulas?: {
    nombre_aula: string
  }
  nombreAula?: string
}
