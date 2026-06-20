import { useQuery } from '@tanstack/react-query'
import api, { workspaceUrl } from '../lib/axios'

export function useTax(workspaceId: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['tax', workspaceId],
    queryFn: async () => {
        const [ taxRes, profileRes] = await Promise.all ([
            api.get(workspaceUrl(workspaceId, '/analytics/tax')),
            api.get(workspaceUrl(workspaceId, '/analytics/tax/profile')),
        ])
        return {
            estimate: taxRes.data,
            profile: profileRes.data,
        }
    },
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 10,
  })
  return { tax: data ?? null, loading: isLoading }
}