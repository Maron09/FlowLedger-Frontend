import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAnalytics } from '../hooks/useAnalytics'
import { useRecentExpenses } from '../hooks/useExpenses'
import { useWorkspaceStore } from '../store/workspace.store'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split('-')
  return new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'short' })
}

const LABELS = {
  PERSONAL: {
    income: 'Total Income',
    expenses: 'Total Expenses',
    balance: 'Balance',
    savingsRate: 'Savings Rate',
    savingsSub: 'Of income saved',
    chart: 'Income vs Expenses',
  },
  BUSINESS: {
    income: 'Total Revenue',
    expenses: 'Operating Expenses',
    balance: 'Net Profit',
    savingsRate: 'Profit Margin',
    savingsSub: 'Of revenue retained',
    chart: 'Revenue vs Expenses',
  },
}

function SummaryCard({ label, value, sub, positive }: {
  label: string; value: string; sub?: string; positive?: boolean
}) {
  return (
    <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4 md:p-5">
      <p className="text-white/40 text-xs uppercase tracking-wider mb-3">{label}</p>
      <p className="text-white text-xl md:text-2xl font-semibold tracking-tight">{value}</p>
      {sub && (
        <p className={`text-xs mt-1.5 ${positive ? 'text-emerald-400' : 'text-white/30'}`}>{sub}</p>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { activeWorkspace, workspaces, setActiveWorkspace } = useWorkspaceStore()
  const { overview, categories, trend, loading } = useAnalytics(workspaceId!)
  const { expenses } = useRecentExpenses(workspaceId!)

  // Sync active workspace from URL
  useEffect(() => {
    if (workspaceId && workspaces.length > 0) {
      const ws = workspaces.find((w) => w.id === workspaceId)
      if (ws && ws.id !== activeWorkspace?.id) {
        setActiveWorkspace(ws)
      }
    }
  }, [workspaceId, workspaces])

  const labels = LABELS[activeWorkspace?.type ?? 'PERSONAL']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/20 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">
            {activeWorkspace?.name ?? 'Dashboard'}
          </h1>
          <p className="text-white/30 text-sm mt-0.5">
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        {activeWorkspace?.type === 'BUSINESS' && (
          <span className="text-xs bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-md">
            Business
          </span>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <SummaryCard
          label={labels.balance}
          value={formatNaira(overview?.balance ?? 0)}
          sub={overview && overview.balance >= 0 ? 'Positive' : 'Negative'}
          positive={!!(overview && overview.balance >= 0)}
        />
        <SummaryCard
          label={labels.income}
          value={formatNaira(overview?.totalIncome ?? 0)}
          sub="This month"
          positive
        />
        <SummaryCard
          label={labels.expenses}
          value={formatNaira(overview?.totalExpenses ?? 0)}
          sub="This month"
        />
        <SummaryCard
          label={labels.savingsRate}
          value={`${overview?.savingsRate.toFixed(1) ?? 0}%`}
          sub={labels.savingsSub}
          positive={!!(overview && overview.savingsRate > 20)}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#0a0d12] border border-white/5 rounded-xl p-4 md:p-5">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-4">{labels.chart}</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                formatter={(value: any) => formatNaira(Number(value))}
                labelFormatter={(label: any) => formatMonth(String(label))}
              />
              <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" name={labels.income}/>
              <Area type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} fill="url(#expenseGrad)" name={labels.expenses}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4 md:p-5">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-4">Spending by Category</p>
          {categories.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categories} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="totalSpent">
                    {categories.map((entry, index) => (
                      <Cell key={index} fill={entry.category?.color ?? '#6366f1'}/>
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {categories.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.category?.color ?? '#6366f1' }}/>
                      <span className="text-white/50 text-xs truncate max-w-[100px]">{item.category?.name}</span>
                    </div>
                    <span className="text-white/70 text-xs">{item.percentage.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-white/20 text-sm">No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4 md:p-5">
        <p className="text-white/60 text-xs uppercase tracking-wider mb-4">Recent Transactions</p>
        {expenses.length > 0 ? (
          <div className="space-y-1">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                    style={{ backgroundColor: `${expense.category?.color}20` }}
                  >
                    <span style={{ color: expense.category?.color }}>₦</span>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">{expense.title}</p>
                    <p className="text-white/30 text-xs">{expense.category?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-red-400 text-sm font-medium">-{formatNaira(Number(expense.amount))}</p>
                  <p className="text-white/20 text-xs">
                    {new Date(expense.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-24">
            <p className="text-white/20 text-sm">No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  )
}