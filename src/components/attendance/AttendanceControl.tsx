// project/src/components/attendance/AttendanceControl.tsx
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
  ArrowRight,
  Zap,
  TrendingUp,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Acudiente, Nino, AttendanceType } from '../../lib/types'
import { format, toZonedTime } from 'date-fns-tz'
import { toast } from 'sonner'


interface AttendanceControlProps {
  initialDocumento?: string
  onRegistrationComplete?: () => void
}

const getFechaHoyColombia = () => {
  const zona = 'America/Bogota'
  const ahora = new Date()
  return format(toZonedTime(ahora, zona), 'yyyy-MM-dd')
}

export function AttendanceControl({ initialDocumento = '', onRegistrationComplete }: AttendanceControlProps) {
  const { user } = useAuth()

  const [documentoAcudiente, setDocumentoAcudiente] = useState(initialDocumento)
  const [acudiente, setAcudiente] = useState<Acudiente | null>(null)
  const [ninos, setNinos] = useState<Nino[]>([])
  const [filteredNinos, setFilteredNinos] = useState<Nino[]>([])
  const [selectedNino, setSelectedNino] = useState<string>('')
  const [selectedChildData, setSelectedChildData] = useState<Nino | null>(null)
  const [tipo, setTipo] = useState<AttendanceType>('entrada')
  const [anotacion, setAnotacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasEntradaToday, setHasEntradaToday] = useState(false)
  const [hasSalidaToday, setHasSalidaToday] = useState(false)
  const [canRegisterSalida, setCanRegisterSalida] = useState(false)
  const [showChildrenModal, setShowChildrenModal] = useState(false)
  const [childSearch, setChildSearch] = useState('')
  const [observaciones, setObservaciones] = useState({
    fiebre: false,
    mordidas: false,
    aruñado: false,
    golpes: false,
    otro: false,
    otro_texto: '',
    fiebre_salida: false,
    mordidas_salida: false,
    aruñado_salida: false,
    golpes_salida: false,
  })

  useEffect(() => {
    if (initialDocumento) {
      searchAcudiente(initialDocumento)
    }
  }, [initialDocumento])

  useEffect(() => {
    if (childSearch.trim()) {
      const searchLower = childSearch.toLowerCase()
      const filtered = ninos.filter((nino) => {
        const fullName = `${nino.nombres} ${nino.apellidos}`.toLowerCase()
        const documento = nino.numero_documento?.toLowerCase() || ''
        const aula = nino.aula?.nombre_aula?.toLowerCase() || ''
        return fullName.includes(searchLower) || documento.includes(searchLower) || aula.includes(searchLower)
      })
      setFilteredNinos(filtered)
    } else {
      setFilteredNinos(ninos)
    }
  }, [childSearch, ninos])

  const searchAcudiente = async (documento: string) => {
    if (!documento.trim() || !user) return
    setLoading(true)

    try {
      const { data: acudienteData, error: acudienteError } = await supabase
        .from('acudientes')
        .select('*')
        .eq('numero_documento', documento)
        .eq('guarderia_id', user.guarderia_id)
        .maybeSingle()

      if (!acudienteData || acudienteError) {
        toast.error('Acudiente no encontrado')
        setAcudiente(null)
        setNinos([])
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
            aula_id,
            aulas (
              id,
              nombre_aula,
              nivel_educativo
            )
          )
        `)
        .eq('acudiente_id', acudienteData.id)

      if (ninosError || !ninosData) {
        toast.error('Error al cargar los niños')
        return
      }

      const activeNinos: Nino[] = ninosData
        .map((item) => {
          const nino = item.ninos
          return {
            ...nino,
            aula: Array.isArray(nino.aulas) ? nino.aulas[0] : nino.aulas,
          }
        })
        .filter((nino) => nino.activo && nino.guarderia_id === user.guarderia_id)

      setNinos(activeNinos)
      setFilteredNinos(activeNinos)

      if (activeNinos.length === 1) {
        const nino = activeNinos[0]
        setSelectedNino(nino.id)
        setSelectedChildData(nino)
        checkTodayAttendanceStatus(nino.id)
      }

      toast.success(`Acudiente encontrado con ${activeNinos.length} niño(s) activo(s)`)
    } catch (error) {
      console.error('Error general en búsqueda:', error)
      toast.error('Error al buscar el acudiente')
    } finally {
      setLoading(false)
    }
  }

  const checkTodayAttendanceStatus = async (ninoId: string) => {
    const today = getFechaHoyColombia()

    const { data, error } = await supabase
      .from('registros_asistencia')
      .select('tipo')
      .eq('nino_id', ninoId)
      .eq('fecha', today)

    if (error) {
      setHasEntradaToday(false)
      setHasSalidaToday(false)
      setCanRegisterSalida(false)
      return
    }

    const hasEntrada = data.some((r) => r.tipo === 'entrada')
    const hasSalida = data.some((r) => r.tipo === 'salida')

    setHasEntradaToday(hasEntrada)
    setHasSalidaToday(hasSalida)
    setCanRegisterSalida(hasEntrada && !hasSalida)
  }

  const selectChild = (nino: Nino) => {
    setSelectedNino(nino.id)
    setSelectedChildData(nino)
    checkTodayAttendanceStatus(nino.id)
    setShowChildrenModal(false)
    setChildSearch('')
  }

  const clearChildSelection = () => {
    setSelectedNino('')
    setSelectedChildData(null)
    setChildSearch('')
    setObservaciones({
      fiebre: false,
      mordidas: false,
      aruñado: false,
      golpes: false,
      otro: false,
      otro_texto: '',
      fiebre_salida: false,
      mordidas_salida: false,
      aruñado_salida: false,
      golpes_salida: false,
    })
  }

  const handleDocumentSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchAcudiente(documentoAcudiente)
  }

  const registerAttendance = async () => {
    if (!acudiente || !selectedNino || !user?.id) {
      toast.error('Faltan datos requeridos')
      return
    }

    if (tipo === 'entrada' && hasEntradaToday) {
      toast.error('Ya se registró la entrada hoy para este niño')
      return
    }

    if (tipo === 'salida' && (!hasEntradaToday || hasSalidaToday)) {
      toast.error('Ya se registró la salida hoy o falta la entrada')
      return
    }

    setLoading(true)

    try {
      const insertData: any = {
        tipo,
        nino_id: selectedNino,
        acudiente_id: acudiente.id,
        usuario_registra_id: user.id,
        anotacion: anotacion.trim() || null,
        guarderia_id: selectedChildData?.guarderia_id || user.guarderia_id,
        aula_id: selectedChildData?.aula?.id || null,
        fecha: getFechaHoyColombia(),
      }

      if (tipo === 'entrada') {
        insertData.fiebre = observaciones.fiebre
        insertData.mordidas = observaciones.mordidas
        insertData.aruñado = observaciones.aruñado
        insertData.golpes = observaciones.golpes
        insertData.otro = observaciones.otro
        if (observaciones.otro && observaciones.otro_texto.trim()) {
          insertData.otro_texto = observaciones.otro_texto.trim()
        }
      } else {
        insertData.fiebre_salida = observaciones.fiebre_salida
        insertData.mordidas_salida = observaciones.mordidas_salida
        insertData.aruñado_salida = observaciones.aruñado_salida
        insertData.golpes_salida = observaciones.golpes_salida
      }

      const { error } = await supabase.from('registros_asistencia').insert(insertData)

      if (error) {
        toast.error('Error al registrar la asistencia')
        return
      }

      toast.success(`Asistencia registrada exitosamente: ${tipo}`)

      await checkTodayAttendanceStatus(selectedNino)

      if (tipo === 'salida') {
        clearChildSelection()
        setDocumentoAcudiente('')
        setAcudiente(null)
        setNinos([])
        setFilteredNinos([])
        setAnotacion('')
        setTipo('entrada')
        setObservaciones({
          fiebre: false,
          mordidas: false,
          aruñado: false,
          golpes: false,
          otro: false,
          otro_texto: '',
          fiebre_salida: false,
          mordidas_salida: false,
          aruñado_salida: false,
          golpes_salida: false,
        })
      }

      if (onRegistrationComplete) onRegistrationComplete()
    } catch (error) {
      toast.error('Error al registrar la asistencia')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-3 sm:p-6">
     <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Control de Asistencia
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Registro de entrada y salida de niños
        </p>
      </div>

     

      <div className="space-y-4 sm:space-y-6">
        {/* Búsqueda de acudiente */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Buscar Acudiente
          </h3>
          <form onSubmit={handleDocumentSearch} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de documento
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={documentoAcudiente}
                  onChange={(e) => setDocumentoAcudiente(e.target.value)}
                  className="flex-1 px-4 py-3 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 text-base sm:text-lg"
                  placeholder="Ingrese el número de documento"
                  required
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-mint-600 text-white rounded-lg hover:bg-mint-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
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
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-mint-600" />
              Acudiente Encontrado
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Nombre:</span>
                <p className="text-gray-900 break-words">{acudiente.nombres} {acudiente.apellidos}</p>
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
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Baby className="w-5 h-5 text-blue-600" />
                Seleccionar Niño ({ninos.length} disponible{ninos.length !== 1 ? 's' : ''})
              </h3>
              {ninos.length > 1 && (
                <button
                  onClick={() => setShowChildrenModal(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Search className="w-4 h-4" />
                  Buscar niño
                </button>
              )}
            </div>

            {/* Lista compacta para pocos niños */}
            <div className="space-y-2 sm:space-y-3">
              {ninos.slice(0, 3).map((nino) => (
                <button
                  key={nino.id}
                  onClick={() => selectChild(nino)}
                  className="w-full flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-left transition-all group active:scale-98"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 flex-shrink-0">
                    <Baby className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {nino.nombres} {nino.apellidos}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {nino.aula?.nombre_aula} - {nino.aula?.nivel_educativo}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </button>
              ))}
              {ninos.length > 3 && (
                <button
                  onClick={() => setShowChildrenModal(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  Ver {ninos.length - 3} niño{ninos.length - 3 !== 1 ? 's' : ''} más...
                </button>
              )}
            </div>
          </div>
        )}

        {/* REGISTRO DIRECTO - SIN MODAL */}
        {selectedChildData && acudiente && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
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
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Baby className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-blue-900 text-sm sm:text-base truncate">
                    {selectedChildData.nombres} {selectedChildData.apellidos}
                  </h4>
                  <p className="text-blue-700 text-xs sm:text-sm truncate">
                    {selectedChildData.aula?.nombre_aula} - {selectedChildData.aula?.nivel_educativo}
                  </p>
                  <p className="text-blue-600 text-xs sm:text-sm truncate">
                    Acudiente: {acudiente.nombres} {acudiente.apellidos}
                  </p>
                </div>
              </div>
            </div>

            {/* Selección de tipo - Más grande */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de registro
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                    type="button"
                    onClick={() => setTipo('entrada')}
                    disabled={hasEntradaToday}
                    className={`relative p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 ${
                      tipo === 'entrada'
                        ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                        : 'border-gray-300 bg-white hover:border-green-300 hover:bg-green-50'
                    } ${hasEntradaToday ? 'opacity-50 cursor-not-allowed' : ''}`}
                >


                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                      tipo === 'entrada' ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className={`font-bold text-sm sm:text-base ${
                      tipo === 'entrada' ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      Entrada
                    </span>
                  </div>
                  {tipo === 'entrada' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('salida')}
                  disabled={!canRegisterSalida}
                  className={`relative p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 ${
                    tipo === 'salida'
                      ? 'border-red-500 bg-red-50 shadow-lg scale-105'
                      : 'border-gray-300 bg-white hover:border-red-300 hover:bg-red-50'
                  } ${!canRegisterSalida ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                      tipo === 'salida' ? 'bg-red-500' : 'bg-gray-400'
                    }`}>
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className={`font-bold text-sm sm:text-base ${
                      tipo === 'salida' ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      Salida
                    </span>
                    {!canRegisterSalida && (
                      <p className="text-xs text-red-500 mt-1 text-center">Requiere entrada previa</p>
                    )}
                  </div>
                  {tipo === 'salida' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                    </div>
                  )}
                </button>

              </div>
            </div>

            {/* Observaciones */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Observaciones {tipo === 'entrada' ? 'de Entrada' : 'de Salida'}
              </label>
              
              {tipo === 'entrada' ? (
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={observaciones.fiebre}
                      onChange={(e) => setObservaciones({ ...observaciones, fiebre: e.target.checked })}
                      className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                      disabled={loading}
                    />
                    <img src="/fiebre.png" alt="Fiebre" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                    <span className="flex-1 text-gray-700">Fiebre</span>
                    <span className="text-sm text-gray-500">{observaciones.fiebre ? 'Sí' : 'No'}</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={observaciones.mordidas}
                      onChange={(e) => setObservaciones({ ...observaciones, mordidas: e.target.checked })}
                      className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                      disabled={loading}
                    />
                    <img src="/mordida.png" alt="Mordidas" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                    <span className="flex-1 text-gray-700">Mordidas</span>
                    <span className="text-sm text-gray-500">{observaciones.mordidas ? 'Sí' : 'No'}</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={observaciones.aruñado}
                      onChange={(e) => setObservaciones({ ...observaciones, aruñado: e.target.checked })}
                      className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                      disabled={loading}
                    />
                    <img src="/rasguno.png" alt="Arañado" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                    <span className="flex-1 text-gray-700">Arañado</span>
                    <span className="text-sm text-gray-500">{observaciones.aruñado ? 'Sí' : 'No'}</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={observaciones.golpes}
                      onChange={(e) => setObservaciones({ ...observaciones, golpes: e.target.checked })}
                      className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                      disabled={loading}
                    />
                    <img src="/curita.png" alt="Golpes" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                    <span className="flex-1 text-gray-700">Golpes</span>
                    <span className="text-sm text-gray-500">{observaciones.golpes ? 'Sí' : 'No'}</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={observaciones.otro}
                      onChange={(e) => setObservaciones({ ...observaciones, otro: e.target.checked })}
                      className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                      disabled={loading}
                    />
                    <span className="flex-1 text-gray-700">Otro</span>
                    <span className="text-sm text-gray-500">{observaciones.otro ? 'Sí' : 'No'}</span>
                  </label>

                  {observaciones.otro && (
                    <div className="ml-8 mt-2">
                      <textarea
                        value={observaciones.otro_texto}
                        onChange={(e) => setObservaciones({ ...observaciones, otro_texto: e.target.value })}
                        placeholder="Describe la observación..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                        rows={3}
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={observaciones.fiebre_salida}
                      onChange={(e) => setObservaciones({ ...observaciones, fiebre_salida: e.target.checked })}
                      className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                      disabled={loading}
                    />
                    <img src="/fiebre.png" alt="Fiebre" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                    <span className="flex-1 text-gray-700">Fiebre</span>
                    <span className="text-sm text-gray-500">{observaciones.fiebre_salida ? 'Sí' : 'No'}</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={observaciones.mordidas_salida}
                      onChange={(e) => setObservaciones({ ...observaciones, mordidas_salida: e.target.checked })}
                      className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                      disabled={loading}
                    />
                    <img src="/mordida.png" alt="Mordidas" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                    <span className="flex-1 text-gray-700">Mordidas</span>
                    <span className="text-sm text-gray-500">{observaciones.mordidas_salida ? 'Sí' : 'No'}</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={observaciones.aruñado_salida}
                      onChange={(e) => setObservaciones({ ...observaciones, aruñado_salida: e.target.checked })}
                      className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                      disabled={loading}
                    />
                    <img src="/rasguno.png" alt="Arañado" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                    <span className="flex-1 text-gray-700">Arañado</span>
                    <span className="text-sm text-gray-500">{observaciones.aruñado_salida ? 'Sí' : 'No'}</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={observaciones.golpes_salida}
                      onChange={(e) => setObservaciones({ ...observaciones, golpes_salida: e.target.checked })}
                      className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                      disabled={loading}
                    />
                    <img src="/curita.png" alt="Golpes" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                    <span className="flex-1 text-gray-700">Golpes</span>
                    <span className="text-sm text-gray-500">{observaciones.golpes_salida ? 'Sí' : 'No'}</span>
                  </label>
                </div>
              )}
            </div>

            {/* Anotación */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anotación (opcional)
              </label>
              <textarea
                value={anotacion}
                onChange={(e) => setAnotacion(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 resize-none text-sm sm:text-base"
                placeholder="Observaciones o comentarios adicionales..."
              />
            </div>

            {/* Información de fecha/hora */}
            <div className="mb-4 sm:mb-6 flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Fecha y hora: {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
            </div>

            {/* Botón de registro */}
            <button
              onClick={registerAttendance}
              disabled={loading}
              className="w-full bg-mint-600 text-white py-3 sm:py-4 px-6 rounded-lg font-bold hover:bg-mint-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg text-base sm:text-lg active:scale-98 transition-transform"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
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
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  placeholder="Buscar por nombre, documento o aula..."
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              
              <p className="text-xs sm:text-sm text-gray-600 mt-2">
                {filteredNinos.length} de {ninos.length} niños
              </p>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-180px)] sm:max-h-96">
              <div className="space-y-2 sm:space-y-3">
                {filteredNinos.map((nino) => (
                  <button
                    key={nino.id}
                    onClick={() => selectChild(nino)}
                    className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-left transition-all group active:scale-98"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 flex-shrink-0">
                      <Baby className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {nino.nombres} {nino.apellidos}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        Doc: {nino.numero_documento}
                      </p>
                      <p className="text-xs sm:text-sm text-blue-600 truncate">
                        {nino.aula?.nombre_aula} - {nino.aula?.nivel_educativo}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </button>
                ))}
                
                {filteredNinos.length === 0 && (
                  <div className="text-center py-6 sm:py-8">
                    <Baby className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-500">No se encontraron niños</p>
                    <p className="text-xs sm:text-sm text-gray-400">Intenta con otro término de búsqueda</p>
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
