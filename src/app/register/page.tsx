'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { register, login } from '../../lib/api'

export default function RegisterPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // VALIDATION REGEX
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // EMPTY FIELD
    if (!fullName || !email || !password || !confirm) {
      setError('All fields are required.')
      return
    }

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address. Example: user@example.com')
      return
    }

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    if (!passwordRegex.test(password)) {
      setError(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.'
      )
      return
    }

    setLoading(true)
    setError('')

    try {
      await register({
        full_name: fullName,
        email,
        password,
        password_confirm: confirm,
      })

      // AUTO LOGIN
      await login({ email, password })

      router.replace('/')
    } catch (e: any) {
      const data = e?.response?.data

      if (data?.errors?.email) {
        setError('Email sudah terdaftar.')
      } else if (data?.errors?.password) {
        setError(data.errors.password[0])
      } else {
        setError(data?.message || 'Registrasi gagal, coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token')

    if (token) {
      router.replace('/')
    }
  }, [router])

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#e1f5ee] dark:bg-[#0f3d30] flex items-center justify-center mx-auto mb-4">
            <UserPlus size={20} className="text-[#0f6e56]" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Create your account
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Free forever. No credit card required.
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">

            <Input
              label="Full name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ahmad Fauzi"
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              placeholder="you@example.com"
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              placeholder="Create a secure password"
              autoComplete="new-password"
              hint="Use at least 8 characters with uppercase, lowercase, number, and symbol."
              />

            <Input
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value)
                setError('')
              }}
              placeholder="Repeat your password"
              autoComplete="new-password"
              error={
                confirm && confirm !== password
                  ? 'Password tidak cocok'
                  : ''
              }
            />

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
            >
              Create account
            </Button>

          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}

              <Link
                href="/login"
                className="text-[#0f6e56] hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
          By creating an account, you agree to our{' '}

          <span className="text-[#0f6e56] cursor-pointer hover:underline">
            Terms of Service
          </span>{' '}
          and{' '}

          <span className="text-[#0f6e56] cursor-pointer hover:underline">
            Privacy Policy
          </span>.
        </p>

      </div>
    </div>
  )
}