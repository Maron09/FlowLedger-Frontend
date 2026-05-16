import { useState, useEffect } from 'react'
import api from '../lib/axios'

export default function FeedbackPage() {
  const [comment, setComment] = useState('')
  const [existing, setExisting] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/reviews/mine')
      .then(({ data }) => {
        if (data) {
          setExisting(data)
          setComment(data.comment)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const { data } = await api.post('/reviews', { comment })
      setExisting(data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-white text-xl font-semibold">Feedback</h1>
        <p className="text-white/30 text-sm mt-0.5">
          Share your thoughts about FlowLedger
        </p>
      </div>

      <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-6">
        {loading ? (
          <p className="text-white/20 text-sm">Loading...</p>
        ) : (
          <>
            <p className="text-white/60 text-sm mb-4">
              {existing ? 'Update your feedback' : 'Leave your feedback'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us what you think about FlowLedger..."
                required
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
              />

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-emerald-400 text-sm">
                  {existing ? 'Feedback updated successfully' : 'Feedback submitted successfully'}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : existing ? 'Update feedback' : 'Submit feedback'}
              </button>
            </form>

            {existing && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-white/30 text-xs uppercase tracking-wider mb-2">
                  Last updated
                </p>
                <p className="text-white/40 text-xs">
                  {new Date(existing.updatedAt).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}