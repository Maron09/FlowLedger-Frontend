import { useQuery } from '@tanstack/react-query'
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
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', workspaceId, month],
    queryFn: async () => {
      const params = month ? `?month=${month}` : ''
      const [overviewRes, categoriesRes, trendRes] = await Promise.all([
        api.get(workspaceUrl(workspaceId, `/analytics/overview${params}`)),
        api.get(workspaceUrl(workspaceId, `/analytics/categories${params}`)),
        api.get(workspaceUrl(workspaceId, '/analytics/trend?months=6')),
      ])
      return {
        overview: overviewRes.data as Overview,
        categories: categoriesRes.data as CategoryBreakdown[],
        trend: trendRes.data as MonthlyTrend[],
      }
    },
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5,
  })

  return {
    overview: data?.overview ?? null,
    categories: data?.categories ?? [],
    trend: data?.trend ?? [],
    loading: isLoading,
  }
}