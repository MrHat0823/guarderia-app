// project\src\components\attendance\QRScannerPage.tsx
import React, { useState, useEffect } from 'react'
import {
  QrCode,
  Camera,
  LogIn,
  CheckCircle,
  AlertTriangle,
  PhoneCall,
  User,
  X,
} from 'lucide-react'
import { QRScanner } from './QRScanner'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { toast } from 'sonner'
import { format, toZonedTime } from 'date-fns-tz'
import type { AttendanceType } from '../../lib/types'

const successSound = new Audio('/sounds/scan-success.mp3')

const getFechaHoyColombia = () => {
  const zona = 'America/Bogota'
  const ahora = new Date()
  return format(toZonedTime(ahora, zona), 'yyyy-MM-dd')
}

interface NinoData {
  id: string
  nombres: string
  apellidos: string
  aula_id?: string
  nombreAula?: string
}

interface AttendanceFormData {
  fiebre: boolean
  mordidas: boolean
  aruñado: boolean
  golpes: boolean
  otro: boolean
  otro_texto: string
  fiebre_salida: boolean
  mordidas_salida: boolean
  aruñado_salida: boolean
  golpes_salida: boolean
}

export function QRScannerPage() {
  const { user } = useAuth()

  const [showScanner, setShowScanner] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [multipleChildren, setMultipleChildren] = useState<NinoData[]>([])
  const [acudienteData, setAcudienteData] = useState<any>(null)
  const [scannedDoc, setScannedDoc] = useState('')
  const [selectedNino, setSelectedNino] = useState<NinoData | null>(null)
  const [showAttendanceForm, setShowAttendanceForm] = useState(false)
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('entrada')
  const [formData, setFormData] = useState<AttendanceFormData>({
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

  const resetForm = () => {
    setFormData({
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
    setSelectedNino(null)
    setShowAttendanceForm(false)
    setIsProcessing(false)
  }

  const handleScan = async (rawData: string) => {
    const documento = rawData.trim().replace(/\s+/g, '')
    setIsProcessing(true)
    setShowScanner(false)
    setMultipleChildren([])
    setScannedDoc(documento)
    resetForm()

    try {
      const { data: acudiente, error: acudienteError } = await supabase
        .from('acudientes')
        .select('id, nombres, apellidos, tipo_documento, numero_documento, telefono1')
        .eq('numero_documento', documento)
        .eq('guarderia_id', user?.guarderia_id)
        .maybeSingle()

      if (acudienteError || !acudiente) {
        toast.error('Acudiente no encontrado.', {
          icon: <AlertTriangle className="text-red-500 w-5 h-5" />,
        })
        setIsProcessing(false)
        return
      }

      setAcudienteData(acudiente)
      successSound.play().catch(() => {})

      const { data: vinculaciones } = await supabase
        .from('nino_acudiente')
        .select('nino_id')
        .eq('acudiente_id', acudiente.id)

      if (!vinculaciones || vinculaciones.length === 0) {
        toast.error('Este acudiente no tiene niños vinculados.', {
          icon: <AlertTriangle className="text-red-500 w-5 h-5" />,
        })
        setIsProcessing(false)
        return
      }

      if (vinculaciones.length === 1) {
        const ninoId = vinculaciones[0].nino_id
        const { data: ninoInfo } = await supabase
          .from('ninos')
          .select('id, nombres, apellidos, aula_id, aulas(nombre_aula)')
          .eq('id', ninoId)
          .maybeSingle()

        if (ninoInfo) {
          const ninoData: NinoData = {
            id: ninoInfo.id,
            nombres: ninoInfo.nombres,
            apellidos: ninoInfo.apellidos,
            aula_id: ninoInfo.aula_id || undefined,
            nombreAula: Array.isArray(ninoInfo.aulas) ? ninoInfo.aulas[0]?.nombre_aula : ninoInfo.aulas?.nombre_aula,
          }
          await prepareAttendanceForm(ninoData)
        }
      } else {
        const ids = vinculaciones.map(v => v.nino_id)
        const { data: ninos } = await supabase
          .from('ninos')
          .select('id, nombres, apellidos, aula_id, aulas(nombre_aula)')
          .in('id', ids)

        const ninosConAula = (ninos || []).map(n => ({
          id: n.id,
          nombres: n.nombres,
          apellidos: n.apellidos,
          aula_id: n.aula_id || undefined,
          nombreAula: Array.isArray(n.aulas) ? n.aulas[0]?.nombre_aula : n.aulas?.nombre_aula,
        }))

        setMultipleChildren(ninosConAula)
        setIsProcessing(false)
      }
    } catch (err) {
      toast.error('Ocurrió un error inesperado.', {
        icon: <AlertTriangle className="text-red-500 w-5 h-5" />,
      })
      console.error('Error al procesar escaneo:', err)
      setIsProcessing(false)
    }
  }

  const prepareAttendanceForm = async (nino: NinoData) => {
    const hoy = getFechaHoyColombia()

    const { data: registrosHoy } = await supabase
      .from('registros_asistencia')
      .select('tipo')
      .eq('nino_id', nino.id)
      .eq('fecha', hoy)

    const yaEntrada = registrosHoy?.some(r => r.tipo === 'entrada')
    const yaSalida = registrosHoy?.some(r => r.tipo === 'salida')

    let tipo: AttendanceType = 'entrada'
    if (!yaEntrada) {
      tipo = 'entrada'
    } else if (!yaSalida) {
      tipo = 'salida'
    } else {
      toast('Este niño ya registró entrada y salida hoy.', {
        icon: <AlertTriangle className="text-yellow-500 w-5 h-5" />,
      })
      setIsProcessing(false)
      return
    }

    setAttendanceType(tipo)
    setSelectedNino(nino)
    setShowAttendanceForm(true)
    setIsProcessing(false)
  }

  const handleRegisterAttendance = async () => {
    if (!selectedNino || !acudienteData || !user?.id) {
      toast.error('Faltan datos requeridos')
      return
    }

    setIsProcessing(true)

    try {
      const hoy = getFechaHoyColombia()

      const insertData: any = {
        nino_id: selectedNino.id,
        acudiente_id: acudienteData.id,
        usuario_registra_id: user.id,
        tipo: attendanceType,
        guarderia_id: user.guarderia_id,
        aula_id: selectedNino.aula_id || null,
        fecha: hoy,
      }

      if (attendanceType === 'entrada') {
        insertData.fiebre = formData.fiebre
        insertData.mordidas = formData.mordidas
        insertData.aruñado = formData.aruñado
        insertData.golpes = formData.golpes
        insertData.otro = formData.otro
        if (formData.otro && formData.otro_texto.trim()) {
          insertData.otro_texto = formData.otro_texto.trim()
        }
      } else {
        insertData.fiebre_salida = formData.fiebre_salida
        insertData.mordidas_salida = formData.mordidas_salida
        insertData.aruñado_salida = formData.aruñado_salida
        insertData.golpes_salida = formData.golpes_salida
      }

      const { error } = await supabase.from('registros_asistencia').insert(insertData)

      if (error) {
        toast.error('Error al registrar asistencia.', {
          icon: <AlertTriangle className="text-red-500 w-5 h-5" />,
        })
        setIsProcessing(false)
        return
      }

      toast.success(
        `Registro exitoso: ${selectedNino.nombres} ${selectedNino.apellidos} - ${attendanceType}`,
        {
          icon: <CheckCircle className="text-green-600 w-5 h-5" />,
        }
      )

      resetForm()
      setAcudienteData(null)
      setMultipleChildren([])
      setScannedDoc('')
      setIsProcessing(false)
    } catch (error) {
      console.error('Error al registrar asistencia:', error)
      toast.error('Error al registrar asistencia.')
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-800">
        <QrCode className="w-6 h-6 text-purple-600" />
        Escáner QR
      </h1>

      <button
        onClick={() => {
          setIsProcessing(false)
          setShowScanner(true)
        }}
        className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 transition-colors duration-200 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 mb-6 shadow-sm"
      >
        <Camera className="w-5 h-5" /> Activar escáner
      </button>

      <QRScanner
        onScan={handleScan}
        isActive={showScanner}
        onClose={() => {
          setIsProcessing(false)
          setShowScanner(false)
        }}
        isProcessing={isProcessing}
      />

      {multipleChildren.length > 0 && acudienteData && !showAttendanceForm && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mt-4">
          <h2 className="text-lg font-semibold mb-2 text-center text-gray-800">
            Seleccione el niño para registrar asistencia
          </h2>

          <div className="mb-6 text-center">
            <div className="max-w-full sm:max-w-md mx-auto bg-purple-50 border border-purple-200 rounded-lg px-4 py-4 sm:px-6 shadow-sm">
              <p className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2 mb-1">
                <User className="w-5 h-5 text-purple-600" />
                {acudienteData.nombres} {acudienteData.apellidos}
              </p>
              <p className="text-sm text-gray-700 mb-1">
                {acudienteData.tipo_documento}: {acudienteData.numero_documento}
              </p>
              <p className="text-sm text-gray-700 flex items-center justify-center gap-2">
                <PhoneCall className="w-4 h-4 text-purple-600" />
                {acudienteData.telefono1 || 'Sin teléfono'}
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {multipleChildren.map((nino) => (
              <li
                key={nino.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white"
              >
                <div>
                  <p className="font-semibold text-gray-800 text-base">
                    🧒 {nino.nombres} {nino.apellidos}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Aula: <span className="font-medium">{nino.nombreAula || 'N/A'}</span>
                  </p>
                </div>
                <button
                  onClick={() => prepareAttendanceForm(nino)}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                  disabled={isProcessing}
                >
                  <LogIn className="w-4 h-4" />
                  Registrar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showAttendanceForm && selectedNino && acudienteData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Registro de {attendanceType === 'entrada' ? 'Entrada' : 'Salida'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isProcessing}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900 mb-1">
                  {selectedNino.nombres} {selectedNino.apellidos}
                </p>
                <p className="text-sm text-gray-600">
                  Acudiente: {acudienteData.nombres} {acudienteData.apellidos}
                </p>
                {selectedNino.nombreAula && (
                  <p className="text-sm text-gray-600">Aula: {selectedNino.nombreAula}</p>
                )}
              </div>

              {attendanceType === 'entrada' ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Observaciones de Entrada</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.fiebre}
                        onChange={(e) => setFormData({ ...formData, fiebre: e.target.checked })}
                        className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                        disabled={isProcessing}
                      />
                      <img src="/fiebre.png" alt="Fiebre" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                      <span className="flex-1 text-gray-700">Fiebre</span>
                      <span className="text-sm text-gray-500">{formData.fiebre ? 'Sí' : 'No'}</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mordidas}
                        onChange={(e) => setFormData({ ...formData, mordidas: e.target.checked })}
                        className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                        disabled={isProcessing}
                      />
                      <img src="/mordida.png" alt="Mordidas" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                      <span className="flex-1 text-gray-700">Mordidas</span>
                      <span className="text-sm text-gray-500">{formData.mordidas ? 'Sí' : 'No'}</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.aruñado}
                        onChange={(e) => setFormData({ ...formData, aruñado: e.target.checked })}
                        className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                        disabled={isProcessing}
                      />
                      <img src="/rasguno.png" alt="Arañado" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                      <span className="flex-1 text-gray-700">Arañado</span>
                      <span className="text-sm text-gray-500">{formData.aruñado ? 'Sí' : 'No'}</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.golpes}
                        onChange={(e) => setFormData({ ...formData, golpes: e.target.checked })}
                        className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                        disabled={isProcessing}
                      />
                      <img src="/curita.png" alt="Golpes" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                      <span className="flex-1 text-gray-700">Golpes</span>
                      <span className="text-sm text-gray-500">{formData.golpes ? 'Sí' : 'No'}</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.otro}
                        onChange={(e) => setFormData({ ...formData, otro: e.target.checked })}
                        className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                        disabled={isProcessing}
                      />
                      <span className="flex-1 text-gray-700">Otro</span>
                      <span className="text-sm text-gray-500">{formData.otro ? 'Sí' : 'No'}</span>
                    </label>

                    {formData.otro && (
                      <div className="ml-8 mt-2">
                        <textarea
                          value={formData.otro_texto}
                          onChange={(e) => setFormData({ ...formData, otro_texto: e.target.value })}
                          placeholder="Describe la observación..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                          rows={3}
                          disabled={isProcessing}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Observaciones de Salida</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.fiebre_salida}
                        onChange={(e) => setFormData({ ...formData, fiebre_salida: e.target.checked })}
                        className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                        disabled={isProcessing}
                      />
                      <img src="/fiebre.png" alt="Fiebre" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                      <span className="flex-1 text-gray-700">Fiebre</span>
                      <span className="text-sm text-gray-500">{formData.fiebre_salida ? 'Sí' : 'No'}</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mordidas_salida}
                        onChange={(e) => setFormData({ ...formData, mordidas_salida: e.target.checked })}
                        className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                        disabled={isProcessing}
                      />
                      <img src="/mordida.png" alt="Mordidas" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                      <span className="flex-1 text-gray-700">Mordidas</span>
                      <span className="text-sm text-gray-500">{formData.mordidas_salida ? 'Sí' : 'No'}</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.aruñado_salida}
                        onChange={(e) => setFormData({ ...formData, aruñado_salida: e.target.checked })}
                        className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                        disabled={isProcessing}
                      />
                      <img src="/rasguno.png" alt="Arañado" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                      <span className="flex-1 text-gray-700">Arañado</span>
                      <span className="text-sm text-gray-500">{formData.aruñado_salida ? 'Sí' : 'No'}</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.golpes_salida}
                        onChange={(e) => setFormData({ ...formData, golpes_salida: e.target.checked })}
                        className="w-5 h-5 rounded-full text-mint-600 focus:ring-mint-500 border-gray-300"
                        disabled={isProcessing}
                      />
                      <img src="/curita.png" alt="Golpes" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                      <span className="flex-1 text-gray-700">Golpes</span>
                      <span className="text-sm text-gray-500">{formData.golpes_salida ? 'Sí' : 'No'}</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button
                  onClick={handleRegisterAttendance}
                  disabled={isProcessing}
                  className="flex-1 bg-mint-600 hover:bg-mint-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirmar Registro
                    </>
                  )}
                </button>
                <button
                  onClick={resetForm}
                  disabled={isProcessing}
                  className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
