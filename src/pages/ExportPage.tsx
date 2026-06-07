import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { useWorkspaceRole } from '../hooks/useWorkspaceRole'
import api, { workspaceUrl } from '../lib/axios'

declare global {
  interface Window {
    PaystackPop: any
  }
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

const EXPORT_PRICE = 100

export default function ExportPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { user } = useAuthStore()
  const { isEditor } = useWorkspaceRole()
  const [exportType, setExportType] = useState<'all' | 'expenses' | 'income'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setThisMonth = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }

  const setLast3Months = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }

  const setThisYear = () => {
    const now = new Date()
    setStartDate(`${now.getFullYear()}-01-01`)
    setEndDate(`${now.getFullYear()}-12-31`)
  }

  const downloadExport = async () => {
    try {
      const params = new URLSearchParams({ type: exportType, startDate, endDate })
      const response = await api.get(
        workspaceUrl(workspaceId!, `/export?${params}`),
        { responseType: 'blob' }
      )
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `flowledger-statement-${startDate}-to-${endDate}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      setError('Export failed. Please contact support.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!startDate || !endDate) {
      setError('Please select a date range')
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before end date')
      return
    }
    setError('')

    if (!window.PaystackPop) {
      setError('Payment system not loaded. Please refresh and try again.')
      return
    }

    setLoading(true)
    let paid = false

    window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: user?.email,
      amount: EXPORT_PRICE * 100,
      currency: 'NGN',
      ref: `export_${Date.now()}`,
      callback: function(response: any) {
        console.log('callback:', response)
        paid = true
        downloadExport()
      },
      onClose: function() {
        console.log('closed, paid:', paid)
        if (!paid) setLoading(false)
      },
    }).openIframe()
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-white text-xl font-semibold">Export Statement</h1>
        <p className="text-white/30 text-sm mt-0.5">Download your financial data as CSV</p>
      </div>

      <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-6 space-y-5">

        {/* Export type */}
        <div className="space-y-2">
          <p className="text-white/50 text-xs uppercase tracking-wider">What to export</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'all', label: 'Everything' },
              { value: 'expenses', label: 'Expenses only' },
              { value: 'income', label: 'Income only' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setExportType(option.value as typeof exportType)}
                className={`p-3 rounded-lg border text-sm transition-all ${
                  exportType === option.value
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="space-y-2">
          <p className="text-white/50 text-xs uppercase tracking-wider">Date range</p>
          <div className="flex gap-2 mb-2">
            {[
              { label: 'This month', action: setThisMonth },
              { label: 'Last 3 months', action: setLast3Months },
              { label: 'This year', action: setThisYear },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={preset.action}
                className="text-xs bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/40 text-xs mb-1.5">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-white/40 text-xs mb-1.5">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Price and CTA */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/60 text-sm">Export fee</p>
              <p className="text-white/30 text-xs mt-0.5">One-time payment per export</p>
            </div>
            <p className="text-white text-xl font-semibold">{formatNaira(EXPORT_PRICE)}</p>
          </div>

          {isEditor ? (
            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-medium py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Pay {formatNaira(EXPORT_PRICE)} & Download
                </>
              )}
            </button>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/30 text-sm text-center">
              You need Editor access or above to export data
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" className="flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div>
          <p className="text-blue-400 text-sm">Your CSV will include date, title, category, amount and payment method for all selected transactions.</p>
          <p className="text-blue-400/50 text-xs mt-1">Payment is processed securely by Paystack.</p>
        </div>
      </div>
    </div>
  )
}