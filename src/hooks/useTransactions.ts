import { useState, useEffect } from 'react'
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
  const [expenses, setExpenses] = useState<Transaction[]>([])
  const [income, setIncome] = useState<Transaction[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!workspaceId) return
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
      ...(search ? { search } : {}),
    })

    Promise.all([
      api.get(workspaceUrl(workspaceId, `/expenses?${params}`)),
      api.get(workspaceUrl(workspaceId, `/income?${params}`)),
    ]).then(([expRes, incRes]) => {
      setExpenses(expRes.data.items.map((e: any) => ({ ...e, type: 'expense' })))
      setIncome(incRes.data.items.map((i: any) => ({ ...i, type: 'income' })))
      setMeta(expRes.data.meta)
    }).finally(() => setLoading(false))
  }, [workspaceId, page, search])

  return { expenses, income, meta, loading, page, setPage, search, setSearch }
}