import React, { useState, useEffect, useRef } from 'react'
import { QrCode, X, Search, Loader2, CheckCircle } from 'lucide-react'

interface QRScannerProps {
  onScan: (data: string) => void
  isActive: boolean
  onClose: () => void
  isProcessing?: boolean
}

export function QRScanner({ onScan, isActive, onClose, isProcessing = false }: QRScannerProps) {
  const [manualInput, setManualInput] = useState('')
  const [scannedCode, setScannedCode] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (isActive) {
      // Escuchar mensajes del iframe
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'QR_SCANNED') {
          const code = event.data.data
          setScannedCode(code)
          
          // Llamar a onScan que ahora es async
          onScan(code)
        }
      }

      window.addEventListener('message', handleMessage)
      
      return () => {
        window.removeEventListener('message', handleMessage)
      }
    }
  }, [isActive, onScan, onClose])

  const startScanner = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage({ type: 'START_SCANNER' }, '*')
    }
  }

  const stopScanner = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage({ type: 'STOP_SCANNER' }, '*')
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.trim()) {
      onScan(manualInput.trim())
      setManualInput('')
    }
  }

  if (!isActive) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-purple-600" />
              Escáner QR
            </h2>
            <button
              onClick={() => {
                stopScanner()
                if (!isProcessing) {
                  onClose()
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              disabled={isProcessing}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Estado de procesamiento */}
          {isProcessing && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <p className="text-blue-900 font-medium">Procesando código escaneado...</p>
                  <p className="text-blue-700 text-sm">Buscando acudiente automáticamente</p>
                </div>
              </div>
            </div>
          )}

          {/* Código escaneado */}
          {scannedCode && !isProcessing && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-green-900 font-medium">Código escaneado: {scannedCode}</p>
                  <p className="text-green-700 text-sm">Procesando búsqueda automática...</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Iframe con el escáner HTML */}
            <div className={`border border-gray-200 rounded-lg overflow-hidden ${isProcessing ? 'opacity-50' : ''}`}>
              <iframe
                ref={iframeRef}
                src="/qr-scanner.html"
                className="w-full h-96 border-0"
                title="Escáner QR"
                style={{ pointerEvents: isProcessing ? 'none' : 'auto' }}
                onLoad={() => {
                  // Auto-iniciar el escáner cuando se carga el iframe
                  if (!isProcessing) {
                    setTimeout(startScanner, 500)
                  }
                }}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">o</span>
              </div>
            </div>

            {/* Ingreso manual */}
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingreso manual
                </label>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Número de documento"
                  required
                  disabled={isProcessing}
                />
              </div>
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-mint-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-mint-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Buscar
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}