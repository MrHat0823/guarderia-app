// project\src\App.tsx
import React, { useState, useEffect } from 'react'
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

  <div className="min-h-screen bg-gray-50 flex relative">
    {/* Botón hamburguesa visible solo en móvil */}
    <div className="absolute top-4 left-4 z-50 md:hidden">
      <SidebarHamburger setActiveTab={setActiveTab} />
    </div>

    {/* Sidebar */}
    <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

    {/* Contenido principal */}
    <main className="flex-1 overflow-auto">
      {renderContent()}
    </main>

    {/* ✅ Toaster de 'sonner' */}
    <Toaster
      position="top-right"
      richColors
      toastOptions={{
        duration: 4000
      }}
    />
  </div>
)
  
}

export default App