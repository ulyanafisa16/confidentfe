'use client'

import Link from 'next/link'
import ThemeToggle from '../ui/ThemeToggle'
import { useEffect, useState, useCallback } from 'react'
import { LogIn, LogOut, LayoutDashboard, User, Menu, X } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import axios from 'axios'
import Button from './Button'
import { logout } from '../../lib/api'
import type { UserProfile } from '../../types'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) { setProfile(null); setLoading(false); return }
    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/me/`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setProfile(data.data ?? data)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
    setMobileOpen(false)
  }, [pathname, fetchProfile])

  const handleLogout = () => {
    logout()
    setProfile(null)
    setMobileOpen(false)
    router.push('/')
    router.refresh()
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : profile?.email?.[0]?.toUpperCase() || '?'

  const navLinks = [
    { href: '/how-it-works', label: 'How it works' },
    { href: '/security', label: 'Security' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#1a6b5e] group-hover:scale-125 transition-transform" />
            <span className="font-semibold text-gray-900 dark:text-white tracking-tight">
              SecretDrop
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm px-3 py-1.5 rounded-lg transition-all ${
                  isActive(href)
                    ? 'text-[#0f6e56] bg-[#e1f5ee] dark:bg-[#0a2e24] font-medium'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden sm:flex items-center gap-2">
            {loading ? (
              <div className="w-20 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ) : profile ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard size={14} />
                    <span>Dashboard</span>
                  </Button>
                </Link>
                <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                  <Link href="/profile">
                    <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                      <div className="w-7 h-7 rounded-full bg-[#e1f5ee] dark:bg-[#0f3d30] flex items-center justify-center">
                        <span className="text-xs font-semibold text-[#0f6e56]">{initials}</span>
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                        {profile.full_name || profile.email}
                      </span>
                    </div>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout} title="Logout">
                    <LogOut size={14} />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    <LogIn size={14} />Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>

           <div className="flex items-center gap-1">
            <ThemeToggle />
            {/* hamburger button */}
            <button className="sm:hidden ...">
              ...
            </button>
          </div>


          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-4 space-y-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg transition-all ${
                  isActive(href)
                    ? 'text-[#0f6e56] bg-[#e1f5ee] dark:bg-[#0a2e24] font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {label}
              </Link>
            ))}

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
              {profile ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <User size={14} /> Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <LogIn size={14} /> Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg text-white bg-[#1a6b5e] hover:bg-[#0f5347]"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}