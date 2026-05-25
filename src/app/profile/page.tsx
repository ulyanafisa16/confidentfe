'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Shield, Save, KeyRound, LogOut } from 'lucide-react'
import { getProfile } from '../../lib/api'
import type { UserProfile } from '../../types'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import api from '../../lib/api'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saveError, setSaveError] = useState('')

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdError, setPwdError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }
    const fetchAll = async () => {
      try {
        const prof = await getProfile()
        setProfile(prof)
        setFullName(prof.full_name || '')
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [router])

  const handleSaveName = async () => {
    setSaving(true)
    setSaveMsg('')
    setSaveError('')
    try {
      await api.patch('/auth/me/', { full_name: fullName })
      setSaveMsg('Name updated successfully!')
      setProfile(prev => prev ? { ...prev, full_name: fullName } : prev)
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (e: any) {
      setSaveError(e?.response?.data?.message || 'Failed to update name.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPwdMsg('')
    setPwdError('')

    if (!newPassword || !oldPassword || !confirmPassword) {
      setPwdError('All fields required')
      return
    }

    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match')
      return
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

    if (!passwordRegex.test(newPassword)) {
      setPwdError('Password must contain uppercase, lowercase, and number')
      return
    }

    setPwdSaving(true)

    try {
      await api.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      })

      setPwdMsg('Password changed successfully!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwdMsg(''), 3000)
    } catch (e: any) {
      console.error('Change password error:', e)

      setPwdError(
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        e?.response?.data?.old_password?.[0] ||
        e?.response?.data?.new_password?.[0] ||
        'Current password is incorrect or failed to change password.'
      )
    } finally {
      setPwdSaving(false)
    }
  }
  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#1d9e75] border-t-transparent animate-spin" />
      </div>
    )
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : profile?.email?.[0]?.toUpperCase() || '?'

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[#e1f5ee] dark:bg-[#0f3d30] flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-[#0f6e56]">{initials}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {profile?.full_name || 'Your Profile'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.email}</p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User size={15} className="text-[#0f6e56]" />
          Personal information
        </h2>
        <div className="space-y-3">
          <Input
            label="Full name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
          />
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email</label>
            <div className="text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              {profile?.email}
            </div>
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
        </div>

        {saveMsg && <p className="mt-3 text-xs text-[#0f6e56]">{saveMsg}</p>}
        {saveError && <p className="mt-3 text-xs text-red-500">{saveError}</p>}

        <div className="mt-4">
          <Button variant="primary" size="md" loading={saving} onClick={handleSaveName}>
            <Save size={13} />
            Save changes
          </Button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <KeyRound size={15} className="text-[#0f6e56]" />
          Change password
        </h2>
        <div className="space-y-3">
          <Input
            label="Current password"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 8 characters"
            hint="Use a combination of letters, numbers, and symbols"
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            error={confirmPassword && confirmPassword !== newPassword ? 'Passwords do not match' : ''}
          />
        </div>

        {pwdMsg && <p className="mt-3 text-xs text-[#0f6e56]">{pwdMsg}</p>}
        {pwdError && <p className="mt-3 text-xs text-red-500">{pwdError}</p>}

        <div className="mt-4">
          <Button variant="primary" size="md" loading={pwdSaving} onClick={handleChangePassword}>
            <KeyRound size={13} />
            Change password
          </Button>
        </div>
      </div>

      {/* Logout */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Shield size={15} className="text-red-500" />
          Session
        </h2>
        <p className="text-xs text-gray-400 mb-4">You will be signed out from your current session.</p>
        <Button variant="danger" size="md" onClick={handleLogout}>
          <LogOut size={13} />
          Log out
        </Button>
      </div>

    </div>
  )
}