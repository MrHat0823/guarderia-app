import React, { useState, useEffect } from 'react'
import bcrypt from 'bcryptjs'

import { 
  User, 
  Lock, 
  Save, 
  Eye, 
  EyeOff, 
  Phone, 
  CreditCard, 
  CheckCircle, 
  XCircle,
  Settings,
  Shield,
  AlertCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { User as UserType } from '../../lib/types'

export function UserSettings() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'personal'>('personal')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Form data for personal info
  const [personalData, setPersonalData] = useState({
    nombres: '',
    apellidos: '',
    telefono: ''
  })

  // Form data for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (user) {
      setPersonalData({
        nombres: user.nombres || '',
        apellidos: user.apellidos || '',
        telefono: user.telefono || ''
      })
    }
  }, [user])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handlePersonalInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Error: Usuario no identificado' })
      return
    }

    if (!personalData.nombres.trim() || !personalData.apellidos.trim()) {
      setMessage({ type: 'error', text: 'Nombres y apellidos son obligatorios' })
      return
    }

    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          nombres: personalData.nombres.trim(),
          apellidos: personalData.apellidos.trim(),
          telefono: personalData.telefono.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating user:', error)
        setMessage({ type: 'error', text: 'Error al actualizar la información personal' })
        return
      }

      // Update user in localStorage
      const updatedUser: UserType = {
        ...user,
        nombres: personalData.nombres.trim(),
        apellidos: personalData.apellidos.trim(),
        telefono: personalData.telefono.trim() || undefined,
        updated_at: new Date().toISOString()
      }
      
      localStorage.setItem('daycare_user', JSON.stringify(updatedUser))
      
      setMessage({ type: 'success', text: 'Información personal actualizada correctamente' })
      
      // Force page reload to update user data everywhere
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (error) {
      console.error('Error updating personal info:', error)
      setMessage({ type: 'error', text: 'Error al actualizar la información personal' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!user?.id) {
    setMessage({ type: 'error', text: 'Error: Usuario no identificado' })
    return
  }

  const { currentPassword, newPassword, confirmPassword } = passwordData

  // Validaciones
  if (!currentPassword.trim()) {
    setMessage({ type: 'error', text: 'Debe ingresar su contraseña actual' })
    return
  }

  if (!newPassword.trim()) {
    setMessage({ type: 'error', text: 'Debe ingresar una nueva contraseña' })
    return
  }

  if (newPassword.length !== 6 || !/^\d+$/.test(newPassword)) {
    setMessage({ type: 'error', text: 'La nueva contraseña debe tener exactamente 6 dígitos' })
    return
  }

  if (newPassword !== confirmPassword) {
    setMessage({ type: 'error', text: 'Las contraseñas no coinciden' })
    return
  }

  setLoading(true)

  try {
    // 1. Obtener el hash actual desde Supabase
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('password')
      .eq('id', user.id)
      .single()

    if (fetchError || !userData?.password) {
      setMessage({ type: 'error', text: 'No se pudo validar la contraseña actual' })
      return
    }

    // 2. Comparar con la contraseña actual
    const match = await bcrypt.compare(currentPassword.trim(), userData.password)
    if (!match) {
      setMessage({ type: 'error', text: 'La contraseña actual es incorrecta' })
      return
    }

    // 3. Verificar que no sea la misma contraseña
    const isSame = await bcrypt.compare(newPassword.trim(), userData.password)
    if (isSame) {
      setMessage({ type: 'error', text: 'La nueva contraseña debe ser diferente a la actual' })
      return
    }

    // 4. Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10)

    // 5. Guardar en Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      setMessage({ type: 'error', text: 'Error al cambiar la contraseña' })
      return
    }

    setMessage({ type: 'success', text: 'Contraseña cambiada correctamente. Será redirigido al login.' })

    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    setTimeout(async () => {
      await signOut()
      window.location.reload()
    }, 2000)

  } catch (error) {
    console.error('Error cambiando contraseña:', error)
    setMessage({ type: 'error', text: 'Error inesperado al cambiar la contraseña' })
  } finally {
    setLoading(false)
  }
}


  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">No se pudo cargar la información del usuario</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Settings className="w-7 h-7 text-mint-600" />
          Configuración
        </h1>
        <p className="text-gray-600">
          Actualiza tu información personal y cambia tu contraseña
        </p>

      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className={`text-sm font-medium ${
            message.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {message.text}
          </span>
        </div>
      )}

      {/* Mostrar contenido según la pestaña activa */}
     
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Information Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Información Personal
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Actualiza tu información básica
            </p>
          </div>
          
          <form onSubmit={handlePersonalInfoUpdate} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombres
              </label>
              <input
                type="text"
                value={personalData.nombres}
                onChange={(e) => setPersonalData({ ...personalData, nombres: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-colors"
                placeholder="Ingrese sus nombres"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellidos
              </label>
              <input
                type="text"
                value={personalData.apellidos}
                onChange={(e) => setPersonalData({ ...personalData, apellidos: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-colors"
                placeholder="Ingrese sus apellidos"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={personalData.telefono}
                  onChange={(e) => setPersonalData({ ...personalData, telefono: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-colors"
                  placeholder="Número de teléfono (opcional)"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Read-only fields */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{user.tipo_documento}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Documento
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{user.numero_documento}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol en el Sistema
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700 capitalize">{user.rol}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mint-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-mint-700 focus:ring-2 focus:ring-mint-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Actualizando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </form>
        </div>

        {/* Password Change Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-600" />
              Cambiar Contraseña
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Actualiza tu contraseña de acceso al sistema
            </p>
          </div>
          
          <form onSubmit={handlePasswordChange} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña Actual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-colors"
                  placeholder="Ingrese su contraseña actual"
                  required
                  disabled={loading}
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña (6 dígitos)
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-colors"
                  placeholder="••••••"
                  required
                  disabled={loading}
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                La contraseña debe contener exactamente 6 dígitos numéricos
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-colors"
                  placeholder="••••••"
                  required
                  disabled={loading}
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Requisitos de la contraseña:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Debe contener exactamente 6 dígitos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Solo números (0-9)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Debe ser diferente a la contraseña actual
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Cambiando...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Cambiar Contraseña
                </>
              )}
            </button>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">Importante:</h4>
                  <p className="text-sm text-yellow-800 mt-1">
                    Después de cambiar tu contraseña, serás desconectado automáticamente y deberás iniciar sesión nuevamente con la nueva contraseña.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      
    </div>
  )
}