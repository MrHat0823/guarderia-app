import { Menu } from 'lucide-react'
import React from 'react'

interface SidebarHamburgerProps {
  setActiveTab: (tab: string) => void
}

export const SidebarHamburger: React.FC<SidebarHamburgerProps> = () => {
  const handleOpenSidebar = () => {
    const sidebarEvent = new CustomEvent('open-sidebar')
    window.dispatchEvent(sidebarEvent)
  }

  return (
    <button
      onClick={handleOpenSidebar}
      className="p-2.5 rounded-lg bg-mint-50 border border-mint-200 hover:bg-mint-100 active:bg-mint-200 transition-colors shadow-sm"
      aria-label="Abrir menú"
    >
      <Menu className="w-6 h-6 text-mint-700" />
    </button>
  )
}
