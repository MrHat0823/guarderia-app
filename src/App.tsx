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

  // Render main app content
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />
      case 'attendance':
        return <AttendanceControl />
      case 'qr-scanner':
        return <QRScannerPage />
      case 'statistics':
        return <Statistics />
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
        case 'attendance-summary':
        return <AttendanceSummary />

      default:
        return <Dashboard onNavigate={setActiveTab} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  )
}

export default App