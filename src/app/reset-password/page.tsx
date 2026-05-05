'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, CheckCircle, XCircle } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import api from '../../lib/api'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setError('Invalid reset link.'); return }
    
    // Validasi token ke BE sebelum render form
    api.get(`/auth/reset-password/validate/?token=${token}`)
        .then((res) => {
        // Token valid, lanjut
        })
        .catch(() => {
        setError('This reset link is invalid or has expired. Please request a new one.')
        })
    }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) { setError('New password is required'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }

    setLoading(true)
    setError('')
    try {
        await api.post('/auth/reset-password/confirm/', {
        token,
        password: newPassword,
        password_confirm: confirmPassword,
        })
        setSuccess(true)
        setTimeout(() => router.push('/login'), 3000)
    } catch (e: any) {
        setError(e?.response?.data?.message || 'Token is invalid or has expired.')
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            success ? 'bg-[#e1f5ee] dark:bg-[#0f3d30]' : 'bg-[#e1f5ee] dark:bg-[#0f3d30]'
          }`}>
            {success
              ? <CheckCircle size={20} className="text-[#0f6e56]" />
              : <KeyRound size={20} className="text-[#0f6e56]" />
            }
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {success ? 'Password reset!' : 'Set new password'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {success
              ? 'Redirecting to login in 3 seconds...'
              : 'Enter your new password below.'}
          </p>
        </div>

        {success ? (
          <div className="text-center">
            <Link href="/login">
              <Button variant="primary" size="md">Go to login</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
            {!token ? (
              <div className="text-center">
                <XCircle size={32} className="text-red-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">Invalid or missing reset token.</p>
                <Link href="/forgot-password">
                  <Button variant="outline" size="sm">Request new link</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Repeat your password"
                  error={confirmPassword && confirmPassword !== newPassword ? 'Passwords do not match' : ''}
                />
                {error && (
                  <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}
                <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
                  Reset password
                </Button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#1d9e75] border-t-transparent animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}