import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth.store'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AppLayout from './components/layout/AppLayout'
import AdminLayout from './components/layout/AdminLayout'
import DashboardPage from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import CategoriesPage from './pages/CategoriesPage'
import BudgetsPage from './pages/BudgetPage'
import AnalyticsPage from './pages/AnalyticsPage'
import FeedbackPage from './pages/FeedbackPage'
import AdminPage from './pages/AdminPage'
import api from './lib/axios'

export default function App() {
  const { isAuthenticated, token, setAuth, user } = useAuthStore()
  const isAdmin = (user as any)?.role === 'ADMIN'

  useEffect(() => {
    if (token && !user) {
      api.get('/auth/me').then(({ data }) => {
        setAuth(data, token)
      }).catch(() => {})
    }
  }, [token])

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to={isAdmin ? '/admin' : '/dashboard'} />} />
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />} />

      {/* Regular user routes */}
      <Route element={isAuthenticated && !isAdmin ? <AppLayout /> : <Navigate to={isAuthenticated ? '/admin' : '/login'} />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
      </Route>

      {/* Admin routes */}
      <Route element={isAuthenticated && isAdmin ? <AdminLayout /> : <Navigate to={isAuthenticated ? '/dashboard' : '/login'} />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/login'} />} />
    </Routes>
  )
}