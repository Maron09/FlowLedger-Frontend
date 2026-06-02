import { useState, useEffect } from 'react'
import api, { workspaceUrl } from '../lib/axios'

interface Overview {
  totalIncome: number
  totalExpenses: number
  balance: number
  savingsRate: number
  allTimeIncome: number
  allTimeExpenses: number
}

interface CategoryBreakdown {
  category: { id: string; name: string; color: string; icon: string }
  totalSpent: number
  percentage: number
}

interface MonthlyTrend {
  month: string
  income: number
  expenses: number
}

export function useAnalytics(workspaceId: string, month?: string) {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [categories, setCategories] = useState<CategoryBreakdown[]>([])
  const [trend, setTrend] = useState<MonthlyTrend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return
    const params = month ? `?month=${month}` : ''

    Promise.all([
      api.get(workspaceUrl(workspaceId, `/analytics/overview${params}`)),
      api.get(workspaceUrl(workspaceId, `/analytics/categories${params}`)),
      api.get(workspaceUrl(workspaceId, '/analytics/trend?months=6')),
    ]).then(([overviewRes, categoriesRes, trendRes]) => {
      setOverview(overviewRes.data)
      setCategories(categoriesRes.data)
      setTrend(trendRes.data)
    }).finally(() => setLoading(false))
  }, [workspaceId, month])

  return { overview, categories, trend, loading }
}