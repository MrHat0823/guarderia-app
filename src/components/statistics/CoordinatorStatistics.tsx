// project\src\components\statistics\CoordinatorStatistics.tsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Search, Users, School, UserCheck, UserX, Activity, CalendarDays, X } from 'lucide-react'
import { isHoliday } from 'colombian-holidays'
import { formatInTimeZone } from 'date-fns-tz'

export function CoordinatorStatistics() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalNinos: 0,
    totalAcudientes: 0,
    totalPersonal: 0,
    asistieronHoy: 0,
    ausentesHoy: 0
  })

  const [ninos, setNinos] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChild, setSelectedChild] = useState<any | null>(null)
  const [childDetails, setChildDetails] = useState<any | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    if (user?.rol === 'coordinador') {
      fetchStats()
      fetchNinos()
    }
  }, [user])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const fetchStats = async () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const formattedDate = formatInTimeZone(today, 'America/Bogota', 'yyyy-MM-dd')

    if (dayOfWeek === 0 || dayOfWeek === 6 || isHoliday(today)) {
      setStats({
        totalNinos: 0,
        totalAcudientes: 0,
        totalPersonal: 0,
        asistieronHoy: 0,
        ausentesHoy: 0
      })
      return
    }

    const [ninos, acudientes, personal, asistencias] = await Promise.all([
      supabase.from('ninos').select('*'),
      supabase.from('acudientes').select('*'),
      supabase.from('users').select('*').in('rol', ['admin', 'profesor', 'portero']),
      supabase
        .from('registros_asistencia')
        .select('nino_id')
        .eq('fecha', formattedDate)
        .eq('tipo', 'entrada')
    ])

    const asistieronIds = asistencias.data?.map(r => r.nino_id) ?? []
    const totalNinos = ninos.data?.length ?? 0
    const asistieronHoy = asistieronIds.length
    const ausentesHoy = totalNinos - asistieronHoy

    setStats({
      totalNinos,
      totalAcudientes: acudientes.data?.length ?? 0,
      totalPersonal: personal.data?.length ?? 0,
      asistieronHoy,
      ausentesHoy
    })
  }

  const fetchNinos = async () => {
    const { data, error } = await supabase.from('ninos').select('id, nombres, apellidos, numero_documento')
    if (!error) setNinos(data || [])
  }

  const fetchChildDetails = async (ninoId: string) => {
    try {
      const { data: ninoData, error: ninoError } = await supabase
        .from('ninos')
        .select(`
          id, nombres, apellidos, numero_documento,
          guarderias (nombre),
          aulas (nombre_aula),
          nino_acudiente: nino_acudiente (
            tipo_parentesco,
            acudientes (
              nombres, apellidos, numero_documento
            )
          )
        `)
        .eq('id', ninoId)
        .single()

      if (ninoError || !ninoData) {
        console.error('Error al obtener datos del niño:', ninoError)
        return
      }

      const { data: registrosData, error: registrosError } = await supabase
        .from('registros_asistencia')
        .select(`
          fecha,
          hora,
          tipo,
          acudientes (nombres, apellidos),
          terceros:tercero_id (nombres, apellidos),
          users (nombres, apellidos),
          guarderias:guarderia_id (nombre)
        `)
        .eq('nino_id', ninoId)
        .order('fecha', { ascending: false })

      if (registrosError) {
        console.error('Error al obtener registros de asistencia:', registrosError)
        return
      }

      setChildDetails({
        ...ninoData,
        registros: registrosData || []
      })
      setModalOpen(true)
    } catch (err) {
      console.error('Error inesperado:', err)
    }
  }

  const handleSelectChild = async (nino: any) => {
    setSelectedChild(nino)
    const { data: ninoData, error: ninoError } = await supabase
      .from('ninos')
      .select(`
        id, nombres, apellidos, numero_documento,
        guarderias (nombre),
        aulas (nombre_aula),
        nino_acudiente (
          acudientes (
            nombres, apellidos, numero_documento
          )
        )
      `)
      .eq('id', nino.id)
      .single()

    if (ninoError || !ninoData) {
      console.error('Error al obtener datos del niño:', ninoError)
      return
    }

    const { data: registrosData, error: registrosError } = await supabase
      .from('registros_asistencia')
      .select(`
        fecha,
        hora,
        tipo,
        acudientes (nombres, apellidos),
        terceros:tercero_id (nombres, apellidos),
        users (nombres, apellidos),
        guarderias (nombre)
      `)
      .eq('nino_id', nino.id)
      .order('fecha', { ascending: false })

    if (registrosError) {
      console.error('Error al obtener registros de asistencia:', registrosError)
      return
    }

    setChildDetails({
      ...ninoData,
      registros: registrosData || []
    })

    setModalOpen(true)
  }

  const filteredAllNinos = ninos.filter((nino) => {
    const fullName = `${nino.nombres} ${nino.apellidos}`.toLowerCase()
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || nino.numero_documento?.toString().includes(query)
  })

  const totalPages = Math.ceil(filteredAllNinos.length / itemsPerPage)
  const paginatedNinos = filteredAllNinos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <School className="text-mint-600" />
        Estadísticas Globales de Guarderías
      </h2>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon={<Users />} label="Niños Registrados" value={stats.totalNinos} />
        <StatCard icon={<UserCheck />} label="Acudientes Registrados" value={stats.totalAcudientes} />
        <StatCard icon={<Activity />} label="Personal Registrado" value={stats.totalPersonal} />
        <StatCard icon={<CalendarDays />} label="Niños que Asistieron Hoy" value={stats.asistieronHoy} />
        <StatCard icon={<UserX />} label="Niños Ausentes Hoy" value={stats.ausentesHoy} />
      </div>

      {/* Búsqueda */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          Buscar Niños
        </h3>

        <input
          type="text"
          placeholder="Buscar por nombre o documento"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-colors"
        />

        {/* Lista de niños */}
        <div className="mt-6 space-y-2">
          {filteredAllNinos.length === 0 ? (
            <p className="text-sm text-gray-500">No se encontraron resultados.</p>
          ) : (
            paginatedNinos.map((nino) => (
              <div
                key={nino.id}
                onClick={() => handleSelectChild(nino)}
                className="p-4 border rounded-lg bg-gray-50 hover:bg-mint-50 transition-colors cursor-pointer"
              >
                <p className="text-gray-900 font-medium">{nino.nombres} {nino.apellidos}</p>
                <p className="text-sm text-gray-600">Doc: {nino.numero_documento}</p>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border text-sm bg-white hover:bg-gray-100 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="px-2 py-1 text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border text-sm bg-white hover:bg-gray-100 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && selectedChild && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white max-w-4xl w-full rounded-xl p-6 relative overflow-auto max-h-[90vh]">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-gray-600 hover:text-red-600">
              <X />
            </button>
            <h3 className="text-xl font-semibold mb-4">
              Detalles del niño: {selectedChild?.nombres} {selectedChild?.apellidos}
            </h3>

            {!childDetails ? (
              <p className="text-gray-500">Cargando información...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <p><strong>Documento:</strong> {selectedChild.numero_documento}</p>
                  <p><strong>Guardería:</strong> {childDetails.guarderias?.nombre || 'N/A'}</p>
                  <p><strong>Aula:</strong> {childDetails.aulas?.nombre_aula || 'N/A'}</p>
                  <div>
                    <strong>Acudiente(s):</strong>
                    {childDetails.nino_acudiente?.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm text-gray-800 list-disc list-inside">
                        {childDetails.nino_acudiente.map((rel: any, idx: number) => (
                          <li key={idx}>
                            {rel.acudientes?.nombres} {rel.acudientes?.apellidos}
                            {rel.tipo_parentesco && (
                              <span className="text-gray-500 italic"> ({rel.tipo_parentesco})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 mt-1">N/A</p>
                    )}
                  </div>
                </div>

                <h4 className="text-lg font-bold mb-2">Historial de Asistencias</h4>
                {childDetails.registros?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 border">Fecha</th>
                          <th className="p-2 border">Hora</th>
                          <th className="p-2 border">Tipo</th>
                          <th className="p-2 border">Registrado por</th>
                          <th className="p-2 border">Acudiente / Tercero</th>
                          <th className="p-2 border">Guardería</th>
                        </tr>
                      </thead>
                      <tbody>
                        {childDetails.registros.map((r: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2 border">{r.fecha}</td>
                            <td className="p-2 border">{r.hora}</td>
                            <td className="p-2 border capitalize">{r.tipo}</td>
                            <td className="p-2 border">{r.users?.nombres} {r.users?.apellidos}</td>
                            <td className="p-2 border">
                              {r.terceros
                                ? `${r.terceros.nombres} ${r.terceros.apellidos} (tercero)`
                                : r.acudientes
                                  ? `${r.acudientes.nombres} ${r.acudientes.apellidos}`
                                  : '—'}
                            </td>
                            <td className="p-2 border">{r.guarderias?.nombre}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay registros de asistencia disponibles.</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="bg-white border rounded-xl shadow-sm p-5 flex items-center gap-4">
      <div className="p-3 rounded-full bg-mint-50 text-mint-600">{icon}</div>
      <div>
        <p className="text-gray-600 text-sm">{label}</p>
        <h3 className="text-xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  )
}
