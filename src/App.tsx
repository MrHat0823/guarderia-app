// project\src\App.tsx
import React, { useState, useEffect } from 'react'
import { Baby } from 'lucide-react'
import { LoginForm } from './components/auth/LoginForm'
import { Sidebar } from './components/layout/Sidebar'
import { Dashboard } from './components/dashboard/Dashboard'
import { AttendanceControl } from './components/attendance/AttendanceControl'
import { QRScannerPage } from './components/attendance/QRScannerPage'
import { Statistics } from './components/statistics/Statistics'
import { UserManagement } from './components/management/UserManagement'
import { ChildrenManagement } from './components/management/ChildrenManagement'
import { GuardianManagement } from './components/management/GuardianManagement'
import { ClassroomManagement } from './components/management/ClassroomManagement'
import { UserSettings } from './components/settings/UserSettings'
import { useAuth } from './hooks/useAuth'
import { AttendanceSummary } from './components/attendance/AttendanceSummary'
import { GuarderiaManagement } from './components/management/GuarderiaManagement'
import { CoordinatorStatistics } from './components/statistics/CoordinatorStatistics'
import { CoordinatorDashboard } from './components/dashboard/CoordinatorDashboard'
import { CoordinatorAttendanceSummary } from './components/attendance/CoordinatorAttendanceSummary'
import { SidebarHamburger } from './components/layout/SidebarHamburger'
import { UsersAttendanceSummary } from './components/attendance/UsersAttendanceSummary'
import RegistroTerceros from './components/attendance/RegistroTerceros';
import { TercerosList } from './components/management/TercerosList';
import { InstallPWA } from './components/common/InstallPWA';






import { Toaster } from 'sonner' //


function App() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

  // Reset tab when user changes
  useEffect(() => {
    if (!user) {
      setActiveTab('dashboard')
    }
  }, [user])

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema...</p>
        </div>
      </div>
    )
  }

  // Show login if no user
  if (!user) {
    return <LoginForm />
  }

  const renderContent = () => {
  switch (activeTab) {
    case 'dashboard':
      return user?.rol === 'coordinador'
        ? <CoordinatorDashboard onNavigate={setActiveTab} />
        : <Dashboard onNavigate={setActiveTab} />
    case 'attendance':
      return <AttendanceControl />
    case 'qr-scanner':
      return <QRScannerPage />
    case 'statistics':
      return <Statistics />
    case 'coordinator-statistics':
      return user?.rol === 'coordinador'
        ? <CoordinatorStatistics />
        : <div className="p-6 text-red-600 font-bold">Acceso denegado</div>
    case 'coordinator-attendance-summary':
      return user?.rol === 'coordinador'
        ? <CoordinatorAttendanceSummary />
        : <div className="p-6 text-red-600 font-bold">Acceso denegado</div>
        case 'terceros-list':
          return user?.rol === 'coordinador'
            ? <TercerosList />
            : <div className="p-6 text-red-600 font-bold">Acceso denegado</div>;

    case 'users':
      return <UserManagement />
    case 'children':
      return <ChildrenManagement />
    case 'guardians':
      return <GuardianManagement />
    case 'classrooms':
      return <ClassroomManagement />
    case 'settings':
      return <UserSettings />
      case 'registro-terceros':
    return user?.rol !== 'coordinador'
      ? <RegistroTerceros />
      : <div className="p-6 text-red-600 font-bold">Acceso denegado</div>;
    case 'attendance-summary':
      if (user?.rol === 'coordinador') {
        return <AttendanceSummary />
      } else {
        return <UsersAttendanceSummary />
      }

    case 'guarderias':
      return user?.rol === 'coordinador'
        ? <GuarderiaManagement />
        : <div className="p-6 text-red-600 font-bold">Acceso denegado</div>
    default:
      return <Dashboard onNavigate={setActiveTab} />
  }
}




  return (
  <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative">
    {/* Header móvil fijo */}
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <SidebarHamburger setActiveTab={setActiveTab} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-mint-100 rounded-full flex items-center justify-center">
              <Baby className="w-5 h-5 text-mint-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {user?.nombres}
              </h2>
              <p className="text-xs text-gray-500 capitalize">{user?.rol}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Sidebar */}
    <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

    {/* Contenido principal con padding superior en móvil */}
    <main className="flex-1 overflow-auto pt-16 md:pt-0">
      {renderContent()}
    </main>

    {/* Toaster de sonner */}
    <Toaster
      position="top-right"
      richColors
      toastOptions={{
        duration: 4000
      }}
    />

    {/* Prompt de instalación PWA */}
    <InstallPWA />
  </div>
)
  
}

export default App