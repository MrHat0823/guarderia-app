import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { DaycareConfig } from '../lib/types'
import { useAuth } from './useAuth'

export function useDaycareConfig() {
  const { user } = useAuth()
  const [config, setConfig] = useState<DaycareConfig | null>(null)
  const [loading, setLoading] = useState(true)

   const daycareNombre =
    user?.rol === 'coordinador'
      ? 'SISTEMA DE GESTIÓN DE GUARDERÍAS'
      : user?.guarderia?.nombre || config?.nombre_guarderia || 'Guardería Infantil'

  useEffect(() => {
    loadConfig()
    
    // Suscribirse a cambios en tiempo real
    let subscription: any = null
    
    try {
      subscription = supabase
        .channel('configuracion_guarderia_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'configuracion_guarderia'
          },
          () => {
            loadConfig()
          }
        )
        .subscribe()
    } catch (error) {
      // Silently fail
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (error) {
          // Silently fail
        }
      }
    }
  }, [])

  const loadConfig = async () => {
    try {
      const { data: existingConfigs, error: checkError } = await supabase
        .from('configuracion_guarderia')
        .select('*')
        .order('created_at', { ascending: true })

      if (checkError) {
        throw checkError
      }

      if (!existingConfigs || existingConfigs.length === 0) {
        await createDefaultConfig()
      } else {
        setConfig(existingConfigs[0])
      }
    } catch (error) {
      await createDefaultConfig()
    } finally {
      setLoading(false)
    }
  }

  const createDefaultConfig = async () => {
    try {
      const defaultConfig = {
        nombre_guarderia: 'Guardería Infantil',
        telefono_guarderia: null,
        direccion_guarderia: null
      }
      
      const { data, error } = await supabase
        .from('configuracion_guarderia')
        .insert(defaultConfig)
        .select()
        .single()
      
      if (error) {
        setConfig({
          id: 'temp-' + Date.now(),
          nombre_guarderia: 'Guardería Infantil',
          telefono_guarderia: undefined,
          direccion_guarderia: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      } else {
        setConfig(data)
      }
    } catch (error) {
      setConfig({
        id: 'temp-' + Date.now(),
        nombre_guarderia: 'Guardería Infantil',
        telefono_guarderia: undefined,
        direccion_guarderia: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }

  const updateConfig = async (configData: {
    nombre_guarderia: string
    telefono_guarderia?: string
    direccion_guarderia?: string
  }) => {
    if (!config?.id || config.id.startsWith('temp-')) {
      try {
        const { data: existingConfigs, error: checkError } = await supabase
          .from('configuracion_guarderia')
          .select('*')
          .limit(1)

        if (checkError) {
          throw checkError
        }

        if (existingConfigs && existingConfigs.length > 0) {
          const existingConfig = existingConfigs[0]
          
          const { data, error } = await supabase
            .from('configuracion_guarderia')
            .update({
              nombre_guarderia: configData.nombre_guarderia.trim(),
              telefono_guarderia: configData.telefono_guarderia?.trim() || null,
              direccion_guarderia: configData.direccion_guarderia?.trim() || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingConfig.id)
            .select()
            .single()
          
          if (error) {
            throw error
          }
          
          setConfig(data)
          return
        }

        const { data, error } = await supabase
          .from('configuracion_guarderia')
          .insert({
            nombre_guarderia: configData.nombre_guarderia.trim(),
            telefono_guarderia: configData.telefono_guarderia?.trim() || null,
            direccion_guarderia: configData.direccion_guarderia?.trim() || null
          })
          .select()
          .single()
        
        if (error) {
          throw error
        }
        
        setConfig(data)
        return
      } catch (error) {
        throw error
      }
    }

    try {
      const { data, error } = await supabase
        .from('configuracion_guarderia')
        .update({
          nombre_guarderia: configData.nombre_guarderia.trim(),
          telefono_guarderia: configData.telefono_guarderia?.trim() || null,
          direccion_guarderia: configData.direccion_guarderia?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      setConfig(data)
    } catch (error) {
      throw error
    }
  }

  return {
    config,
    loading,
    updateConfig,
    daycareNombre
  }
}