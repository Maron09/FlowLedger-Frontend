import { useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { useWorkspaceStore } from '../../store/workspace.store'
import api from '../../lib/axios'

interface Props {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: Props) {
  const { user, logout } = useAuthStore()
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaceStore()
  const navigate = useNavigate()
  const { workspaceId } = useParams()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newWorkspace, setNewWorkspace] = useState({ name: '', type: 'PERSONAL' })
  const [creating, setCreating] = useState(false)

  const navItems = [
    { path: `/w/${workspaceId}/dashboard`, label: 'Dashboard' },
    { path: `/w/${workspaceId}/transactions`, label: 'Transactions' },
    { path: `/w/${workspaceId}/categories`, label: 'Categories' },
    { path: `/w/${workspaceId}/budgets`, label: 'Budgets' },
    { path: `/w/${workspaceId}/analytics`, label: 'Analytics' },
    { path: `/w/${workspaceId}/feedback`, label: 'Feedback' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSwitch = async (workspace: any) => {
    setActiveWorkspace(workspace)
    await api.post(`/workspaces/${workspace.id}/switch`)
    setShowSwitcher(false)
    navigate(`/w/${workspace.id}/dashboard`)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const { data } = await api.post('/workspaces', newWorkspace)
      const { data: allWorkspaces } = await api.get('/workspaces')
      const { setWorkspaces } = useWorkspaceStore.getState()
      setWorkspaces(allWorkspaces)
      setActiveWorkspace(data)
      setShowSwitcher(false)
      setShowCreateForm(false)
      setNewWorkspace({ name: '', type: 'PERSONAL' })
      navigate(`/w/${data.id}/dashboard`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-40 w-60
        bg-[#0a0d12] border-r border-white/5
        flex flex-col transition-transform duration-300
        lg:relative lg:min-h-screen lg:translate-x-0 lg:z-auto
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Workspace switcher */}
        <div className="p-3 border-b border-white/5">
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
              activeWorkspace?.type === 'BUSINESS' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {activeWorkspace?.name[0].toUpperCase() ?? 'F'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-white/80 text-xs font-medium truncate">{activeWorkspace?.name ?? 'Loading...'}</p>
              <p className="text-white/30 text-xs capitalize">{activeWorkspace?.type?.toLowerCase() ?? ''}</p>
            </div>
            <svg
              className={`text-white/30 flex-shrink-0 transition-transform ${showSwitcher ? 'rotate-180' : ''}`}
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          {/* Switcher dropdown */}
          {showSwitcher && (
            <div className="mt-1 space-y-0.5">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => handleSwitch(ws)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                    ws.id === activeWorkspace?.id ? 'bg-white/8' : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    ws.type === 'BUSINESS' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {ws.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-xs truncate">{ws.name}</p>
                    <p className="text-white/30 text-xs capitalize">{ws.type.toLowerCase()}</p>
                  </div>
                  {ws.id === activeWorkspace?.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  )}
                </button>
              ))}

              {/* Create new workspace */}
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors text-xs"
                >
                  <span>+</span> New workspace
                </button>
              ) : (
                <form onSubmit={handleCreate} className="p-2 space-y-2">
                  <input
                    type="text"
                    value={newWorkspace.name}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                    placeholder="Workspace name"
                    required
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-white placeholder-white/20 text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                  <select
                    value={newWorkspace.type}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, type: e.target.value })}
                    className="w-full bg-[#0f1117] border border-white/10 rounded-md px-2.5 py-1.5 text-white text-xs focus:outline-none"
                  >
                    <option value="PERSONAL">Personal</option>
                    <option value="BUSINESS">Business</option>
                  </select>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 bg-white/5 text-white/40 text-xs py-1.5 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="flex-1 bg-emerald-500 text-white text-xs py-1.5 rounded-md disabled:opacity-50"
                    >
                      {creating ? '...' : 'Create'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-400 text-xs font-medium">
                {user?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user?.email}
              </p>
              <p className="text-white/30 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-white/30 hover:text-red-400 text-xs transition-colors rounded-lg hover:bg-red-500/5"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}