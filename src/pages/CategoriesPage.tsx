import { useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/axios'
import { useWorkspaceRole } from '../hooks/useWorkspaceRole'
import { useCategories, useInvalidateCategories } from '../hooks/useCategories'

interface Category {
  id: string
  name: string
  color: string
  icon: string
  type: string
}

const PRESET_COLORS = [
  '#10b981', '#f97316', '#3b82f6', '#8b5cf6',
  '#ec4899', '#eab308', '#14b8a6', '#ef4444',
  '#a855f7', '#06b6d4', '#84cc16', '#f59e0b',
]

export default function CategoriesPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { isEditor } = useWorkspaceRole()
  const { categories, loading } = useCategories(workspaceId!)
  const invalidateCategories = useInvalidateCategories()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', color: '#10b981', icon: 'wallet', type: 'EXPENSE' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // const fetchCategories = () => {
  //   api.get(`/w/${workspaceId}/categories`).then(({ data }) => setCategories(data)).finally(() => setLoading(false))
  // }

  // useEffect(() => { if (workspaceId) fetchCategories() }, [workspaceId])

  const openCreate = () => {
    setEditId(null)
    setForm({ name: '', color: '#10b981', icon: 'wallet', type: 'EXPENSE' })
    setError('')
    setShowForm(true)
  }

  const openEdit = (cat: Category) => {
    setEditId(cat.id)
    setForm({ name: cat.name, color: cat.color, icon: cat.icon, type: cat.type })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editId) {
        await api.patch(`/w/${workspaceId}/categories/${editId}`, form)
      } else {
        await api.post(`/w/${workspaceId}/categories`, form)
      }
      setShowForm(false)
      invalidateCategories(workspaceId!)
    } catch (err: any) {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    try {
      await api.delete(`/w/${workspaceId}/categories/${id}`)
      invalidateCategories(workspaceId!)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cannot delete category')
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">Categories</h1>
          <p className="text-white/30 text-sm mt-0.5">{categories.length} categories</p>
        </div>
        {isEditor && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <span>+</span> New Category
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0d12] border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold mb-5">{editId ? 'Edit Category' : 'New Category'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Food & Dining" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"/>
              </div>
              <div>
                <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all">
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Color</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button key={color} type="button" onClick={() => setForm({ ...form, color })} className="w-7 h-7 rounded-full transition-transform hover:scale-110" style={{ backgroundColor: color, outline: form.color === color ? `2px solid ${color}` : 'none', outlineOffset: '2px' }}/>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Icon label</label>
                <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="e.g. wallet" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"/>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 text-sm py-2.5 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40"><p className="text-white/20 text-sm">Loading...</p></div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 border border-dashed border-white/10 rounded-xl">
          <p className="text-white/20 text-sm">No categories yet</p>
          {isEditor && <button onClick={openCreate} className="text-emerald-400 text-sm mt-2 hover:text-emerald-300">Create your first category</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-[#0a0d12] border border-white/5 rounded-xl p-4 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                  {cat.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">{cat.name}</p>
                  <p className="text-white/30 text-xs capitalize">{cat.type.toLowerCase()}</p>
                </div>
              </div>
              {isEditor && (
                <div className="flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cat)} className="text-white/30 hover:text-white/70 text-xs px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">Edit</button>
                  <button onClick={() => handleDelete(cat.id)} className="text-white/30 hover:text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-500/5 transition-colors">Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}