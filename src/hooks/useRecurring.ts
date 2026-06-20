import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { workspaceUrl } from '../lib/axios'

export function useRecurring(workspaceId: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['recurring', workspaceId],
    queryFn: async () => {
        const [expRes, incRes] = await Promise.all([
            api.get(workspaceUrl(workspaceId, '/expenses?isRecurring=true&limit=100')),
            api.get(workspaceUrl(workspaceId, '/income?isRecurring=true&limit=100')),
        ])
        return [
            ...expRes.data.items.map((e: any) => ({ ...e, type: 'expense' })),
            ...incRes.data.items.map((i: any) => ({ ...i, type: 'income' })),
        ]
    },
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5,
  })
  return { recurring: data ?? [], loading: isLoading }
}

export function useInvalidateRecurring() {
  const queryClient = useQueryClient()
  return (workspaceId: string) => {
    queryClient.invalidateQueries({ queryKey: ['recurring', workspaceId] })
  }
}