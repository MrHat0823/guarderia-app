import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../lib/types'
import bcrypt from 'bcryptjs'


export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkStoredUser()
  }, [])

  const checkStoredUser = async () => {
    try {
      const storedUser = localStorage.getItem('daycare_user')
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        console.log('useAuth - Usuario cargado desde localStorage:', parsedUser)
        
        // Verificar que el usuario aún existe en la base de datos
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', parsedUser.id)
            .single()

          if (error || !data) {
            console.log('useAuth - Usuario no encontrado en BD, limpiando localStorage')
            localStorage.removeItem('daycare_user')
            setUser(null)
          } else {
            console.log('useAuth - Usuario validado en BD:', data)
            setUser(data)
          }
        } catch (dbError) {
          console.log('useAuth - Error al validar usuario en BD, usando datos locales:', dbError)
          // Si hay error de conexión, usar datos locales
          setUser(parsedUser)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error al cargar usuario almacenado:', error)
      localStorage.removeItem('daycare_user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (documento: string, password: string) => {
  if (!documento.trim() || !password.trim()) {
    throw new Error('Número de documento y contraseña requeridos')
  }

  if (password.length !== 6 || !/^\d+$/.test(password)) {
    throw new Error('La contraseña debe tener exactamente 6 dígitos')
  }

  setLoading(true)

  try {
    console.log('useAuth - Intentando login con:', { documento: documento.trim(), password })

    // Buscar el usuario solo por número de documento
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('numero_documento', documento.trim())
      .single()

    if (error || !data) {
      console.error('useAuth - Documento no encontrado:', error)
      throw new Error('Documento o contraseña incorrectos')
    }

    // Verificar la contraseña hasheada
    const passwordMatch = await bcrypt.compare(password, data.password)
    if (!passwordMatch) {
      throw new Error('Documento o contraseña incorrectos')
    }

    console.log('useAuth - Login exitoso:', data)

    // Guardar usuario en localStorage
    localStorage.setItem('daycare_user', JSON.stringify(data))
    setUser(data)
    setLoading(false)

    return data
  } catch (error) {
    console.error('Error en signIn:', error)
    setLoading(false)
    throw error
  }
}


  const signOut = async () => {
    console.log('useAuth - Iniciando logout')
    
    try {
      // Limpiar estado y localStorage
      setUser(null)
      localStorage.removeItem('daycare_user')
      
      console.log('useAuth - Logout completado')
    } catch (error) {
      console.error('Error en signOut:', error)
      // Forzar limpieza incluso si hay error
      setUser(null)
      localStorage.removeItem('daycare_user')
    }
  }

 const createUser = async (userData: {
  nombres: string
  apellidos: string
  password: string
  rol: 'admin' | 'profesor' | 'portero' | 'coordinador'
  tipo_documento: string
  numero_documento: string
  telefono?: string
  guarderia_id: string // ✅ NUEVO campo obligatorio
}) => {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    const { data, error } = await supabase
      .from('users')
      .insert({
        nombres: userData.nombres,
        apellidos: userData.apellidos,
        password: hashedPassword,
        rol: userData.rol,
        tipo_documento: userData.tipo_documento,
        numero_documento: userData.numero_documento,
        telefono: userData.telefono,
        guarderia_id: userData.guarderia_id // ✅ Inserción aquí
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al crear usuario:', error)
    throw error
  }
}



  return {
    user,
    loading,
    signIn,
    signOut,
    createUser
  }
}