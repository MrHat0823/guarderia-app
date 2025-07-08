import React, { useState, useEffect } from 'react'
import { 
  Search, 
  QrCode, 
  UserCheck, 
  Clock, 
  Baby, 
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Filter,
  X,
  ArrowRight,
  Zap
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Acudiente, Nino, AttendanceType } from '../../lib/types'
import { format } from 'date-fns'


interface AttendanceControlProps {
  initialDocumento?: string
  onRegistrationComplete?: () => void
}

export function AttendanceControl({ initialDocumento = '', onRegistrationComplete }: AttendanceControlProps) {
  const [documentoAcudiente, setDocumentoAcudiente] = useState('')
  const [acudiente, setAcudiente] = useState<Acudiente | null>(null)
  const [ninos, setNinos] = useState<Nino[]>([])
  const [filteredNinos, setFilteredNinos] = useState<Nino[]>([])
  const [selectedNino, setSelectedNino] = useState<string>('')
  const [tipo, setTipo] = useState<AttendanceType>('entrada')
  const [anotacion, setAnotacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Estados para búsqueda y filtros de niños
  const [childSearch, setChildSearch] = useState('')
  const [showChildrenModal, setShowChildrenModal] = useState(false)
  const [selectedChildData, setSelectedChildData] = useState<Nino | null>(null)
  
  const { user } = useAuth()

  // Initialize document state and trigger search when initialDocumento changes
  useEffect(() => {
    if (initialDocumento) {
      console.log('AttendanceControl - Documento inicial recibido:', initialDocumento)
      setDocumentoAcudiente(initialDocumento)
      searchAcudiente(initialDocumento)
    }
  }, [initialDocumento])


  // Filtrar niños cuando cambia la búsqueda
  useEffect(() => {
    if (!childSearch.trim()) {
      setFilteredNinos(ninos)
    } else {
      const searchLower = childSearch.toLowerCase()
      const filtered = ninos.filter(nino => {
        const fullName = `${nino.nombres} ${nino.apellidos}`.toLowerCase()
        const documento = nino.numero_documento.toLowerCase()
        const aula = nino.aula?.nombre_aula?.toLowerCase() || ''
        
        return fullName.includes(searchLower) || 
               documento.includes(searchLower) || 
               aula.includes(searchLower)
      })
      setFilteredNinos(filtered)
    }
  }, [childSearch, ninos])

  const searchAcudiente = async (documento: string) => {
  if (!documento.trim()) return

  console.log('AttendanceControl - Iniciando búsqueda para documento:', documento)
  setLoading(true)
  setMessage(null)

  try {

    const { data: acudienteData, error: acudienteError } = await supabase
      .from('acudientes')
      .select('*')
      .eq('numero_documento', documento)
      .eq('guarderia_id', user?.guarderia_id) // ← RESTRICCIÓN CLAVE
      .maybeSingle()


    if (!acudienteData || acudienteError) {
      console.warn('AttendanceControl - Acudiente no encontrado:', acudienteError)
      setMessage({ type: 'error', text: 'Acudiente no encontrado' })
      setAcudiente(null)
      setNinos([])
      setFilteredNinos([])
      return
    }

    setAcudiente(acudienteData)

    const { data: ninosData, error: ninosError } = await supabase
  .from('nino_acudiente')
  .select(`
    ninos (
      id,
      nombres,
      apellidos,
      tipo_documento,
      numero_documento,
      activo,
      guarderia_id,
      aulas (
        nombre_aula,
        nivel_educativo
      )
    )
  `)
  .eq('acudiente_id', acudienteData.id)
  // Aquí no se puede usar directamente ninos.guarderia_id en todas las versiones de Supabase.



    if (ninosError || !ninosData) {
      console.error('AttendanceControl - Error al cargar niños:', ninosError)
      setMessage({ type: 'error', text: 'Error al cargar los niños' })
      setNinos([])
      setFilteredNinos([])
      return
    }

    if (!user) {
      setMessage({ type: 'error', text: 'Usuario no autenticado' })
      return
    }

    const activeNinos: Nino[] = ninosData
      .flatMap(item => {
        const nino = item.ninos
        const aula = Array.isArray(nino.aulas) ? nino.aulas[0] : nino.aulas
        return {
          ...nino,
          aula
        }
      })
      .filter(nino => nino.activo && nino.guarderia_id === user.guarderia_id)

    if (activeNinos.length === 0) {
      setMessage({ type: 'error', text: 'No hay niños activos asociados a este acudiente' })
    } else {
      setMessage({ type: 'success', text: `Acudiente encontrado con ${activeNinos.length} niño(s) activo(s)` })
    }

    setNinos(activeNinos)
    setFilteredNinos(activeNinos)

    // Selección automática si hay solo uno
    if (activeNinos.length === 1) {
      setSelectedNino(activeNinos[0].id)
      setSelectedChildData(activeNinos[0])
    }

  } catch (error) {
    console.error('AttendanceControl - Error general en búsqueda:', error)
    setMessage({ type: 'error', text: 'Error al buscar el acudiente' })
    setAcudiente(null)
    setNinos([])
    setFilteredNinos([])
  } finally {
    setLoading(false)
  }
}


  const selectChild = (nino: Nino) => {
    setSelectedNino(nino.id)
    setSelectedChildData(nino)
    setShowChildrenModal(false)
    setChildSearch('')
  }

  const clearChildSelection = () => {
    setSelectedNino('')
    setSelectedChildData(null)
  }

  const registerAttendance = async () => {
    if (!acudiente || !selectedNino || !user?.id) {
      setMessage({ type: 'error', text: 'Faltan datos requeridos' })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('registros_asistencia')
        .insert({
          tipo,
          nino_id: selectedNino,
          acudiente_id: acudiente.id,
          usuario_registra_id: user.id,
          anotacion: anotacion.trim() || null
        })

      if (error) {
        setMessage({ type: 'error', text: 'Error al registrar la asistencia' })
        return
      }

      setMessage({ type: 'success', text: 'Asistencia registrada exitosamente' })
      
      // Limpiar todo inmediatamente
      setSelectedChildData(null)
      setSelectedNino('')
      setChildSearch('')
      setShowChildrenModal(false)
      setAnotacion('')
      setTipo('entrada')
      setDocumentoAcudiente('')
      setAcudiente(null)
      setNinos([])
      setFilteredNinos([])
      
      // Notificar al componente padre si existe
      if (onRegistrationComplete) {
        onRegistrationComplete()
      }
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al registrar la asistencia' })
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('AttendanceControl - Búsqueda manual iniciada para:', documentoAcudiente)
    searchAcudiente(documentoAcudiente)
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Control de Asistencia
        </h1>
        <p className="text-gray-600">
          Registro de entrada y salida de niños
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

      <div className="space-y-6">
        {/* Búsqueda de acudiente */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Buscar Acudiente
          </h3>
          <form onSubmit={handleDocumentSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de documento
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={documentoAcudiente}
                  onChange={(e) => setDocumentoAcudiente(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 text-lg"
                  placeholder="Ingrese el número de documento"
                  required
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-mint-600 text-white rounded-lg hover:bg-mint-700 disabled:opacity-50 flex items-center gap-2 font-medium"
                >
                  <Search className="w-5 h-5" />
                  Buscar
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Información del acudiente */}
        {acudiente && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-mint-600" />
              Acudiente Encontrado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Nombre:</span>
                <p className="text-gray-900">{acudiente.nombres} {acudiente.apellidos}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Documento:</span>
                <p className="text-gray-900">{acudiente.tipo_documento} {acudiente.numero_documento}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Teléfono:</span>
                <p className="text-gray-900">{acudiente.telefono1 || 'No disponible'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Selección de niño mejorada */}
        {ninos.length > 0 && !selectedChildData && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Baby className="w-5 h-5 text-blue-600" />
                Seleccionar Niño ({ninos.length} disponible{ninos.length !== 1 ? 's' : ''})
              </h3>
              {ninos.length > 1 && (
                <button
                  onClick={() => setShowChildrenModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
                >
                  <Search className="w-4 h-4" />
                  Buscar niño
                </button>
              )}
            </div>

            {/* Lista compacta para pocos niños */}
            <div className="space-y-2">
              {ninos.slice(0, 3).map((nino) => (
                <button
                  key={nino.id}
                  onClick={() => selectChild(nino)}
                  className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-left transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                    <Baby className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {nino.nombres} {nino.apellidos}
                    </p>
                    <p className="text-sm text-gray-600">
                      {nino.aula?.nombre_aula} - {nino.aula?.nivel_educativo}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
              {ninos.length > 3 && (
                <button
                  onClick={() => setShowChildrenModal(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  Ver {ninos.length - 3} niño{ninos.length - 3 !== 1 ? 's' : ''} más...
                </button>
              )}
            </div>
          </div>
        )}

        {/* REGISTRO DIRECTO - SIN MODAL */}
        {selectedChildData && acudiente && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-mint-600" />
                Registro de Asistencia
              </h3>
              <button
                onClick={clearChildSelection}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Información del niño */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Baby className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">
                    {selectedChildData.nombres} {selectedChildData.apellidos}
                  </h4>
                  <p className="text-blue-700 text-sm">
                    {selectedChildData.aula?.nombre_aula} - {selectedChildData.aula?.nivel_educativo}
                  </p>
                  <p className="text-blue-600 text-sm">
                    Acudiente: {acudiente.nombres} {acudiente.apellidos}
                  </p>
                </div>
              </div>
            </div>

            {/* Selección de tipo - Más grande */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de registro
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipo('entrada')}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                    tipo === 'entrada'
                      ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                      : 'border-gray-300 bg-white hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      tipo === 'entrada' ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <span className={`font-bold ${
                      tipo === 'entrada' ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      Entrada
                    </span>
                  </div>
                  {tipo === 'entrada' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('salida')}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                    tipo === 'salida'
                      ? 'border-red-500 bg-red-50 shadow-lg scale-105'
                      : 'border-gray-300 bg-white hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      tipo === 'salida' ? 'bg-red-500' : 'bg-gray-400'
                    }`}>
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <span className={`font-bold ${
                      tipo === 'salida' ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      Salida
                    </span>
                  </div>
                  {tipo === 'salida' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Anotación */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anotación (opcional)
              </label>
              <textarea
                value={anotacion}
                onChange={(e) => setAnotacion(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 resize-none"
                placeholder="Observaciones o comentarios adicionales..."
              />
            </div>

            {/* Información de fecha/hora */}
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <Clock className="w-4 h-4" />
              <span>Fecha y hora: {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
            </div>

            {/* Botón de registro */}
            <button
              onClick={registerAttendance}
              disabled={loading}
              className="w-full bg-mint-600 text-white py-4 px-6 rounded-lg font-bold hover:bg-mint-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg text-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" />
                  Registrar {tipo}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Modal de búsqueda de niños */}
      {showChildrenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Seleccionar Niño
                </h2>
                <button
                  onClick={() => {
                    setShowChildrenModal(false)
                    setChildSearch('')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  value={childSearch}
                  onChange={(e) => setChildSearch(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Buscar por nombre, documento o aula..."
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              
              <p className="text-sm text-gray-600 mt-2">
                {filteredNinos.length} de {ninos.length} niños
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-3">
                {filteredNinos.map((nino) => (
                  <button
                    key={nino.id}
                    onClick={() => selectChild(nino)}
                    className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-left transition-all group"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                      <Baby className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {nino.nombres} {nino.apellidos}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Doc: {nino.numero_documento}
                      </p>
                      <p className="text-sm text-blue-600">
                        {nino.aula?.nombre_aula} - {nino.aula?.nivel_educativo}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
                
                {filteredNinos.length === 0 && (
                  <div className="text-center py-8">
                    <Baby className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron niños</p>
                    <p className="text-gray-400 text-sm">Intenta con otro término de búsqueda</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}