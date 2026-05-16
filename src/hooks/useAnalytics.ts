import { useState, useEffect } from 'react'
import api from '../lib/axios'

interface Overview {
  totalIncome: number
  totalExpenses: number
  balance: number
  savingsRate: number
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

export function useAnalytics(month?: string) {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [categories, setCategories] = useState<CategoryBreakdown[]>([])
  const [trend, setTrend] = useState<MonthlyTrend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = month ? `?month=${month}` : ''

    Promise.all([
      api.get(`/analytics/overview${params}`),
      api.get(`/analytics/categories${params}`),
      api.get('/analytics/trend?months=6'),
    ]).then(([overviewRes, categoriesRes, trendRes]) => {
      setOverview(overviewRes.data)
      setCategories(categoriesRes.data)
      setTrend(trendRes.data)
    }).finally(() => setLoading(false))
  }, [month])

  return { overview, categories, trend, loading }
}