import { useState, useEffect } from 'react'
import api from '../lib/axios'

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

export function useTransactions() {
  const [expenses, setExpenses] = useState<Transaction[]>([])
  const [income, setIncome] = useState<Transaction[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
      ...(search ? { search } : {}),
    })

    Promise.all([
      api.get(`/expenses?${params}`),
      api.get(`/income?${params}`),
    ]).then(([expRes, incRes]) => {
      setExpenses(expRes.data.items.map((e: any) => ({ ...e, type: 'expense' })))
      setIncome(incRes.data.items.map((i: any) => ({ ...i, type: 'income' })))
      setMeta(expRes.data.meta)
    }).finally(() => setLoading(false))
  }, [page, search])

  return { expenses, income, meta, loading, page, setPage, search, setSearch }
}