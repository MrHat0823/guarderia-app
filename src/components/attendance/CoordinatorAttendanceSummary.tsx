import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CalendarDays } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { formatInTimeZone } from 'date-fns-tz'
import { toast } from 'sonner'


export function CoordinatorAttendanceSummary() {
  const { user } = useAuth()
  const [guarderias, setGuarderias] = useState<any[]>([])
  const [selectedGuarderia, setSelectedGuarderia] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [absentChildren, setAbsentChildren] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [selectedChild, setSelectedChild] = useState<any>(null)
  const [childAcudientes, setChildAcudientes] = useState<any[]>([])
  const [selectedAcudienteId, setSelectedAcudienteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const itemsPerPage = 10
  const maxDate = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchGuarderias()
  }, [])

  useEffect(() => {
    if (selectedGuarderia) {
      fetchAbsentChildrenForDateAndGuarderia(selectedDate, selectedGuarderia)
    }
  }, [selectedDate, selectedGuarderia])

  const fetchGuarderias = async () => {
    const { data, error } = await supabase.from('guarderias').select('id, nombre')
    if (!error && data) {
      setGuarderias(data)
      if (data.length > 0) setSelectedGuarderia(data[0].id)
    }
  }

  const fetchAbsentChildrenForDateAndGuarderia = async (date: Date, guarderiaId: string) => {
    const fecha = formatInTimeZone(date, 'America/Bogota', 'yyyy-MM-dd')

    const { data: allChildren } = await supabase
      .from('ninos')
      .select(`id, nombres, apellidos, aula_id`)
      .eq('activo', true)
      .eq('guarderia_id', guarderiaId)

    const { data: attendanceToday } = await supabase
      .from('registros_asistencia')
      .select('nino_id')
      .eq('fecha', fecha)
      .eq('guarderia_id', guarderiaId)

    if (!allChildren || !attendanceToday) return

    const attendedIds = attendanceToday.map(r => r.nino_id)
    const absent = allChildren.filter(child => !attendedIds.includes(child.id))

    setAbsentChildren(absent)
    setCurrentPage(1)
  }

  const fetchChildAcudientes = async (ninoId: string) => {
    const { data, error } = await supabase
      .from('nino_acudiente')
      .select('acudiente_id, acudientes(id, nombres, apellidos)')
      .eq('nino_id', ninoId)

    if (!error && data) {
      const acudientesList = data.map((a: any) => ({
        id: a.acudiente_id,
        nombre: `${a.acudientes.nombres} ${a.acudientes.apellidos}`
      }))
      setChildAcudientes(acudientesList)
      if (acudientesList.length > 0) setSelectedAcudienteId(acudientesList[0].id)
    } else {
      setChildAcudientes([])
      setSelectedAcudienteId(null)
    }
  }

  const formattedDate = selectedDate.toISOString().split('T')[0]
  const totalPages = Math.ceil(absentChildren.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentChildren = absentChildren.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Resumen Coordinador</h1>
          <p className="text-gray-600">Niños ausentes por guardería y fecha</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={selectedGuarderia ?? ''}
            onChange={(e) => setSelectedGuarderia(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            {guarderias.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
          <input
            type="date"
            max={maxDate}
            value={formattedDate}
            onChange={(e) => {
              setSelectedDate(new Date(`${e.target.value}T00:00:00`))
            }}
            className="px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white border p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-red-600" />
            Niños que no asistieron el {selectedDate.toLocaleDateString()}
          </h3>
          <span className="text-sm text-gray-600">
            Total ausentes:{' '}
            <span className="font-semibold text-red-600">{absentChildren.length}</span>
          </span>
        </div>

        {currentChildren.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-4 text-gray-700 font-medium">Nombre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentChildren.map((child) => (
                    <tr
                      key={child.id}
                      className="hover:bg-gray-100 cursor-pointer"
                      onClick={async () => {
                        setSelectedChild(child)
                        await fetchChildAcudientes(child.id)
                        setShowModal(true)
                      }}
                    >
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {child.nombres} {child.apellidos}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end items-center gap-4 pt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </>
        ) : (
          <p className="text-green-600 font-medium">Todos los niños asistieron ese día.</p>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              Registrar asistencia manual
            </h3>
            <p className="text-gray-700 mb-4">
              ¿Deseas registrar entrada (08:00) y salida (15:00) para{' '}
              <span className="font-semibold">{selectedChild.nombres} {selectedChild.apellidos}</span> el{' '}
              <span className="font-semibold">{selectedDate.toLocaleDateString()}</span>?
            </p>

            {childAcudientes.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Selecciona un acudiente:</label>
                <select
                  value={selectedAcudienteId ?? ''}
                  onChange={(e) => setSelectedAcudienteId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {childAcudientes.map((acudiente) => (
                    <option key={acudiente.id} value={acudiente.id}>
                      {acudiente.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                disabled={isSubmitting || !selectedAcudienteId}
                className="px-4 py-2 rounded-lg bg-mint-600 text-white hover:bg-mint-700 disabled:opacity-50"
                onClick={async () => {
                  if (!selectedAcudienteId) {
                    alert('Selecciona un acudiente')
                    return
                  }

                  setIsSubmitting(true)
                  const fecha = selectedDate.toISOString().split('T')[0]
                  const entrada = '08:00:00'
                  const salida = '15:00:00'
                  const usuario_registra_id = user?.id ?? 'system'

                  const { error: insertError } = await supabase.from('registros_asistencia').insert([
                    {
                      nino_id: selectedChild.id,
                      fecha,
                      tipo: 'entrada',
                      hora: entrada,
                      usuario_registra_id,
                      acudiente_id: selectedAcudienteId,
                      guarderia_id: selectedGuarderia,
                      aula_id: selectedChild.aula_id
                    },
                    {
                      nino_id: selectedChild.id,
                      fecha,
                      tipo: 'salida',
                      hora: salida,
                      usuario_registra_id,
                      acudiente_id: selectedAcudienteId,
                      guarderia_id: selectedGuarderia,
                      aula_id: selectedChild.aula_id
                    }
                  ])

                  if (insertError) {
                    alert('Error al registrar asistencia: ' + insertError.message)
                    setIsSubmitting(false)
                    return
                  }

                  toast.success('Asistencia registrada correctamente')
                  setShowModal(false)
                  setSelectedChild(null)
                  setSelectedAcudienteId(null)
                  await fetchAbsentChildrenForDateAndGuarderia(selectedDate, selectedGuarderia!)
                  setIsSubmitting(false)
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

