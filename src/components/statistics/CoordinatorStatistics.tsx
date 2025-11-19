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
          fiebre,
          mordidas,
          aruñado,
          golpes,
          otro,
          otro_texto,
          fiebre_salida,
          mordidas_salida,
          aruñado_salida,
          golpes_salida,
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
        fiebre,
        mordidas,
        aruñado,
        golpes,
        otro,
        otro_texto,
        fiebre_salida,
        mordidas_salida,
        aruñado_salida,
        golpes_salida,
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
                    <div className="space-y-4">
                      {childDetails.registros.map((r: any, idx: number) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-500">Fecha</p>
                              <p className="font-medium">{r.fecha}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Hora</p>
                              <p className="font-medium">{r.hora}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Tipo</p>
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                r.tipo === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                              }`}>
                                {r.tipo}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Guardería</p>
                              <p className="font-medium">{r.guarderias?.nombre || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-500">Registrado por</p>
                              <p className="font-medium">{r.users?.nombres} {r.users?.apellidos}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Acudiente / Tercero</p>
                              <p className="font-medium">
                                {r.terceros
                                  ? `${r.terceros.nombres} ${r.terceros.apellidos} (tercero)`
                                  : r.acudientes
                                    ? `${r.acudientes.nombres} ${r.acudientes.apellidos}`
                                    : '—'}
                              </p>
                            </div>
                          </div>
                          {r.tipo === 'entrada' && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-700 mb-2">Observaciones de Entrada:</p>
                              <div className="flex flex-wrap gap-2">
                                {r.fiebre && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                    <img src="/fiebre.png" alt="Fiebre" className="w-4 h-4" />
                                    Fiebre
                                  </span>
                                )}
                                {r.mordidas && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs">
                                    <img src="/mordida.png" alt="Mordidas" className="w-4 h-4" />
                                    Mordidas
                                  </span>
                                )}
                                {r.aruñado && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                                    <img src="/rasguno.png" alt="Arañado" className="w-4 h-4" />
                                    Arañado
                                  </span>
                                )}
                                {r.golpes && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                    <img src="/curita.png" alt="Golpes" className="w-4 h-4" />
                                    Golpes
                                  </span>
                                )}
                                {r.otro && r.otro_texto && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                    Otro: {r.otro_texto}
                                  </span>
                                )}
                                {!r.fiebre && !r.mordidas && !r.aruñado && !r.golpes && !r.otro && (
                                  <span className="text-xs text-gray-500">Sin observaciones</span>
                                )}
                              </div>
                            </div>
                          )}
                          {r.tipo === 'salida' && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-700 mb-2">Observaciones de Salida:</p>
                              <div className="flex flex-wrap gap-2">
                                {r.fiebre_salida && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                    <img src="/fiebre.png" alt="Fiebre" className="w-4 h-4" />
                                    Fiebre
                                  </span>
                                )}
                                {r.mordidas_salida && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs">
                                    <img src="/mordida.png" alt="Mordidas" className="w-4 h-4" />
                                    Mordidas
                                  </span>
                                )}
                                {r.aruñado_salida && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                                    <img src="/rasguno.png" alt="Arañado" className="w-4 h-4" />
                                    Arañado
                                  </span>
                                )}
                                {r.golpes_salida && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                    <img src="/curita.png" alt="Golpes" className="w-4 h-4" />
                                    Golpes
                                  </span>
                                )}
                                {!r.fiebre_salida && !r.mordidas_salida && !r.aruñado_salida && !r.golpes_salida && (
                                  <span className="text-xs text-gray-500">Sin observaciones</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
