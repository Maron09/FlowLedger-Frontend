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

interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  currency: string
  role: string
  createdAt: string
}

export default function AdminPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [reviews, setReviews] = useState<Review[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'users' | 'reviews'>('users')

  useEffect(() => {
    if (!user) return
    if ((user as any).role !== 'ADMIN') {
      navigate('/dashboard')
      return
    }

    Promise.all([
      api.get('/reviews'),
      api.get('/users'),
    ]).then(([reviewsRes, usersRes]) => {
      setReviews(reviewsRes.data)
      setUsers(usersRes.data)
    }).finally(() => setLoading(false))
  }, [user])

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return
    await api.delete(`/reviews/${id}`)
    setReviews(reviews.filter((r) => r.id !== id))
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-white text-xl font-semibold">Admin</h1>
        <p className="text-white/30 text-sm mt-0.5">
          {users.filter(u => u.role !== 'ADMIN').length} users · {reviews.length} reviews
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'users' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/30 hover:text-white/60'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setTab('reviews')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'reviews' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/30 hover:text-white/60'
          }`}
        >
          Reviews
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-white/20 text-sm">Loading...</p>
        </div>
      ) : tab === 'users' ? (
        <div className="bg-[#0a0d12] border border-white/5 rounded-xl overflow-hidden">
          <div className="flex items-center px-5 py-3 border-b border-white/5">
            <span className="text-white/30 text-xs uppercase tracking-wider flex-1">User</span>
            <span className="text-white/30 text-xs uppercase tracking-wider w-24 text-left hidden md:block">Currency</span>
            <span className="text-white/30 text-xs uppercase tracking-wider w-24 text-left hidden md:block">Role</span>
            <span className="text-white/30 text-xs uppercase tracking-wider w-32 text-right">Joined</span>
          </div>

          {users.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-white/20 text-sm">No users yet</p>
            </div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="flex items-center px-5 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 text-xs font-medium">
                      {u.firstName?.[0] ?? u.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/80 text-sm truncate">
                      {u.firstName ? `${u.firstName} ${u.lastName ?? ''}`.trim() : '—'}
                    </p>
                    <p className="text-white/30 text-xs truncate">{u.email}</p>
                  </div>
                </div>
                <div className="w-24 hidden md:block">
                  <span className="text-white/40 text-sm">{u.currency}</span>
                </div>
                <div className="w-24 hidden md:block">
                  <span className={`text-xs px-2 py-0.5 rounded-md ${
                    u.role === 'ADMIN'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/5 text-white/30'
                  }`}>
                    {u.role}
                  </span>
                </div>
                <div className="w-32 text-right">
                  <span className="text-white/30 text-sm">
                    {new Date(u.createdAt).toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="flex items-center justify-center h-40 border border-dashed border-white/10 rounded-xl">
              <p className="text-white/20 text-sm">No reviews yet</p>
            </div>
          ) : (
            reviews.map((review) => (
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
                    onClick={() => handleDeleteReview(review.id)}
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
            ))
          )}
        </div>
      )}
    </div>
  )
}