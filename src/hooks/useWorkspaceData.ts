import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

// Cache keys
export const keys = {
  overview: (wid: string) => ['overview', wid],
  transactions: (wid: string) => ['transactions', wid],
  budgets: (wid: string) => ['budgets', wid],
  categories: (wid: string) => ['categories', wid],
  analytics: (wid: string, month: string) => ['analytics', wid, month],
  portfolio: (wid: string) => ['portfolio', wid],
  recurring: (wid: string) => ['recurring', wid],
  tax: (wid: string) => ['tax', wid],
}

// Overview
export function useOverview(workspaceId: string) {
  return useQuery({
    queryKey: keys.overview(workspaceId),
    queryFn: () => api.get(`/w/${workspaceId}/analytics/overview`).then(r => r.data),
    enabled: !!workspaceId,
  })
}

// Transactions
export function useTransactions(workspaceId: string) {
  return useQuery({
    queryKey: keys.transactions(workspaceId),
    queryFn: async () => {
      const [expRes, incRes] = await Promise.all([
        api.get(`/w/${workspaceId}/expenses?limit=100`),
        api.get(`/w/${workspaceId}/income?limit=100`),
      ])
      const expenses = expRes.data.items.map((e: any) => ({ ...e, type: 'expense' }))
      const income = incRes.data.items.map((i: any) => ({ ...i, type: 'income' }))
      return [...expenses, ...income].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    },
    enabled: !!workspaceId,
  })
}

// Budgets
export function useBudgets(workspaceId: string) {
  return useQuery({
    queryKey: keys.budgets(workspaceId),
    queryFn: () => api.get(`/w/${workspaceId}/analytics/budgets`).then(r => r.data),
    enabled: !!workspaceId,
  })
}

// Categories
export function useCategories(workspaceId: string) {
  return useQuery({
    queryKey: keys.categories(workspaceId),
    queryFn: () => api.get(`/w/${workspaceId}/categories`).then(r => r.data),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 15, // categories change rarely, cache for 15 min
  })
}

// Analytics
export function useAnalytics(workspaceId: string, month: string) {
  return useQuery({
    queryKey: keys.analytics(workspaceId, month),
    queryFn: async () => {
      const [overviewRes, categoriesRes, trendRes, sourcesRes] = await Promise.all([
        api.get(`/w/${workspaceId}/analytics/overview?month=${month}`),
        api.get(`/w/${workspaceId}/analytics/categories?month=${month}`),
        api.get(`/w/${workspaceId}/analytics/trend?months=6`),
        api.get(`/w/${workspaceId}/analytics/income-sources?month=${month}`),
      ])
      return {
        overview: overviewRes.data,
        categories: categoriesRes.data,
        trend: trendRes.data,
        sources: sourcesRes.data.sources,
      }
    },
    enabled: !!workspaceId && !!month,
  })
}

// Portfolio
export function usePortfolio(workspaceId: string) {
  return useQuery({
    queryKey: keys.portfolio(workspaceId),
    queryFn: () => api.get(`/w/${workspaceId}/portfolio`).then(r => r.data),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 30, // portfolio prices update every 30 min
  })
}

// Recurring
export function useRecurring(workspaceId: string) {
  return useQuery({
    queryKey: keys.recurring(workspaceId),
    queryFn: () => api.get(`/w/${workspaceId}/recurring`).then(r => r.data),
    enabled: !!workspaceId,
  })
}

// Invalidation helpers — call these after mutations
export function useInvalidate() {
  const queryClient = useQueryClient()
  return {
    invalidateOverview: (wid: string) => queryClient.invalidateQueries({ queryKey: keys.overview(wid) }),
    invalidateTransactions: (wid: string) => queryClient.invalidateQueries({ queryKey: keys.transactions(wid) }),
    invalidateBudgets: (wid: string) => queryClient.invalidateQueries({ queryKey: keys.budgets(wid) }),
    invalidateCategories: (wid: string) => queryClient.invalidateQueries({ queryKey: keys.categories(wid) }),
    invalidatePortfolio: (wid: string) => queryClient.invalidateQueries({ queryKey: keys.portfolio(wid) }),
    invalidateAll: (wid: string) => queryClient.invalidateQueries({ queryKey: [wid] }),
  }
}