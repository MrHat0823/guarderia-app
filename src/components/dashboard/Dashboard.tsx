import React, { useState, useEffect } from 'react'

import { 
  Users, 
  Baby, 
  School, 
  CheckCircle, 
  Calendar, 
  Clock,
  TrendingUp,
  UserCheck,
  Eye,
  MapPin,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Activity,
  BarChart3
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useDaycareConfig } from '../../hooks/useDaycareConfig'
import type { AttendanceStats } from '../../lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'



interface ChildInFacility {
  id: string
  nombres: string
  apellidos: string
  numero_documento: string
  hora_entrada: string
  acudiente_entrada: string
  aula?: {
    nombre_aula: string
    nivel_educativo: string
  }
}

interface DashboardProps {
  onNavigate?: (tab: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth()
  const { daycareNombre } = useDaycareConfig()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<AttendanceStats>({
    totalNinos: 0,
    ninosActivos: 0,
    asistenciaHoy: 0,
    totalEntradas: 0,
    totalSalidas: 0
  })
  const [childrenInFacility, setChildrenInFacility] = useState<ChildInFacility[]>([])
  const [showChildrenList, setShowChildrenList] = useState(false)
  const [childrenSearchTerm, setChildrenSearchTerm] = useState('')

  // Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

 useEffect(() => {
  if (user?.guarderia_id) {
    const initializeData = async () => {
      setInitialLoading(true)
      await Promise.all([
        loadStats(true),
        loadChildrenInFacility()
      ])
      setInitialLoading(false)
    }

    initializeData()

    const interval = setInterval(() => {
      loadStats(false)
      loadChildrenInFacility()
    }, 30000)

    return () => clearInterval(interval)
  }
}, [user?.guarderia_id])


const loadStats = async (isInitial = false) => {
  if (isInitial) {
    setInitialLoading(true)
  } else {
    setRefreshing(true)
  }

  try {
    const now = new Date()
    const today = format(now, 'yyyy-MM-dd')

    const { count: totalNinos } = await supabase
      .from('ninos')
      .select('*', { count: 'exact', head: true })
      .eq('guarderia_id', user?.guarderia_id)

    const { count: ninosActivos } = await supabase
      .from('ninos')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true)
      .eq('guarderia_id', user?.guarderia_id)

    // SOLO ENTRADAS
    const { count: asistenciaHoy } = await supabase
      .from('registros_asistencia')
      .select('*', { count: 'exact', head: true })
      .eq('fecha', today)
      .eq('tipo', 'entrada')
      .eq('guarderia_id', user?.guarderia_id)

    const { count: totalEntradas } = await supabase
      .from('registros_asistencia')
      .select('*', { count: 'exact', head: true })
      .eq('fecha', today)
      .eq('tipo', 'entrada')
      .eq('guarderia_id', user?.guarderia_id)

    const { count: totalSalidas } = await supabase
      .from('registros_asistencia')
      .select('*', { count: 'exact', head: true })
      .eq('fecha', today)
      .eq('tipo', 'salida')
      .eq('guarderia_id', user?.guarderia_id)

    setStats({
      totalNinos: totalNinos ?? 0,
      ninosActivos: ninosActivos ?? 0,
      asistenciaHoy: asistenciaHoy ?? 0, // ✅ corregido
      totalEntradas: totalEntradas ?? 0,
      totalSalidas: totalSalidas ?? 0
    })
  } catch (error) {
    console.error('Dashboard - Error general en loadStats:', error)
    setStats({
      totalNinos: 0,
      ninosActivos: 0,
      asistenciaHoy: 0,
      totalEntradas: 0,
      totalSalidas: 0
    })
  } finally {
    if (isInitial) {
      setInitialLoading(false)
    } else {
      setRefreshing(false)
    }
  }
}



const loadChildrenInFacility = async () => {
  try {
    const today = format(new Date(), "yyyy-MM-dd");

    const { data: todayRecords, error: recordsError } = await supabase
      .from("registros_asistencia")
      .select(`
        nino_id,
        tipo,
        hora,
        acudientes (
          nombres,
          apellidos
        ),
        terceros (
          nombres,
          apellidos
        ),
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
      .eq("fecha", today)
      .eq("guarderia_id", user?.guarderia_id)
      .order("hora", { ascending: true });

    if (recordsError) {
      throw new Error(`Error al obtener registros: ${recordsError.message}`);
    }

    if (!todayRecords || todayRecords.length === 0) {
      setChildrenInFacility([]);
      return;
    }

    const childrenStatus = new Map<
      string,
      { child: any; lastRecord: any; isInFacility: boolean }
    >();

    todayRecords.forEach((record) => {
      const ninoId = record.nino_id;
      const isEntrada = record.tipo === "entrada";

      if (!childrenStatus.has(ninoId)) {
        childrenStatus.set(ninoId, {
          child: record.ninos,
          lastRecord: record,
          isInFacility: isEntrada,
        });
      } else {
        const current = childrenStatus.get(ninoId)!;
        if (record.hora > current.lastRecord.hora) {
          current.lastRecord = record;
          current.isInFacility = isEntrada;
        }
      }
    });

    const ninosEnPlantel: ChildInFacility[] = [];

    childrenStatus.forEach((status, ninoId) => {
      if (status.isInFacility) {
        const entradaRecord = todayRecords
          .filter((r) => r.nino_id === ninoId && r.tipo === "entrada")
          .sort((a, b) => b.hora.localeCompare(a.hora))[0];

        if (entradaRecord) {
          let nombreRegistrador = "";

          if (entradaRecord.terceros) {
            nombreRegistrador = `${entradaRecord.terceros.nombres} ${entradaRecord.terceros.apellidos} (tercero)`;
          } else if (entradaRecord.acudientes) {
            nombreRegistrador = `${entradaRecord.acudientes.nombres} ${entradaRecord.acudientes.apellidos}`;
          } else {
            nombreRegistrador = "Desconocido";
          }

          ninosEnPlantel.push({
            id: status.child.id,
            nombres: status.child.nombres,
            apellidos: status.child.apellidos,
            numero_documento: status.child.numero_documento,
            hora_entrada: entradaRecord.hora,
            acudiente_entrada: nombreRegistrador,
            aula: status.child.aulas,
          });
        }
      }
    });

    setChildrenInFacility(ninosEnPlantel);
  } catch (error) {
    console.error("Dashboard - Error loading children in facility:", error);
    setChildrenInFacility([]);
  }
};



  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return { text: 'Buenos días', icon: Sunrise, color: 'text-yellow-600' }
    if (hour < 18) return { text: 'Buenas tardes', icon: Sun, color: 'text-orange-600' }
    return { text: 'Buenas noches', icon: Moon, color: 'text-indigo-600' }
  }

  const getTimeIcon = () => {
    const hour = currentTime.getHours()
    if (hour >= 6 && hour < 12) return { icon: Sunrise, color: 'bg-yellow-100 text-yellow-600' }
    if (hour >= 12 && hour < 18) return { icon: Sun, color: 'bg-orange-100 text-orange-600' }
    if (hour >= 18 && hour < 21) return { icon: Sunset, color: 'bg-red-100 text-red-600' }
    return { icon: Moon, color: 'bg-indigo-100 text-indigo-600' }
  }

  const handleQuickAction = (action: string) => {
    if (onNavigate) {
      onNavigate(action)
    }
  }

  const StatCard = ({ icon: Icon, title, value, color, trend, onClick, refreshing }: {
    icon: React.ComponentType<any>
    title: string
    value: number
    color: string
    trend?: string
    onClick?: () => void
    refreshing?: boolean
  }) => (
    <div 
      className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      } ${refreshing ? 'border-mint-200 shadow-mint-100' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold text-gray-900 mt-2 transition-all duration-300 ${
            refreshing ? 'animate-pulse' : ''
          }`}>
            {value}
          </p>
          {trend && (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${color} ${
          refreshing ? 'animate-pulse' : ''
        }`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {onClick && (
        <div className="mt-3 flex items-center text-sm text-blue-600">
          <Eye className="w-4 h-4 mr-1" />
          Ver detalles
        </div>
      )}
    </div>
  )

  const greeting = getGreeting()
  const timeIcon = getTimeIcon()
  const normalizedSearch = childrenSearchTerm.trim().toLowerCase()
  const filteredChildrenInFacility = childrenInFacility.filter((child) =>
    `${child.nombres} ${child.apellidos}`.toLowerCase().includes(normalizedSearch)
  )

  // Solo mostrar pantalla de carga completa en la carga inicial
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint-50 via-sky-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-mint-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-mint-600"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Inicializando Dashboard</h3>
          <p className="text-gray-600">Cargando información del sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 via-sky-50 to-blue-50">

      {/* Header con mensaje de bienvenida */}
      <div className={`bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10 transition-all duration-300 ${
        refreshing ? 'border-mint-300' : ''
      }`}>
        <div className="p-6">
          {/* Indicador sutil de actualización */}
          {refreshing && (
            <div className="mb-4 flex items-center justify-center">
              <div className="bg-mint-50 border border-mint-200 rounded-full px-4 py-2 flex items-center gap-2">
                <div className="w-3 h-3 bg-mint-500 rounded-full animate-pulse"></div>
                <span className="text-mint-700 text-sm font-medium">Actualizando datos...</span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${timeIcon.color}`}>
                <timeIcon.icon className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className={`text-2xl font-bold ${greeting.color}`}>
                    {greeting.text}, {user?.nombres}!
                  </h1>
                  <greeting.icon className={`w-6 h-6 ${greeting.color}`} />
                </div>
                <p className="text-gray-600">
                  Bienvenido al sistema de gestión de {daycareNombre}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col lg:items-end gap-2">
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="w-5 h-5 text-mint-600" />
                <span className="font-medium">
                  {format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="w-5 h-5 text-mint-600" />
                <span className={`font-mono text-lg font-bold text-mint-700 transition-all duration-300 ${
                  refreshing ? 'animate-pulse' : ''
                }`}>
                  {format(currentTime, 'HH:mm:ss')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Estadísticas principales */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 transition-all duration-300 ${
          refreshing ? 'opacity-90' : 'opacity-100'
        }`}>
          <StatCard
            icon={Baby}
            title="Total Niños"
            value={stats.totalNinos}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            icon={CheckCircle}
            title="Niños Activos"
            value={stats.ninosActivos}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            icon={UserCheck}
            title="Asistencia Hoy"
            value={stats.asistenciaHoy}
            color="bg-mint-100 text-mint-600"
          />
          <StatCard
            icon={MapPin}
            title="En el Plantel"
            value={childrenInFacility.length}
            color="bg-purple-100 text-purple-600"
            onClick={() => {
              setChildrenSearchTerm('')
              setShowChildrenList(true)
            }}
            refreshing={refreshing}
          />
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-300 ${
          refreshing ? 'opacity-90' : 'opacity-100'
        }`}>
          {/* Resumen del día */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-mint-600" />
              Actividad del día
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Entradas</p>
                    <p className="text-sm text-gray-600">Niños que llegaron hoy</p>
                  </div>
                </div>
                <span className="text-3xl font-bold text-green-600">
                  {stats.totalEntradas}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Salidas</p>
                    <p className="text-sm text-gray-600">Niños que se fueron</p>
                  </div>
                </div>
                <span className="text-3xl font-bold text-orange-600">
                  {stats.totalSalidas}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">En el plantel</p>
                    <p className="text-sm text-gray-600">Niños actualmente presentes</p>
                  </div>
                </div>
                <span className="text-3xl font-bold text-purple-600">
                  {childrenInFacility.length}
                </span>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-mint-600" />
              Acciones rápidas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleQuickAction('attendance')}
                className="group p-6 bg-gradient-to-br from-mint-50 to-mint-100 rounded-xl hover:from-mint-100 hover:to-mint-200 transition-all duration-200 border border-mint-200 hover:shadow-md"
              >
                <UserCheck className="w-10 h-10 text-mint-600 mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-gray-900">
                  Registrar Asistencia
                </p>
              </button>
              
              <button 
                onClick={() => handleQuickAction('statistics')}
                className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200 hover:shadow-md"
              >
                <BarChart3 className="w-10 h-10 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-gray-900">
                  Ver Estadísticas
                </p>
              </button>
              
              {user?.rol === 'admin' && (
                <button 
                  onClick={() => handleQuickAction('children')}
                  className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-200 border border-purple-200 hover:shadow-md"
                >
                  <Baby className="w-10 h-10 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-gray-900">
                    Gestionar Niños
                  </p>
                </button>
              )}
              {user?.rol === 'admin' && (
              <button 
                onClick={() => handleQuickAction('classrooms')}
                className="group p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-200 border border-green-200 hover:shadow-md"
              >
                <School className="w-10 h-10 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-gray-900">
                  Ver Aulas
                </p>
              </button>
              )}

            </div>
          </div>
        </div>

        {/* Modal para mostrar niños en el plantel */}
        {showChildrenList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-purple-600" />
                      Niños actualmente en el plantel
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {childrenInFacility.length} niños con entrada registrada sin salida del día
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full lg:w-auto">
                    <input
                      type="text"
                      value={childrenSearchTerm}
                      onChange={(e) => setChildrenSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre o apellido..."
                      className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-mint-500 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        setShowChildrenList(false)
                        setChildrenSearchTerm('')
                      }}
                      className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {filteredChildrenInFacility.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredChildrenInFacility.map((child) => (
                      <div key={child.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Baby className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {child.nombres} {child.apellidos}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Doc: {child.numero_documento}
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-green-600" />
                                <span className="text-gray-600">Entrada:</span>
                               <span className="font-medium text-green-600">
                                  {child.hora_entrada.substring(0, 8)}
                                </span>

                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-600" />
                                <span className="text-gray-600">Acudiente:</span>
                                <span className="font-medium text-blue-600">
                                  {child.acudiente_entrada}
                                </span>
                              </div>
                              
                              {child.aula && (
                                <div className="flex items-center gap-2">
                                  <School className="w-4 h-4 text-orange-600" />
                                  <span className="text-gray-600">Aula:</span>
                                  <span className="font-medium text-orange-600">
                                    {child.aula.nombre_aula} - {child.aula.nivel_educativo}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No hay niños en el plantel
                    </h3>
                    <p className="text-gray-600">
                      Todos los niños han salido o no hay registros de entrada para hoy.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}