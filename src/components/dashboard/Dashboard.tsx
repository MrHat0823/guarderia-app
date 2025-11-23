import React, { useState, useEffect } from 'react'

import { 
  Users, 
  Baby, 
  School, 
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
  BarChart3,
  Search,
  X,
  Cake
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
    totalSalidas: 0,
    inasistencia: 0
  })
  const [childrenInFacility, setChildrenInFacility] = useState<ChildInFacility[]>([])
  const [showChildrenList, setShowChildrenList] = useState(false)
  const [childrenSearchTerm, setChildrenSearchTerm] = useState('')
  const [showQuickSearch, setShowQuickSearch] = useState(false)
  const [acudienteSearchTerm, setAcudienteSearchTerm] = useState('')
  const [ninoSearchTerm, setNinoSearchTerm] = useState('')
  const [acudienteResult, setAcudienteResult] = useState<any>(null)
  const [ninoResult, setNinoResult] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const [showChildrenByClassroom, setShowChildrenByClassroom] = useState(false)
  const [aulas, setAulas] = useState<any[]>([])
  const [selectedAulaId, setSelectedAulaId] = useState('')
  const [childrenByClassroom, setChildrenByClassroom] = useState<any[]>([])
  const [loadingChildren, setLoadingChildren] = useState(false)
  const [showBirthdaysModal, setShowBirthdaysModal] = useState(false)
  const [birthdayChildren, setBirthdayChildren] = useState<any[]>([])

  // Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user?.guarderia_id) {
      loadAulasForClassroom()
      loadBirthdayChildren()
      
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
        loadBirthdayChildren()
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

    const ninosActivosCount = ninosActivos ?? 0
    const asistenciaHoyCount = asistenciaHoy ?? 0
    const inasistenciaCount = Math.max(0, ninosActivosCount - asistenciaHoyCount)

    setStats({
      totalNinos: totalNinos ?? 0,
      ninosActivos: ninosActivosCount,
      asistenciaHoy: asistenciaHoyCount,
      totalEntradas: totalEntradas ?? 0,
      totalSalidas: totalSalidas ?? 0,
      inasistencia: inasistenciaCount
    })
  } catch (error) {
    console.error('Dashboard - Error general en loadStats:', error)
    setStats({
      totalNinos: 0,
      ninosActivos: 0,
      asistenciaHoy: 0,
      totalEntradas: 0,
      totalSalidas: 0,
      inasistencia: 0
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

  const searchAcudiente = async (searchTerm: string) => {
    if (!searchTerm.trim() || !user?.guarderia_id) {
      setAcudienteResult(null)
      return
    }

    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('acudientes')
        .select(`
          id,
          nombres,
          apellidos,
          tipo_documento,
          numero_documento,
          nino_acudiente (
            parentesco,
            ninos (
              id,
              nombres,
              apellidos,
              aulas (
                nombre_aula,
                nivel_educativo
              )
            )
          )
        `)
        .eq('guarderia_id', user.guarderia_id)
        .or(`nombres.ilike.%${searchTerm}%,apellidos.ilike.%${searchTerm}%,numero_documento.ilike.%${searchTerm}%`)
        .limit(1)
        .maybeSingle()

      if (error) throw error
      setAcudienteResult(data)
    } catch (error) {
      console.error('Error buscando acudiente:', error)
      setAcudienteResult(null)
    } finally {
      setSearching(false)
    }
  }

  const searchNino = async (searchTerm: string) => {
    if (!searchTerm.trim() || !user?.guarderia_id) {
      setNinoResult(null)
      return
    }

    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('ninos')
        .select(`
          id,
          nombres,
          apellidos,
          tipo_documento,
          numero_documento,
          nino_acudiente (
            parentesco,
            acudientes (
              id,
              nombres,
              apellidos
            )
          )
        `)
        .eq('guarderia_id', user.guarderia_id)
        .or(`nombres.ilike.%${searchTerm}%,apellidos.ilike.%${searchTerm}%,numero_documento.ilike.%${searchTerm}%`)
        .limit(1)
        .maybeSingle()

      if (error) throw error
      setNinoResult(data)
    } catch (error) {
      console.error('Error buscando niño:', error)
      setNinoResult(null)
    } finally {
      setSearching(false)
    }
  }

  const handleAcudienteSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchAcudiente(acudienteSearchTerm)
  }

  const handleNinoSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchNino(ninoSearchTerm)
  }

  const resetQuickSearch = () => {
    setShowQuickSearch(false)
    setAcudienteSearchTerm('')
    setNinoSearchTerm('')
    setAcudienteResult(null)
    setNinoResult(null)
  }

  const loadAulasForClassroom = async () => {
    try {
      if (!user?.guarderia_id) return

      const { data, error } = await supabase
        .from('aulas')
        .select('*')
        .eq('guarderia_id', user.guarderia_id)
        .order('nombre_aula')

      if (error) throw error
      setAulas(data || [])
    } catch (error) {
      console.error('Error loading aulas:', error)
      setAulas([])
    }
  }

  const loadChildrenByClassroom = async (aulaId: string) => {
    if (!aulaId || !user?.guarderia_id) {
      setChildrenByClassroom([])
      return
    }

    setLoadingChildren(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')

      // Cargar niños del aula
      const { data: ninos, error: ninosError } = await supabase
        .from('ninos')
        .select('id, nombres, apellidos, numero_documento, fecha_nacimiento')
        .eq('aula_id', aulaId)
        .eq('guarderia_id', user.guarderia_id)
        .eq('activo', true)
        .order('nombres')

      if (ninosError) throw ninosError

      // Cargar registros de asistencia de hoy
      const { data: asistencias, error: asistenciasError } = await supabase
        .from('registros_asistencia')
        .select('nino_id')
        .eq('fecha', today)
        .eq('tipo', 'entrada')
        .eq('guarderia_id', user.guarderia_id)

      if (asistenciasError) throw asistenciasError

      const asistenciaSet = new Set(asistencias?.map(a => a.nino_id) || [])

      const childrenWithAttendance = (ninos || []).map(nino => ({
        ...nino,
        asistio: asistenciaSet.has(nino.id)
      }))

      setChildrenByClassroom(childrenWithAttendance)
    } catch (error) {
      console.error('Error loading children by classroom:', error)
      setChildrenByClassroom([])
    } finally {
      setLoadingChildren(false)
    }
  }

  const calculateAge = (fechaNacimiento: string | null): string => {
    if (!fechaNacimiento) return 'No especificada'
    
    const birthDate = new Date(fechaNacimiento)
    const today = new Date()
    
    let years = today.getFullYear() - birthDate.getFullYear()
    let months = today.getMonth() - birthDate.getMonth()
    
    if (months < 0) {
      years--
      months += 12
    }
    
    return `${years} año${years !== 1 ? 's' : ''} ${months} mes${months !== 1 ? 'es' : ''}`
  }

  const handleAulaChange = (aulaId: string) => {
    setSelectedAulaId(aulaId)
    loadChildrenByClassroom(aulaId)
  }

  const loadBirthdayChildren = async () => {
    try {
      if (!user?.guarderia_id) return

      const today = new Date()
      const month = today.getMonth() + 1
      const day = today.getDate()

      const { data, error } = await supabase
        .from('ninos')
        .select(`
          id,
          nombres,
          apellidos,
          fecha_nacimiento,
          aulas (
            nombre_aula,
            nivel_educativo
          )
        `)
        .eq('guarderia_id', user.guarderia_id)
        .eq('activo', true)
        .not('fecha_nacimiento', 'is', null)

      if (error) throw error

      // Filtrar en el cliente por día y mes
      const birthdays = (data || []).filter(nino => {
        if (!nino.fecha_nacimiento) return false
        
        // Parsear la fecha directamente desde el string para evitar problemas de zona horaria
        const fechaParts = nino.fecha_nacimiento.split('-')
        const birthMonth = parseInt(fechaParts[1], 10)
        const birthDay = parseInt(fechaParts[2], 10)
        
        return birthMonth === month && birthDay === day
      })

      setBirthdayChildren(birthdays)
    } catch (error) {
      console.error('Error loading birthday children:', error)
      setBirthdayChildren([])
    }
  }

  const calculateBirthdayAge = (fechaNacimiento: string): number => {
    const birthDate = new Date(fechaNacimiento)
    const today = new Date()
    return today.getFullYear() - birthDate.getFullYear()
  }

  const StatCard = ({ icon: Icon, iconImage, title, value, color, trend, onClick, refreshing }: {
    icon?: React.ComponentType<any>
    iconImage?: string
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
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center transition-all duration-300 ${color} ${
          refreshing ? 'animate-pulse' : ''
        }`}>
          {iconImage ? (
            <img src={iconImage} alt={title} className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
          ) : Icon ? (
            <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
          ) : null}
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
            iconImage="/nino.png"
            title="Total Niños"
            value={stats.totalNinos}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            iconImage="/activo.png"
            title="Niños Activos"
            value={stats.ninosActivos}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            iconImage="/birthday.png"
            title="Cumpleaños"
            value={birthdayChildren.length}
            color="bg-pink-100 text-pink-600"
            onClick={() => setShowBirthdaysModal(true)}
            refreshing={refreshing}
          />
          <StatCard
            iconImage="/gps.png"
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
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <img src="/entrada.png" alt="Entradas" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
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
              
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <img src="/inasistencia.png" alt="Inasistencia" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Inasistencia</p>
                    <p className="text-sm text-gray-600">Niños que no registraron entrada</p>
                  </div>
                </div>
                <span className="text-3xl font-bold text-red-600">
                  {stats.inasistencia}
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
                onClick={() => setShowQuickSearch(true)}
                className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200 hover:shadow-md"
              >
                <Search className="w-10 h-10 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-gray-900">
                  Búsqueda Rápida
                </p>
              </button>
              
              {user?.rol === 'admin' && (
                <button 
                  onClick={() => setShowChildrenByClassroom(true)}
                  className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-200 border border-purple-200 hover:shadow-md"
                >
                  <School className="w-10 h-10 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-gray-900">
                    Niños por Aula
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

        {/* Modal de Cumpleaños */}
        {showBirthdaysModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-yellow-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Cake className="w-6 h-6 text-pink-600" />
                      Cumpleaños de Hoy 🎉
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {birthdayChildren.length} {birthdayChildren.length === 1 ? 'niño cumple' : 'niños cumplen'} años hoy
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBirthdaysModal(false)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {birthdayChildren.length > 0 ? (
                  <div className="space-y-4">
                    {birthdayChildren.map((child) => (
                      <div key={child.id} className="p-5 border-2 border-pink-200 rounded-xl bg-gradient-to-r from-pink-50 to-yellow-50 hover:shadow-md transition-all">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <Cake className="w-8 h-8 text-pink-600" />
                          </div>
                          <div className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Nombre completo</p>
                                <p className="text-lg font-bold text-gray-900">
                                  {child.nombres} {child.apellidos}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Fecha de nacimiento</p>
                                <p className="text-gray-700">
                                  {(() => {
                                    const [year, month, day] = child.fecha_nacimiento.split('-')
                                    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                                    return format(date, "d 'de' MMMM 'de' yyyy", { locale: es })
                                  })()}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Aula</p>
                                <p className="text-gray-700">
                                  {child.aulas ? `${child.aulas.nombre_aula} - ${child.aulas.nivel_educativo}` : 'Sin aula asignada'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Años que cumple</p>
                                <p className="text-2xl font-bold text-pink-600">
                                  {calculateBirthdayAge(child.fecha_nacimiento)} años 🎂
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Cake className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No hay cumpleaños hoy
                    </h3>
                    <p className="text-gray-600">
                      Ningún niño cumple años el día de hoy.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Niños por Aula */}
        {showChildrenByClassroom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <School className="w-6 h-6 text-purple-600" />
                      Niños por Aula
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Selecciona un aula para ver los niños matriculados
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowChildrenByClassroom(false)
                      setSelectedAulaId('')
                      setChildrenByClassroom([])
                    }}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Selector de Aula */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Aula
                  </label>
                  <select
                    value={selectedAulaId}
                    onChange={(e) => handleAulaChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">-- Selecciona un aula --</option>
                    {aulas.map((aula) => (
                      <option key={aula.id} value={aula.id}>
                        {aula.nombre_aula} - {aula.nivel_educativo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contador y Lista de Niños */}
                {selectedAulaId && (
                  <div>
                    <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-lg font-semibold text-purple-900">
                        Total de niños: {childrenByClassroom.length}
                      </p>
                    </div>

                    <div className="overflow-y-auto max-h-[calc(90vh-400px)]">
                      {loadingChildren ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                      ) : childrenByClassroom.length > 0 ? (
                        <div className="space-y-3">
                          {childrenByClassroom.map((child) => (
                            <div key={child.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Nombre completo</p>
                                  <p className="font-semibold text-gray-900">
                                    {child.nombres} {child.apellidos}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Documento</p>
                                  <p className="text-gray-700">{child.numero_documento}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Edad</p>
                                  <p className="text-gray-700">{calculateAge(child.fecha_nacimiento)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Asistió hoy</p>
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    child.asistio 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {child.asistio ? 'SÍ' : 'NO'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Baby className="w-10 h-10 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No hay niños en esta aula
                          </h3>
                          <p className="text-gray-600">
                            El aula seleccionada no tiene niños matriculados actualmente.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!selectedAulaId && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <School className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Selecciona un aula
                    </h3>
                    <p className="text-gray-600">
                      Elige un aula del menú desplegable para ver los niños matriculados.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Búsqueda Rápida */}
        {showQuickSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Search className="w-6 h-6 text-blue-600" />
                      Búsqueda Rápida
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Busca acudientes o niños por nombre o documento
                    </p>
                  </div>
                  <button
                    onClick={resetQuickSearch}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Búsqueda de Acudiente */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Buscar Acudiente
                    </h3>
                    <form onSubmit={handleAcudienteSearch} className="space-y-3">
                      <input
                        type="text"
                        value={acudienteSearchTerm}
                        onChange={(e) => setAcudienteSearchTerm(e.target.value)}
                        placeholder="Nombre o documento del acudiente..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        disabled={searching || !acudienteSearchTerm.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {searching ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Buscando...
                          </>
                        ) : (
                          <>
                            <Search className="w-5 h-5" />
                            Buscar
                          </>
                        )}
                      </button>
                    </form>

                    {acudienteResult && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Resultado:</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Nombre completo:</span> {acudienteResult.nombres} {acudienteResult.apellidos}</p>
                          <p><span className="font-medium">Tipo documento:</span> {acudienteResult.tipo_documento}</p>
                          <p><span className="font-medium">Número de documento:</span> {acudienteResult.numero_documento}</p>
                          
                          {acudienteResult.nino_acudiente && acudienteResult.nino_acudiente.length > 0 && (
                            <div className="mt-3">
                              <p className="font-medium mb-2">Niños vinculados:</p>
                              <ul className="space-y-2">
                                {acudienteResult.nino_acudiente.map((rel: any, idx: number) => {
                                  const nino = rel.ninos
                                  const aula = Array.isArray(nino.aulas) ? nino.aulas[0] : nino.aulas
                                  return (
                                    <li key={idx} className="pl-4 border-l-2 border-blue-300">
                                      <p className="font-medium">{nino.nombres} {nino.apellidos}</p>
                                      <p className="text-gray-600">Parentesco: {rel.parentesco}</p>
                                      {aula && (
                                        <p className="text-gray-600">Aula: {aula.nombre_aula} - {aula.nivel_educativo}</p>
                                      )}
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {acudienteSearchTerm && !acudienteResult && !searching && (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
                        No se encontraron resultados
                      </div>
                    )}
                  </div>

                  {/* Búsqueda de Niño */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Baby className="w-5 h-5 text-purple-600" />
                      Buscar Niño
                    </h3>
                    <form onSubmit={handleNinoSearch} className="space-y-3">
                      <input
                        type="text"
                        value={ninoSearchTerm}
                        onChange={(e) => setNinoSearchTerm(e.target.value)}
                        placeholder="Nombre o documento del niño..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        disabled={searching || !ninoSearchTerm.trim()}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {searching ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Buscando...
                          </>
                        ) : (
                          <>
                            <Search className="w-5 h-5" />
                            Buscar
                          </>
                        )}
                      </button>
                    </form>

                    {ninoResult && (
                      <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Resultado:</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Nombre completo:</span> {ninoResult.nombres} {ninoResult.apellidos}</p>
                          <p><span className="font-medium">Tipo documento:</span> {ninoResult.tipo_documento}</p>
                          <p><span className="font-medium">Número de documento:</span> {ninoResult.numero_documento}</p>
                          
                          {ninoResult.nino_acudiente && ninoResult.nino_acudiente.length > 0 && (
                            <div className="mt-3">
                              <p className="font-medium mb-2">Acudientes vinculados:</p>
                              <ul className="space-y-2">
                                {ninoResult.nino_acudiente.map((rel: any, idx: number) => {
                                  const acudiente = rel.acudientes
                                  return (
                                    <li key={idx} className="pl-4 border-l-2 border-purple-300">
                                      <p className="font-medium">{acudiente.nombres} {acudiente.apellidos}</p>
                                      <p className="text-gray-600">Parentesco: {rel.parentesco}</p>
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {ninoSearchTerm && !ninoResult && !searching && (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
                        No se encontraron resultados
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}