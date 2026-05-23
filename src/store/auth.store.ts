import { create } from 'zustand'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  currency: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null  // in memory only
  isAuthenticated: boolean
  setAuth: (user: User, token: string, refreshToken?: string) => void
  setToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,  // no longer from localStorage
  isAuthenticated: !!localStorage.getItem('refreshToken'),

  setAuth: (user, token, refreshToken) => {
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
    set({ user, token, isAuthenticated: true })
  },

  setToken: (token) => set({ token }),

  logout: () => {
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('activeWorkspaceId')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))