import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { supabase } from './lib/supabase'

import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'

import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { MaterialsPage } from './pages/MaterialsPage'
import { ProductsPage } from './pages/ProductsPage'
import { RecipesPage } from './pages/RecipesPage'
import { ProductionPage } from './pages/ProductionPage'
import { SalesPage } from './pages/SalesPage'
import { CustomersPage } from './pages/CustomersPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { ReportsPage } from './pages/ReportsPage'
import { UsersPage } from './pages/UsersPage'

export default function App() {
  const { setUser, fetchProfile } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/production" element={<ProductionPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
