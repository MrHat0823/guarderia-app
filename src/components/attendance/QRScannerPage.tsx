import React, { useState, useEffect } from 'react'
import {
  QrCode,
  AlertCircle,
  Camera,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'
import { QRScanner } from './QRScanner'
import { AttendanceControl } from './AttendanceControl'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'


// Sonido de éxito
const successSound = new Audio('/sounds/scan-success.mp3')

export function QRScannerPage() {
  const [showScanner, setShowScanner] = useState(false)
  const [scannedDocument, setScannedDocument] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAttendanceForm, setShowAttendanceForm] = useState(false)

  const { user } = useAuth()

  const handleScan = async (rawData: string) => {
  const documento = rawData.trim().replace(/\s+/g, '')
  setIsProcessing(true)
  setScannedDocument(documento)
  setShowScanner(false)

  try {
    // Buscar acudiente
    const { data: acudiente, error: acudienteError } = await supabase
      .from('acudientes')
      .select('id, nombres, apellidos')
      .eq('numero_documento', documento)
      .single()

    if (acudienteError || !acudiente) {
      console.error('Acudiente no encontrado:', acudienteError)
      alert('Acudiente no encontrado.')
      setIsProcessing(false)
      return
    }

    successSound.play().catch((err) =>
      console.error('Error al reproducir sonido:', err)
    )

    const acudienteId = acudiente.id

    // Obtener niño vinculado
    const { data: vinculaciones, error: vinculacionError } = await supabase
      .from('nino_acudiente')
      .select('nino_id')
      .eq('acudiente_id', acudienteId)

    if (vinculacionError || !vinculaciones) {
      console.error('Error obteniendo niños:', vinculacionError)
      setIsProcessing(false)
      return
    }

    // Si hay un solo niño, registrar directamente
    if (vinculaciones.length === 1) {
      const ninoId = vinculaciones[0].nino_id

      // Obtener aula
      const { data: ninoInfo, error: ninoError } = await supabase
        .from('ninos')
        .select('aula_id, nombres, apellidos')
        .eq('id', ninoId)
        .single()

      if (ninoError || !ninoInfo?.aula_id) {
        console.error('Error obteniendo aula del niño:', ninoError)
        alert('No se pudo obtener el aula del niño.')
        setIsProcessing(false)
        return
      }

      // Consultar registros de hoy
      const hoy = new Date().toISOString().split('T')[0]
      const { data: registrosHoy, error: errorRegistros } = await supabase
        .from('registros_asistencia')
        .select('tipo')
        .eq('nino_id', ninoId)
        .eq('fecha', hoy)

      if (errorRegistros) {
        console.error('Error consultando registros del día:', errorRegistros)
        setIsProcessing(false)
        return
      }

      const yaRegistroEntrada = registrosHoy?.some(r => r.tipo === 'entrada')
      const yaRegistroSalida = registrosHoy?.some(r => r.tipo === 'salida')

      let tipoRegistro: 'entrada' | 'salida' | null = null

      if (!yaRegistroEntrada) {
        tipoRegistro = 'entrada'
      } else if (!yaRegistroSalida) {
        tipoRegistro = 'salida'
      } else {
        alert(`El niño ${ninoInfo.nombres} ${ninoInfo.apellidos} ya registró Entrada y Salida el día de hoy.`)
        setIsProcessing(false)
        return
      }

      // Insertar registro
      const { error: registroError } = await supabase
        .from('registros_asistencia')
        .insert({
          nino_id: ninoId,
          acudiente_id: acudienteId,
          usuario_registra_id: user?.id,
          tipo: tipoRegistro,
          guarderia_id: user?.guarderia_id,
          aula_id: ninoInfo.aula_id,
        })

      if (registroError) {
        console.error('Error registrando asistencia automática:', registroError)
        alert('Error al registrar asistencia automática.')
      } else {
        alert(`Registro automático realizado (${tipoRegistro})`)
      }

      setIsProcessing(false)
      setShowAttendanceForm(false)
      setScannedDocument('')
    } else {
      // Más de un niño → abrir formulario manual
      setTimeout(() => {
        setIsProcessing(false)
        setShowAttendanceForm(true)
      }, 500)
    }

  } catch (error) {
    console.error('Error general en handleScan:', error)
    alert('Error inesperado al escanear.')
    setIsProcessing(false)
  }
}



  const handleClearAndScanAgain = () => {
    setScannedDocument('')
    setShowAttendanceForm(false)
    setIsProcessing(false)
    setShowScanner(true)
  }

  const handleBackToScanner = () => {
    setShowAttendanceForm(false)
    setScannedDocument('')
  }

  useEffect(() => {
    const handleQRScanned = (event: CustomEvent) => {
      console.log('QRScannerPage - Evento QR escaneado:', event.detail)
      handleScan(event.detail)
    }

    window.addEventListener('qr-scanned', handleQRScanned as EventListener)

    return () => {
      window.removeEventListener('qr-scanned', handleQRScanned as EventListener)
    }
  }, [])

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Escáner QR</h1>
        <p className="text-gray-600">
          Escanee el código QR del acudiente para registro rápido
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Escáner QR */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Escáner QR</h3>
            <p className="text-sm text-gray-600 mb-4">
              Usar la cámara para escanear código QR
            </p>
            <button
              onClick={() => setShowScanner(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Camera className="w-5 h-5" />
              Activar escáner
            </button>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Instrucciones
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• El código QR debe contener el número de documento del acudiente</li>
                <li>• Mantenga el código QR centrado en la cámara</li>
                <li>• Asegúrese de tener buena iluminación</li>
                <li>• También puede ingresar el documento manualmente</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <QRScanner
        onScan={handleScan}
        isActive={showScanner}
        onClose={() => setShowScanner(false)}
        isProcessing={isProcessing}
      />

      {showAttendanceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-mint-50 to-mint-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <QrCode className="w-6 h-6 text-purple-600" />
                    Registro de Asistencia
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Código escaneado:{' '}
                    <span className="font-mono font-bold text-mint-700">
                      {scannedDocument}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearAndScanAgain}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Escanear otro
                  </button>
                  <button
                    onClick={handleBackToScanner}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              <AttendanceControl
                initialDocumento={scannedDocument}
                onRegistrationComplete={() => {
                  setTimeout(() => {
                    setShowAttendanceForm(false)
                    setScannedDocument('')
                  }, 2000)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
