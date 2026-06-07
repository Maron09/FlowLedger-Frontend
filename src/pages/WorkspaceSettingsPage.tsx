import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWorkspaceStore } from '../store/workspace.store'
import { useAuthStore } from '../store/auth.store'
import api, { workspaceUrl } from '../lib/axios'

interface Member {
  id: string
  role: string
  userId: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

const ROLES = ['VIEWER', 'EDITOR', 'ADMIN']

const ROLE_DESCRIPTIONS: Record<string, string> = {
  VIEWER: 'Can view transactions and reports',
  EDITOR: 'Can add and edit transactions',
  ADMIN: 'Full access except delete workspace',
  OWNER: 'Full access',
}

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const { activeWorkspace, workspaces, setActiveWorkspace, setWorkspaces } = useWorkspaceStore()
  const { user } = useAuthStore()

  const [form, setForm] = useState<{ name: string; type: 'PERSONAL' | 'BUSINESS' }>({
    name: activeWorkspace?.name ?? '',
    type: (activeWorkspace?.type as 'PERSONAL' | 'BUSINESS') ?? 'PERSONAL',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Members state
  const [members, setMembers] = useState<Member[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('EDITOR')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  const myRole = members.find((m) => m.userId === user?.id)?.role
  const isOwner = myRole === 'OWNER' || activeWorkspace?.ownerId === user?.id
  const isAdmin = isOwner || myRole === 'ADMIN'

  const fetchMembers = () => {
    if (!workspaceId) return
    api.get(workspaceUrl(workspaceId, '/members'))
      .then(({ data }) => setMembers(data))
      .catch((err) => console.error('Failed to fetch members', err))
  }

  useEffect(() => { fetchMembers() }, [workspaceId])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const { data } = await api.patch(`/workspaces/${workspaceId}`, form)
      const updated = workspaces.map((w) => w.id === workspaceId ? { ...w, ...data } : w)
      setWorkspaces(updated)
      setActiveWorkspace({ ...activeWorkspace!, ...data })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg || 'Failed to update workspace')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await api.delete(`/workspaces/${workspaceId}`)
      const remaining = workspaces.filter((w) => w.id !== workspaceId)
      setWorkspaces(remaining)
      if (remaining.length > 0) {
        setActiveWorkspace(remaining[0])
        navigate(`/w/${remaining[0].id}/dashboard`)
      } else {
        navigate('/')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message
      setDeleteError(Array.isArray(msg) ? msg[0] : msg || 'Failed to delete workspace')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setInviteError('')
    setInviteSuccess('')
    try {
      const { data } = await api.post(workspaceUrl(workspaceId!, '/members/invite'), {
        email: inviteEmail,
        role: inviteRole,
      })
      setInviteSuccess(data.message)
      setInviteEmail('')
      fetchMembers()
      setTimeout(() => setInviteSuccess(''), 4000)
    } catch (err: any) {
      const msg = err.response?.data?.message
      setInviteError(Array.isArray(msg) ? msg[0] : msg || 'Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  const handleUpdateRole = async (memberId: string, role: string) => {
    try {
      await api.patch(workspaceUrl(workspaceId!, `/members/${memberId}/role`), { role })
      fetchMembers()
    } catch (err: any) {
      console.error('Failed to update role', err)
    }
  }

  const handleRemove = async (memberId: string) => {
    setRemovingId(memberId)
    try {
      await api.delete(workspaceUrl(workspaceId!, `/members/${memberId}`))
      fetchMembers()
    } catch (err: any) {
      console.error('Failed to remove member', err)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-white text-xl font-semibold">Workspace Settings</h1>
        <p className="text-white/30 text-sm mt-0.5">Manage {activeWorkspace?.name}</p>
      </div>

      {/* General */}
      <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-6">
        <h2 className="text-white font-medium mb-1">General</h2>
        <p className="text-white/30 text-sm mb-5">Update workspace name and type</p>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Workspace name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Workspace type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'PERSONAL' | 'BUSINESS' })}
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
            >
              <option value="PERSONAL">Personal</option>
              <option value="BUSINESS">Business</option>
            </select>
          </div>
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}
          {success && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-emerald-400 text-sm">Workspace updated successfully</div>}
          <button type="submit" disabled={saving} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Members */}
      <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-6">
        <h2 className="text-white font-medium mb-1">Team Members</h2>
        <p className="text-white/30 text-sm mb-5">{members.length} member{members.length !== 1 ? 's' : ''}</p>

        {/* Member list */}
        <div className="space-y-2 mb-6">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-400 text-xs font-medium">
                  {member.user.firstName?.[0] ?? member.user.email[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm truncate">
                  {member.user.firstName ? `${member.user.firstName} ${member.user.lastName ?? ''}`.trim() : member.user.email}
                </p>
                <p className="text-white/30 text-xs truncate">{member.user.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {member.role === 'OWNER' ? (
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20">Owner</span>
                ) : isOwner ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-white/60 text-xs focus:outline-none"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r} style={{ backgroundColor: '#0a0d12' }}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs bg-white/5 text-white/40 px-2.5 py-1 rounded-md border border-white/10">
                    {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                  </span>
                )}
                {isAdmin && member.role !== 'OWNER' && member.userId !== user?.id && (
                  <button
                    onClick={() => handleRemove(member.id)}
                    disabled={removingId === member.id}
                    className="text-white/20 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded-md hover:bg-red-500/10"
                  >
                    {removingId === member.id ? '...' : 'Remove'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Role descriptions */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
            <div key={role} className="p-2.5 rounded-lg bg-white/3 border border-white/5">
              <p className="text-white/60 text-xs font-medium mb-0.5">{role.charAt(0) + role.slice(1).toLowerCase()}</p>
              <p className="text-white/20 text-xs">{desc}</p>
            </div>
          ))}
        </div>

        {/* Invite form */}
        {isAdmin && (
          <form onSubmit={handleInvite} className="space-y-3 border-t border-white/5 pt-5">
            <p className="text-white/50 text-xs uppercase tracking-wider">Invite member</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email address"
                required
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} style={{ backgroundColor: '#0f1117' }}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            {inviteError && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{inviteError}</div>}
            {inviteSuccess && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-emerald-400 text-sm">{inviteSuccess}</div>}
            <button
              type="submit"
              disabled={inviting}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {inviting ? 'Sending...' : 'Send invite'}
            </button>
          </form>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-[#0a0d12] border border-red-500/20 rounded-xl p-6">
        <h2 className="text-red-400 font-medium mb-1">Danger zone</h2>
        <p className="text-white/30 text-sm mb-5">
          Deleting a workspace will permanently remove all its categories, transactions and budgets.
        </p>
        {deleteError && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm mb-4">{deleteError}</div>}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium px-6 py-2.5 rounded-lg transition-colors border border-red-500/20"
          >
            Delete workspace
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-white/60 text-sm">Are you sure? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 text-sm py-2.5 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}