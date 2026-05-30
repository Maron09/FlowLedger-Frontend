import { useState, useEffect } from 'react'
import api, { workspaceUrl } from '../../lib/axios'

interface Insight {
  type: string
  message: string
  severity: 'info' | 'warning' | 'positive'
}

interface Props {
  workspaceId: string
}

const severityConfig = {
  positive: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
}

export default function InsightsCard({ workspaceId }: Props) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return
    api.get(workspaceUrl(workspaceId, '/analytics/insights'))
      .then(({ data }) => setInsights(data))
      .finally(() => setLoading(false))
  }, [workspaceId])

  if (loading || insights.length === 0) return null

  return (
    <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-4 md:p-5">
      <p className="text-white/60 text-xs uppercase tracking-wider mb-3">Smart Insights</p>
      <div className="space-y-2">
        {insights.map((insight, i) => {
          const config = severityConfig[insight.severity]
          return (
            <div
              key={i}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${config.bg} ${config.border}`}
            >
              <span className={`mt-0.5 flex-shrink-0 ${config.text}`}>
                {config.icon}
              </span>
              <p className={`text-sm ${config.text}`}>{insight.message}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}