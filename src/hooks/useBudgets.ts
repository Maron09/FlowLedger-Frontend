import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { workspaceUrl } from '../lib/axios'

export function useBudgets(workspaceId: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['budgets', workspaceId],
    queryFn: () => api.get(workspaceUrl(workspaceId, '/analytics/budgets')).then(r => r.data),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5,
  })
  return { budgets: data ?? [], loading: isLoading }
}

export function useInvalidateBudgets() {
  const queryClient = useQueryClient()
  return (workspaceId: string) => {
    queryClient.invalidateQueries({ queryKey: ['budgets', workspaceId] })
  }
}