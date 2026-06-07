import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '../../store/auth.store'
import api from '../../lib/axios'

const INACTIVITY_TIMEOUT = 60 * 60 * 1000  // 60 minutes

export default function SessionWarning() {
  const { logout, setAuth, user } = useAuthStore()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const showWarningRef = useRef(false)

  const handleLogout = useCallback(() => {
    if (countdownTimer.current) clearInterval(countdownTimer.current)
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    api.post('/auth/logout').catch(() => {})
    logout()
    window.location.href = '/login'
  }, [logout])

  const handleStayLoggedIn = useCallback(async () => {
    if (countdownTimer.current) clearInterval(countdownTimer.current)
    setShowWarning(false)
    showWarningRef.current = false
    setCountdown(60)

    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      handleLogout()
      return
    }

    try {
      const { data } = await api.post('/auth/refresh', { refreshToken })
      setAuth(user!, data.accessToken, data.refreshToken)
    } catch {
      handleLogout()
    }
  }, [user, setAuth, handleLogout])

  const startCountdown = useCallback(() => {
    if (countdownTimer.current) clearInterval(countdownTimer.current)
    setCountdown(60)
    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    if (countdown === 0 && showWarning) {
      handleLogout()
    }
  }, [countdown, showWarning, handleLogout])

  const resetTimer = useCallback(() => {
    if (showWarningRef.current) return
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)

    inactivityTimer.current = setTimeout(() => {
      setShowWarning(true)
      showWarningRef.current = true
      startCountdown()
    }, INACTIVITY_TIMEOUT)
  }, [startCountdown])

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach((e) => window.addEventListener(e, resetTimer))
    resetTimer()

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      if (countdownTimer.current) clearInterval(countdownTimer.current)
    }
  }, [resetTimer])

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div className="bg-[#0a0d12] border border-white/10 rounded-xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Session expiring</h3>
            <p className="text-white/40 text-xs">You've been inactive for a while</p>
          </div>
        </div>

        <p className="text-white/60 text-sm mb-2">Your session will expire in</p>

        <div className="flex items-center justify-center my-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6"/>
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - countdown / 60)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-amber-400 text-xl font-bold">{countdown}</span>
            </div>
          </div>
        </div>

        <p className="text-white/30 text-xs text-center mb-6">
          You'll be logged out automatically if you don't respond.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 text-sm py-2.5 rounded-lg transition-colors"
          >
            Log out
          </button>
          <button
            onClick={handleStayLoggedIn}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            Stay logged in
          </button>
        </div>
      </div>
    </div>
  )
}