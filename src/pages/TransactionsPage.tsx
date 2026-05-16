import { useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import AddTransactionModal from '../components/ui/AddTransactionModal'
import api from '../lib/axios'

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function TransactionsPage() {
  const { expenses, income, meta, loading, page, setPage, search, setSearch } = useTransactions()
  const [editTransaction, setEditTransaction] = useState<any>(null)

  const all = [...expenses, ...income].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const handleDelete = async (id: string, type: 'expense' | 'income') => {
    if (!confirm('Delete this transaction?')) return
    await api.delete(`/${type === 'expense' ? 'expenses' : 'income'}/${id}`)
    window.location.reload()
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">Transactions</h1>
          <p className="text-white/30 text-sm mt-0.5">{all.length} transactions this page</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search transactions..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0a0d12] border border-white/5 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/5">
          <span className="text-white/30 text-xs uppercase tracking-wider">Transaction</span>
          <span className="text-white/30 text-xs uppercase tracking-wider">Category</span>
          <span className="text-white/30 text-xs uppercase tracking-wider">Date</span>
          <span className="text-white/30 text-xs uppercase tracking-wider text-right">Amount</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-white/20 text-sm">Loading...</p>
          </div>
        ) : all.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-white/20 text-sm">No transactions found</p>
          </div>
        ) : (
          all.map((tx) => (
            <div
              key={`${tx.type}-${tx.id}`}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors group"
            >
              {/* Title */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-medium"
                  style={{ backgroundColor: `${tx.category?.color ?? '#6366f1'}20`, color: tx.category?.color ?? '#6366f1' }}
                >
                  {tx.title[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white/80 text-sm truncate">{tx.title}</p>
                  <p className="text-white/30 text-xs capitalize">
                    {tx.paymentMethod?.toLowerCase().replace('_', ' ') ?? (tx as any).source ?? '—'}
                  </p>
                </div>
              </div>

              {/* Category */}
              <div className="flex items-center">
                <span
                  className="text-xs px-2 py-1 rounded-md"
                  style={{
                    backgroundColor: `${tx.category?.color ?? '#6366f1'}15`,
                    color: tx.category?.color ?? '#6366f1',
                  }}
                >
                  {tx.category?.name ?? 'Uncategorized'}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center">
                <span className="text-white/30 text-sm">
                  {new Date(tx.date).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
              </div>

              {/* Amount + actions */}
              <div className="flex items-center gap-3 justify-end">
                <span className={`text-sm font-medium ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatNaira(Number(tx.amount))}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditTransaction(tx)}
                    className="text-white/30 hover:text-white/70 text-xs px-2 py-1 rounded hover:bg-white/5 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id, tx.type)}
                    className="text-white/30 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-500/5 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-white/30 text-sm">Page {page} of {meta.totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/50 text-sm disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === meta.totalPages}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/50 text-sm disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTransaction && (
        <AddTransactionModal
          transaction={editTransaction}
          onClose={() => setEditTransaction(null)}
          onSuccess={() => { setEditTransaction(null); window.location.reload() }}
        />
      )}
    </div>
  )
}