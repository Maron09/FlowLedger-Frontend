import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../lib/axios'

interface Trade {
  id: string
  units: number
  pricePerUnit: number
  totalCost: number
  buyDate: string
  notes?: string
}

interface Position {
  id: string
  symbol: string
  name: string
  exchange: string
  currency: string
  totalUnits: number
  avgCost: number
  totalCost: number
  currentPrice: number | null
  currentValue: number | null
  gainLoss: number | null
  gainLossPct: number | null
  trades: Trade[]
}

interface Summary {
  NGN: { totalValue: number; totalCost: number; gainLoss: number; gainLossPct: number }
  USD: { totalValue: number; totalCost: number; gainLoss: number; gainLossPct: number }
}

interface SearchResult {
  symbol: string
  name: string
  type: string
  region: string
  currency: string
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function PortfolioPage() {
  const { workspaceId } = useParams()
  const [positions, setPositions] = useState<Position[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null)

  const fetchPortfolio = async () => {
    try {
      const { data } = await api.get(`/w/${workspaceId}/portfolio`)
      setPositions(data.positions)
      setSummary(data.summary)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPortfolio() }, [workspaceId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio</h1>
          <p className="text-white/40 text-sm mt-1">Track your investments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add trade
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* NGN Summary */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Nigerian Stocks</span>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">NGN</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.NGN.totalValue, 'NGN')}</p>
            <p className="text-white/40 text-sm mt-1">Cost: {formatCurrency(summary.NGN.totalCost, 'NGN')}</p>
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${summary.NGN.gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <span>{summary.NGN.gainLoss >= 0 ? '↑' : '↓'}</span>
              <span>{formatCurrency(Math.abs(summary.NGN.gainLoss), 'NGN')}</span>
              <span className="text-white/30">({summary.NGN.gainLossPct.toFixed(2)}%)</span>
            </div>
          </div>

          {/* USD Summary */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">International Stocks</span>
              <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">USD</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.USD.totalValue, 'USD')}</p>
            <p className="text-white/40 text-sm mt-1">Cost: {formatCurrency(summary.USD.totalCost, 'USD')}</p>
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${summary.USD.gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <span>{summary.USD.gainLoss >= 0 ? '↑' : '↓'}</span>
              <span>{formatCurrency(Math.abs(summary.USD.gainLoss), 'USD')}</span>
              <span className="text-white/30">({summary.USD.gainLossPct.toFixed(2)}%)</span>
            </div>
          </div>
        </div>
      )}

      {/* Positions */}
      {positions.length === 0 ? (
        <div className="text-center py-20 text-white/20">
          <p className="text-lg">No positions yet</p>
          <p className="text-sm mt-2">Add your first trade to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Positions</h2>
          {positions.map((pos) => (
            <div key={pos.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {/* Position header */}
              <button
                className="w-full text-left p-5 hover:bg-white/5 transition-colors"
                onClick={() => setExpandedPosition(expandedPosition === pos.id ? null : pos.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${pos.currency === 'NGN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {pos.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{pos.symbol}</p>
                      <p className="text-white/40 text-xs">{pos.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      {pos.currentValue
                        ? formatCurrency(pos.currentValue, pos.currency)
                        : formatCurrency(pos.totalCost, pos.currency)}
                    </p>
                    {pos.gainLossPct !== null && (
                      <p className={`text-xs font-medium ${pos.gainLossPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pos.gainLossPct >= 0 ? '+' : ''}{pos.gainLossPct.toFixed(2)}%
                      </p>
                    )}
                    {pos.currentPrice === null && (
                      <p className="text-xs text-white/20">Price unavailable</p>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-white/30 text-xs">Units</p>
                    <p className="text-white/70 text-sm font-medium">{pos.totalUnits}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs">Avg cost</p>
                    <p className="text-white/70 text-sm font-medium">{formatCurrency(pos.avgCost, pos.currency)}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs">Current price</p>
                    <p className="text-white/70 text-sm font-medium">
                      {pos.currentPrice ? formatCurrency(pos.currentPrice, pos.currency) : '—'}
                    </p>
                  </div>
                </div>
              </button>

              {/* Trades list */}
              {expandedPosition === pos.id && (
                <div className="border-t border-white/5 px-5 pb-5">
                  <p className="text-xs text-white/30 uppercase tracking-widest mt-4 mb-3">Trade history</p>
                  <div className="space-y-2">
                    {pos.trades.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-white/70 text-sm">{trade.units} units @ {formatCurrency(trade.pricePerUnit, pos.currency)}</p>
                          <p className="text-white/30 text-xs">{new Date(trade.buyDate).toLocaleDateString()}</p>
                          {trade.notes && <p className="text-white/20 text-xs mt-1">{trade.notes}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-white/60 text-sm">{formatCurrency(trade.totalCost, pos.currency)}</p>
                          <button
                            onClick={() => handleDeleteTrade(trade.id)}
                            className="text-red-400/50 hover:text-red-400 text-xs mt-1 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add trade modal */}
      {showAddModal && (
        <AddTradeModal
          workspaceId={workspaceId!}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchPortfolio()
          }}
        />
      )}
    </div>
  )

  async function handleDeleteTrade(tradeId: string) {
    if (!confirm('Delete this trade?')) return
    try {
      await api.delete(`/w/${workspaceId}/portfolio/trades/${tradeId}`)
      fetchPortfolio()
    } catch (err) {
      console.error(err)
    }
  }
}

function AddTradeModal({ workspaceId, onClose, onSuccess }: {
  workspaceId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [exchange, setExchange] = useState<'INTERNATIONAL' | 'NGX'>('INTERNATIONAL')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null)
  const [form, setForm] = useState({
    units: '',
    pricePerUnit: '',
    buyDate: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const { data } = await api.get(
        `/w/${workspaceId}/portfolio/search?q=${searchQuery}&exchange=${exchange}`
      )
      setSearchResults(data)
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedStock || !form.units || !form.pricePerUnit) {
      setError('Please select a stock and fill in all fields')
      return
    }
    setSaving(true)
    setError('')
    try {
      const currency = exchange === 'NGX' ? 'NGN' : (selectedStock.currency === 'NGN' ? 'NGN' : 'USD')
      await api.post(`/w/${workspaceId}/portfolio/trades`, {
        symbol: selectedStock.symbol,
        name: selectedStock.name,
        exchange,
        currency,
        units: Number(form.units),
        pricePerUnit: Number(form.pricePerUnit),
        buyDate: form.buyDate,
        notes: form.notes || undefined,
      })
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add trade')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-white font-semibold">Add trade</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Exchange selector */}
          <div className="space-y-2">
            <label className="text-xs text-white/40 uppercase tracking-widest">Market</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setExchange('INTERNATIONAL')
                  setSelectedStock(null)
                  setSearchResults([])
                  setSearchQuery('')
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                  exchange === 'INTERNATIONAL'
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                }`}
              >
                🌍 International
              </button>
              <button
                onClick={() => {
                  setExchange('NGX')
                  setSelectedStock(null)
                  setSearchResults([])
                  setSearchQuery('')
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                  exchange === 'NGX'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                }`}
              >
                🇳🇬 NGX
              </button>
            </div>
          </div>

          {/* Stock search */}
          {!selectedStock ? (
            <div className="space-y-3">
              <label className="text-xs text-white/40 uppercase tracking-widest">Search stock</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={exchange === 'NGX' ? 'e.g. DANGCEM, MTNN, GTCO' : 'e.g. AAPL, TSLA, MSFT'}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {searching ? '...' : 'Search'}
                </button>
              </div>

              {exchange === 'NGX' && (
                <p className="text-white/20 text-xs">
                  Search by ticker symbol or company name e.g. DANGCEM, Zenith, MTN
                </p>
              )}

              {searchResults.length === 0 && searchQuery && !searching && (
                <p className="text-white/20 text-xs text-center py-4">
                  {exchange === 'NGX'
                    ? 'No NGX stocks found. Prices update every 30 minutes.'
                    : 'No results found. Try a different search term.'}
                </p>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.symbol}
                      onClick={() => setSelectedStock(result)}
                      className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm font-medium">{result.symbol}</p>
                          <p className="text-white/40 text-xs">{result.name} · {result.region}</p>
                        </div>
                        {(result as any).price && (
                          <p className="text-emerald-400 text-sm font-medium">
                            ₦{(result as any).price.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
              <div>
                <p className="text-emerald-400 font-medium text-sm">{selectedStock.symbol}</p>
                <p className="text-white/40 text-xs">{selectedStock.name}</p>
              </div>
              <button
                onClick={() => { setSelectedStock(null); setSearchResults([]) }}
                className="text-white/30 hover:text-white text-xs transition-colors"
              >
                Change
              </button>
            </div>
          )}

          {/* Trade details */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest">Units purchased</label>
              <input
                type="number"
                value={form.units}
                onChange={(e) => setForm({ ...form, units: e.target.value })}
                placeholder="e.g. 100"
                className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest">
                Price per unit ({exchange === 'NGX' ? '₦' : '$'})
              </label>
              <input
                type="number"
                value={form.pricePerUnit}
                onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
                placeholder={exchange === 'NGX' ? 'e.g. 450' : 'e.g. 150.50'}
                className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest">Buy date</label>
              <input
                type="date"
                value={form.buyDate}
                onChange={(e) => setForm({ ...form, buyDate: e.target.value })}
                className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest">Notes (optional)</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any notes..."
                className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Cost preview */}
          {form.units && form.pricePerUnit && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Total cost</p>
              <p className="text-white font-semibold">
                {exchange === 'NGX' ? '₦' : '$'}
                {(Number(form.units) * Number(form.pricePerUnit)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={saving || !selectedStock}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add trade'}
          </button>
        </div>
      </div>
    </div>
  )
}