// project\src\components\dashboard\CoordinatorDashboard.tsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { format } from 'date-fns'
import { Baby, Users, School, UserCheck, CalendarDays, FileDown, FileText } from 'lucide-react'
import AttendancePDFGenerator from './AttendancePDFGenerator'



interface Guarderia {
  id: string
  nombre: string
}

interface Aula {
  id: string
  nombre_aula: string
}

interface CoordinatorDashboardProps {
  onNavigate?: (tab: string) => void
}

export function CoordinatorDashboard({ onNavigate }: CoordinatorDashboardProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [guarderias, setGuarderias] = useState<Guarderia[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [selectedGuarderiaId, setSelectedGuarderiaId] = useState('')
  const [selectedAulaId, setSelectedAulaId] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const [stats, setStats] = useState({
    totalGuarderias: 0,
    totalNinos: 0,
    totalAcudientes: 0,
    totalPersonal: 0,
    asistenciaHoy: 0,
    inasistenciasHoy: 0
  })

  // Cargar datos al iniciar
  useEffect(() => {
    if (user?.rol === 'coordinador') {
      loadGlobalStats()
      loadGuarderias()
    }
  }, [user])

  const loadGlobalStats = async () => {
    setLoading(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')

      const [{ count: totalGuarderias }, { count: totalNinos }, { count: totalAcudientes },
        { count: totalPersonal }, { count: asistenciaHoy }] = await Promise.all([
        supabase.from('guarderias').select('*', { count: 'exact', head: true }),
        supabase.from('ninos').select('*', { count: 'exact', head: true }),
        supabase.from('acudientes').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).neq('rol', 'coordinador'),
        supabase.from('registros_asistencia').select('*', { count: 'exact', head: true }).eq('fecha', today).eq('tipo', 'entrada')
      ])

      const inasistenciasHoy = (totalNinos ?? 0) - (asistenciaHoy ?? 0)

      setStats({
        totalGuarderias: totalGuarderias ?? 0,
        totalNinos: totalNinos ?? 0,
        totalAcudientes: totalAcudientes ?? 0,
        totalPersonal: totalPersonal ?? 0,
        asistenciaHoy: asistenciaHoy ?? 0,
        inasistenciasHoy: inasistenciasHoy >= 0 ? inasistenciasHoy : 0
      })
    } catch (error) {
      console.error('Error al cargar estadísticas globales:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGuarderias = async () => {
    const { data, error } = await supabase.from('guarderias').select('id, nombre').order('nombre')
    if (error) {
      console.error('Error al cargar guarderías:', error)
    } else {
      setGuarderias(data || [])
    }
  }

  const loadAulasByGuarderia = async (guarderiaId: string) => {
    const { data, error } = await supabase.from('aulas').select('id, nombre_aula').eq('guarderia_id', guarderiaId).order('nombre_aula')
    if (error) {
      console.error('Error al cargar aulas:', error)
    } else {
      setAulas(data || [])
    }
  }

  const handleGuarderiaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedGuarderiaId(value)
    setSelectedAulaId('')
    if (value) loadAulasByGuarderia(value)
    else setAulas([])
  }

  return (
    <div className="p-6 bg-gradient-to-br from-sky-50 via-blue-50 to-mint-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel Global del Coordinador</h1>

      {/* RESUMEN GLOBAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <StatCard icon={School} title="Total Guarderías" value={stats.totalGuarderias} color="bg-blue-100 text-blue-600" />
        <StatCard icon={Baby} title="Total Niños" value={stats.totalNinos} color="bg-purple-100 text-purple-600" />
        <StatCard icon={Users} title="Total Acudientes" value={stats.totalAcudientes} color="bg-green-100 text-green-600" />
        <StatCard icon={UserCheck} title="Total Personal" value={stats.totalPersonal} color="bg-orange-100 text-orange-600" />
        <StatCard icon={CalendarDays} title="Asistencias Hoy" value={stats.asistenciaHoy} color="bg-mint-100 text-mint-600" />
        <StatCard icon={FileText} title="Inasistencias Hoy" value={stats.inasistenciasHoy} color="bg-red-100 text-red-600" />
      </div>

      {/* FORMULARIO PDF */}
      <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
        <AttendancePDFGenerator />
      </div>
    </div>
  )
}

const StatCard = ({ icon: Icon, title, value, color }: {
  icon: React.ElementType
  title: string
  value: number
  color: string
}) => (
  <div className={`p-5 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
)
