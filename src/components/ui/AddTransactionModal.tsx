import { useState, useEffect } from 'react'
import api from '../../lib/axios'

interface Category {
  id: string
  name: string
  color: string
  type: string
}

interface Transaction {
  id: string
  title: string
  amount: string
  date: string
  paymentMethod?: string
  source?: string
  notes?: string
  categoryId?: string
  category?: { id: string; name: string }
  type: 'expense' | 'income'
}

interface Props {
  onClose: () => void
  onSuccess: () => void
  transaction?: Transaction
}

export default function AddTransactionModal({ onClose, onSuccess, transaction }: Props) {
  const isEditing = !!transaction
  const [tab, setTab] = useState<'expense' | 'income'>(transaction?.type ?? 'expense')
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    title: transaction?.title ?? '',
    amount: transaction?.amount ?? '',
    date: transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    categoryId: transaction?.category?.id ?? '',
    paymentMethod: transaction?.paymentMethod ?? 'CARD',
    source: transaction?.source ?? '',
    notes: transaction?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data))
  }, [])

  const filteredCategories = categories.filter((c) =>
    c.type === (tab === 'expense' ? 'EXPENSE' : 'INCOME') || c.type === 'BOTH'
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (isEditing) {
        if (tab === 'expense') {
          await api.patch(`/expenses/${transaction!.id}`, {
            title: form.title,
            amount: Number(form.amount),
            date: form.date,
            categoryId: form.categoryId,
            paymentMethod: form.paymentMethod,
            notes: form.notes || undefined,
          })
        } else {
          await api.patch(`/income/${transaction!.id}`, {
            title: form.title,
            amount: Number(form.amount),
            date: form.date,
            categoryId: form.categoryId || undefined,
            source: form.source || undefined,
            notes: form.notes || undefined,
          })
        }
      } else {
        if (tab === 'expense') {
          await api.post('/expenses', {
            title: form.title,
            amount: Number(form.amount),
            date: form.date,
            categoryId: form.categoryId,
            paymentMethod: form.paymentMethod,
            notes: form.notes || undefined,
          })
        } else {
          await api.post('/income', {
            title: form.title,
            amount: Number(form.amount),
            date: form.date,
            categoryId: form.categoryId || undefined,
            source: form.source || undefined,
            notes: form.notes || undefined,
          })
        }
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0d12] border border-white/10 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">
            {isEditing ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">✕</button>
        </div>

        {/* Tabs — disabled when editing */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1 mb-5">
          <button
            type="button"
            onClick={() => !isEditing && setTab('expense')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              tab === 'expense'
                ? 'bg-red-500/20 text-red-400'
                : 'text-white/30 hover:text-white/60'
            } ${isEditing ? 'cursor-default' : ''}`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => !isEditing && setTab('income')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              tab === 'income'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-white/30 hover:text-white/60'
            } ${isEditing ? 'cursor-default' : ''}`}
          >
            Income
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={tab === 'expense' ? 'e.g. Chicken Republic' : 'e.g. April Salary'}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Amount (₦)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
                required
                min="1"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              required={tab === 'expense'}
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
            >
              <option value="" style={{ backgroundColor: '#0f1117' }}>Select category</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id} style={{ backgroundColor: '#0f1117' }}>{cat.name}</option>
              ))}
            </select>
          </div>

          {tab === 'expense' && (
            <div>
              <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Payment method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              >
                {['CARD', 'CASH', 'TRANSFER', 'MOBILE_MONEY', 'OTHER'].map((m) => (
                  <option key={m} value={m} style={{ backgroundColor: '#0f1117' }}>{m.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          )}

          {tab === 'income' && (
            <div>
              <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Source</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="e.g. Tech Corp, Upwork"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 text-sm py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors ${
                tab === 'expense' ? 'bg-red-500/80 hover:bg-red-500' : 'bg-emerald-500 hover:bg-emerald-400'
              }`}
            >
              {saving ? 'Saving...' : isEditing ? 'Update' : `Add ${tab === 'expense' ? 'Expense' : 'Income'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}