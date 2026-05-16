import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Admin top bar */}
      <header className="bg-[#0a0d12] border-b border-white/5 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-white font-semibold tracking-tight">FlowLedger</span>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-sm">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-white/30 hover:text-red-400 text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="p-8">
        <Outlet />
      </main>
    </div>
  )
}