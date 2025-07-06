import React, { useState, useEffect } from 'react'
import { QrCode, Search, AlertCircle, Camera, RefreshCw, ArrowLeft } from 'lucide-react'
import { QRScanner } from './QRScanner'
import { AttendanceControl } from './AttendanceControl'

export function QRScannerPage() {
  const [showScanner, setShowScanner] = useState(false)
  const [scannedDocument, setScannedDocument] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAttendanceForm, setShowAttendanceForm] = useState(false)

  const handleScan = async (data: string) => {
    console.log('QRScannerPage - Código escaneado:', data)
    setIsProcessing(true)
    setScannedDocument(data)
    
    // Cerrar el modal del escáner automáticamente
    setShowScanner(false)
    
    // Mostrar el formulario de asistencia después de un breve delay
    setTimeout(() => {
      setIsProcessing(false)
      setShowAttendanceForm(true)
    }, 1000)
  }

  const handleClearAndScanAgain = () => {
    // Limpiar todos los datos
    setScannedDocument('')
    setShowAttendanceForm(false)
    setIsProcessing(false)
    
    // Abrir el escáner nuevamente
    setShowScanner(true)
  }

  const handleBackToScanner = () => {
    setShowAttendanceForm(false)
    setScannedDocument('')
  }

  // Escuchar eventos del iframe del escáner
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Escáner QR
        </h1>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Escáner QR
            </h3>
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

      {/* Modal del escáner QR */}
      <QRScanner 
        onScan={handleScan}
        isActive={showScanner}
        onClose={() => setShowScanner(false)}
        isProcessing={isProcessing}
      />

      {/* Modal de Registro de Asistencia */}
      {showAttendanceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
            {/* Header del modal */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-mint-50 to-mint-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <QrCode className="w-6 h-6 text-purple-600" />
                    Registro de Asistencia
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Código escaneado: <span className="font-mono font-bold text-mint-700">{scannedDocument}</span>
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
            
            {/* Contenido del modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              <AttendanceControl 
                initialDocumento={scannedDocument}
                onRegistrationComplete={() => {
                  // Cerrar modal después de registro exitoso
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