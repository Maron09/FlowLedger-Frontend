import { useState } from 'react'
import { useAnalytics } from '../hooks/useAnalytics'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
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

function getLast6Months() {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' })
    months.push({ value, label })
  }
  return months
}

const TOOLTIP_STYLE = {
  backgroundColor: '#0a0d12',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#fff',
}

export default function AnalyticsPage() {
  const months = getLast6Months()
  const [selectedMonth, setSelectedMonth] = useState(months[months.length - 1].value)
  const { overview, categories, trend } = useAnalytics(selectedMonth)

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-xl font-semibold">Analytics</h1>
          <p className="text-white/30 text-sm mt-0.5">Your financial picture</p>
        </div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-[#0a0d12] border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value} style={{ backgroundColor: '#0a0d12' }}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Income', value: overview?.totalIncome ?? 0, color: '#10b981' },
          { label: 'Expenses', value: overview?.totalExpenses ?? 0, color: '#ef4444' },
          { label: 'Balance', value: overview?.balance ?? 0, color: '#3b82f6' },
        ].map((item) => (
          <div key={item.label} className="bg-[#0a0d12] border border-white/5 rounded-xl p-4 md:p-5">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2">{item.label}</p>
            <p className="text-xl font-semibold" style={{ color: item.color }}>
              {formatNaira(item.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4 md:p-5">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-4">6-month trend</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trend} barGap={4}>
              <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: any) => formatNaira(Number(value))}
labelFormatter={(label: any) => formatMonth(String(label))}/>
              <Legend wrapperStyle={{ fontSize: '11px', color: '#ffffff50' }}/>
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.8}/>
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.8}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4 md:p-5">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-4">Spending breakdown</p>
          {categories.length > 0 ? (
            <div className="flex gap-4">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie data={categories} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="totalSpent">
                    {categories.map((entry, index) => (
                      <Cell key={index} fill={entry.category?.color ?? '#6366f1'}/>
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: any) => formatNaira(Number(value))}
labelFormatter={(label: any) => formatMonth(String(label))}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5 py-2">
                {categories.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.category?.color ?? '#6366f1' }}/>
                        <span className="text-white/50 text-xs truncate max-w-[80px]">{item.category?.name}</span>
                      </div>
                      <span className="text-white/50 text-xs">{item.percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.category?.color ?? '#6366f1' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-white/20 text-sm">No spending data for this month</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/60 text-xs uppercase tracking-wider">Savings rate</p>
          <p className="text-white font-semibold">{overview?.savingsRate.toFixed(1) ?? 0}%</p>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(overview?.savingsRate ?? 0, 100)}%`,
              backgroundColor: (overview?.savingsRate ?? 0) > 20 ? '#10b981' : '#f59e0b',
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-white/20 text-xs">0%</span>
          <span className="text-white/20 text-xs">
            {(overview?.savingsRate ?? 0) > 20 ? '✓ Healthy savings rate' : 'Aim for 20%+'}
          </span>
          <span className="text-white/20 text-xs">100%</span>
        </div>
      </div>
    </div>
  )
}