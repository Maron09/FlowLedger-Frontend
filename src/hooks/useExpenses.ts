import { useState, useEffect } from 'react'
import api, { workspaceUrl } from '../lib/axios'

interface Expense {
  id: string
  title: string
  amount: string
  date: string
  paymentMethod: string
  category: { id: string; name: string; color: string; icon: string }
}

export function useRecentExpenses(workspaceId: string) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return
    api.get(workspaceUrl(workspaceId, '/expenses?limit=5&sortBy=date&sortOrder=desc'))
      .then(({ data }) => setExpenses(data.items))
      .finally(() => setLoading(false))
  }, [workspaceId])

  return { expenses, loading }
}