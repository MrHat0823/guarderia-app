import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

export function useQRScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<string>('')
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  const startScanning = (elementId: string) => {
    if (scannerRef.current) {
      scannerRef.current.clear()
    }

    const scanner = new Html5QrcodeScanner(
      elementId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    )

    scanner.render(
      (decodedText) => {
        setScannedData(decodedText)
        setIsScanning(false)
        scanner.clear()
      },
      (error) => {
        console.warn('QR scan error:', error)
      }
    )

    scannerRef.current = scanner
    setIsScanning(true)
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
      }
    }
  }, [])

  return {
    isScanning,
    scannedData,
    startScanning,
    stopScanning,
    setScannedData
  }
}