import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { workspaceUrl } from '../lib/axios'

interface Transaction {
  id: string
  title: string
  amount: string
  date: string
  paymentMethod?: string
  category: { id: string; name: string; color: string }
  type: 'expense' | 'income'
  source?: string
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function useTransactions(workspaceId: string) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', workspaceId, page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(search ? { search } : {}),
      })
      const [expRes, incRes] = await Promise.all([
        api.get(workspaceUrl(workspaceId, `/expenses?${params}`)),
        api.get(workspaceUrl(workspaceId, `/income?${params}`)),
      ])
      return {
        expenses: expRes.data.items.map((e: any) => ({ ...e, type: 'expense' })) as Transaction[],
        income: incRes.data.items.map((i: any) => ({ ...i, type: 'income' })) as Transaction[],
        meta: expRes.data.meta as Meta,
      }
    },
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5,
  })

  return {
    expenses: data?.expenses ?? [],
    income: data?.income ?? [],
    meta: data?.meta ?? null,
    loading: isLoading,
    page,
    setPage,
    search,
    setSearch,
  }
}

export function useInvalidateTransactions() {
  const queryClient = useQueryClient()
  return (workspaceId: string) => {
    queryClient.invalidateQueries({ queryKey: ['transactions', workspaceId] })
    queryClient.invalidateQueries({ queryKey: ['analytics', workspaceId] })
    queryClient.invalidateQueries({ queryKey: ['expenses', workspaceId] })
  }
}