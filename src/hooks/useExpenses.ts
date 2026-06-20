import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  const { data, isLoading } = useQuery({
    queryKey: ['expenses', workspaceId],
    queryFn: async () => {
      const { data } = await api.get(
        workspaceUrl(workspaceId, '/expenses?limit=5&sortBy=date&sortOrder=desc')
      )
      return data.items as Expense[]
    },
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5,
  })

  return {
    expenses: data ?? [],
    loading: isLoading,
  }
}

export function useInvalidateExpenses() {
  const queryClient = useQueryClient()
  return (workspaceId: string) => {
    queryClient.invalidateQueries({ queryKey: ['expenses', workspaceId] })
    queryClient.invalidateQueries({ queryKey: ['analytics', workspaceId] })
  }
}