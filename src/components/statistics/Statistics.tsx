import React, { useState, useEffect } from 'react'
import { toZonedTime } from 'date-fns-tz'
import { es } from 'date-fns/locale'
import { format, subDays, parseISO } from 'date-fns'
import {
  BarChart3,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Baby,
  Search,
  User,
  Shield,
  UserCheck,
  Eye
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

/* ✅ Tipos */

interface AttendanceRecord {
  id: string
  fecha: string
  hora: string
  tipo: 'entrada' | 'salida'
  anotacion?: string
  nino?: {
    nombres: string
    apellidos: string
    numero_documento: string
  }
  acudiente?: {
    nombres: string
    apellidos: string
    numero_documento: string
  }
  usuario_registra?: {
    nombres: string
    apellidos: string
    rol: string
  }
}

interface ChildStats {
  id: string
  nombres: string
  apellidos: string
  numero_documento: string
  aula?: {
    nombre_aula: string
    nivel_educativo: string
  }
  total_registros: number
  entradas: number
  salidas: number
  ultimo_registro?: string
}

interface UserStats {
  id: string
  nombres: string
  apellidos: string
  numero_documento: string
  rol: string
  total_registros: number
  dias_trabajados: number
  ultimo_registro: string
}

export function Statistics() {
  const [activeSection, setActiveSection] = useState<'overview' | 'children' | 'users'>('overview')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const [childSearch, setChildSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [selectedChild, setSelectedChild] = useState<ChildStats | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null)

  const [overviewStats, setOverviewStats] = useState({
    totalRegistros: 0,
    totalEntradas: 0,
    totalSalidas: 0,
    diasActivos: 0
  })
  const [childrenStats, setChildrenStats] = useState<ChildStats[]>([])
  const [usersStats, setUsersStats] = useState<UserStats[]>([])
  const [selectedHistory, setSelectedHistory] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    if (user?.guarderia_id) {
      loadStatistics()
    }
  }, [user])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      await Promise.all([loadOverviewStats(), loadChildrenStats(), loadUsersStats()])
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOverviewStats = async () => {
    const { data, error } = await supabase
      .from('registros_asistencia')
      .select('fecha, tipo')
      .eq('guarderia_id', user?.guarderia_id)

    if (error) throw error

    const totalRegistros = data.length
    const totalEntradas = data.filter((r) => r.tipo === 'entrada').length
    const totalSalidas = data.filter((r) => r.tipo === 'salida').length
    const diasActivos = new Set(data.map((r) => r.fecha)).size

    setOverviewStats({
      totalRegistros,
      totalEntradas,
      totalSalidas,
      diasActivos
    })
  }

  const loadChildrenStats = async () => {
    const { data, error } = await supabase
      .from('registros_asistencia')
      .select(`
        id,
        fecha,
        tipo,
        nino_id,
        ninos (
          id,
          nombres,
          apellidos,
          numero_documento,
          aulas (
            nombre_aula,
            nivel_educativo
          )
        )
      `)
      .eq('guarderia_id', user?.guarderia_id)
      .not('nino_id', 'is', null)

    if (error) throw error

    const childStats = data.reduce<Record<string, ChildStats>>((acc, record) => {
      const child = record.ninos
      if (!child) return acc

      if (!acc[child.id]) {
        acc[child.id] = {
          id: child.id,
          nombres: child.nombres,
          apellidos: child.apellidos,
          numero_documento: child.numero_documento,
          aula: child.aulas,
          total_registros: 0,
          entradas: 0,
          salidas: 0,
          ultimo_registro: record.fecha
        }
      }

      acc[child.id].total_registros++
      if (record.tipo === 'entrada') acc[child.id].entradas++
      else if (record.tipo === 'salida') acc[child.id].salidas++

      if (record.fecha > (acc[child.id].ultimo_registro || '')) {
        acc[child.id].ultimo_registro = record.fecha
      }

      return acc
    }, {})

    setChildrenStats(Object.values(childStats).sort((a, b) => b.total_registros - a.total_registros))
  }

  const loadUsersStats = async (): Promise<void> => {
    const { data, error } = await supabase
      .from('registros_asistencia')
      .select(`
        fecha,
        usuario_registra:users!registros_asistencia_usuario_registra_id_fkey (
          id,
          nombres,
          apellidos,
          numero_documento,
          rol
        )
      `)
      .eq('guarderia_id', user?.guarderia_id)

    if (error) throw error

    const userStats = (data || []).reduce<
      Record<
        string,
        {
          id: string
          nombres: string
          apellidos: string
          numero_documento: string
          rol: string
          total_registros: number
          dias_trabajados: Set<string>
          ultimo_registro: string
        }
      >
    >((acc, record) => {
      const userRegistra = record.usuario_registra
      if (!userRegistra) return acc

      if (!acc[userRegistra.id]) {
        acc[userRegistra.id] = {
          id: userRegistra.id,
          nombres: userRegistra.nombres,
          apellidos: userRegistra.apellidos,
          numero_documento: userRegistra.numero_documento,
          rol: userRegistra.rol,
          total_registros: 0,
          dias_trabajados: new Set<string>(),
          ultimo_registro: record.fecha
        }
      }

      acc[userRegistra.id].total_registros++
      acc[userRegistra.id].dias_trabajados.add(record.fecha)

      if (record.fecha > acc[userRegistra.id].ultimo_registro) {
        acc[userRegistra.id].ultimo_registro = record.fecha
      }

      return acc
    }, {})

    const processedStats: UserStats[] = Object.values(userStats)
      .map((stat) => ({
        ...stat,
        dias_trabajados: stat.dias_trabajados.size
      }))
      .sort((a, b) => b.total_registros - a.total_registros)

    setUsersStats(processedStats)
  }

  const loadHistory = async (type: 'child' | 'user', id: string) => {
    const today = new Date()
    const startDate = subDays(today, 30)

    const { data, error } = await supabase
      .from('registros_asistencia')
      .select(`
        id,
        fecha,
        hora,
        tipo,
        anotacion,
        ninos (
          nombres,
          apellidos,
          numero_documento
        ),
        acudientes (
          nombres,
          apellidos,
          numero_documento
        ),
        terceros (
          nombres,
          apellidos,
          numero_documento
        ),
        usuario_registra:users (
          nombres,
          apellidos,
          rol
        )
      `)
      .eq(type === 'child' ? 'nino_id' : 'usuario_registra_id', id)
      .eq('guarderia_id', user?.guarderia_id)
      .gte('fecha', format(startDate, 'yyyy-MM-dd'))
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })

    if (error) {
      console.error('Error loading history:', error)
      setSelectedHistory([])
      return
    }

    const filtered: AttendanceRecord[] = (data || []).map((record) => {
    //  const utcDate = parseISO(record.fecha)
    //  const zonedDate = toZonedTime(utcDate, 'America/Bogota')

      const isTercero = !record.acudientes && !!record.terceros

      return {
        id: record.id,
        fecha: format(new Date(record.fecha + 'T00:00:00'), 'yyyy-MM-dd'),
        hora: record.hora,
        tipo: record.tipo,
        anotacion: record.anotacion,
        nino: record.ninos
          ? {
              nombres: record.ninos.nombres,
              apellidos: record.ninos.apellidos,
              numero_documento: record.ninos.numero_documento
            }
          : undefined,
        acudiente: isTercero
          ? {
              nombres: `${record.terceros?.nombres || ''} (Tercero)`,
              apellidos: record.terceros?.apellidos || '',
              numero_documento: record.terceros?.numero_documento || ''
            }
          : record.acudientes
          ? {
              nombres: record.acudientes.nombres,
              apellidos: record.acudientes.apellidos,
              numero_documento: record.acudientes.numero_documento
            }
          : undefined,
        usuario_registra: record.usuario_registra
          ? {
              nombres: record.usuario_registra.nombres,
              apellidos: record.usuario_registra.apellidos,
              rol: record.usuario_registra.rol
            }
          : undefined
      }
    })

    setSelectedHistory(filtered)
  }

  const handleChildSelect = async (child: ChildStats) => {
    setSelectedChild(child)
    await loadHistory('child', child.id)
  }

  const handleUserSelect = async (user: UserStats) => {
    setSelectedUser(user)
    await loadHistory('user', user.id)
  }

  const filteredChildren = childrenStats.filter((child) => {
    if (!childSearch.trim()) return true
    const searchLower = childSearch.toLowerCase()
    const fullName = `${child.nombres} ${child.apellidos}`.toLowerCase()
    return fullName.includes(searchLower) || child.numero_documento.includes(searchLower)
  })

  const filteredUsers = usersStats.filter((user) => {
    if (!userSearch.trim()) return true
    const searchLower = userSearch.toLowerCase()
    const fullName = `${user.nombres} ${user.apellidos}`.toLowerCase()
    return fullName.includes(searchLower) || user.numero_documento.includes(searchLower)
  })

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color
  }: {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    color: string
  }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Estadísticas
          </h1>
          <p className="text-gray-600">
            Análisis detallado de asistencia y actividad del sistema
          </p>
        </div>
        <div className="flex gap-2">
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
        <button
          onClick={() => setActiveSection('overview')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'overview'
              ? 'bg-white text-mint-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Resumen General
        </button>
        <button
          onClick={() => setActiveSection('children')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'children'
              ? 'bg-white text-mint-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Baby className="w-4 h-4" />
          Estadísticas por Niño
        </button>
        <button
          onClick={() => setActiveSection('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'users'
              ? 'bg-white text-mint-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Estadísticas por Usuario
        </button>
      </div>

      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total registros"
              value={overviewStats.totalRegistros}
              subtitle="En el período seleccionado"
              icon={BarChart3}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              title="Entradas totales"
              value={overviewStats.totalEntradas}
              subtitle="Niños que ingresaron"
              icon={TrendingUp}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              title="Salidas totales"
              value={overviewStats.totalSalidas}
              subtitle="Niños que salieron"
              icon={Clock}
              color="bg-orange-100 text-orange-600"
            />
            <StatCard
              title="Días activos"
              value={overviewStats.diasActivos}
              subtitle="Días con registros"
              icon={Calendar}
              color="bg-purple-100 text-purple-600"
            />
          </div>
        </div>
      )}

      {/* Children Section */}
      {activeSection === 'children' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Baby className="w-5 h-5 text-blue-600" />
                Buscar Niño
              </h3>
              <div className="relative">
                <input
                  type="text"
                  value={childSearch}
                  onChange={(e) => setChildSearch(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                  placeholder="Buscar por nombre o documento..."
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {filteredChildren.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleChildSelect(child)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedChild?.id === child.id
                        ? 'border-mint-500 bg-mint-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{child.nombres} {child.apellidos}</p>
                        <p className="text-sm text-gray-600">Doc: {child.numero_documento}</p>
                        {child.aula && (
                          <p className="text-sm text-gray-500">{child.aula.nombre_aula}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-mint-600">{child.total_registros}</p>
                        <p className="text-xs text-gray-500">registros</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-600" />
                Historial de Asistencia
              </h3>
              {selectedChild && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-900">{selectedChild.nombres} {selectedChild.apellidos}</p>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                    <div>
                      <span className="text-blue-700">Total: </span>
                      <span className="font-bold">{selectedChild.total_registros}</span>
                    </div>
                    <div>
                      <span className="text-green-700">Entradas: </span>
                      <span className="font-bold">{selectedChild.entradas}</span>
                    </div>
                    <div>
                      <span className="text-orange-700">Salidas: </span>
                      <span className="font-bold">{selectedChild.salidas}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {selectedChild ? (
                <div className="space-y-3">
                  {selectedHistory.map((record) => (
                    <div key={record.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            record.tipo === 'entrada' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {record.tipo}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {format(new Date(record.fecha + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}

                          </span>
                          <span className="text-sm text-gray-600">{record.hora.split('.')[0]}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>Acudiente:</strong> {record.acudiente?.nombres} {record.acudiente?.apellidos}</p>
                        <p><strong>Registrado por:</strong> {record.usuario_registra?.nombres} {record.usuario_registra?.apellidos} ({record.usuario_registra?.rol})</p>
                        {record.anotacion && (
                          <p><strong>Nota:</strong> {record.anotacion}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedHistory.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay registros en los últimos 30 días</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Seleccione un niño para ver su historial</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Users Section */}
      {activeSection === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-600" />
                Buscar Usuario
              </h3>
              <div className="relative">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                  placeholder="Buscar por nombre o documento..."
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedUser?.id === user.id
                        ? 'border-mint-500 bg-mint-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          user.rol === 'admin' ? 'bg-red-100' :
                          user.rol === 'profesor' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {user.rol === 'admin' ? (
                            <Shield className={`w-5 h-5 text-red-600`} />
                          ) : user.rol === 'profesor' ? (
                            <User className={`w-5 h-5 text-blue-600`} />
                          ) : (
                            <UserCheck className={`w-5 h-5 text-green-600`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.nombres} {user.apellidos}</p>
                          <p className="text-sm text-gray-600 capitalize">{user.rol}</p>
                          <p className="text-sm text-gray-500">Doc: {user.numero_documento}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-mint-600">{user.total_registros}</p>
                        <p className="text-xs text-gray-500">{user.dias_trabajados} días</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-600" />
                Historial de Actividad
              </h3>
              {selectedUser && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <p className="font-medium text-purple-900">{selectedUser.nombres} {selectedUser.apellidos}</p>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                    <div>
                      <span className="text-purple-700">Registros: </span>
                      <span className="font-bold">{selectedUser.total_registros}</span>
                    </div>
                    <div>
                      <span className="text-purple-700">Días trabajados: </span>
                      <span className="font-bold">{selectedUser.dias_trabajados}</span>
                    </div>
                    <div>
                      <span className="text-purple-700">Rol: </span>
                      <span className="font-bold capitalize">{selectedUser.rol}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {selectedUser ? (
                <div className="space-y-3">
                  {selectedHistory.map((record) => (
                    <div key={record.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            record.tipo === 'entrada' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {record.tipo}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {format(new Date(record.fecha), 'dd/MM/yyyy', { locale: es })}
                          </span>
                          <span className="text-sm text-gray-600">{record.hora.split('.')[0]}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>Niño:</strong> {record.nino?.nombres} {record.nino?.apellidos}</p>
                        <p><strong>Acudiente:</strong> {record.acudiente?.nombres} {record.acudiente?.apellidos}</p>

                        <p><strong>Registrado por:</strong> {record.usuario_registra?.nombres} {record.usuario_registra?.apellidos} ({record.usuario_registra?.rol})</p>
                        {record.anotacion && (
                          <p><strong>Nota:</strong> {record.anotacion}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedHistory.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay registros en los últimos 30 días</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Seleccione un usuario para ver su historial</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}