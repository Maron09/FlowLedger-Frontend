import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api, { workspaceUrl } from '../lib/axios'
import AddTransactionModal from '../components/ui/AddTransactionModal'
import Toast from '../components/ui/Toast'

interface Transaction {
  id: string
  title: string
  amount: string
  date: string
  paymentMethod?: string
  source?: string
  notes?: string
  categoryId?: string
  category?: { id: string; name: string; color: string; icon: string }
  type: 'expense' | 'income'
  isRecurring: boolean
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function RecurringPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [expenses, setExpenses] = useState<Transaction[]>([])
  const [income, setIncome] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [logAgainTransaction, setLogAgainTransaction] = useState<any>(null)
  const [toast, setToast] = useState<string | null>(null)

  const fetchRecurring = () => {
    if (!workspaceId) return
    Promise.all([
      api.get(workspaceUrl(workspaceId, '/expenses?isRecurring=true&limit=100')),
      api.get(workspaceUrl(workspaceId, '/income?isRecurring=true&limit=100')),
    ]).then(([expRes, incRes]) => {
      setExpenses(expRes.data.items.map((e: any) => ({ ...e, type: 'expense' })))
      setIncome(incRes.data.items.map((i: any) => ({ ...i, type: 'income' })))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchRecurring() }, [workspaceId])

  const all = [...expenses, ...income].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const handleLogAgain = (tx: Transaction) => {
    setLogAgainTransaction({
      title: tx.title,
      amount: tx.amount,
      date: new Date().toISOString(),
      categoryId: tx.categoryId,
      category: tx.category,
      paymentMethod: tx.paymentMethod,
      source: tx.source,
      notes: tx.notes,
      type: tx.type,
      isRecurring: false,
    })
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-white text-xl font-semibold">Recurring</h1>
        <p className="text-white/30 text-sm mt-0.5">
          {all.length} recurring transaction{all.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-white/20 text-sm">Loading...</p>
        </div>
      ) : all.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 border border-dashed border-white/10 rounded-xl">
          <p className="text-white/20 text-sm">No recurring transactions yet</p>
          <p className="text-white/10 text-xs mt-1">Mark a transaction as recurring when adding it</p>
        </div>
      ) : (
        <div className="space-y-2">
          {all.map((tx) => (
            <div
              key={`${tx.type}-${tx.id}`}
              className="bg-[#0a0d12] border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium flex-shrink-0"
                  style={{
                    backgroundColor: `${tx.category?.color ?? '#6366f1'}20`,
                    color: tx.category?.color ?? '#6366f1',
                  }}
                >
                  {tx.title[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white/80 text-sm font-medium truncate">{tx.title}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                      recurring
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-md"
                      style={{
                        backgroundColor: `${tx.category?.color ?? '#6366f1'}15`,
                        color: tx.category?.color ?? '#6366f1',
                      }}
                    >
                      {tx.category?.name ?? 'Uncategorized'}
                    </span>
                    <span className="text-white/20 text-xs">
                      Last: {new Date(tx.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatNaira(Number(tx.amount))}
                </p>
                <button
                  onClick={() => handleLogAgain(tx)}
                  className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border border-emerald-500/20"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                  Log again
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {logAgainTransaction && (
        <AddTransactionModal
          transaction={logAgainTransaction}
          onClose={() => setLogAgainTransaction(null)}
          onSuccess={() => {
            setLogAgainTransaction(null)
            setToast('Transaction logged successfully')
            fetchRecurring()
          }}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}