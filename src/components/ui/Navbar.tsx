// src/components/ui/Navbar.tsx

'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { LogIn, LogOut, LayoutDashboard, User } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import Button from './Button'
import { logout, getProfile } from '../../lib/api'
import type { UserProfile } from '../../types'
import axios from 'axios'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
  const token = localStorage.getItem('access_token')
  if (!token) { setProfile(null); setLoading(false); return }

  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/me/`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    // Handle response wrapped dalam 'data' atau langsung
    setProfile(data.data ?? data)
  } catch {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setProfile(null)
  } finally {
    setLoading(false)
  }
}, [])

  // Fetch setiap kali route berubah
  useEffect(() => {
    fetchProfile()
  }, [pathname, fetchProfile])

  const handleLogout = () => {
    logout()
    setProfile(null)
    router.push('/')
    router.refresh()
  }

  // Inisial avatar dari nama
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : profile?.email?.[0]?.toUpperCase() || '?'

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-2 h-2 rounded-full bg-[#1a6b5e] group-hover:scale-125 transition-transform" />
          <span className="font-semibold text-gray-900 dark:text-white tracking-tight">
            SecretDrop
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-6">
          <Link
            href="/how-it-works"
            className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            How it works
          </Link>
          <Link
            href="/security"
            className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Security
          </Link>
        </div>

        {/* Auth area */}
        <div className="flex items-center gap-2">
          {loading ? (
            // Skeleton loader
            <div className="w-20 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ) : profile ? (
            // Logged in
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard size={14} />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>

              {/* Avatar dropdown sederhana */}
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                <div className="w-7 h-7 rounded-full bg-[#e1f5ee] dark:bg-[#0f3d30] flex items-center justify-center">
                  {initials ? (
                    <span className="text-xs font-semibold text-[#0f6e56]">{initials}</span>
                  ) : (
                    <User size={13} className="text-[#0f6e56]" />
                  )}
                </div>
                <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                  {profile.full_name || profile.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout} title="Logout">
                  <LogOut size={14} />
                </Button>
              </div>
            </>
          ) : (
            // Not logged in
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  <LogIn size={14} />
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  )
}