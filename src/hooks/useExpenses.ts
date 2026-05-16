import { useState, useEffect } from 'react'
import api from '../lib/axios'

interface Expense {
  id: string
  title: string
  amount: string
  date: string
  paymentMethod: string
  category: { id: string; name: string; color: string; icon: string }
}

export function useRecentExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/expenses?limit=5&sortBy=date&sortOrder=desc')
      .then(({ data }) => setExpenses(data.items))
      .finally(() => setLoading(false))
  }, [])

  return { expenses, loading }
}