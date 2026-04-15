import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAppStore } from '../store/appStore'
import { Toaster } from 'react-hot-toast'
import { Menu, IceCream } from 'lucide-react'

export function Layout() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore()

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="sidebar__logo">
          <IceCream size={24} className="sidebar__logo-icon" />
          <span className="sidebar__logo-text">مصنع آيس كريم</span>
        </div>
        <button className="mobile-toggle-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'Cairo, sans-serif',
            direction: 'rtl',
          },
        }}
      />
    </div>
  )
}
