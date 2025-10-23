// project\src\hooks\useGuarderias.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { Guarderia } from '../lib/types'

export function useGuarderias() {
  const [guarderias, setGuarderias] = useState<Guarderia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
  if (user) {
    fetchGuarderias()
  }
}, [user])






  const fetchGuarderias = async () => {
    setLoading(true)
    setError(null)

    try {
      // ✅ Incluye el campo created_at
      let query = supabase
        .from('guarderias')
        .select('id, nombre, direccion, telefono, created_at')

      if (user?.rol === 'admin' && user.guarderia_id) {
        query = query.eq('id', user.guarderia_id)
      } else if (user?.rol === 'coordinador') {
        // Coordinadores ven todas, no se aplica filtro
      }


      const { data, error } = await query.order('nombre', { ascending: true })

          if (error) {
            console.error('Error al obtener guarderías:', error)
            setError('No se pudieron cargar las guarderías')
            setGuarderias([])
          } else {
            setGuarderias(data || [])
          }


    } catch (e) {
      console.error('Error general:', e)
      setError('Error inesperado al cargar guarderías')
    }

    setLoading(false)
  }

  return {
    guarderias,
    loading,
    error,
    refetch: fetchGuarderias
  }
}
