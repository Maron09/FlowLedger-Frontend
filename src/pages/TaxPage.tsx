import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useWorkspaceStore } from '../store/workspace.store'
import api, { workspaceUrl } from '../lib/axios'

interface TaxEstimate {
  type: 'PERSONAL' | 'BUSINESS'
  monthlyIncome: number
  annualIncome: number
  annualTax: number
  monthlyTax: number
  effectiveRate: number
  breakdown?: { band: string; rate: number; tax: number }[]
  citRate?: number
  monthlyVat?: number
  companySize?: string
  note: string
  employmentType: string
}

interface TaxProfile {
  employmentType: 'SALARIED' | 'SELF_EMPLOYED' | 'MIXED'
  taxableCategories: string[]
}

interface Category {
  id: string
  name: string
  color: string
  type: string
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

const EMPLOYMENT_TYPES = [
  {
    value: 'SELF_EMPLOYED',
    label: 'Self-employed / Freelancer',
    description: 'All income is gross — no employer deducting tax',
  },
  {
    value: 'SALARIED',
    label: 'Salaried employee',
    description: 'Employer deducts tax — only side income needs estimation',
  },
  {
    value: 'MIXED',
    label: 'Mixed income',
    description: 'Net salary + side income — select which categories to include',
  },
]

export default function TaxPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { activeWorkspace } = useWorkspaceStore()
  const [estimate, setEstimate] = useState<TaxEstimate | null>(null)
  const [profile, setProfile] = useState<TaxProfile | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileForm, setProfileForm] = useState<TaxProfile>({
    employmentType: 'SELF_EMPLOYED',
    taxableCategories: [],
  })

  const isBusiness = activeWorkspace?.type === 'BUSINESS'

  const fetchData = () => {
    if (!workspaceId) return
    Promise.all([
      api.get(workspaceUrl(workspaceId, '/analytics/tax')),
      api.get(workspaceUrl(workspaceId, '/analytics/tax/profile')),
      api.get(workspaceUrl(workspaceId, '/categories')),
    ]).then(([taxRes, profileRes, catRes]) => {
      setEstimate(taxRes.data)
      setProfile(profileRes.data)
      setProfileForm({
        employmentType: profileRes.data.employmentType,
        taxableCategories: profileRes.data.taxableCategories,
      })
      setCategories(catRes.data.filter((c: Category) => c.type === 'INCOME' || c.type === 'BOTH'))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [workspaceId])

  const handleSaveProfile = async () => {
    if (!workspaceId) return
    setSaving(true)
    try {
      await api.patch(workspaceUrl(workspaceId, '/analytics/tax/profile'), profileForm)
      await fetchData()
      setShowSetup(false)
    } finally {
      setSaving(false)
    }
  }

  const toggleCategory = (id: string) => {
    setProfileForm((prev) => ({
      ...prev,
      taxableCategories: prev.taxableCategories.includes(id)
        ? prev.taxableCategories.filter((c) => c !== id)
        : [...prev.taxableCategories, id],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/20 text-sm">Loading...</p>
      </div>
    )
  }

  const showCategorySelector = profileForm.employmentType === 'SALARIED' || profileForm.employmentType === 'MIXED'

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">Tax Estimation</h1>
          <p className="text-white/30 text-sm mt-0.5">
            Based on Nigeria Tax Act 2025 — {isBusiness ? 'Companies Income Tax' : 'Personal Income Tax (PAYE)'}
          </p>
        </div>
        {!isBusiness && (
          <button
            onClick={() => setShowSetup(!showSetup)}
            className="text-xs bg-white/5 hover:bg-white/10 text-white/50 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
          >
            {showSetup ? 'Hide setup' : 'Tax profile'}
          </button>
        )}
      </div>

      {/* Tax profile setup */}
      {showSetup && !isBusiness && (
        <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-5 space-y-4">
          <p className="text-white/60 text-xs uppercase tracking-wider">Tax Profile</p>

          {/* Employment type */}
          <div className="space-y-2">
            <p className="text-white/50 text-xs uppercase tracking-wider">Employment type</p>
            {EMPLOYMENT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setProfileForm({ ...profileForm, employmentType: type.value as TaxProfile['employmentType'], taxableCategories: [] })}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  profileForm.employmentType === type.value
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                  profileForm.employmentType === type.value
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-white/20'
                }`}>
                  {profileForm.employmentType === type.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white"/>
                  )}
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">{type.label}</p>
                  <p className="text-white/30 text-xs mt-0.5">{type.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Category selector */}
          {showCategorySelector && categories.length > 0 && (
            <div className="space-y-2">
              <p className="text-white/50 text-xs uppercase tracking-wider">
                {profileForm.employmentType === 'SALARIED'
                  ? 'Select taxable side income categories'
                  : 'Select which income categories to include in tax calculation'}
              </p>
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      profileForm.taxableCategories.includes(cat.id)
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${
                      profileForm.taxableCategories.includes(cat.id)
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'bg-white/5 border-white/20'
                    }`}>
                      {profileForm.taxableCategories.includes(cat.id) && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}/>
                      <p className="text-white/70 text-sm">{cat.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      )}

      {/* Employment type badge */}
      {!isBusiness && profile && (
        <div className="flex items-center gap-2">
          <span className="text-xs bg-white/5 border border-white/10 text-white/40 px-2.5 py-1 rounded-md">
            {profile.employmentType === 'SELF_EMPLOYED' ? 'Self-employed' :
             profile.employmentType === 'SALARIED' ? 'Salaried — side income only' :
             'Mixed income'}
          </span>
          {profile.taxableCategories.length > 0 && (
            <span className="text-xs bg-white/5 border border-white/10 text-white/40 px-2.5 py-1 rounded-md">
              {profile.taxableCategories.length} categor{profile.taxableCategories.length === 1 ? 'y' : 'ies'} included
            </span>
          )}
        </div>
      )}

      {/* No income state */}
      {(!estimate || estimate.monthlyIncome === 0) ? (
        <div className="flex flex-col items-center justify-center h-60 border border-dashed border-white/10 rounded-xl">
          <p className="text-white/20 text-sm">No taxable income this month</p>
          <p className="text-white/10 text-xs mt-1">
            {profile?.employmentType === 'SALARIED'
              ? 'Add side income or update your tax profile'
              : 'Add income transactions to see your tax estimate'}
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Taxable Income</p>
              <p className="text-white text-xl font-semibold">{formatNaira(estimate.monthlyIncome)}</p>
              <p className="text-white/30 text-xs mt-1">Annual: {formatNaira(estimate.annualIncome)}</p>
            </div>
            <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Effective Tax Rate</p>
              <p className="text-white text-xl font-semibold">{estimate.effectiveRate.toFixed(1)}%</p>
              <p className="text-white/30 text-xs mt-1">Of annual income</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-amber-400/70 text-xs uppercase tracking-wider mb-2">Set Aside Monthly</p>
              <p className="text-amber-400 text-xl font-semibold">{formatNaira(Math.ceil(estimate.monthlyTax))}</p>
              <p className="text-amber-400/50 text-xs mt-1">For tax obligations</p>
            </div>
            <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Annual Tax</p>
              <p className="text-white text-xl font-semibold">{formatNaira(Math.ceil(estimate.annualTax))}</p>
              <p className="text-white/30 text-xs mt-1">Estimated liability</p>
            </div>
          </div>

          {/* Business VAT card */}
          {isBusiness && estimate.monthlyVat !== undefined && (
            <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">VAT (7.5%)</p>
                  <p className="text-white text-lg font-semibold">{formatNaira(Math.ceil(estimate.monthlyVat))}</p>
                  <p className="text-white/30 text-xs mt-0.5">Monthly VAT on eligible transactions</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Company size</p>
                  <p className="text-white/70 text-sm">{estimate.companySize}</p>
                  <p className="text-white/30 text-xs mt-0.5">CIT rate: {estimate.citRate}%</p>
                </div>
              </div>
            </div>
          )}

          {/* PAYE breakdown */}
          {!isBusiness && estimate.breakdown && estimate.breakdown.length > 0 && (
            <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-5">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-4">Tax Band Breakdown</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <p className="text-white/50 text-sm">First ₦800,000</p>
                    <p className="text-white/20 text-xs">Tax-free threshold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 text-sm font-medium">0%</p>
                    <p className="text-white/20 text-xs">{formatNaira(0)}</p>
                  </div>
                </div>
                {estimate.breakdown.map((band, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-white/50 text-sm">{band.band}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/70 text-sm font-medium">{band.rate}%</p>
                      <p className="text-white/30 text-xs">{formatNaira(band.tax)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <p className="text-blue-400 text-sm">{estimate.note}</p>
              <p className="text-blue-400/50 text-xs mt-1">
                This is an estimate only. Consult a tax professional for accurate filing.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}