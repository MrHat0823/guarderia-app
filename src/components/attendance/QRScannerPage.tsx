// project\src\components\attendance\QRScannerPage.tsx
import React, { useState } from 'react'
import {
  QrCode,
  Camera,
  LogIn,
  CheckCircle,
  AlertTriangle,
  PhoneCall,
  User,
} from 'lucide-react'
import { QRScanner } from './QRScanner'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { toast } from 'sonner'
import { format, toZonedTime } from 'date-fns-tz'

const successSound = new Audio('/sounds/scan-success.mp3')

const getFechaHoyColombia = () => {
  const zona = 'America/Bogota'
  const ahora = new Date()
  return format(toZonedTime(ahora, zona), 'yyyy-MM-dd')
}

export function QRScannerPage() {
  const { user } = useAuth()

  const [showScanner, setShowScanner] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [multipleChildren, setMultipleChildren] = useState<any[]>([])
  const [acudienteData, setAcudienteData] = useState<any>(null)
  const [scannedDoc, setScannedDoc] = useState('')

  const handleScan = async (rawData: string) => {
    const documento = rawData.trim().replace(/\s+/g, '')
    setIsProcessing(true)
    setShowScanner(false)
    setMultipleChildren([])
    setScannedDoc(documento)

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
        await registrarAutomatico(vinculaciones[0].nino_id, acudiente.id)
      } else {
        const ids = vinculaciones.map(v => v.nino_id)
        const { data: ninos } = await supabase
          .from('ninos')
          .select('id, nombres, apellidos, aula_id, aulas(nombre_aula)')
          .in('id', ids)

        const ninosConAula = (ninos || []).map(n => ({
          ...n,
          nombreAula: n.aulas?.nombre_aula || 'N/A',
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

  const registrarAutomatico = async (ninoId: number, acudienteId: number) => {
    const hoy = getFechaHoyColombia()

    const { data: registrosHoy } = await supabase
      .from('registros_asistencia')
      .select('tipo')
      .eq('nino_id', ninoId)
      .eq('fecha', hoy)

    const yaEntrada = registrosHoy?.some(r => r.tipo === 'entrada')
    const yaSalida = registrosHoy?.some(r => r.tipo === 'salida')

    let tipo: 'entrada' | 'salida' | null = null
    if (!yaEntrada) tipo = 'entrada'
    else if (!yaSalida) tipo = 'salida'
    else {
      toast('Este niño ya registró entrada y salida hoy.', {
        icon: <AlertTriangle className="text-yellow-500 w-5 h-5" />,
      })
      setIsProcessing(false)
      return
    }

    const { data: infoNino } = await supabase
      .from('ninos')
      .select('nombres, apellidos, aula_id')
      .eq('id', ninoId)
      .maybeSingle()

    const { error } = await supabase.from('registros_asistencia').insert({
      nino_id: ninoId,
      acudiente_id: acudienteId,
      usuario_registra_id: user?.id,
      tipo,
      guarderia_id: user?.guarderia_id,
      aula_id: infoNino?.aula_id || null,
    })

    if (error) {
      toast.error('Error al registrar asistencia.', {
        icon: <AlertTriangle className="text-red-500 w-5 h-5" />,
      })
    } else {
      toast.success(
        `Registro automático exitoso: ${infoNino?.nombres} ${infoNino?.apellidos} - ${tipo}`,
        {
          icon: <CheckCircle className="text-green-600 w-5 h-5" />,
        }
      )
    }

    setIsProcessing(false)
  }

  const registrarManual = async (nino: any) => {
    setIsProcessing(true)
    const hoy = getFechaHoyColombia()

    const { data: registros } = await supabase
      .from('registros_asistencia')
      .select('tipo')
      .eq('nino_id', nino.id)
      .eq('fecha', hoy)

    const yaEntrada = registros?.some(r => r.tipo === 'entrada')
    const yaSalida = registros?.some(r => r.tipo === 'salida')

    let tipo: 'entrada' | 'salida' | null = null
    if (!yaEntrada) tipo = 'entrada'
    else if (!yaSalida) tipo = 'salida'
    else {
      toast(`El niño ${nino.nombres} ${nino.apellidos} ya registró entrada y salida hoy.`, {
        icon: <AlertTriangle className="text-yellow-500 w-5 h-5" />,
      })
      setIsProcessing(false)
      return
    }

    const { data: acudiente } = await supabase
      .from('acudientes')
      .select('id')
      .eq('numero_documento', scannedDoc)
      .maybeSingle()

    const { error } = await supabase.from('registros_asistencia').insert({
      nino_id: nino.id,
      acudiente_id: acudiente?.id,
      usuario_registra_id: user?.id,
      tipo,
      guarderia_id: user?.guarderia_id,
      aula_id: nino.aula_id,
    })

    if (error) {
      toast.error(`Error al registrar asistencia para ${nino.nombres}`, {
        icon: <AlertTriangle className="text-red-500 w-5 h-5" />,
      })
    } else {
      toast.success(
        `Registro manual exitoso: ${nino.nombres} ${nino.apellidos} - ${tipo}`,
        {
          icon: <CheckCircle className="text-green-600 w-5 h-5" />,
        }
      )
    }

    setIsProcessing(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-800">
        <QrCode className="w-6 h-6 text-purple-600" />
        Escáner QR
      </h1>

      <button
        onClick={() => setShowScanner(true)}
        className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 transition-colors duration-200 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 mb-6 shadow-sm"
      >
        <Camera className="w-5 h-5" /> Activar escáner
      </button>

      <QRScanner
        onScan={handleScan}
        isActive={showScanner}
        onClose={() => setShowScanner(false)}
        isProcessing={isProcessing}
      />

      {multipleChildren.length > 0 && acudienteData && (
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
                  onClick={() => registrarManual(nino)}
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
    </div>
  )
}

