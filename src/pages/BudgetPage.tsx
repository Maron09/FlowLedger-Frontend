import { useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/axios'
import { useWorkspaceRole } from '../hooks/useWorkspaceRole'
import { useBudgets, useInvalidateBudgets } from '../hooks/useBudgets'
import { useCategories } from '../hooks/useCategories'

interface Budget {
  id: string
  amount: string
  period: string
  category: { id: string; name: string; color: string }
}

interface Category {
  id: string
  name: string
  color: string
  type: string
}

interface BudgetStatus {
  budget: Budget
  spent: number
  remaining: number
  percentage: number
  status: 'ok' | 'warning' | 'over'
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount)
}

export default function BudgetsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { isAdmin } = useWorkspaceRole()
  const { budgets: budgetStatuses, loading } = useBudgets(workspaceId!)
  const { categories } = useCategories(workspaceId!)
  const invalidateBudgets = useInvalidateBudgets()
  const [showForm, setShowForm] = useState(false)
  const [editBudget, setEditBudget] = useState<BudgetStatus | null>(null)
  const [form, setForm] = useState({ categoryId: '', amount: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  

  invalidateBudgets(workspaceId!)

  const openCreate = () => {
    setEditBudget(null)
    setForm({ categoryId: '', amount: '' })
    setError('')
    setShowForm(true)
  }

  const openEdit = (bs: BudgetStatus) => {
    setEditBudget(bs)
    setForm({ categoryId: bs.budget.category.id, amount: String(Number(bs.budget.amount)) })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post(`/w/${workspaceId}/budgets`, { categoryId: form.categoryId, amount: Number(form.amount) })
      setShowForm(false)
      setForm({ categoryId: '', amount: '' })
      invalidateBudgets(workspaceId!)
    } catch (err: any) {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return
    await api.delete(`/w/${workspaceId}/budgets/${id}`)
    invalidateBudgets(workspaceId!)
  }

  const statusColor = (status: string) => {
    if (status === 'over') return '#ef4444'
    if (status === 'warning') return '#f59e0b'
    return '#10b981'
  }

  const availableCategories = editBudget
    ? categories.filter((c: any) => c.id === editBudget.budget.category.id)
    : categories

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">Budgets</h1>
          <p className="text-white/30 text-sm mt-0.5">Monthly spending limits</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <span>+</span> Set Budget
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0d12] border border-white/10 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-semibold mb-5">{editBudget ? 'Edit Budget' : 'Set Budget'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Category</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required disabled={!!editBudget} className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all disabled:opacity-50">
                  <option value="" style={{ backgroundColor: '#0f1117' }}>Select category</option>
                  {availableCategories.map((cat: any) => (
                    <option key={cat.id} value={cat.id} style={{ backgroundColor: '#0f1117' }}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Monthly limit (₦)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="50000" required min="1" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"/>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 text-sm py-2.5 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">{saving ? 'Saving...' : editBudget ? 'Update' : 'Save Budget'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40"><p className="text-white/20 text-sm">Loading...</p></div>
      ) : budgetStatuses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 border border-dashed border-white/10 rounded-xl">
          <p className="text-white/20 text-sm">No budgets set</p>
          {isAdmin && <button onClick={openCreate} className="text-emerald-400 text-sm mt-2 hover:text-emerald-300">Set your first budget</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {budgetStatuses.map((bs: any) => {
            const { budget, spent, remaining, percentage, status } = bs
            return (
              <div key={budget.id} className="bg-[#0a0d12] border border-white/5 rounded-xl p-4 md:p-5 group">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0" style={{ backgroundColor: `${budget.category?.color}20`, color: budget.category?.color }}>
                      {budget.category?.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white/80 text-sm font-medium truncate">{budget.category?.name}</p>
                      <p className="text-white/30 text-xs">Monthly budget</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-white/70 text-sm whitespace-nowrap">{formatNaira(spent)} <span className="text-white/30">/ {formatNaira(Number(budget.amount))}</span></p>
                      <p className="text-xs" style={{ color: statusColor(status) }}>{status === 'over' ? `${formatNaira(Math.abs(remaining))} over` : `${formatNaira(remaining)} left`}</p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(bs)} className="text-white/30 hover:text-white/70 text-xs px-2 py-1 rounded hover:bg-white/5 transition-colors">Edit</button>
                        <button onClick={() => handleDelete(budget.id)} className="text-white/30 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-500/5 transition-colors">Delete</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: statusColor(status) }}/>
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-white/20 text-xs">0%</span>
                  <span className="text-white/20 text-xs">{percentage.toFixed(0)}%</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}