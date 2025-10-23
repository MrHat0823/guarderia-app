import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatInTimeZone } from 'date-fns-tz'
import { CalendarDays, School } from 'lucide-react'
import { toast } from 'sonner'

export function UsersAttendanceSummary() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<string>(
    formatInTimeZone(new Date(), 'America/Bogota', 'yyyy-MM-dd')
  )
  const [absentChildren, setAbsentChildren] = useState<any[]>([])
  const [childAcudientes, setChildAcudientes] = useState<any[]>([])
  const [selectedAcudienteId, setSelectedAcudienteId] = useState<string | null>(null)
  const [selectedChild, setSelectedChild] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 10
  const maxDate = formatInTimeZone(new Date(), 'America/Bogota', 'yyyy-MM-dd')

  useEffect(() => {
    if (user?.guarderia_id) {
      fetchAbsentChildrenForDate(selectedDate)
    }
  }, [selectedDate, user?.guarderia_id])

  const fetchAbsentChildrenForDate = async (fecha: string) => {
    const { data: allChildren } = await supabase
      .from('ninos')
      .select(`
        id,
        nombres,
        apellidos,
        guarderia_id,
        aula_id,
        aulas (
          id,
          nombre_aula
        )
      `)
      .eq('activo', true)
      .eq('guarderia_id', user?.guarderia_id)

    const { data: attendanceToday } = await supabase
      .from('registros_asistencia')
      .select('nino_id')
      .eq('fecha', fecha)

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
      if (acudientesList.length > 0) {
        setSelectedAcudienteId(acudientesList[0].id)
      }
    } else {
      setChildAcudientes([])
      setSelectedAcudienteId(null)
    }
  }

  const totalPages = Math.ceil(absentChildren.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentChildren = absentChildren.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="p-6">
      {/* Fecha y encabezado */}
      <div className="mb-6 flex items-center gap-4">
        <CalendarDays className="w-6 h-6 text-mint-700" />
        <input
          type="date"
          max={maxDate}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-mint-500"
        />
      </div>

      {/* Título */}
      <h2 className="text-2xl font-bold text-mint-700 mb-6">
        Niños sin asistencia <span className="text-gray-500 text-base">({selectedDate})</span>
      </h2>

      {/* Lista o mensaje vacío */}
      {currentChildren.length === 0 ? (
        <p className="text-green-600 font-medium">Todos los niños han registrado asistencia.</p>
      ) : (
        <ul className="space-y-3">
          {currentChildren.map((child) => (
            <li
              key={child.id}
              className="p-4 rounded-xl border border-gray-200 bg-red-50 hover:bg-red-100 shadow-sm cursor-pointer transition"
              onClick={async () => {
                setSelectedChild(child)
                await fetchChildAcudientes(child.id)
                setShowModal(true)
              }}
            >
              <p className="text-base font-semibold text-gray-800">
                {child.nombres} {child.apellidos}
              </p>

              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <School className="w-4 h-4 text-mint-600" />
                Aula: {child.aulas?.nombre_aula || 'Sin aula'}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-700">
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              Registrar asistencia manual
            </h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              ¿Deseas registrar entrada (
              <span className="text-mint-700 font-semibold">08:00</span>) y salida (
              <span className="text-mint-700 font-semibold">15:00</span>) para{' '}
              <span className="font-semibold">
                {selectedChild.nombres} {selectedChild.apellidos}
              </span>{' '}
              el <span className="font-semibold">{selectedDate}</span>?
            </p>

            {childAcudientes.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selecciona un acudiente:
                </label>
                <select
                  value={selectedAcudienteId ?? ''}
                  onChange={(e) => setSelectedAcudienteId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-mint-500"
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
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                disabled={isSubmitting || !selectedAcudienteId}
                className="px-4 py-2 rounded-lg bg-mint-600 text-white hover:bg-mint-700 disabled:opacity-50 transition"
                onClick={async () => {
                  if (!selectedChild || !selectedAcudienteId || !user) {
                    toast.error('Faltan datos para registrar la asistencia')
                    return
                  }

                  setIsSubmitting(true)

                  const fecha = selectedDate
                  const entrada = '08:00:00'
                  const salida = '15:00:00'
                  const usuario_registra_id = user.id

                  const { error: insertError } = await supabase
                    .from('registros_asistencia')
                    .insert([
                      {
                        nino_id: selectedChild.id,
                        fecha,
                        tipo: 'entrada',
                        hora: entrada,
                        usuario_registra_id,
                        acudiente_id: selectedAcudienteId,
                        guarderia_id: user.guarderia_id,
                        aula_id: selectedChild.aula_id || selectedChild.aulas?.id || null,
                      },
                      {
                        nino_id: selectedChild.id,
                        fecha,
                        tipo: 'salida',
                        hora: salida,
                        usuario_registra_id,
                        acudiente_id: selectedAcudienteId,
                        guarderia_id: user.guarderia_id,
                        aula_id: selectedChild.aula_id || selectedChild.aulas?.id || null,
                      },
                    ])

                  if (insertError) {
                    toast.error('Error al registrar asistencia: ' + insertError.message)
                    setIsSubmitting(false)
                    return
                  }

                  toast.success('Asistencia registrada exitosamente')
                  setShowModal(false)
                  setSelectedChild(null)
                  setSelectedAcudienteId(null)
                  await fetchAbsentChildrenForDate(selectedDate)
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
