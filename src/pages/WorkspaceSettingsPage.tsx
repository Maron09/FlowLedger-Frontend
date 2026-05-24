import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWorkspaceStore } from '../store/workspace.store'
import api from '../lib/axios'

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const { activeWorkspace, workspaces, setActiveWorkspace, setWorkspaces } = useWorkspaceStore()

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

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-white text-xl font-semibold">Workspace Settings</h1>
        <p className="text-white/30 text-sm mt-0.5">Manage {activeWorkspace?.name}</p>
      </div>

      {/* Update workspace */}
      <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-6">
        <h2 className="text-white font-medium mb-1">General</h2>
        <p className="text-white/30 text-sm mb-5">Update workspace name and type</p>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">
              Workspace name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">
              Workspace type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'PERSONAL' | 'BUSINESS' })}
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
            >
              <option value="PERSONAL">Personal</option>
              <option value="BUSINESS">Business</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-emerald-400 text-sm">
              Workspace updated successfully
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-[#0a0d12] border border-red-500/20 rounded-xl p-6">
        <h2 className="text-red-400 font-medium mb-1">Danger zone</h2>
        <p className="text-white/30 text-sm mb-5">
          Deleting a workspace will permanently remove all its categories, transactions and budgets.
        </p>

        {deleteError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm mb-4">
            {deleteError}
          </div>
        )}

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
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 text-sm py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}