import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import { useAuthStore } from '../store/auth.store'

interface Review {
  id: string
  comment: string
  createdAt: string
  updatedAt: string
  user: { id: string; firstName: string | null; lastName: string | null; email: string }
}

export default function AdminPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    if ((user as any).role !== 'ADMIN') {
      navigate('/dashboard')
      return
    }

    api.get('/reviews')
      .then(({ data }) => setReviews(data))
      .finally(() => setLoading(false))
  }, [user])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return
    await api.delete(`/reviews/${id}`)
    setReviews(reviews.filter((r) => r.id !== id))
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-white text-xl font-semibold">Admin — Reviews</h1>
        <p className="text-white/30 text-sm mt-0.5">{reviews.length} total reviews</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-white/20 text-sm">Loading...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex items-center justify-center h-40 border border-dashed border-white/10 rounded-xl">
          <p className="text-white/20 text-sm">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-[#0a0d12] border border-white/5 rounded-xl p-5 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 text-xs font-medium">
                      {review.user.firstName?.[0] ?? review.user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">
                      {review.user.firstName
                        ? `${review.user.firstName} ${review.user.lastName ?? ''}`.trim()
                        : review.user.email}
                    </p>
                    <p className="text-white/30 text-xs">{review.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(review.id)}
                  className="text-white/20 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                >
                  Delete
                </button>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">{review.comment}</p>
              <p className="text-white/20 text-xs mt-3">
                {new Date(review.updatedAt).toLocaleDateString('en-NG', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}