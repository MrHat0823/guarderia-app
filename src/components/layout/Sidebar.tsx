import React, { useState, useEffect } from 'react'
import {
  Home, Users, Baby, School, QrCode, BarChart3,
  LogOut, Settings, CalendarSearch, NotebookPen, X
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useDaycareConfig } from '../../hooks/useDaycareConfig'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { user, signOut } = useAuth()
  const { daycareNombre } = useDaycareConfig()
  const appVersion = import.meta.env.VITE_APP_VERSION

  useEffect(() => {
    const handleOpen = () => setIsMobileOpen(true)
    window.addEventListener('open-sidebar', handleOpen)
    return () => window.removeEventListener('open-sidebar', handleOpen)
  }, [])

  const handleSignOut = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await signOut()
      setTimeout(() => {
        setIsLoggingOut(false)
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error('Error en logout:', error)
      setIsLoggingOut(false)
      window.location.reload()
    }
  }

  const getMenuItems = () => {
    const common = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'qr-scanner', label: 'Escáner QR', icon: QrCode },
      { id: 'attendance-summary', label: user?.rol === 'coordinador' ? 'Resumen de Asistencias' : 'Registro Personalizado', icon: CalendarSearch },
      { id: 'statistics', label: 'Estadísticas', icon: BarChart3 },
      { id: 'settings', label: 'Configuración', icon: Settings }
    ]

    const admin = [
      { id: 'users', label: 'Usuarios', icon: Users },
      { id: 'children', label: 'Niños', icon: Baby },
      { id: 'guardians', label: 'Acudientes', icon: Users },
      { id: 'classrooms', label: 'Aulas', icon: School },
      { id: 'registro-terceros', label: 'Registro de Terceros', icon: NotebookPen }
    ]

    if (user?.rol === 'admin') return [...common, ...admin]

    if (user?.rol === 'coordinador') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'coordinator-attendance-summary', label: 'Resumen de Asistencias', icon: CalendarSearch },
        { id: 'guarderias', label: 'Gestión de Guarderías', icon: School },
        { id: 'coordinator-statistics', label: 'Estadísticas Coordinador', icon: BarChart3 },
        // ✅ Nuevo menú exclusivo para coordinador
        { id: 'terceros-list', label: 'Listado de Terceros', icon: Users }
      ]
    }

    // Para profesores y otros roles
    return [...common, { id: 'registro-terceros', label: 'Registro de Terceros', icon: Baby }]
  }

  const menuItems = getMenuItems()

  if (!user) return null

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[45] md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        className={`
          fixed md:relative z-[60] top-0 left-0 h-full bg-white shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
          w-[280px] sm:w-[320px] max-w-[85vw]
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 md:w-64 md:shadow-lg
          overflow-y-auto
        `}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-mint-100 rounded-full flex items-center justify-center">
                <Baby className="w-6 h-6 text-mint-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{daycareNombre}</h2>
                <p className="text-sm text-gray-500">
                  {user?.rol === 'coordinador' ? '' : 'Sistema de gestión'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1.5">
            {menuItems.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  onClick={() => {
                    setActiveTab(id)
                    setIsMobileOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-left transition-all duration-200 ${
                    activeTab === id
                      ? 'bg-mint-100 text-mint-700 font-semibold shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="mb-3 px-2">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.nombres} {user.apellidos}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user.rol}</p>
            <p className="text-xs text-gray-500 truncate">Doc: {user.numero_documento}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 font-medium shadow-sm active:scale-95"
          >
            {isLoggingOut ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                <span className="text-sm">Cerrando...</span>
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Cerrar sesión</span>
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-gray-400 mt-3">
            Versión {appVersion}
          </p>
        </div>
      </div>
    </>
  )
}
