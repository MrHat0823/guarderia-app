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
      className="p-2 rounded-md bg-white shadow hover:bg-gray-100"
    >
      <Menu className="w-6 h-6 text-gray-700" />
    </button>
  )
}
