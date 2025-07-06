import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Save, 
  CheckCircle, 
  XCircle,
  Settings,
  AlertCircle,
  Edit3,
  Phone,
  MapPin
} from 'lucide-react'
import { useDaycareConfig } from '../../hooks/useDaycareConfig'
import { useAuth } from '../../hooks/useAuth'

export function DaycareSettings() {
  const { user } = useAuth()
  const { config, loading: configLoading, updateConfig, daycareNombre } = useDaycareConfig()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    nombre_guarderia: '',
    telefono_guarderia: '',
    direccion_guarderia: ''
  })

  useEffect(() => {
    if (config) {
      setFormData({
        nombre_guarderia: config.nombre_guarderia,
        telefono_guarderia: config.telefono_guarderia || '',
        direccion_guarderia: config.direccion_guarderia || ''
      })
    }
  }, [config])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('DaycareSettings - Formulario enviado con datos:', formData)
    
    if (!formData.nombre_guarderia.trim()) {
      setMessage({ type: 'error', text: 'El nombre de la guardería es obligatorio' })
      return
    }

    if (formData.nombre_guarderia.trim().length < 3) {
      setMessage({ type: 'error', text: 'El nombre debe tener al menos 3 caracteres' })
      return
    }

    if (formData.nombre_guarderia.trim().length > 50) {
      setMessage({ type: 'error', text: 'El nombre no puede exceder 50 caracteres' })
      return
    }

    setLoading(true)
    setMessage(null)
    
    try {
      console.log('DaycareSettings - Llamando updateConfig con:', {
        nombre_guarderia: formData.nombre_guarderia.trim(),
        telefono_guarderia: formData.telefono_guarderia.trim() || undefined,
        direccion_guarderia: formData.direccion_guarderia.trim() || undefined
      })
      
      await updateConfig({
        nombre_guarderia: formData.nombre_guarderia.trim(),
        telefono_guarderia: formData.telefono_guarderia.trim() || undefined,
        direccion_guarderia: formData.direccion_guarderia.trim() || undefined
      })
      
      console.log('DaycareSettings - Configuración actualizada exitosamente')
      setMessage({ type: 'success', text: 'Configuración de la guardería actualizada correctamente' })
      
      // Recargar la página después de 2 segundos para mostrar los cambios
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } catch (error) {
      console.error('Error updating daycare config:', error)
      setMessage({ 
        type: 'error', 
        text: `Error al actualizar la configuración: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      })
    } finally {
      setLoading(false)
    }
  }

  // Solo administradores pueden acceder
  if (user?.rol !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Acceso Restringido
          </h3>
          <p className="text-gray-600">
            Solo los administradores pueden acceder a la configuración de la guardería
          </p>
        </div>
      </div>
    )
  }

  if (configLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Building2 className="w-7 h-7 text-mint-600" />
          Configuración de la Guardería
        </h1>
        <p className="text-gray-600">
          Personaliza la información básica de tu guardería
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

      <div className="max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              Información General
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Configura el nombre que aparecerá en todo el sistema
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Guardería
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.nombre_guarderia}
                  onChange={(e) => setFormData({ ...formData, nombre_guarderia: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-colors"
                  placeholder="Ingrese el nombre de la guardería"
                  required
                  disabled={loading}
                  minLength={3}
                  maxLength={50}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Este nombre aparecerá en el login y en el dashboard
                </p>
                <span className={`text-xs ${
                  formData.nombre_guarderia.length > 50 ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {formData.nombre_guarderia.length}/50
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono de la Guardería
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.telefono_guarderia}
                  onChange={(e) => setFormData({ ...formData, telefono_guarderia: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-colors"
                  placeholder="Número de teléfono principal"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Teléfono de contacto principal de la guardería
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección de la Guardería
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={formData.direccion_guarderia}
                  onChange={(e) => setFormData({ ...formData, direccion_guarderia: e.target.value })}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-colors resize-none"
                  placeholder="Dirección completa de la guardería"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Dirección física donde se encuentra ubicada la guardería
              </p>
            </div>

            {/* Vista previa */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Vista Previa:</h4>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-mint-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-mint-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {formData.nombre_guarderia.trim() || 'Guardería Infantil'}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Sistema de gestión y control de asistencia
                      </p>
                      {formData.telefono_guarderia && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {formData.telefono_guarderia}
                        </p>
                      )}
                      {formData.direccion_guarderia && (
                        <p className="text-sm text-gray-600 flex items-start gap-1 mt-1">
                          <MapPin className="w-3 h-3 mt-0.5" />
                          <span className="text-xs">{formData.direccion_guarderia}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Vista previa de la información de la guardería
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Información importante:</h4>
                  <ul className="text-sm text-blue-800 mt-1 space-y-1">
                    <li>• Los cambios se aplicarán inmediatamente en todo el sistema</li>
                    <li>• El nombre aparecerá en el login y dashboard</li>
                    <li>• El teléfono y dirección son opcionales pero recomendados</li>
                    <li>• Esta información puede ser útil para reportes y documentos</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.nombre_guarderia.trim() || formData.nombre_guarderia.length < 3}
              className="w-full bg-mint-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-mint-700 focus:ring-2 focus:ring-mint-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Cambios
                </>
              )}
            </button>
            
            {/* Debug info - solo en desarrollo */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
                <p><strong>Debug:</strong></p>
                <p>Config ID: {config?.id || 'No ID'}</p>
                <p>Loading: {loading.toString()}</p>
                <p>Form valid: {(formData.nombre_guarderia.trim().length >= 3).toString()}</p>
              </div>
            )}
          </form>
        </div>

        {/* Información del sistema */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              Información del Sistema
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Nombre actual:</span>
                <p className="font-medium text-gray-900">{daycareNombre}</p>
              </div>
              <div>
                <span className="text-gray-600">Teléfono:</span>
                <p className="font-medium text-gray-900">{config?.telefono_guarderia || 'No configurado'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Dirección:</span>
                <p className="font-medium text-gray-900">{config?.direccion_guarderia || 'No configurada'}</p>
              </div>
              <div>
                <span className="text-gray-600">Última actualización:</span>
                <p className="font-medium text-gray-900">
                  {config?.updated_at ? new Date(config.updated_at).toLocaleString('es-CO') : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}