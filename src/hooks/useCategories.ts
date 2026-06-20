import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { workspaceUrl } from '../lib/axios'

export function useCategories(workspaceId: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['categories', workspaceId],
    queryFn: () => api.get(workspaceUrl(workspaceId, '/categories')).then(r => r.data),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 15,
  })
  return { categories: data ?? [], loading: isLoading }
}

export function useInvalidateCategories() {
  const queryClient = useQueryClient()
  return (workspaceId: string) => {
    queryClient.invalidateQueries({ queryKey: ['categories', workspaceId] })
  }
}