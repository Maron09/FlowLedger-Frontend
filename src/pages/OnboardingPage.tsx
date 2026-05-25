import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { useWorkspaceStore } from '../store/workspace.store'
import api from '../lib/axios'

export default function OnboardingPage() {
  const { user } = useAuthStore()
  const { workspaces, setWorkspaces, setActiveWorkspace } = useWorkspaceStore()
  const navigate = useNavigate()

  const defaultName = user?.firstName
    ? `${user.firstName}'s`
    : user?.email?.split('@')[0] ?? 'My'

  const [type, setType] = useState<'PERSONAL' | 'BUSINESS' | null>(null)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // If user already has workspaces, redirect away from onboarding
  useEffect(() => {
    if (workspaces.length > 0) {
      navigate(`/w/${workspaces[0].id}/dashboard`, { replace: true })
    }
  }, [workspaces])

  const handleTypeSelect = (selected: 'PERSONAL' | 'BUSINESS') => {
    setType(selected)
    if (!name) {
      setName(selected === 'PERSONAL' ? `${defaultName} Personal` : `${defaultName} Business`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!type || creating) return
    setCreating(true)
    setError('')

    try {
      const { data: workspace } = await api.post('/workspaces', { name, type })
      const { data: allWorkspaces } = await api.get('/workspaces')
      setWorkspaces(allWorkspaces)
      setActiveWorkspace(workspace)
      navigate(`/w/${workspace.id}/dashboard`, { replace: true })
    } catch (err: any) {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg || 'Failed to create workspace')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-lg">FlowLedger</span>
        </div>

        <h1 className="text-white text-2xl font-semibold mb-2">
          Welcome{user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-white/40 text-sm mb-8">
          Let's set up your first workspace. You can create more later.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-3">
              What best describes you?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeSelect('PERSONAL')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  type === 'PERSONAL'
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="text-2xl mb-2">👤</div>
                <p className="text-white text-sm font-medium">Personal</p>
                <p className="text-white/30 text-xs mt-0.5">
                  Track personal finances, savings and expenses
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect('BUSINESS')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  type === 'BUSINESS'
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="text-2xl mb-2">🏢</div>
                <p className="text-white text-sm font-medium">Business</p>
                <p className="text-white/30 text-xs mt-0.5">
                  Track revenue, expenses and business performance
                </p>
              </button>
            </div>
          </div>

          {type && (
            <div>
              <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">
                Workspace name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Personal Finances"
                required
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!type || !name || creating}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg text-sm transition-colors"
          >
            {creating ? 'Creating workspace...' : 'Get started →'}
          </button>
        </form>
      </div>
    </div>
  )
}