import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useWorkspaceStore } from '../store/workspace.store'
import api, { workspaceUrl } from '../lib/axios'

interface PersonalTaxEstimate {
  type: 'PERSONAL'
  monthlyIncome: number
  annualIncome: number
  annualTax: number
  monthlyTax: number
  effectiveRate: number
  breakdown?: { band: string; rate: number; tax: number }[]
  note: string
  employmentType: string
}

interface BusinessTaxEstimate {
  type: 'BUSINESS'
  ytdRevenue: number
  ytdExpenses: number
  taxableProfit: number
  annualizedRevenue: number
  annualizedProfit: number
  citRate: number
  annualTax: number
  ytdTax: number
  monthlyTaxProvision: number
  vatRegistered: boolean
  monthlyVat: number
  annualVat: number
  totalMonthlyProvision: number
  handlesPaye: boolean
  sector: string
  effectiveRate: number
  note: string
}

type TaxEstimate = PersonalTaxEstimate | BusinessTaxEstimate

interface TaxProfile {
  employmentType: 'SALARIED' | 'SELF_EMPLOYED' | 'MIXED'
  taxableCategories: string[]
  businessSector?: string
  businessSize?: string
  handlesPaye?: boolean
  vatRegistered?: boolean
  deductibleCategories?: string[]
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
  { value: 'SELF_EMPLOYED', label: 'Self-employed / Freelancer', description: 'All income is gross — no employer deducting tax' },
  { value: 'SALARIED', label: 'Salaried employee', description: 'Employer deducts tax — only side income needs estimation' },
  { value: 'MIXED', label: 'Mixed income', description: 'Net salary + side income — select which categories to include' },
]

const BUSINESS_SECTORS = [
  { value: 'GENERAL', label: 'General / Services' },
  { value: 'TECH', label: 'Technology' },
  { value: 'AGRICULTURE', label: 'Agriculture' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'OTHER', label: 'Other' },
]

const BUSINESS_SIZES = [
  { value: 'SOLE', label: 'Sole trader', description: 'No employees' },
  { value: 'MICRO', label: 'Micro (1–9 employees)', description: 'Simplified tax regime' },
  { value: 'SMALL', label: 'Small (10–49 employees)', description: 'Standard CIT applies' },
  { value: 'MEDIUM', label: 'Medium / Large (50+)', description: 'Full compliance required' },
]

