'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { login } from '../../lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Kalau sudah login, redirect ke home
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      router.replace('/')  // replace — tidak bisa di-back
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Email dan password wajib diisi'); return }
    setLoading(true)
    setError('')
    try {
      await login({ email, password })
      router.replace('/')  // ← replace bukan push, tidak bisa di-back
    } catch (e: any) {
      const data = e?.response?.data
      if (data?.detail) setError(data.detail)
      else if (data?.non_field_errors) setError(data.non_field_errors[0])
      else setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#e1f5ee] dark:bg-[#0f3d30] flex items-center justify-center mx-auto mb-4">
            <LogIn size={20} className="text-[#0f6e56]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to manage your secret links
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <div className="flex justify-end mt-1.5">
                <Link href="/forgot-password" className="text-xs text-[#0f6e56] hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-[#0f6e56] hover:underline font-medium">
                Sign up free
              </Link>
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          You can also use SecretDrop without an account.{' '}
          <Link href="/" className="text-[#0f6e56] hover:underline">
            Create a secret →
          </Link>
        </p>
      </div>
    </div>
  )
}