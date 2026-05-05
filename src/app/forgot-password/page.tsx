'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import api from '../../lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Email wajib diisi'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password/', { email })
      setSent(true)
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#e1f5ee] dark:bg-[#0f3d30] flex items-center justify-center mx-auto mb-4">
            <Mail size={20} className="text-[#0f6e56]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Forgot your password?
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-[#e1f5ee] dark:bg-[#0f3d30] flex items-center justify-center mx-auto mb-3">
              <Mail size={18} className="text-[#0f6e56]" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Check your email
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              If <strong>{email}</strong> is registered, you'll receive a reset link shortly. Check your spam folder too.
            </p>
            <Link href="/login">
              <Button variant="outline" size="sm" className="w-full">
                <ArrowLeft size={13} /> Back to login
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
                Send reset link
              </Button>
            </form>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center gap-1.5">
                <ArrowLeft size={13} /> Back to login
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}