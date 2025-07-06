import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { DaycareConfig } from '../lib/types'

export function useDaycareConfig() {
  const [config, setConfig] = useState<DaycareConfig | null>(null)
  const [loading, setLoading] = useState(true)

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
            console.log('useDaycareConfig - Cambio detectado, recargando configuración')
            loadConfig()
          }
        )
        .subscribe()
    } catch (error) {
      console.log('No se pudo suscribir a cambios en tiempo real:', error)
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.log('Error al desuscribirse:', error)
        }
      }
    }
  }, [])

  const loadConfig = async () => {
    try {
      console.log('useDaycareConfig - Iniciando carga de configuración...')
      
      // Primero verificar si existe alguna configuración
      const { data: existingConfigs, error: checkError } = await supabase
        .from('configuracion_guarderia')
        .select('*')
        .order('created_at', { ascending: true })

      if (checkError) {
        console.error('useDaycareConfig - Error verificando configuración:', checkError)
        throw checkError
      }

      console.log('useDaycareConfig - Configuraciones encontradas:', existingConfigs?.length || 0)

      if (!existingConfigs || existingConfigs.length === 0) {
        console.log('useDaycareConfig - No hay configuración, creando por defecto...')
        await createDefaultConfig()
      } else {
        console.log('useDaycareConfig - Configuración cargada:', existingConfigs[0])
        setConfig(existingConfigs[0])
      }
    } catch (error) {
      console.error('useDaycareConfig - Error en loadConfig:', error)
      await createDefaultConfig()
    } finally {
      setLoading(false)
    }
  }

  const createDefaultConfig = async () => {
    try {
      console.log('useDaycareConfig - Creando configuración por defecto...')
      
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
        console.error('useDaycareConfig - Error creando configuración por defecto:', error)
        // Fallback a configuración local
        setConfig({
  id: 'temp-' + Date.now(),
  nombre_guarderia: 'Guardería Infantil',
  telefono_guarderia: undefined,
  direccion_guarderia: undefined,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

      } else {
        console.log('useDaycareConfig - Configuración por defecto creada exitosamente:', data)
        setConfig(data)
      }
    } catch (error) {
      console.error('useDaycareConfig - Error en createDefaultConfig:', error)
      // Fallback final
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
    console.log('useDaycareConfig - Iniciando actualización con datos:', configData)
    
    if (!config?.id || config.id.startsWith('temp-')) {

      console.log('➡️ ID actual antes del update/insert:', config?.id)
      console.log('useDaycareConfig - No hay configuración válida, creando nueva...')
      
      try {
        // Primero verificar si ya existe alguna configuración
        
        const { data: existingConfigs, error: checkError } = await supabase
          .from('configuracion_guarderia')
          .select('*')
          .limit(1)

        if (checkError) {
          console.error('useDaycareConfig - Error verificando configuraciones existentes:', checkError)
        }

        if (existingConfigs && existingConfigs.length > 0) {
          // Ya existe una configuración, actualizarla
          console.log('useDaycareConfig - Configuración existente encontrada, actualizando...')
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
            console.error('useDaycareConfig - Error actualizando configuración existente:', error)
            throw error
          }
          
          console.log('useDaycareConfig - Configuración existente actualizada:', data)
          setConfig(data)
          return
        }

        // No existe configuración, crear nueva
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
          console.error('useDaycareConfig - Error creando nueva configuración:', error)
          throw error
        }
        
        console.log('useDaycareConfig - Nueva configuración creada exitosamente:', data)
        setConfig(data)
        return
      } catch (error) {
        console.error('useDaycareConfig - Error en inserción/actualización de configuración:', error)
        throw error
      }
    }

    // Actualizar configuración existente válida
    try {
      console.log('useDaycareConfig - Actualizando configuración existente con ID:', config.id)
      
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
        console.error('useDaycareConfig - Error actualizando configuración:', error)
        throw error
      }

      console.log('useDaycareConfig - Configuración actualizada exitosamente:', data)
      setConfig(data)

    } catch (error) {
      console.error('useDaycareConfig - Error en updateConfig:', error)
      throw error
    }
  }

  return {
    config,
    loading,
    updateConfig,
    daycareNombre: config?.nombre_guarderia || 'Guardería Infantil'
  }
}