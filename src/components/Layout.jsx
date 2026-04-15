import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAppStore } from '../store/appStore'
import { Toaster } from 'react-hot-toast'

export function Layout() {
  const { sidebarOpen } = useAppStore()

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
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
