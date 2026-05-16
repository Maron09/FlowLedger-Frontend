import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import AddTransactionModal from '../ui/AddTransactionModal'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0a0d12]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/50 hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-sm">FlowLedger</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-8 h-8 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full flex items-center justify-center text-lg transition-colors"
          >
            +
          </button>
        </div>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Desktop floating button */}
      <button
        onClick={() => setShowModal(true)}
        className="hidden lg:flex fixed bottom-8 right-8 w-12 h-12 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-lg items-center justify-center text-2xl transition-all hover:scale-110 z-40"
      >
        +
      </button>

      {showModal && (
        <AddTransactionModal
          onClose={() => setShowModal(false)}
          onSuccess={() => navigate(0)}
        />
      )}
    </div>
  )
}