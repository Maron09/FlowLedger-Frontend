import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth.store'
import { useWorkspaceStore } from './store/workspace.store'
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
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'


function WorkspaceRedirect() {
  const { activeWorkspace } = useWorkspaceStore()
  if (!activeWorkspace) return <div className="min-h-screen bg-[#0f1117]" />
  return <Navigate to={`/w/${activeWorkspace.id}/dashboard`} replace />
}

export default function App() {
  const { isAuthenticated, token, setAuth, user } = useAuthStore()
  const { setWorkspaces, setActiveWorkspace } = useWorkspaceStore()
  const isAdmin = (user as any)?.role === 'ADMIN'

  useEffect(() => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (refreshToken && !user) {
    api.post('/auth/refresh', { refreshToken })
      .then(({ data }) => {
        api.get('/auth/me', {
          headers: { Authorization: `Bearer ${data.accessToken}` }
        }).then(({ data: userData }) => {
          setAuth(userData, data.accessToken, data.refreshToken)
        })
      })
      .catch(() => {
        localStorage.removeItem('refreshToken')
      })
  }
}, [])

  useEffect(() => {
    if (isAuthenticated && user && !isAdmin) {
      api.get('/workspaces').then(({ data }) => {
        setWorkspaces(data)
        const savedId = localStorage.getItem('activeWorkspaceId')
        const saved = data.find((w: any) => w.id === savedId)
        const active = saved ?? data[0]
        if (active) setActiveWorkspace(active)
      })
    }
  }, [isAuthenticated, user])

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Workspace routes */}
      <Route
        path="/w/:workspaceId/*"
        element={isAuthenticated && !isAdmin ? <AppLayout /> : <Navigate to={isAuthenticated ? '/admin' : '/login'} />}
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="budgets" element={<BudgetsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
      </Route>

      {/* Admin routes */}
      <Route
        element={isAuthenticated && isAdmin ? <AdminLayout /> : <Navigate to={isAuthenticated ? '/' : '/login'} />}
      >
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      {/* Root redirect */}
      <Route
        path="/"
        element={
          !isAuthenticated ? <Navigate to="/login" /> :
          isAdmin ? <Navigate to="/admin" /> :
          <WorkspaceRedirect />
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}