function CheckBox({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${
        checked ? 'bg-emerald-500 border-emerald-500' : 'bg-white/5 border-white/20'
      }`}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
    </button>
  )
}

export default function TaxPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { activeWorkspace } = useWorkspaceStore()
  const [estimate, setEstimate] = useState<TaxEstimate | null>(null)
  const [profile, setProfile] = useState<TaxProfile | null>(null)
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileForm, setProfileForm] = useState<TaxProfile>({
    employmentType: 'SELF_EMPLOYED',
    taxableCategories: [],
    businessSector: 'GENERAL',
    businessSize: 'SMALL',
    handlesPaye: false,
    vatRegistered: false,
    deductibleCategories: [],
  })

  const isBusiness = activeWorkspace?.type === 'BUSINESS'

  const incomeCategories = allCategories.filter((c) => c.type === 'INCOME' || c.type === 'BOTH')
  const expenseCategories = allCategories.filter((c) => c.type === 'EXPENSE' || c.type === 'BOTH')

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
        employmentType: profileRes.data.employmentType ?? 'SELF_EMPLOYED',
        taxableCategories: profileRes.data.taxableCategories ?? [],
        businessSector: profileRes.data.businessSector ?? 'GENERAL',
        businessSize: profileRes.data.businessSize ?? 'SMALL',
        handlesPaye: profileRes.data.handlesPaye ?? false,
        vatRegistered: profileRes.data.vatRegistered ?? false,
        deductibleCategories: profileRes.data.deductibleCategories ?? [],
      })
      setAllCategories(catRes.data)
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

  const toggleCategory = (id: string, field: 'taxableCategories' | 'deductibleCategories') => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(id)
        ? (prev[field] as string[]).filter((c) => c !== id)
        : [...(prev[field] as string[]), id],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/20 text-sm">Loading...</p>
      </div>
    )
  }

  const biz = estimate?.type === 'BUSINESS' ? estimate as BusinessTaxEstimate : null
  const personal = estimate?.type === 'PERSONAL' ? estimate as PersonalTaxEstimate : null
  const hasData = biz ? biz.ytdRevenue > 0 : (personal?.monthlyIncome ?? 0) > 0

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">Tax Estimation</h1>
          <p className="text-white/30 text-sm mt-0.5">
            Based on Nigeria Tax Act 2025 — {isBusiness ? 'Companies Income Tax' : 'Personal Income Tax (PAYE)'}
          </p>
        </div>
        <button
          onClick={() => setShowSetup(!showSetup)}
          className="text-xs bg-white/5 hover:bg-white/10 text-white/50 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
        >
          {showSetup ? 'Hide setup' : 'Tax profile'}
        </button>
      </div>

      {/* Tax profile setup */}
      {showSetup && (
        <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-5 space-y-5">
          <p className="text-white/60 text-xs uppercase tracking-wider">Tax Profile</p>

          {!isBusiness ? (
            <>
              {/* Personal — employment type */}
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
                      profileForm.employmentType === type.value ? 'border-emerald-500 bg-emerald-500' : 'border-white/20'
                    }`}>
                      {profileForm.employmentType === type.value && <div className="w-1.5 h-1.5 rounded-full bg-white"/>}
                    </div>
                    <div>
                      <p className="text-white/80 text-sm font-medium">{type.label}</p>
                      <p className="text-white/30 text-xs mt-0.5">{type.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Personal — taxable categories */}
              {(profileForm.employmentType === 'SALARIED' || profileForm.employmentType === 'MIXED') && incomeCategories.length > 0 && (
                <div className="space-y-2">
                  <p className="text-white/50 text-xs uppercase tracking-wider">Taxable income categories</p>
                  {incomeCategories.map((cat) => (
                    <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id, 'taxableCategories')}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                        profileForm.taxableCategories.includes(cat.id) ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <CheckBox checked={profileForm.taxableCategories.includes(cat.id)} onClick={() => toggleCategory(cat.id, 'taxableCategories')}/>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}/>
                        <p className="text-white/70 text-sm">{cat.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Business — sector */}
              <div className="space-y-2">
                <p className="text-white/50 text-xs uppercase tracking-wider">Business sector</p>
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_SECTORS.map((sector) => (
                    <button key={sector.value} type="button"
                      onClick={() => setProfileForm({ ...profileForm, businessSector: sector.value })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        profileForm.businessSector === sector.value ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <p className="text-white/80 text-sm">{sector.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Business — size */}
              <div className="space-y-2">
                <p className="text-white/50 text-xs uppercase tracking-wider">Business size</p>
                {BUSINESS_SIZES.map((size) => (
                  <button key={size.value} type="button"
                    onClick={() => setProfileForm({ ...profileForm, businessSize: size.value })}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                      profileForm.businessSize === size.value ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                      profileForm.businessSize === size.value ? 'border-emerald-500 bg-emerald-500' : 'border-white/20'
                    }`}>
                      {profileForm.businessSize === size.value && <div className="w-1.5 h-1.5 rounded-full bg-white"/>}
                    </div>
                    <div>
                      <p className="text-white/80 text-sm font-medium">{size.label}</p>
                      <p className="text-white/30 text-xs">{size.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Business — toggles */}
              <div className="space-y-3">
                <p className="text-white/50 text-xs uppercase tracking-wider">Settings</p>
                <button type="button" onClick={() => setProfileForm({ ...profileForm, vatRegistered: !profileForm.vatRegistered })}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:border-white/20 transition-all"
                >
                  <div>
                    <p className="text-white/80 text-sm">VAT registered</p>
                    <p className="text-white/30 text-xs">7.5% VAT on eligible revenue</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors ${profileForm.vatRegistered ? 'bg-emerald-500' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${profileForm.vatRegistered ? 'translate-x-5' : 'translate-x-0.5'}`}/>
                  </div>
                </button>
                <button type="button" onClick={() => setProfileForm({ ...profileForm, handlesPaye: !profileForm.handlesPaye })}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:border-white/20 transition-all"
                >
                  <div>
                    <p className="text-white/80 text-sm">Handle PAYE for staff</p>
                    <p className="text-white/30 text-xs">You deduct and remit employee taxes</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors ${profileForm.handlesPaye ? 'bg-emerald-500' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${profileForm.handlesPaye ? 'translate-x-5' : 'translate-x-0.5'}`}/>
                  </div>
                </button>
              </div>

              {/* Business — taxable revenue categories */}
              {incomeCategories.length > 0 && (
                <div className="space-y-2">
                  <p className="text-white/50 text-xs uppercase tracking-wider">Taxable revenue categories</p>
                  <p className="text-white/20 text-xs">Leave all unchecked to include all income</p>
                  {incomeCategories.map((cat) => (
                    <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id, 'taxableCategories')}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                        profileForm.taxableCategories.includes(cat.id) ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <CheckBox checked={profileForm.taxableCategories.includes(cat.id)} onClick={() => toggleCategory(cat.id, 'taxableCategories')}/>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}/>
                        <p className="text-white/70 text-sm">{cat.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Business — deductible expense categories */}
              {expenseCategories.length > 0 && (
                <div className="space-y-2">
                  <p className="text-white/50 text-xs uppercase tracking-wider">Deductible expense categories</p>
                  <p className="text-white/20 text-xs">Leave all unchecked to include all expenses</p>
                  {expenseCategories.map((cat) => (
                    <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id, 'deductibleCategories')}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                        profileForm.deductibleCategories?.includes(cat.id) ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <CheckBox checked={profileForm.deductibleCategories?.includes(cat.id) ?? false} onClick={() => toggleCategory(cat.id, 'deductibleCategories')}/>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}/>
                        <p className="text-white/70 text-sm">{cat.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <button onClick={handleSaveProfile} disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      )}

      {/* Profile badges */}
      <div className="flex flex-wrap items-center gap-2">
        {isBusiness && profile?.businessSector && (
          <span className="text-xs bg-white/5 border border-white/10 text-white/40 px-2.5 py-1 rounded-md capitalize">
            {BUSINESS_SECTORS.find(s => s.value === profile.businessSector)?.label ?? profile.businessSector}
          </span>
        )}
        {isBusiness && profile?.vatRegistered && (
          <span className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-1 rounded-md">VAT registered</span>
        )}
        {isBusiness && profile?.handlesPaye && (
          <span className="text-xs bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2.5 py-1 rounded-md">PAYE employer</span>
        )}
        {!isBusiness && profile && (
          <span className="text-xs bg-white/5 border border-white/10 text-white/40 px-2.5 py-1 rounded-md">
            {profile.employmentType === 'SELF_EMPLOYED' ? 'Self-employed' :
             profile.employmentType === 'SALARIED' ? 'Salaried — side income only' : 'Mixed income'}
          </span>
        )}
      </div>

      {/* No data state */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-60 border border-dashed border-white/10 rounded-xl">
          <p className="text-white/20 text-sm">{isBusiness ? 'No revenue recorded this year' : 'No taxable income this month'}</p>
          <p className="text-white/10 text-xs mt-1">Add transactions to see your tax estimate</p>
        </div>
      ) : (
        <>
          {/* Business summary */}
          {isBusiness && biz && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">YTD Revenue</p>
                  <p className="text-white text-xl font-semibold">{formatNaira(biz.ytdRevenue)}</p>
                  <p className="text-white/30 text-xs mt-1">Annualized: {formatNaira(biz.annualizedRevenue)}</p>
                </div>
                <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">YTD Expenses</p>
                  <p className="text-white text-xl font-semibold">{formatNaira(biz.ytdExpenses)}</p>
                  <p className="text-white/30 text-xs mt-1">Deductible costs</p>
                </div>
                <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Taxable Profit</p>
                  <p className="text-white text-xl font-semibold">{formatNaira(biz.taxableProfit)}</p>
                  <p className="text-white/30 text-xs mt-1">Revenue minus expenses</p>
                </div>
                <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">CIT Rate</p>
                  <p className="text-white text-xl font-semibold">{biz.citRate}%</p>
                  <p className="text-white/30 text-xs mt-1">Companies Income Tax</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-amber-400/70 text-xs uppercase tracking-wider mb-2">Set Aside Monthly</p>
                  <p className="text-amber-400 text-xl font-semibold">{formatNaira(Math.ceil(biz.totalMonthlyProvision))}</p>
                  <p className="text-amber-400/50 text-xs mt-1">CIT{biz.vatRegistered ? ' + VAT' : ''} provision</p>
                </div>
                <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Annual CIT</p>
                  <p className="text-white text-xl font-semibold">{formatNaira(Math.ceil(biz.annualTax))}</p>
                  <p className="text-white/30 text-xs mt-1">Estimated liability</p>
                </div>
              </div>

              {biz.vatRegistered && (
                <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">VAT (7.5%)</p>
                    <p className="text-white text-lg font-semibold">{formatNaira(Math.ceil(biz.monthlyVat))}</p>
                    <p className="text-white/30 text-xs mt-0.5">Monthly VAT obligation</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Annual VAT</p>
                    <p className="text-white/70 text-sm">{formatNaira(Math.ceil(biz.annualVat))}</p>
                  </div>
                </div>
              )}

              {biz.handlesPaye && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                  <p className="text-purple-400 text-sm font-medium mb-1">PAYE Reminder</p>
                  <p className="text-purple-400/60 text-xs">You have PAYE obligations for your staff. Monthly PAYE returns must be filed and remitted to FIRS by the 10th of the following month.</p>
                </div>
              )}
            </div>
          )}

          {/* Personal summary */}
          {!isBusiness && personal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Taxable Income</p>
                  <p className="text-white text-xl font-semibold">{formatNaira(personal.monthlyIncome)}</p>
                  <p className="text-white/30 text-xs mt-1">Annual: {formatNaira(personal.annualIncome)}</p>
                </div>
                <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Effective Rate</p>
                  <p className="text-white text-xl font-semibold">{personal.effectiveRate.toFixed(1)}%</p>
                  <p className="text-white/30 text-xs mt-1">Of annual income</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-amber-400/70 text-xs uppercase tracking-wider mb-2">Set Aside Monthly</p>
                  <p className="text-amber-400 text-xl font-semibold">{formatNaira(Math.ceil(personal.monthlyTax))}</p>
                  <p className="text-amber-400/50 text-xs mt-1">For tax obligations</p>
                </div>
                <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Annual Tax</p>
                  <p className="text-white text-xl font-semibold">{formatNaira(Math.ceil(personal.annualTax))}</p>
                  <p className="text-white/30 text-xs mt-1">Estimated liability</p>
                </div>
              </div>

              {personal.breakdown && personal.breakdown.length > 0 && (
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
                    {personal.breakdown.map((band, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <p className="text-white/50 text-sm">{band.band}</p>
                        <div className="text-right">
                          <p className="text-white/70 text-sm font-medium">{band.rate}%</p>
                          <p className="text-white/30 text-xs">{formatNaira(band.tax)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              <p className="text-blue-400 text-sm">{estimate?.note}</p>
              <p className="text-blue-400/50 text-xs mt-1">This is an estimate only. Consult a tax professional for accurate filing.</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}