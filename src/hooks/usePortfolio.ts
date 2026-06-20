import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { workspaceUrl } from '../lib/axios'

export function usePortfolio(workspaceId: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio', workspaceId],
    queryFn: () => api.get(workspaceUrl(workspaceId, '/portfolio')).then(r => r.data),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 30,
  })
  return {
    positions: data?.positions ?? [],
    summary: data?.summary ?? null,
    loading: isLoading,
  }
}

export function useInvalidatePortfolio() {
  const queryClient = useQueryClient()
  return (workspaceId: string) => {
    queryClient.invalidateQueries({ queryKey: ['portfolio', workspaceId] })
  }
}