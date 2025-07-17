// src/components/dashboard/AttendancePDFGenerator.tsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Download, Loader2 } from 'lucide-react'

interface Guarderia {
  id: string
  nombre: string
}

interface Aula {
  id: string
  nombre_aula: string
}

export default function AttendancePDFGenerator() {
  const [guarderias, setGuarderias] = useState<Guarderia[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [selectedGuarderia, setSelectedGuarderia] = useState('')
  const [selectedAula, setSelectedAula] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchGuarderias()
  }, [])

  useEffect(() => {
    if (selectedGuarderia) fetchAulas()
  }, [selectedGuarderia])

  const fetchGuarderias = async () => {
    const { data, error } = await supabase
      .from('guarderias')
      .select('id, nombre')
    if (!error && data) setGuarderias(data)
  }

  const fetchAulas = async () => {
    const { data, error } = await supabase
      .from('aulas')
      .select('id, nombre_aula')
      .eq('guarderia_id', selectedGuarderia)
    if (!error && data) setAulas(data)
  }

  const generarPDF = async () => {
    if (!selectedGuarderia || !fromDate || !toDate) return
    setLoading(true)

    try {
      let query = supabase
        .from('registros_asistencia')
        .select(`
          fecha,
          hora,
          tipo,
          aulas (
            nombre_aula
          ),
          ninos (
            nombres,
            apellidos,
            tipo_documento,
            numero_documento
          ),
          acudientes (
            nombres,
            apellidos,
            tipo_documento,
            numero_documento
          ),
          terceros (
            nombres,
            apellidos,
            tipo_documento,
            numero_documento
          )
        `)
        .gte('fecha', fromDate)
        .lte('fecha', toDate)
        .eq('guarderia_id', selectedGuarderia)

      if (selectedAula) {
        query = query.eq('aula_id', selectedAula)
      }

      const { data: registrosRaw, error } = await query

      if (error) throw error
      if (!registrosRaw) return

      const registrosAgrupados = agruparRegistros(registrosRaw)

      const guarderiaNombre =
        guarderias.find((g) => g.id === selectedGuarderia)?.nombre || 'Guardería'
      const aulaNombre =
        aulas.find((a) => a.id === selectedAula)?.nombre_aula || ''

      const titulo = `Control de Asistencias de la Guardería ${guarderiaNombre}${
        aulaNombre ? ' - Aula ' + aulaNombre : ''
      }`

      const doc = new jsPDF({ orientation: 'landscape' })
      doc.setFontSize(16)
      doc.text(titulo, 14, 20)

      autoTable(doc, {
        startY: 30,
        head: [
          [
            'Niño',
            'Tipo Documento',
            'Número de Documento',
            'Acudiente/Tercero',
            'Tipo Documento Acudiente/Tercero',
            'Número de Documento Acudiente/Tercero',
            'Fecha',
            'Hora Entrada',
            'Hora Salida',
            ...(selectedAula ? [] : ['Aula'])
          ]
        ],
        body: registrosAgrupados.map((r) => [
          `${r.nino.nombres} ${r.nino.apellidos}`,
          r.nino.tipo_documento,
          r.nino.numero_documento,
          `${r.acudiente?.nombres || ''} ${r.acudiente?.apellidos || ''}`,
          r.acudiente?.tipo_documento || '',
          r.acudiente?.numero_documento || '',
          r.fecha,
          r.hora_entrada || '',
          r.hora_salida || '',
          ...(selectedAula ? [] : [r.aula || ''])
        ]),
        theme: 'striped',
        styles: {
          fontSize: 10,
          halign: 'center'
        },
        headStyles: {
          fillColor: [99, 179, 237]
        }
      })

      doc.save(
        `asistencias_${guarderiaNombre}_${fromDate}_to_${toDate}.pdf`
      )
    } catch (err) {
      console.error('Error al generar PDF:', err)
    } finally {
      setLoading(false)
    }
  }

  const agruparRegistros = (registros: any[]): {
    nino: any
    acudiente: any
    fecha: string
    hora_entrada?: string
    hora_salida?: string
    aula?: string
  }[] => {
    const mapa = new Map<string, any>()

    registros.forEach((r) => {
      const clave = `${r.ninos.numero_documento}_${r.fecha}`

      const acudienteOTercero = r.terceros ?? r.acudientes

      if (!mapa.has(clave)) {
        mapa.set(clave, {
          nino: r.ninos,
          acudiente: acudienteOTercero,
          fecha: r.fecha,
          hora_entrada: r.tipo === 'entrada' ? r.hora : undefined,
          hora_salida: r.tipo === 'salida' ? r.hora : undefined,
          aula: r.aulas?.nombre_aula || ''
        })
      } else {
        const existente = mapa.get(clave)
        if (r.tipo === 'entrada') existente.hora_entrada = r.hora
        if (r.tipo === 'salida') existente.hora_salida = r.hora
      }
    })

    return Array.from(mapa.values())
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-3xl mx-auto mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Download className="w-6 h-6 text-blue-500" />
        Generar Reporte de Asistencias
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Guardería
          </label>
          <select
            className="w-full border-gray-300 rounded-md"
            value={selectedGuarderia}
            onChange={(e) => setSelectedGuarderia(e.target.value)}
          >
            <option value="">Selecciona una guardería</option>
            {guarderias.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Aula (opcional)
          </label>
          <select
            className="w-full border-gray-300 rounded-md"
            value={selectedAula}
            onChange={(e) => setSelectedAula(e.target.value)}
            disabled={!aulas.length}
          >
            <option value="">Todas las aulas</option>
            {aulas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre_aula}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Desde
          </label>
          <input
            type="date"
            className="w-full border-gray-300 rounded-md"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hasta
          </label>
          <input
            type="date"
            className="w-full border-gray-300 rounded-md"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={generarPDF}
        disabled={loading || !selectedGuarderia || !fromDate || !toDate}
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
      >
        {loading ? (
          <Loader2 className="animate-spin w-5 h-5" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        Generar PDF
      </button>
    </div>
  )
}
