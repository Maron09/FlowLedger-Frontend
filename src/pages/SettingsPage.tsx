import { useState } from 'react'
import { useAuthStore } from '../store/auth.store'
import api from '../lib/axios'

export default function SettingsPage() {
  const { user, setAuth, token } = useAuthStore()
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError('')
    setProfileSuccess(false)
    try {
      const { data } = await api.patch('/users/me', profileForm)
      setAuth(data, token!)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err: any) {
      const msg = err.response?.data?.message
      setProfileError(Array.isArray(msg) ? msg[0] : msg || 'Failed to update profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordSaving(true)
    try {
      await api.patch('/users/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordSuccess(true)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: any) {
      const msg = err.response?.data?.message
      setPasswordError(Array.isArray(msg) ? msg[0] : msg || 'Failed to update password')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-white text-xl font-semibold">Settings</h1>
        <p className="text-white/30 text-sm mt-0.5">Manage your account</p>
      </div>

      {/* Profile section */}
      <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-6">
        <h2 className="text-white font-medium mb-1">Profile</h2>
        <p className="text-white/30 text-sm mb-5">Update your name</p>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">
                First name
              </label>
              <input
                type="text"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                placeholder="First name"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">
                Last name
              </label>
              <input
                type="text"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                placeholder="Last name"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="w-full bg-white/3 border border-white/5 rounded-lg px-4 py-2.5 text-white/30 text-sm cursor-not-allowed"
            />
            <p className="text-white/20 text-xs mt-1">Email cannot be changed</p>
          </div>

          {profileError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-emerald-400 text-sm">
              Profile updated successfully
            </div>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            {profileSaving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Password section */}
      <div className="bg-[#0a0d12] border border-white/5 rounded-xl p-6">
        <h2 className="text-white font-medium mb-1">Change password</h2>
        <p className="text-white/30 text-sm mb-5">Choose a strong password</p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">
              Current password
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="••••••••"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">
              New password
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="Min. 8 characters"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">
              Confirm new password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="Repeat new password"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          {passwordError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-emerald-400 text-sm">
              Password updated successfully
            </div>
          )}

          <button
            type="submit"
            disabled={passwordSaving}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            {passwordSaving ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}